import { currentUser } from "./data.js";
import { onSocketEvent } from "./messages-socket.js";
import * as api from "./stories-api.js";

const store = { groups: [], loaded: false };
const listeners = new Set();
const viewed = new Set();
let unsubscribeSocket = null;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(change) {
  listeners.forEach((listener) => listener(change));
}

export const isLive = (story) => new Date(story.expires_at) > new Date();

export function liveGroup(group) {
  const stories = group.stories.filter(isLive);
  return { ...group, stories, has_unseen: stories.some((s) => !s.seen) };
}

export function storyGroups() {
  return store.groups.map(liveGroup).filter((group) => group.stories.length);
}

export function myGroup() {
  return storyGroups().find((group) => group.user.id === currentUser.id) || null;
}

export function findStory(storyId) {
  for (const group of store.groups) {
    const story = group.stories.find((s) => s.id === storyId);
    if (story) return { group, story };
  }
  return null;
}

export async function loadStoryFeed() {
  try {
    store.groups = await api.getStoryFeed();
  } catch {
    store.groups = store.groups || [];
  }
  store.loaded = true;
  notify({ type: "feed" });
}

export async function loadUserGroup(userId) {
  const group = await api.getUserStories(userId);
  return liveGroup(group);
}

export function markSeen(story) {
  if (story.user_id === currentUser.id || viewed.has(story.id)) return;
  viewed.add(story.id);
  const found = findStory(story.id);
  if (found) found.story.seen = true;
  story.seen = true;
  api.markStoryViewed(story.id).catch(() => viewed.delete(story.id));
  notify({ type: "seen", storyId: story.id });
}

export async function removeStory(storyId) {
  await api.deleteStory(storyId);
  store.groups = store.groups
    .map((group) => ({ ...group, stories: group.stories.filter((s) => s.id !== storyId) }))
    .filter((group) => group.stories.length);
  notify({ type: "feed" });
}

function onViewed({ story_id: storyId, viewer, view_count: count }) {
  const found = findStory(storyId);
  if (found) found.story.view_count = count;
  notify({ type: "viewed", storyId, viewer, count });
}

const HANDLERS = {
  "story:new": loadStoryFeed,
  "story:viewed": onViewed,
  "socket:open": loadStoryFeed,
};

export function startStories() {
  if (unsubscribeSocket) return;
  unsubscribeSocket = onSocketEvent((event) => HANDLERS[event.type]?.(event));
  loadStoryFeed();
}

export function stopStories() {
  unsubscribeSocket?.();
  unsubscribeSocket = null;
  store.groups = [];
  store.loaded = false;
  viewed.clear();
  notify({ type: "feed" });
}
