#!/usr/bin/env node
/**
 * pi-async — a small, dependency-free wrapper around `pi --mode rpc`.
 *
 * Why: an interactive TUI that you `bg` under shell job control keeps running
 * but can no longer take your input. RPC mode is built for exactly this: you
 * stay detached, send prompts asynchronously, and consume a structured event
 * stream back. This wrapper hides the JSONL plumbing behind a small promise API.
 *
 * Library:
 *   import { PiAsync } from "./pi-async.mjs";
 *   const pi = await new PiAsync({ args: ["--no-session"] }).start();
 *   pi.onEvent((e) => { ... });
 *   await pi.prompt("do the thing");   // resolves when ACCEPTED, not finished
 *   await pi.waitForSettled();          // resolves when pi stops auto-continuing
 *   await pi.stop();
 *
 * CLI:
 *   ./pi-async.mjs "Explain this repository"
 *   ./pi-async.mjs --model claude-sonnet-4-5 --follow-up "also update the README" "refactor utils.ts"
 *   ./pi-async.mjs --json "list the files" | jq .
 */

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

export class PiAsync {
	/**
	 * @param {object} [opts]
	 * @param {string} [opts.cliPath="pi"]  Path to the pi executable.
	 * @param {string[]} [opts.args=[]]     Extra args passed to pi (before --mode rpc is added).
	 * @param {string} [opts.cwd=process.cwd()]
	 * @param {(e: object) => void} [opts.onEvent]  Fallback event listener.
	 */
	constructor({ cliPath = "pi", args = [], cwd = process.cwd(), onEvent = () => {} } = {}) {
		this.cliPath = cliPath;
		this.args = args;
		this.cwd = cwd;

		this.child = null;
		this.buffer = "";
		this.pending = new Map(); // id -> { resolve, reject }
		this.listeners = new Set();
		if (onEvent) this.listeners.add(onEvent);
		this.settledWaiters = [];
		this.exitPromise = null;
		this.stderrTail = [];
	}

	/** Spawn pi in RPC mode. Resolves once the child is up (not once ready for input). */
	async start() {
		this.child = spawn(this.cliPath, [...this.args, "--mode", "rpc"], {
			cwd: this.cwd,
			stdio: ["pipe", "pipe", "pipe"],
		});

		this.exitPromise = new Promise((resolve) => {
			this.child.on("exit", (code, signal) => {
				const err = new Error(`pi exited (code=${code}, signal=${signal})`);
				this._rejectAll(err);
				this._flushSettled(err);
				resolve({ code, signal });
			});
		});
		this.child.on("error", (err) => {
			this._rejectAll(err);
			this._flushSettled(err);
		});

		this.child.stdout.setEncoding("utf8");
		this.child.stdout.on("data", (chunk) => this._onData(chunk));

		// Keep a small stderr tail for diagnostics; never parse it as protocol data.
		this.child.stderr.setEncoding("utf8");
		this.child.stderr.on("data", (chunk) => {
			this.stderrTail.push(chunk);
			if (this.stderrTail.length > 100) this.stderrTail.shift();
		});

		return this;
	}

	/** Raw JSONL framing: split on LF only and strip an optional preceding CR. */
	_onData(chunk) {
		this.buffer += chunk;
		let idx;
		while ((idx = this.buffer.indexOf("\n")) >= 0) {
			let line = this.buffer.slice(0, idx);
			this.buffer = this.buffer.slice(idx + 1);
			if (line.endsWith("\r")) line = line.slice(0, -1);
			if (!line) continue;
			let record;
			try {
				record = JSON.parse(line);
			} catch {
				continue; // ignore malformed lines rather than crash
			}
			this._dispatch(record);
		}
	}

	_dispatch(record) {
		// 1) Correlate command responses by id.
		if (record.type === "response" && record.id && this.pending.has(record.id)) {
			const { resolve, reject } = this.pending.get(record.id);
			this.pending.delete(record.id);
			if (record.success) resolve(record.data ?? {});
			else reject(new Error(record.error || `command "${record.command}" failed`));
			return;
		}

		// 2) Session events. "agent_settled" is the final boundary: pi will not
		//    continue automatically after it (retries/compaction/queues are done).
		if (record.type === "agent_settled") {
			this._flushSettled(record);
		}

		// 3) Fan out to listeners.
		for (const fn of this.listeners) {
			try {
				fn(record);
			} catch {
				/* listener errors must not kill the stream */
			}
		}
	}

