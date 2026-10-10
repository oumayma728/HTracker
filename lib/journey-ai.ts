/**
 * Journey AI: turns raw text into an ordered list of roadmap steps using Claude.
 * Used by all three input modes (pasted text, typed description, extracted PDF text).
 * Server-only: it reads ANTHROPIC_API_KEY, which must never reach the browser.
 */
import "server-only"; // build fails if a client component ever imports this file
import Anthropic from "@anthropic-ai/sdk"; // official Anthropic SDK

/* ---------- limits ---------- */

export const MAX_INPUT_CHARS = 15_000; // longest text we send to Claude (~4k tokens)
const MIN_STEPS = 6; // fewer than this is not a useful roadmap
const MAX_STEPS = 25; // more than this is overwhelming; extra steps are dropped
const MAX_TITLE_CHARS = 80; // cap for the roadmap title and each step title
const MAX_DESCRIPTION_CHARS = 300; // cap for each step description

/* ---------- result types ---------- */

export type GeneratedStep = { title: string; description: string | null }; // one validated step
export type GenerateResult = // what generateRoadmapSteps returns: success or a user-facing error
  | { ok: true; title: string; steps: GeneratedStep[]; truncated: boolean } // truncated = input was cut to MAX_INPUT_CHARS
  | { ok: false; error: string }; // error is safe to show in the UI

/* ---------- Claude setup ---------- */

const MODEL = "claude-opus-5-5"; // current default Claude model
const TOOL_NAME = "save_roadmap"; // the one tool Claude must call to hand back its answer

// Tool definition. Claude "calls" it with the roadmap as arguments, so we get JSON, not free text.
const ROADMAP_TOOL: Anthropic.Beta.BetaTool = {
  name: TOOL_NAME, // name Claude uses to call it
  description: "Save the finished roadmap. Call this exactly once with the full ordered list of steps.", // tells Claude what the tool is for
  strict: true, // API guarantees the arguments match input_schema exactly
  input_schema: {
    type: "object", // arguments are one object
    properties: {
      title: { type: "string", description: "Short roadmap title, under 60 characters." }, // roadmap name
      steps: {
        type: "array", // ordered list of steps
        description: `Between ${MIN_STEPS} and ${MAX_STEPS} steps, in the order they should be done.`, // count guidance
        items: {
          type: "object", // each step is an object
          properties: {
            title: { type: "string", description: "Short action, under 70 characters, starting with a verb." }, // step name
            description: { type: "string", description: "One or two plain sentences on what to do. Under 250 characters." }, // step detail
          },
          required: ["title", "description"], // strict mode needs every property listed as required
          additionalProperties: false, // strict mode: no extra keys
        },
      },
    },
    required: ["title", "steps"], // both fields must be present
    additionalProperties: false, // strict mode: no extra keys
  },
};

// System prompt: what Claude should produce. Kept constant so it can be cached by the API.
const SYSTEM_PROMPT = [
  "You turn a person's goal, notes, or document into a personal step-by-step roadmap.", // the job
  "Each step must be a concrete, doable action that builds on the previous one; the person works through them strictly in order.", // sequential, actionable
  `Produce between ${MIN_STEPS} and ${MAX_STEPS} steps. Use fewer, larger steps for short inputs and more for detailed ones.`, // size guidance
  "Write in the same language as the input. Use plain words, no markdown.", // formatting
  `When you are done, call the ${TOOL_NAME} tool once with the whole roadmap. Do not reply with plain text.`, // must use the tool (forced tool_choice is not available on this model)
].join("\n"); // one line per rule

/* ---------- helpers ---------- */

/** Trim whitespace, collapse inner whitespace, and cut to `max` characters. */
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return ""; // anything that isn't a string becomes empty
  return value.replace(/\s+/g, " ").trim().slice(0, max); // single spaces, no edges, capped length
}

/** Check the tool arguments ourselves too: never trust model output blindly. */
function validateToolInput(input: unknown): GenerateResult {
  if (!input || typeof input !== "object") return { ok: false, error: "The AI returned an empty roadmap. Please try again." }; // not an object
  const raw = input as { title?: unknown; steps?: unknown }; // look at the two expected fields
  if (!Array.isArray(raw.steps)) return { ok: false, error: "The AI returned an invalid roadmap. Please try again." }; // steps must be a list

  const steps: GeneratedStep[] = raw.steps // start from Claude's list
    .map((s) => { // normalise each step
      const step = (s ?? {}) as { title?: unknown; description?: unknown }; // tolerate null entries
      const description = clean(step.description, MAX_DESCRIPTION_CHARS); // capped description
      return { title: clean(step.title, MAX_TITLE_CHARS), description: description || null }; // empty description -> null
    })
    .filter((s) => s.title.length > 0) // drop steps without a title
    .slice(0, MAX_STEPS); // hard cap on step count

  if (steps.length < MIN_STEPS) { // too short to be a roadmap
    return { ok: false, error: `Couldn't build a roadmap with at least ${MIN_STEPS} steps from that. Try adding more detail.` }; // ask for more input
  }
  const title = clean(raw.title, MAX_TITLE_CHARS) || "My journey"; // fallback title if Claude left it blank
  return { ok: true, title, steps, truncated: false }; // valid roadmap (truncated is set by the caller)
}

