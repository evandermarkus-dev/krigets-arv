/**
 * Helpers for AI SDK 6 UI messages, which carry text in `parts`
 * rather than a `content` string.
 */

type LooseMessage = { role?: unknown; content?: unknown; parts?: unknown };

/** Plain text of a message, from `parts` (AI SDK 6) or a legacy `content` field. */
export function messageText(message: unknown): string {
  const m = (message ?? {}) as LooseMessage;
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p): p is { type: "text"; text: string } =>
        typeof p === "object" && p !== null && (p as { type?: unknown }).type === "text" &&
        typeof (p as { text?: unknown }).text === "string")
      .map((p) => p.text)
      .join("");
  }
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.content)) {
    const part = m.content.find(
      (p): p is { type: "text"; text: string } =>
        typeof p === "object" && p !== null && (p as { type?: unknown }).type === "text",
    );
    return part?.text ?? "";
  }
  return "";
}

/**
 * Text that uniquely describes a whole conversation, for cache keys.
 * Keying on the full history (not just the last message) keeps a follow-up
 * like "tell me more" from hitting another conversation's cached answer.
 */
export function conversationCacheText(messages: unknown[]): string {
  return messages
    .map((m) => `${String((m as LooseMessage)?.role ?? "")}:${messageText(m)}`)
    .join("\n");
}

/** Return a copy of a UI message with its text parts replaced by `text`. */
export function withText<T extends object>(message: T, text: string): T {
  return { ...message, parts: [{ type: "text", text }] } as T;
}
