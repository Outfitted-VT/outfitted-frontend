import { icons } from "./icons.js";
import { friendsList } from "./data.js";
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

function renderMockCard(friend) {
  return `
    <div class="friend-profile-card" data-friend-id="${friend.id}" data-username="${friend.id}">
      <div class="friend-card-top">
        <span class="avatar-chip lg" style="background:${friend.color}; color:#fff;">${escapeHtml(friend.initial)}</span>
        <div class="friend-card-names">
          <h3>${escapeHtml(friend.name)}</h3>
          <small>${escapeHtml(friend.handle)}</small>
        </div>
        <button class="button ${friend.following ? "button-outline" : "button-primary"} button-sm btn-toggle-follow"
          data-username="${escapeHtml(friend.id)}"
          data-following="${friend.following ? "true" : "false"}">
          ${friend.following ? "Following" : "+ Follow"}
        </button>
      </div>

      <p class="friend-card-bio">${escapeHtml(friend.bio)}</p>

      <div class="friend-card-stats">
        <div><small>Fits Shared</small><strong>${escapeHtml(String(friend.fitsCount))}</strong></div>
        <div><small>Status</small><strong>${escapeHtml(friend.status)}</strong></div>
        <div><small>Opinion Score</small><strong>96%</strong></div>
      </div>

      <div class="friend-card-actions">
        <button class="button button-dark button-block btn-open-dm" data-friend-name="${escapeHtml(friend.name)}">
          ${icons.message}<span>Send Message / Fit Check</span>
        </button>
      </div>
    </div>
  `;
}

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
        ${friendsList.map(renderMockCard).join("")}
      </div>
    </div>
  `;
}

export function connectFriends(onOpenMessageThread, options = {}) {
  const container = document.querySelector("#friends-page");
  if (!container) return;

  const grid = container.querySelector("#friends-grid-box");
  const searchInput = container.querySelector("#friend-page-search");

  function bindCardEvents() {
    grid.querySelectorAll(".btn-toggle-follow").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const username = btn.dataset.username;
        const wasFollowing = btn.dataset.following === "true";
        const willFollow = !wasFollowing;

        // Optimistic UI update
        btn.dataset.following = willFollow ? "true" : "false";
        btn.textContent = willFollow ? "Following" : "+ Follow";
        btn.className = `button ${willFollow ? "button-outline" : "button-primary"} button-sm btn-toggle-follow`;

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
          // If offline or mock friend, update mock friend state
          const mockFriend = friendsList.find((f) => f.id === username);
          if (mockFriend) {
            mockFriend.following = willFollow;
          } else {
            // Revert UI on real API error
            btn.dataset.following = wasFollowing ? "true" : "false";
            btn.textContent = wasFollowing ? "Following" : "+ Follow";
            btn.className = `button ${wasFollowing ? "button-outline" : "button-primary"} button-sm btn-toggle-follow`;
            options.toast?.(err.message || "Failed to update follow status");
          }
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

  // Load live users from backend
  async function loadUsers(query = "") {
    try {
      const users = await searchUsers(query);
      if (users && users.length > 0) {
        grid.innerHTML = users.map(renderUserCard).join("");
      } else if (query) {
        grid.innerHTML = `
          <div class="friend-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
            <p style="font-size: 1.1rem; font-weight: 600; color: var(--on-surface);">No users found</p>
            <p style="color: var(--on-surface-variant); font-size: 0.9rem; margin-top: 4px;">No one matches "${escapeHtml(query)}". Try another search.</p>
          </div>
        `;
      } else {
        // Fall back to mock circle if no users exist on server
        grid.innerHTML = friendsList.map(renderMockCard).join("");
      }
      bindCardEvents();
    } catch {
      // Offline fallback: filter local cards
      if (!query) {
        grid.innerHTML = friendsList.map(renderMockCard).join("");
        bindCardEvents();
      } else {
        const q = query.toLowerCase();
        const matches = friendsList.filter(
          (f) => f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q) || f.bio.toLowerCase().includes(q)
        );
        if (matches.length > 0) {
          grid.innerHTML = matches.map(renderMockCard).join("");
        } else {
          grid.innerHTML = `
            <div class="friend-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
              <p style="font-size: 1.1rem; font-weight: 600;">No friends found</p>
              <p style="color: var(--on-surface-variant); font-size: 0.9rem; margin-top: 4px;">No one matches "${escapeHtml(query)}".</p>
            </div>
          `;
        }
        bindCardEvents();
      }
    }
  }

  bindCardEvents();
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
