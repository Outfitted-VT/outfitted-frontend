// The Friends page: people you follow, and people to find. Styles: .of-friends* in
// src/connected.css, on the app's --of-* theme.

import { currentUser } from "./data.js";
import { searchUsers, followUser, unfollowUser, getFollowing, getSuggestions } from "./fits.js";
import { escapeHtml } from "./format.js";
import { avatar, displayName, ofIcons } from "./views/components.js";

const TABS = [
  { id: "following", label: "Following" },
  { id: "discover", label: "Discover" },
];

const state = { tab: "following", query: "", following: null, followingCount: null };

const CHAT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>`;

function followButton(user, following) {
  return `<button type="button" class="of-friends-follow ${following ? "on" : ""}" data-follow="${escapeHtml(user.username)}" aria-pressed="${following}">
    ${following ? "Following" : "Follow"}
  </button>`;
}

function personCard(user, { following, note = "" }) {
  const line = note || user.bio || "";
  return `<li class="of-friends-card" data-user-id="${escapeHtml(user.id)}" data-open-user="${escapeHtml(user.username)}">
    ${avatar(user, { size: 52 })}
    <div class="of-friends-text">
      <b>${escapeHtml(displayName(user))}</b>
      <small>@${escapeHtml(user.username)}</small>
      ${line ? `<p>${escapeHtml(line)}</p>` : ""}
    </div>
    <div class="of-friends-actions">
      ${following ? `<button type="button" class="of-friends-chat" data-chat="${escapeHtml(user.id)}" aria-label="Message ${escapeHtml(displayName(user))}">${CHAT}</button>` : ""}
      ${followButton(user, following)}
    </div>
  </li>`;
}

function suggestionCard(user) {
  const mutual = user.mutual_count ? `${user.mutual_count} mutual` : "New on Outfitted";
  return `<li class="of-friends-suggest" data-user-id="${escapeHtml(user.id)}" data-open-user="${escapeHtml(user.username)}">
    ${avatar(user, { size: 56 })}
    <b>${escapeHtml(displayName(user))}</b>
    <small>${escapeHtml(mutual)}</small>
    ${followButton(user, false)}
  </li>`;
}

function message(title, text = "", action = "") {
  return `<div class="of-friends-empty" role="status">
    <p class="of-friends-empty-title">${escapeHtml(title)}</p>
    ${text ? `<p>${escapeHtml(text)}</p>` : ""}
    ${action}
  </div>`;
}

const loading = () => `<div class="of-friends-empty" role="status"><p>Loading…</p></div>`;

function tabsHtml() {
  return TABS.map((tab) => {
    const count = tab.id === "following" && state.followingCount !== null ? ` <span>${state.followingCount}</span>` : "";
    return `<button type="button" class="of-chip ${state.tab === tab.id ? "on" : ""}" data-friends-tab="${tab.id}" aria-pressed="${state.tab === tab.id}">${tab.label}${count}</button>`;
  }).join("");
}

export function renderFriendsView() {
  return `
    <section class="of-screen of-friends" id="friends-page">
      <header class="of-friends-head">
        <span class="of-friends-kicker">YOUR CIRCLE</span>
        <h1 class="of-display">Friends</h1>
        <p class="of-friends-sub">The people whose taste you trust. Follow them to see their fits, and message them before you buy.</p>
      </header>
      <label class="of-search of-friends-search">
        ${ofIcons.search()}
        <input type="search" placeholder="Search by name or @username" aria-label="Search people" value="${escapeHtml(state.query)}" data-friends-search autocomplete="off" />
      </label>
      <nav class="of-friends-tabs" aria-label="Friends" id="friends-tabs">${tabsHtml()}</nav>
      <section class="of-friends-suggestions" id="friends-suggestions" hidden></section>
      <div id="friends-list">${loading()}</div>
    </section>
  `;
}

// Everyone you follow (the API pages at most 50 at a time).
async function loadFollowing() {
  const users = [];
  let cursor = null;
  do {
    const page = await getFollowing(currentUser.username, { cursor, limit: 50 });
    users.push(...page.items);
    cursor = page.next_cursor;
  } while (cursor);
  return users;
}

const matchesQuery = (user, query) =>
  !query || [user.username, user.full_name || ""].some((text) => text.toLowerCase().includes(query.toLowerCase()));

// onOpenChat(userId): open a direct chat with that person (shown for people you follow, who are
// in your circle).
export function connectFriends(onOpenChat, options = {}) {
  const root = document.querySelector("#friends-page");
  if (!root) return;
  const list = root.querySelector("#friends-list");
  const tabs = root.querySelector("#friends-tabs");
  const suggestions = root.querySelector("#friends-suggestions");
  const search = root.querySelector("[data-friends-search]");
  let request = 0; // a slow earlier load can't overwrite a newer one

  async function paintFollowing() {
    const run = ++request;
    try {
      state.following ||= await loadFollowing();
    } catch (err) {
      if (run !== request) return;
      list.innerHTML = message("Couldn't load who you follow", err.message || "Check your connection and try again.", `<button type="button" class="of-friends-follow" data-friends-retry>Try again</button>`);
      return;
    }
    if (run !== request) return;
    state.followingCount = state.following.length;
    tabs.innerHTML = tabsHtml();
    const shown = state.following.filter((u) => matchesQuery(u, state.query));
    if (!state.following.length) {
      list.innerHTML = message("You're not following anyone yet", "Find people you know in Discover.", `<button type="button" class="of-friends-follow" data-friends-tab="discover">Discover people</button>`);
    } else if (!shown.length) {
      list.innerHTML = message("No one you follow matches", `Try another name, or search everyone in Discover.`);
    } else {
      list.innerHTML = `<ul class="of-friends-list">${shown.map((u) => personCard(u, { following: true })).join("")}</ul>`;
    }
  }

  async function paintSuggestions() {
    if (state.tab !== "discover" || state.query) {
      suggestions.hidden = true;
      return;
    }
    try {
      const people = await getSuggestions(8);
      if (state.tab !== "discover" || state.query || !people.length) return;
      suggestions.innerHTML = `<p class="of-friends-label">Suggested for you</p>
        <ul class="of-friends-suggest-row">${people.map(suggestionCard).join("")}</ul>`;
      suggestions.hidden = false;
    } catch {
      suggestions.hidden = true;
    }
  }

  async function paintDiscover() {
    const run = ++request;
    let users;
    try {
      users = await searchUsers(state.query);
    } catch (err) {
      if (run !== request) return;
      list.innerHTML = message("Couldn't load people", err.message || "Check your connection and try again.", `<button type="button" class="of-friends-follow" data-friends-retry>Try again</button>`);
      return;
    }
    if (run !== request) return;
    if (!users.length) {
      list.innerHTML = state.query
        ? message("No one found", `No one matches "${state.query}". Try another name or username.`)
        : message("No one else is here yet", "Invite your friends to Outfitted, then follow them here.");
      return;
    }
    list.innerHTML = `<p class="of-friends-label">${state.query ? "Results" : "Everyone"}</p>
      <ul class="of-friends-list">${users.map((u) => personCard(u, { following: u.is_following })).join("")}</ul>`;
  }

  function paint() {
    list.innerHTML = loading();
    paintSuggestions();
    return state.tab === "following" ? paintFollowing() : paintDiscover();
  }

  async function toggleFollow(button) {
    const username = button.dataset.follow;
    const wasFollowing = button.getAttribute("aria-pressed") === "true";
    const set = (on) => {
      root.querySelectorAll(`[data-follow="${CSS.escape(username)}"]`).forEach((b) => {
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
        b.textContent = on ? "Following" : "Follow";
      });
    };
    set(!wasFollowing);
    button.disabled = true;
    try {
      if (wasFollowing) await unfollowUser(username);
      else await followUser(username);
      options.toast?.(wasFollowing ? `Unfollowed @${username}` : `Following @${username}`);
      state.following = null; // reload the Following tab next time
      options.onFollowChanged?.();
    } catch (err) {
      set(wasFollowing);
      options.toast?.(err.message || "Couldn't update follow status. Try again.");
    } finally {
      button.disabled = false;
    }
  }

  root.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-friends-tab]");
    if (tab) {
      state.tab = tab.dataset.friendsTab;
      tabs.innerHTML = tabsHtml();
      return paint();
    }
    if (event.target.closest("[data-friends-retry]")) return paint();
    const follow = event.target.closest("[data-follow]");
    if (follow) return toggleFollow(follow);
    const chat = event.target.closest("[data-chat]");
    if (chat) return onOpenChat?.(chat.dataset.chat);
  });

  let timer = null;
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = search.value.trim();
      paint();
    }, 200);
  });

  state.following = null;
  paint();
}
