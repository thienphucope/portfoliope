import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { complete } from "@earendil-works/pi-ai";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("\x1b[34mHi! 👋 Session started\x1b[0m", "info");

    try {
      const model = ctx.model;
      if (!model) throw new Error("No model selected");

      const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
      if (!auth.ok || !auth.apiKey) throw new Error("No API key available");

      const result = await complete(model, {
        systemPrompt:
          "You are a quote generator. Reply with ONLY a short inspiring quote of Edison. " +
          'Format: "quote text" — Author Name. No explanations, no prefixes.',
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Give me an inspiring quote from a famous person." }],
            timestamp: Date.now(),
          },
        ],
      }, { apiKey: auth.apiKey });

      const quote = result.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("")
        .trim();

      if (quote) {
        ctx.ui.notify("\x1b[34m" + quote + "\x1b[0m", "info");
      }
    } catch {
      // LLM call failed, skip quote
    }
  });
}
