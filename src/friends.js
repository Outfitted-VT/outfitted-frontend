import { icons } from "./icons.js";
import { searchUsers, followUser, unfollowUser, mediaUrl } from "./fits.js";
import { escapeHtml } from "./format.js";

function renderUserCard(user) {
  const name = user.full_name || user.username;
  const initial = (name || "U").charAt(0).toUpperCase();
  const isFollowing = Boolean(user.is_following);
  const bio = user.bio || "Fashion enthusiast on Outfitted.";

  return `
    <div class="friend-profile-card" data-username="${escapeHtml(user.username)}">
      <div class="friend-card-top">
        <span class="avatar-chip lg overflow-hidden" style="background:#0f3728; color:#fff;">
          ${
            user.avatar?.url
              ? `<img src="${escapeHtml(mediaUrl(user.avatar.url))}" alt="${escapeHtml(name)}" class="w-full h-full object-cover rounded-full" />`
              : escapeHtml(initial)
          }
        </span>
        <div class="friend-card-names">
          <h3>${escapeHtml(name)}</h3>
          <small>@${escapeHtml(user.username)}</small>
        </div>
        <button class="button ${isFollowing ? "button-outline" : "button-primary"} button-sm btn-toggle-follow"
          data-username="${escapeHtml(user.username)}"
          data-following="${isFollowing ? "true" : "false"}">
          ${isFollowing ? "Following" : "+ Follow"}
        </button>
      </div>

      <p class="friend-card-bio">${escapeHtml(bio)}</p>

      <div class="friend-card-stats">
        <div><small>Stylist Score</small><strong>96%</strong></div>
        <div><small>Status</small><strong>Active</strong></div>
        <div><small>Community</small><strong>Member</strong></div>
      </div>

      <div class="friend-card-actions">
        <button class="button button-dark button-block btn-open-dm" data-friend-name="${escapeHtml(name)}">
          ${icons.message}<span>Send Message / Fit Check</span>
        </button>
      </div>
    </div>
  `;
}

// Loading, empty, and error states share one full-width message block. `action` is optional
// button markup (e.g. Try again).
function renderStatus(title, text, action = "") {
  return `
    <div class="friend-empty-state" role="status" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
      <p style="font-size: 1.1rem; font-weight: 600; color: var(--ink);">${escapeHtml(title)}</p>
      <p style="color: var(--muted); font-size: 0.9rem; margin-top: 4px;">${escapeHtml(text)}</p>
      ${action ? `<div style="margin-top: 16px; display: flex; justify-content: center;">${action}</div>` : ""}
    </div>
  `;
}

const loadingState = () => renderStatus("Loading people…", "Finding people on Outfitted.");

export function renderFriendsView() {
  return `
    <div class="friends-page" id="friends-page">
      <div class="friends-hero">
        <div>
          <p class="eyebrow" style="color:var(--brand-coral);"><span class="coral-bullet">•</span> YOUR CIRCLE & STYLISTS</p>
          <h1 class="friends-title">Friends & Followers</h1>
          <p class="friends-subtitle">Real people whose taste you trust. Share looks directly and weigh in on their fits before they buy.</p>
        </div>
        <div class="friends-hero-search">
          <div class="wardrobe-search">
            <span class="search-icon">${icons.search}</span>
            <input type="text" id="friend-page-search" placeholder="Search friends by name or username..." autocomplete="off" />
          </div>
        </div>
      </div>

      <div class="friends-grid" id="friends-grid-box">
        ${loadingState()}
      </div>
    </div>
  `;
}

export function connectFriends(onOpenMessageThread, options = {}) {
  const container = document.querySelector("#friends-page");
  if (!container) return;

  const grid = container.querySelector("#friends-grid-box");
  const searchInput = container.querySelector("#friend-page-search");

  function setFollowButton(btn, following) {
    btn.dataset.following = following ? "true" : "false";
    btn.textContent = following ? "Following" : "+ Follow";
    btn.className = `button ${following ? "button-outline" : "button-primary"} button-sm btn-toggle-follow`;
  }

  function bindCardEvents() {
    grid.querySelectorAll(".btn-toggle-follow").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const username = btn.dataset.username;
        const wasFollowing = btn.dataset.following === "true";
        const willFollow = !wasFollowing;

        // Optimistic UI update; undone below if the request fails.
        setFollowButton(btn, willFollow);
        btn.disabled = true;

        try {
          if (willFollow) {
            await followUser(username);
            options.toast?.(`Following @${username}`);
          } else {
            await unfollowUser(username);
            options.toast?.(`Unfollowed @${username}`);
          }
          options.onFollowChanged?.();
        } catch (err) {
          setFollowButton(btn, wasFollowing);
          options.toast?.(err.message || "Couldn't update follow status. Try again.");
        } finally {
          btn.disabled = false;
        }
      };
    });

    grid.querySelectorAll(".btn-open-dm").forEach((btn) => {
      btn.onclick = () => {
        const name = btn.dataset.friendName;
        if (onOpenMessageThread) onOpenMessageThread(name);
      };
    });
  }

  // Each search gets a number, so a slow earlier response can't overwrite a newer one.
  let latestRequest = 0;

  async function loadUsers(query = "") {
    const request = ++latestRequest;

    let users;
    try {
      users = await searchUsers(query);
    } catch (err) {
      if (request !== latestRequest) return;
      grid.innerHTML = renderStatus(
        "Couldn't load people",
        err.message || "Check your connection and try again.",
        `<button type="button" class="button button-outline button-sm" id="friends-retry">Try again</button>`
      );
      grid.querySelector("#friends-retry").onclick = () => {
        grid.innerHTML = loadingState();
        loadUsers(query);
      };
      return;
    }
    if (request !== latestRequest) return;

    if (users.length > 0) {
      grid.innerHTML = users.map(renderUserCard).join("");
      bindCardEvents();
    } else if (query) {
      grid.innerHTML = renderStatus("No users found", `No one matches "${query}". Try another name or username.`);
    } else {
      grid.innerHTML = renderStatus("No one else is here yet", "Invite your friends to Outfitted, then follow them here.");
    }
  }

  loadUsers("");

  let searchTimeout = null;
  if (searchInput) {
    searchInput.oninput = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadUsers(searchInput.value.trim());
      }, 250);
    };
  }
}
