import { apiFetch, parse } from "./auth.js";

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const story = (id) => `/stories/${encodeURIComponent(id)}`;

export async function getStoryFeed() {
  return parse(await apiFetch("/stories/feed"));
}

export async function getUserStories(userId) {
  return parse(await apiFetch(`/users/${encodeURIComponent(userId)}/stories`));
}

export async function postStory({ imageId, caption = null, fitId = null, visibility = "public" }) {
  const body = { image_id: imageId, visibility, ...(caption && { caption }), ...(fitId && { fit_id: fitId }) };
  return parse(await apiFetch("/stories", json("POST", body)));
}

export async function markStoryViewed(id) {
  return parse(await apiFetch(`${story(id)}/view`, { method: "POST" }));
}

export async function getStoryViewers(id, { cursor = null, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), ...(cursor && { cursor }) });
  return parse(await apiFetch(`${story(id)}/viewers?${params}`));
}

export async function deleteStory(id) {
  return parse(await apiFetch(story(id), { method: "DELETE" }));
}

export async function replyToStory(id, body, clientId) {
  return parse(await apiFetch(`${story(id)}/reply`, json("POST", { body, client_id: clientId })));
}
