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
 * model's cost in the OpenRouter model registry, but only when Pi's reported
 * cost is non-positive. Set or update rates in `models.json`; unknown routed
 * models are recorded as $0 with a notification.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// Pricing lives in the OpenRouter model overrides in models.json. The model
// registry merges those overrides with Pi's model catalog, avoiding a second
// rates table here and in the historical-session fixer.

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
	// Only warn once per unknown routed model per extension load, so a long session
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
		if (![usage.input, usage.output, usage.cacheRead, usage.cacheWrite].some((tokens) => (tokens ?? 0) > 0)) return;
		if (typeof usage.cost?.total === "number" && usage.cost.total > 0) return;

		const model = ctx.modelRegistry.find("openrouter", responseModel);
		// Keep the mutation scoped to OpenRouter even if the registry or message
		// metadata is unexpected.
		if (model && model.provider !== "openrouter") return;
		const rates = model?.cost;
		if (!rates) {
			usage.cost = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
			if (!warned.has(responseModel)) {
				warned.add(responseModel);
				ctx.ui.notify(
					`openrouter-auto-cost: no rate for routed model "${responseModel}" (from ${message.model}). ` +
						`Recorded as $0. Add its cost under providers.openrouter.modelOverrides in models.json.`,
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
