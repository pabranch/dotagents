/**
 * openrouter-auto-cost
 *
 * OpenRouter's `openrouter/auto` router reports the concrete model it used in
 * `message.responseModel`, but pi prices every response against the model you
 * selected (`openrouter/auto`). That model's catalog price is a sentinel
 * (`-1000000` per million input/output), which makes pi compute
 * `cost = -1 * tokens` and drives the session total hugely negative.
 *
 * This extension recomputes `usage.cost` at `message_end` from the response
 * model's real rates. Add or adjust prices in RATES below. When a routed model
 * is not listed, the cost is recorded as $0 and you get a notification instead
 * of silently losing the charge.
 *
 * Rates are US dollars per million tokens.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type Rates = {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
};

// Calibrated 2026-10-05 against the OpenRouter dashboard. Adjust as the router
// mix and OpenRouter pricing change.
const RATES: Record<string, Rates> = {
	"deepseek/deepseek-v4.1-flash": {
		input: 0.3104,
		output: 1.2416,
		cacheRead: 0.0062,
		cacheWrite: 0,
	},
	"deepseek/deepseek-v4-flash-0731": {
		input: 0.1166,
		output: 9.8166,
		cacheRead: 0.1166,
		cacheWrite: 0,
	},
	"z-ai/glm-5.3-flash": {
		input: 0.15,
		output: 0.5,
		cacheRead: 0.03,
		cacheWrite: 0,
	},
};

type Cost = {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	total: number;
};

type AssistantMessageLike = {
	role?: string;
	provider?: string;
	model?: string;
	responseModel?: string;
	usage?: {
		input?: number;
		output?: number;
		cacheRead?: number;
		cacheWrite?: number;
		cost?: Cost;
	};
};

export default function openrouterAutoCost(pi: ExtensionAPI) {
	// Only warn once per unrouted model per extension load, so a long session
	// does not spam the notification area.
	const warned = new Set<string>();

	pi.on("message_end", (event, ctx: ExtensionContext) => {
		const message = event.message as unknown as AssistantMessageLike;
		if (message.role !== "assistant") return;
		if (message.provider !== "openrouter") return;

		const responseModel = message.responseModel;
		// No routing happened, or the provider did not report a different model.
		if (!responseModel || responseModel === message.model) return;

		const usage = message.usage;
		if (!usage) return;

		const rates = RATES[responseModel];
		if (!rates) {
			usage.cost = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
			if (!warned.has(responseModel)) {
				warned.add(responseModel);
				ctx.ui.notify(
					`openrouter-auto-cost: no rate for routed model "${responseModel}" (from ${message.model}). ` +
						`Recorded as $0. Add it to RATES in ~/.pi/agent/extensions/openrouter-auto-cost.ts.`,
					"warning",
				);
			}
			return { message: event.message };
		}

		const input = usage.input ?? 0;
		const output = usage.output ?? 0;
		const cacheRead = usage.cacheRead ?? 0;
		const cacheWrite = usage.cacheWrite ?? 0;

		const cost: Cost = {
			input: (rates.input * input) / 1e6,
			output: (rates.output * output) / 1e6,
			cacheRead: (rates.cacheRead * cacheRead) / 1e6,
			cacheWrite: (rates.cacheWrite * cacheWrite) / 1e6,
			total: 0,
		};
		cost.total = cost.input + cost.output + cost.cacheRead + cost.cacheWrite;
		usage.cost = cost;

		return { message: event.message };
	});
}
