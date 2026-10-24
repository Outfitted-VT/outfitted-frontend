import { icons } from "./icons.js";
import { friendsList } from "./data.js";

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
            <input type="text" id="friend-page-search" placeholder="Find people by handle or aesthetic..." />
          </div>
        </div>
      </div>

      <div class="friends-grid" id="friends-grid-box">
        ${friendsList
          .map(
            (friend) => `
            <div class="friend-profile-card" data-friend-id="${friend.id}">
              <div class="friend-card-top">
                <span class="avatar-chip lg" style="background:${friend.color}; color:#fff;">${friend.initial}</span>
                <div class="friend-card-names">
                  <h3>${friend.name}</h3>
                  <small>${friend.handle}</small>
                </div>
                <button class="button ${friend.following ? "button-outline" : "button-primary"} button-sm btn-toggle-follow" data-friend-id="${friend.id}">
                  ${friend.following ? "Following" : "+ Follow"}
                </button>
              </div>

              <p class="friend-card-bio">${friend.bio}</p>

              <div class="friend-card-stats">
                <div><small>Fits Shared</small><strong>${friend.fitsCount}</strong></div>
                <div><small>Status</small><strong>${friend.status}</strong></div>
                <div><small>Opinion Score</small><strong>96%</strong></div>
              </div>

              <div class="friend-card-actions">
                <button class="button button-dark button-block btn-open-dm" data-friend-id="${friend.id}" data-friend-name="${friend.name}">
                  ${icons.message}<span>Send Message / Fit Check</span>
                </button>
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

export function connectFriends(onOpenMessageThread) {
  const container = document.querySelector("#friends-page");
  if (!container) return;

  // Follow / Unfollow toggle
  container.querySelectorAll(".btn-toggle-follow").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.friendId;
      const friend = friendsList.find((f) => f.id === id);
      if (friend) {
        friend.following = !friend.following;
        btn.textContent = friend.following ? "Following" : "+ Follow";
        btn.className = `button ${friend.following ? "button-outline" : "button-primary"} button-sm btn-toggle-follow`;
      }
    };
  });

  // Open DM
  container.querySelectorAll(".btn-open-dm").forEach((btn) => {
    btn.onclick = () => {
      const name = btn.dataset.friendName;
      if (onOpenMessageThread) onOpenMessageThread(name);
    };
  });

  // Search filter
  const searchInput = container.querySelector("#friend-page-search");
  if (searchInput) {
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase().trim();
      container.querySelectorAll(".friend-profile-card").forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.hidden = q && !text.includes(q);
      });
    };
  }
}
