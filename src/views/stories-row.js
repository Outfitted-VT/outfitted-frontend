import { currentUser } from "../data.js";
import { escapeHtml } from "../format.js";
import * as stories from "../stories-store.js";
import { displayName, ofIcons, storyAvatar } from "./components.js";

const firstName = (user) => displayName(user).split(/\s+/)[0];

export function ringFor(group) {
  if (!group?.stories.length) return "none";
  return group.has_unseen ? "unseen" : "seen";
}

function ownItem() {
  const group = stories.myGroup();
  const me = { ...currentUser, full_name: currentUser.name };
  const open = group ? `data-story-user="${escapeHtml(currentUser.id)}"` : "data-story-compose";
  return `<div class="of-story-item" role="listitem">
    <button type="button" class="of-story-btn" ${open} aria-label="${group ? "View your story" : "Add to your story"}">${storyAvatar(me, { ring: ringFor(group) })}</button>
    <button type="button" class="of-story-add" data-story-compose aria-label="Add to your story">${ofIcons.plus(12)}</button>
    <span class="of-story-name">Your story</span>
  </div>`;
}

function item(group) {
  const name = firstName(group.user);
  return `<div class="of-story-item" role="listitem">
    <button type="button" class="of-story-btn" data-story-user="${escapeHtml(group.user.id)}" aria-label="${escapeHtml(`${name}'s story${group.has_unseen ? ", new" : ""}`)}">${storyAvatar(group.user, { ring: ringFor(group) })}</button>
    <span class="of-story-name">${escapeHtml(name)}</span>
  </div>`;
}

function rowHtml() {
  const others = stories.storyGroups().filter((group) => group.user.id !== currentUser.id);
  return ownItem() + others.map(item).join("");
}

export function renderStoriesRow() {
  return `<div class="of-stories" id="feed-stories" role="list" aria-label="Stories">${rowHtml()}</div>`;
}

export function mountStoriesRow({ onOpen, onCompose }) {
  const row = document.querySelector("#feed-stories");
  if (!row) return () => {};
  row.addEventListener("click", (event) => {
    if (event.target.closest("[data-story-compose]")) return onCompose();
    const open = event.target.closest("[data-story-user]");
    if (open) onOpen(open.dataset.storyUser);
  });
  const paint = () => {
    if (row.isConnected) row.innerHTML = rowHtml();
  };
  paint();
  return stories.subscribe((change) => ["feed", "seen"].includes(change.type) && paint());
}
