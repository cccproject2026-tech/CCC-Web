export type TranscriptChatMessage = {
  speaker: string;
  text: string;
  side: "left" | "right";
};

export function parseTranscriptToChatMessages(rawTranscript: string): TranscriptChatMessage[] {
  const raw = String(rawTranscript ?? "").trim();
  if (!raw) return [];

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed = lines.map((line, idx) => {
    const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (m) return { speaker: m[1].trim(), text: m[2].trim(), idx };
    return { speaker: "", text: line, idx };
  });

  const speakers = Array.from(new Set(parsed.map((p) => p.speaker).filter(Boolean))).slice(0, 2);
  const right = speakers[1] || "";

  return parsed.map((p) => {
    const side: "left" | "right" =
      p.speaker && right && p.speaker === right ? "right" : "left";
    return { speaker: p.speaker || "Transcript", text: p.text, side };
  });
}