	_rejectAll(err) {
		for (const { reject } of this.pending.values()) reject(err);
		this.pending.clear();
	}

	_flushSettled(value) {
		const waiters = this.settledWaiters;
		this.settledWaiters = [];
		for (const w of waiters) {
			if (value instanceof Error) w.reject(value);
			else w.resolve(value);
		}
	}

	/** Subscribe to all session events. Returns an unsubscribe function. */
	onEvent(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	_send(cmd) {
		if (!this.child || this.child.exitCode !== null) throw new Error("pi is not running");
		this.child.stdin.write(JSON.stringify(cmd) + "\n");
	}

	_command(type, extra = {}) {
		const id = randomUUID();
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			try {
				this._send({ id, type, ...extra });
			} catch (err) {
				this.pending.delete(id);
				reject(err);
			}
		});
	}

	// --- high-level commands -------------------------------------------------

	/**
	 * Send a prompt. Resolves with `{ disposition }` as soon as pi ACCEPTS it
	 * ("started", "queued", or "handled") — NOT when the work completes.
	 * Use waitForSettled()/promptAndWait() for completion.
	 *
	 * While pi is streaming you must pass `streamingBehavior`: "steer" or "followUp".
	 */
	prompt(message, { streamingBehavior, images } = {}) {
		const extra = { message };
		if (streamingBehavior) extra.streamingBehavior = streamingBehavior;
		if (images) extra.images = images;
		return this._command("prompt", extra);
	}

	steer(message, images) {
		return this._command("steer", { message, ...(images ? { images } : {}) });
	}

	followUp(message, images) {
		return this._command("follow_up", { message, ...(images ? { images } : {}) });
	}

	abort() {
		return this._command("abort");
	}

	clearQueue() {
		return this._command("clear_queue");
	}

	getState() {
		return this._command("get_state");
	}

	getLastAssistantText() {
		return this._command("get_last_assistant_text");
	}

	// --- lifecycle helpers ---------------------------------------------------

	/**
	 * Resolve the next time pi reports it will not continue automatically.
	 * Install this (or promptAndWait) before prompting to avoid missing a fast
	 * completion. Don't call it when the prompt disposition was "handled".
	 */
	waitForSettled() {
		return new Promise((resolve, reject) => {
			this.settledWaiters.push({ resolve, reject });
		});
	}

	/** Send a prompt and wait for the run to settle. */
	async promptAndWait(message, opts = {}) {
		const result = await this.prompt(message, opts);
		if (result.disposition !== "handled") await this.waitForSettled();
		return result;
	}

	/** Close stdin for an orderly shutdown, then force-kill if it lingers. */
	async stop({ timeoutMs = 5000 } = {}) {
		if (!this.child) return;
		if (this.child.exitCode === null) this.child.stdin.end();
		await Promise.race([
			this.exitPromise,
			new Promise((r) => setTimeout(r, timeoutMs)),
		]);
		if (this.child.exitCode === null) this.child.kill("SIGTERM");
	}

	/** Last stderr lines, for diagnostics when something goes wrong. */
	stderr() {
		return this.stderrTail.join("");
	}
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseCliArgs(argv) {
	const wrapper = {
		piArgs: [],
		promptParts: [],
		followUps: [],
		json: false,
		quiet: false,
		timeout: 0,
	};
	let i = 0;
	const need = (name) => {
		if (i + 1 >= argv.length) throw new Error(`${name} requires a value`);
		return argv[++i];
	};
	for (; i < argv.length; i++) {
		const a = argv[i];
		switch (a) {
			case "--model":
				wrapper.piArgs.push("--model", need(a));
				break;
			case "--provider":
				wrapper.piArgs.push("--provider", need(a));
				break;
			case "--name":
				wrapper.piArgs.push("--name", need(a));
				break;
			case "--session":
				wrapper.piArgs.push("--session", need(a));
				break;
			case "--session-dir":
				wrapper.piArgs.push("--session-dir", need(a));
				break;
			case "--continue":
			case "-c":
				wrapper.piArgs.push("--continue");
				break;
			case "--no-session":
				wrapper.piArgs.push("--no-session");
				break;
			case "--thinking":
				wrapper.piArgs.push("--thinking", need(a));
				break;
			case "--dir":
				wrapper.cwd = need(a);
				break;
			case "--follow-up":
				wrapper.followUps.push(need(a));
				break;
			case "--json":
				wrapper.json = true;
				break;
			case "--quiet":
				wrapper.quiet = true;
				break;
			case "--timeout":
				wrapper.timeout = Number(need(a)) || 0;
				break;
			case "--pi-arg":
				wrapper.piArgs.push(need(a));
				break;
			case "--":
				wrapper.piArgs.push(...argv.slice(i + 1));
				i = argv.length;
				break;
			default:
				if (a.startsWith("--")) throw new Error(`unknown option: ${a}`);
				wrapper.promptParts.push(a);
		}
	}
	return wrapper;
}

