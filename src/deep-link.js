export function parseLink(link) {
  let url;
  try {
    url = new URL(link, "https://outfitted.app");
  } catch {
    return null;
  }
  const [root, id, sub] = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (root === "users" && id) return { type: "user", username: id };
  if (root === "fits" && id) return { type: "fit", id };
  if (root === "conversations" && id) return { type: "conversation", id, messageId: url.searchParams.get("message") };
  if (root === "stories" && id && sub === "viewers") return { type: "story-viewers", id };
  if (root === "stories" && id) return { type: "story", id };
  if (root === "streak") return { type: "streak" };
  return null;
}
