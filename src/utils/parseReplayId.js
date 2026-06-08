const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function parseReplayId(input) {
  if (!input?.trim()) return null;
  const match = input.trim().match(UUID_RE);
  return match ? match[0].toLowerCase() : null;
}

export function parseReplayIds(input) {
  if (!input?.trim()) return [];
  const matches = input.match(new RegExp(UUID_RE.source, "gi")) || [];
  return [...new Set(matches.map((id) => id.toLowerCase()))];
}