/* ---------- main entry point ---------- */

/**
 * Send raw text to Claude and get back a validated roadmap.
 * Never throws: every failure becomes { ok: false, error } with a message safe for the UI.
 */
export async function generateRoadmapSteps(rawText: string): Promise<GenerateResult> {
  const text = rawText.trim(); // ignore surrounding whitespace
  if (text.length < 20) return { ok: false, error: "Please give a bit more detail (at least a sentence or two)." }; // too little to work with
  const truncated = text.length > MAX_INPUT_CHARS; // remember whether we had to cut it
  const input = text.slice(0, MAX_INPUT_CHARS); // cap the input size (cost + latency)

  if (!process.env.ANTHROPIC_API_KEY) { // key missing on this server
    console.error("[journey] ANTHROPIC_API_KEY is not set"); // log for the developer
    return { ok: false, error: "Roadmap generation isn't configured on the server yet." }; // generic message for the user
  }

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  try {
    const response = await client.beta.messages.create({ // beta endpoint: needed for refusal fallbacks
      model: MODEL, // Claude Opus 5.5
      max_tokens: 16000, // plenty of room for thinking + up to 25 steps
      output_config: { effort: "medium" }, // moderate reasoning depth: this is a structuring task, not a hard puzzle
      betas: ["server-side-fallback-2026-07-01"], // enables the fallbacks parameter below
      fallbacks: "default", // if the model declines for safety reasons, the API retries on a suitable fallback model
      system: SYSTEM_PROMPT, // the instructions above
      tools: [ROADMAP_TOOL], // the only tool Claude may call
      tool_choice: { type: "auto", disable_parallel_tool_use: true }, // auto (forced choice is rejected by this model); at most one call
      messages: [{ role: "user", content: `Build a roadmap from this:\n\n<input>\n${input}\n</input>` }], // the user's text, clearly delimited
    });

    if (response.stop_reason === "refusal") { // whole fallback chain declined
      return { ok: false, error: "The AI declined to build a roadmap from this input. Try rephrasing it." }; // user can retry differently
    }
    if (response.stop_reason === "max_tokens") { // output was cut off: arguments may be incomplete
      return { ok: false, error: "The roadmap came back incomplete. Try a shorter input." }; // shorter input -> shorter output
    }

    const call = response.content.find( // look for Claude's tool call among the content blocks
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME, // narrow to our tool
    );
    if (!call) return { ok: false, error: "The AI didn't return a roadmap. Please try again." }; // it answered in text instead

    const result = validateToolInput(call.input); // our own checks + caps
    return result.ok ? { ...result, truncated } : result; // add the truncated flag on success
  } catch (error) {
    // Most specific first, so each failure gets a useful message (the SDK already retried 429/5xx twice).
    if (error instanceof Anthropic.AuthenticationError) { // bad or revoked key
      console.error("[journey] Anthropic auth failed:", error.message); // developer log
      return { ok: false, error: "Roadmap generation isn't configured correctly on the server." }; // don't leak details
    }
    if (error instanceof Anthropic.RateLimitError) { // too many requests
      return { ok: false, error: "The AI is busy right now. Please try again in a minute." }; // retry later
    }
    if (error instanceof Anthropic.BadRequestError) { // something wrong with our request
      console.error("[journey] Anthropic bad request:", error.message); // developer log
      return { ok: false, error: "That input couldn't be processed. Try shortening or rephrasing it." }; // likely input-related
    }
    if (error instanceof Anthropic.APIConnectionError) { // network problem reaching the API
      return { ok: false, error: "Couldn't reach the AI service. Check your connection and try again." }; // transient
    }
    if (error instanceof Anthropic.APIError) { // any other API status (e.g. 500, 529 overloaded)
      console.error(`[journey] Anthropic API error ${error.status}:`, error.message); // developer log
      return { ok: false, error: "The AI service had a problem. Please try again." }; // generic retry message
    }
    console.error("[journey] Unexpected error:", error); // anything else (a bug on our side)
    return { ok: false, error: "Something went wrong while building your roadmap." }; // never crash the page
  }
}
