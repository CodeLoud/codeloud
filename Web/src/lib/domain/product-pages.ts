import type { ProductId } from "./product-catalog";

/** One factual capability explained on a dedicated product page. */
export interface ProductPageCapability {
	readonly title: string;
	readonly detail: string;
}

/** Search-focused, visible content for one CodeLoud product page. */
export interface ProductPageDefinition {
	readonly id: ProductId;
	readonly eyebrow: string;
	readonly title: string;
	readonly description: string;
	readonly promise: string;
	readonly problemTitle: string;
	readonly problem: string;
	readonly workflowTitle: string;
	readonly workflow: readonly string[];
	readonly capabilitiesTitle: string;
	readonly capabilities: readonly ProductPageCapability[];
	readonly boundaryTitle: string;
	readonly boundary: string;
	readonly ctaLabel: string;
	readonly cta:
		| { readonly _tag: "internal"; readonly url: "/early-access?product=voice" }
		| { readonly _tag: "external"; readonly url: `https://${string}` };
}

const PRODUCT_PAGES = {
	voice: {
		id: "voice",
		eyebrow: "CodeLoud Voice / developer dictation",
		title: "Speak naturally. Keep code terms precise.",
		description:
			"Voice dictation for coding agents. Review project-aware corrections to filenames, symbols, and commands before copying your prompt. In private development.",
		promise:
			"Dictate the instruction, not every keystroke. Voice checks code terms against your approved project context so you can review the changes before handing a prompt to your coding agent.",
		problemTitle: "Speech recognition breaks at code-specific terms.",
		problem:
			"General speech recognition is optimized for ordinary language. Developer work is full of uncommon identifiers, compact commands, version strings, and repository-specific vocabulary where one character can change the meaning.",
		workflowTitle: "From spoken prompt to reviewed developer text.",
		workflow: [
			"Choose a speech model and accept its policy disclosure, then capture your instruction for hosted transcription.",
			"Compare the transcript locally with approved project vocabulary. Inspect suggested filenames, symbols, and paths alongside the original words.",
			"Review the result, confirm delivery to the clipboard, and paste it into your coding agent. You decide what to send or run.",
		],
		capabilitiesTitle: "Code-aware dictation without silent rewrites.",
		capabilities: [
			{
				title: "Project-aware vocabulary",
				detail:
					"Surface relevant filenames, symbols, packages, paths, and commands from the approved project context.",
			},
			{
				title: "Visible correction",
				detail:
					"Keep recognition uncertainty and proposed identifier changes reviewable instead of silently rewriting text.",
			},
			{
				title: "Reviewed handoff",
				detail:
					"Copy text for recovery or use window-level paste on tested Hyprland setups. Insertion is not universal, and placement can remain unverified. Voice does not submit your prompt or run a command.",
			},
		],
		boundaryTitle: "Hosted speech. Local correction.",
		boundary:
			"Audio goes through the CodeLoud API to an external speech provider under the selected model policy. Project-aware correction is local. Source-body inspection and provider keyterms require separate opt-ins. Provider retention and training policies vary; Voice does not promise universal local processing or zero retention.",
		ctaLabel: "Request Voice early access",
		cta: { _tag: "internal", url: "/early-access?product=voice" },
	},
	relay: {
		id: "relay",
		eyebrow: "CodeLoud Relay / MCP technical context",
		title: "Exact-version documentation and sourced context through one MCP server.",
		description:
			"CodeLoud Relay is an MCP documentation server for exact-version docs, sourced technical research, package review, and replayable coding-agent evidence.",
		promise:
			"Resolve what the project actually uses before retrieving context, and abstain when the available evidence cannot support a precise answer.",
		problemTitle: "Plausible context can still be the wrong version.",
		problem:
			"Coding agents can receive plausible documentation for the wrong version, unbounded web results, or package advice without durable evidence. Relay puts identity, source admission, and evidence status ahead of answer generation.",
		workflowTitle: "Resolve identity before retrieving documentation.",
		workflow: [
			"Resolve the package, ecosystem, version, repository, or project dependency first.",
			"Retrieve bounded documentation or admitted technical sources for that identity.",
			"Return source locators, evidence excerpts, hashes, and explicit support status to the agent.",
		],
		capabilitiesTitle: "MCP context with inspectable evidence attached.",
		capabilities: [
			{
				title: "Exact-version docs",
				detail:
					"Ground package documentation in the resolved ecosystem and version rather than a nearby latest release.",
			},
			{
				title: "Package review",
				detail:
					"Provide advisory dependency signals, provenance evidence, and bounded trust findings before installation.",
			},
			{
				title: "Sourced research",
				detail:
					"Return admitted passages and replayable evidence instead of presenting unsupported synthesis as verification.",
			},
		],
		boundaryTitle: "Context evidence is not final-answer verification",
		boundary:
			"Relay grounds the context available to a coding agent. The agent still owns its interpretation, code changes, and final answer. Relay abstains when versions or sources remain ambiguous.",
		ctaLabel: "Apply for the Relay beta",
		cta: { _tag: "external", url: "https://relay.codeloud.xyz/#beta" },
	},
} satisfies Readonly<Record<ProductId, ProductPageDefinition>>;

/** Resolve dedicated product-page content; a missing entry is a development defect. */
export function productPageFor(id: ProductId): ProductPageDefinition {
	return PRODUCT_PAGES[id];
}