async function runCli() {
	const wrapper = parseCliArgs(process.argv.slice(2));
	const prompt = wrapper.promptParts.join(" ");
	if (!prompt) {
		process.stderr.write(
			[
				"usage: pi-async [options] <prompt>",
				"",
				"options:",
				"  --model <m>          pass --model to pi",
				"  --provider <p>       pass --provider to pi",
				"  --name <n>           session display name",
				"  --session <id>       use a specific session",
				"  --session-dir <dir>  session storage dir",
				"  --continue, -c       continue the previous session",
				"  --no-session         ephemeral, do not save",
				"  --thinking <level>   off|minimal|low|medium|high|xhigh|max",
				"  --dir <path>         working directory for pi",
				"  --follow-up <msg>    queue a follow-up (repeatable)",
				"  --json               print raw event records to stdout",
				"  --quiet              suppress streamed assistant text",
				"  --timeout <seconds>  give up waiting for settle after N seconds",
				"  --pi-arg <arg>       pass an arbitrary arg through to pi",
				"  -- <args...>         pass everything after -- to pi",
				"",
			].join("\n"),
		);
		process.exit(2);
	}

	const pi = await new PiAsync({ args: wrapper.piArgs, cwd: wrapper.cwd || process.cwd() });
	await pi.start();

	if (!wrapper.json && !wrapper.quiet) {
		pi.onEvent((event) => {
			if (event.type === "message_update") {
				const ev = event.assistantMessageEvent;
				if (ev?.type === "text_delta") process.stdout.write(ev.delta);
			} else if (event.type === "tool_execution_start") {
				process.stderr.write(`\n[tool: ${event.toolName}]\n`);
			}
		});
	}
	if (wrapper.json) {
		pi.onEvent((event) => process.stdout.write(JSON.stringify(event) + "\n"));
	}

	let timedOut = false;
	let timer = null;
	const onSigint = () => {
		process.stderr.write("\n[interrupt: aborting]\n");
		pi.abort().catch(() => {});
	};
	process.on("SIGINT", onSigint);

	try {
		const result = await pi.prompt(prompt);
		if (result.disposition === "handled") return;

		if (wrapper.followUps.length) {
			// Queue follow-ups before waiting so they run in the same session.
			for (const msg of wrapper.followUps) await pi.followUp(msg);
		}

		const settled = pi.waitForSettled();
		if (wrapper.timeout > 0) {
			timer = setTimeout(() => {
				timedOut = true;
				process.stderr.write(`\n[timeout after ${wrapper.timeout}s: aborting]\n`);
				pi.abort().catch(() => {});
			}, wrapper.timeout * 1000);
		}
		await settled;
	} finally {
		if (timer) clearTimeout(timer);
		process.off("SIGINT", onSigint);
		await pi.stop();
		if (!wrapper.json && !wrapper.quiet) process.stdout.write("\n");
	}
	if (timedOut) process.exitCode = 124;
}

// Canonicalize both paths so the CLI still works when invoked through a
// symlink (e.g. ~/.local/bin/pi-async -> pi-async.mjs).
function isMainModule() {
	if (!process.argv[1]) return false;
	try {
		return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
	} catch {
		return false;
	}
}

if (isMainModule()) {
	runCli().catch((err) => {
		process.stderr.write(`pi-async: ${err?.message || err}\n`);
		process.exit(1);
	});
}
