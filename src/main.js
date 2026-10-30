import { currentUser, posts, friendsList, wardrobeOutfits, history, messagesData } from "./data.js";
import { icons } from "./icons.js";
import { renderStylistAssistant, connectStylistAssistant } from "./assistant.js";
import { renderMessagesView, connectMessages } from "./messages.js";
import { renderWardrobePage, connectWardrobe } from "./wardrobe.js";
import { renderFriendsView, connectFriends } from "./friends.js";
import { renderVirtualDressingRoomModal, connectVirtualDressingRoom, openVirtualDressingRoom } from "./tryon-modal.js";
import { renderShareModal, connectShareModal, openShareModalForPost } from "./share-modal.js";
import { renderBrandingDialog, connectBrandingDialog } from "./branding-dialog.js";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { ApiError, getMe, logIn, logOut, restoreSession, setSessionExpiredHandler, signUp } from "./auth.js";
import { initCreate, openCreate } from "./create.js";
import { mountFitList } from "./feed.js";
import { getProfile, uploadImage, updateProfile, mediaUrl } from "./fits.js";
import { escapeHtml } from "./format.js";
import { renderAuthScreen, setAuthMode, showAuthErrors } from "./views/auth-screen.js";
import { renderProfileView } from "./views/profile.js";
import { renderCreateSheet } from "./views/create-sheet.js";
import { openDormCloset } from "./dorm-closet.js";
import { openStyleFriend } from "./style-friend.js";
import { applyTheme, getThemePreference, isDarkTheme, onThemeChange, setThemePreference } from "./theme.js";

// Native (iOS/Android) status bar and splash screen. The status bar follows the theme.
if (Capacitor.isNativePlatform()) {
  const syncStatusBar = (dark) => {
    // Style.Dark is light text for a dark background; Style.Light is the opposite.
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: dark ? "#121413" : "#f9f9f6" }).catch(() => {});
  };
  syncStatusBar(isDarkTheme());
  onThemeChange(syncStatusBar);
  SplashScreen.hide().catch(() => {});
}
applyTheme();

const app = document.querySelector("#app");

let activeTab = "feed"; // 'feed' | 'wardrobe' | 'friends' | 'messages' | 'assistant' | 'profile'
let activePostForComments = null;

// Wide screens: the sidebar is either full or collapsed to an icon rail. Remembered per browser.
const SIDEBAR_KEY = "outfitted.sidebarCollapsed";
let sidebarCollapsed = false;
try {
  sidebarCollapsed = localStorage.getItem(SIDEBAR_KEY) === "1";
} catch {}

function showToast(message) {
  const existing = document.querySelector(".toast-notice");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast-notice";
  toast.innerHTML = `${icons.check}<span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

/* ---------- Top Bar Component ---------- */
function renderTopBar() {
  return `
    <header class="main-topbar">
      <div class="topbar-container">
        <a class="topbar-brand" href="#feed" data-nav="feed" aria-label="Outfitted home">
          <div class="brand-text-wrap">
            <span class="wordmark">OUTFITTED<span class="wordmark-dot">.</span></span>
            <span class="brand-tagline">GOOD FITS. BETTER FRIENDS.</span>
          </div>
        </a>

        <div class="topbar-center-banner">
          <div class="feed-header-pill">The feed <span class="asterisk-coral">✱</span></div>
          <span class="daily-dose-tag">YOUR DAILY DOSE OF GOOD TASTE</span>
        </div>

        <div class="topbar-actions">
          <button class="topbar-ai-pill" data-nav="assistant" title="Stylist AI">
            ${icons.wand}
            <span>✦ Stylist AI</span>
          </button>
          <button class="brand-suite-btn" id="open-branding-suite" title="App Icons & Splash Screen">
            <span class="asterisk-coral">✱</span>
            <span>Brand Marks</span>
          </button>
          <div class="notif-bell-wrap">
            <button class="icon-button" id="btn-notifications" aria-label="Notifications">
              ${icons.bell}
            </button>
            <span class="notif-dot"></span>
          </div>
          <button type="button" class="user-badge-hi overflow-hidden p-0" id="account-badge" aria-label="Account & Studio Menu" title="Account profile & studio menu">
            ${currentUser.avatarUrl ? `<img src="${escapeHtml(mediaUrl(currentUser.avatarUrl))}" alt="" class="w-full h-full object-cover rounded-full" />` : escapeHtml(currentUser.initial || "HI")}
          </button>
        </div>
      </div>
    </header>
  `;
}

/* ---------- Left Navigation Sidebar ---------- */
function renderSidebar() {
  return `
    <aside class="app-sidebar">
      <button type="button" class="sidebar-toggle" id="btn-sidebar-toggle"
        aria-expanded="${!sidebarCollapsed}" aria-label="${sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}">
        <span class="material-symbols-outlined" aria-hidden="true">${sidebarCollapsed ? "left_panel_open" : "left_panel_close"}</span>
      </button>

      <nav class="sidebar-nav-list" aria-label="Main Navigation">
        <a href="#feed" class="nav-item ${activeTab === "feed" ? "active" : ""}" data-nav="feed" title="Feed">
          ${icons.feed}
          <span class="sidebar-label">Feed</span>
        </a>
        <a href="#wardrobe" class="nav-item ${activeTab === "wardrobe" ? "active" : ""}" data-nav="wardrobe" title="My fits">
          ${icons.hanger}
          <span class="sidebar-label">My fits</span>
        </a>
        <a href="#friends" class="nav-item ${activeTab === "friends" ? "active" : ""}" data-nav="friends" title="Friends">
          ${icons.users}
          <span class="sidebar-label">Friends</span>
        </a>
        <a href="#messages" class="nav-item ${activeTab === "messages" ? "active" : ""}" data-nav="messages" title="Messages">
          ${icons.message}
          <span class="sidebar-label">Messages</span>
        </a>
        <a href="#assistant" class="nav-item ${activeTab === "assistant" ? "active" : ""}" data-nav="assistant" title="Stylist AI">
          ${icons.wand}
          <span class="sidebar-label">✦ Stylist AI</span>
        </a>
        <a href="#profile" class="nav-item ${activeTab === "profile" ? "active" : ""}" data-nav="profile" title="Profile">
          ${icons.users}
          <span class="sidebar-label">Profile</span>
        </a>
      </nav>

      <button class="btn-sidebar-create" id="btn-open-create-fit" title="Create a fit">
        <span>+<span class="sidebar-label"> Create a fit</span></span>
        <span class="sidebar-create-arrow">${icons.arrowRight}</span>
      </button>

      <div class="sidebar-bottom-card">
        <span class="mustard-sparkle">✱</span>
        <div class="mustard-title">Your style, your circle.</div>
        <p class="mustard-desc">Looks worth sharing. Opinions worth hearing.</p>
        <button type="button" class="mustard-link" id="link-sidebar-auth">
          <span>Join Outfitted</span>
          <span>${icons.arrowRight}</span>
        </button>
      </div>
    </aside>
  `;
}

/* ---------- Post Card Component (Image 1 & 6) ---------- */
function renderPostCard(post) {
  const totalVotes = post.votes.yes + post.votes.no;
  const yesShare = totalVotes > 0 ? Math.round((post.votes.yes / totalVotes) * 100) : 50;

  return `
    <article class="post-card" id="post-${post.id}" data-post-id="${post.id}">
      <header class="post-card-header">
        <div class="post-author-wrap">
          <span class="avatar-chip" style="background:${post.initialBg || "#2d5a3f"}">${post.initial}</span>
          <div class="post-author-meta">
            <strong class="author-name">${post.author}</strong>
            <small class="author-handle">${post.handle || "@friend"} · ${post.time}</small>
          </div>
        </div>
        <button class="icon-button" aria-label="Options">${icons.more}</button>
      </header>

      <div class="post-media-stage">
        <img src="${post.image}" alt="${post.title}" class="post-img-main" />
        <span class="fit-file-badge">${post.fileTag || "THE FIT FILES / 01"}</span>
      </div>

      <div class="post-card-body">
        <div class="post-title-row">
          <h3 class="post-card-title">${post.title}</h3>
          <span class="sample-fit-pill">SAMPLE FIT</span>
        </div>

        <p class="post-question-text">${post.question}</p>

        <div class="post-pieces-line">
          <span>👕</span>
          <p>${post.piecesSummary || post.pieces.map((p) => p.name).join(" · ")}</p>
        </div>

        <!-- Interactive Poll -->
        <div class="poll-component" data-post-id="${post.id}">
          <span class="poll-question-label">Would you wear it?</span>
          <div class="poll-buttons-row">
            <button class="btn-poll-option ${post.userVote === "yes" ? "voted" : ""}" data-vote="yes" data-post-id="${post.id}">
              Wear it
            </button>
            <button class="btn-poll-option ${post.userVote === "no" ? "voted" : ""}" data-vote="no" data-post-id="${post.id}">
              Rethink
            </button>
          </div>
          <div class="poll-results-bar-wrap">
            <div class="poll-progress-track">
              <div class="poll-progress-fill" style="width:${yesShare}%"></div>
            </div>
            <span class="poll-results-stat"><strong>${yesShare}%</strong> say wear it · ${totalVotes} votes</span>
          </div>
        </div>

        <!-- Super Reactions -->
        <div class="super-react-bar" data-post-id="${post.id}">
          ${Object.entries(post.superReactions || { "🎧": 3, "💍": 2, "🍦": 1, "💖": 8, "🧁": 2, "🎀": 5 })
            .map(([emoji, count]) => `
              <button class="reaction-sticker-btn" data-emoji="${emoji}" data-post-id="${post.id}">
                <span>${emoji}</span>
                <span class="rx-count">${count}</span>
              </button>
            `)
            .join("")}
        </div>
      </div>

      <footer class="post-card-footer">
        <div class="footer-left-actions">
          <button class="btn-card-action btn-card-like ${post.hasLiked ? "liked" : ""}" data-post-id="${post.id}">
            ${icons.heart}
            <span class="like-count">${post.likes}</span>
          </button>
          <button class="btn-card-action btn-card-comment" data-post-id="${post.id}">
            ${icons.comment}
            <span>${post.commentsList ? post.commentsList.length : post.comments}</span>
          </button>
          <button class="btn-card-action btn-card-share" data-post-id="${post.id}">
            ${icons.share}
            <span>Share</span>
          </button>
        </div>
        <button class="btn-try-look-cta" data-post-id="${post.id}">
          <span>Try a look</span>
          <span>${icons.arrowRight}</span>
        </button>
      </footer>
    </article>
  `;
}

/* ---------- Center Feed Hero & Feed Stream ---------- */
function renderMainFeed() {
  return `
    <div class="main-feed-column">
      <!-- Hero Banner (Image 1) -->
      <section class="feed-hero-banner" aria-label="Social Fit Check Hero">
        <p class="eyebrow" style="color:var(--brand-coral);">
          <span class="coral-bullet">•</span> THE SOCIAL FIT CHECK
        </p>
        <h1 class="hero-heading">
          Good fits are <span class="hero-underline">better together.</span>
        </h1>
        <p class="hero-subtitle">
          Show your people the look. Get the real opinion. Wear it your way.
        </p>
        <div class="hero-actions-row">
          <button class="button button-primary" id="btn-hero-post-fit">
            <span>Post a fit</span>
            <span>${icons.arrowRight}</span>
          </button>
          <button class="button button-outline" id="btn-hero-try-on">
            ${icons.sparkleIcon}
            <span>Try it on</span>
          </button>
        </div>
      </section>

      <!-- Real fits from the backend (loaded by src/feed.js) -->
      <section class="feed-section-header" aria-label="Fits from your circle">
        <p class="eyebrow" style="color:var(--brand-coral);">LIVE FROM YOUR CIRCLE</p>
        <div class="feed-header-top">
          <h2 class="feed-title-big">Latest fits ↘</h2>
        </div>
      </section>
      <div class="flex flex-col gap-space-lg" id="feed-fits"></div>
      <div class="py-space-md flex justify-center" id="feed-status"></div>
      <div id="feed-sentinel" aria-hidden="true"></div>

      <!-- Feed Section Header -->
      <div class="feed-section-header">
        <p class="eyebrow" style="color:var(--brand-green);">YOUR CORNER OF THE INTERNET</p>
        <div class="feed-header-top">
          <h2 class="feed-title-big">Fresh off the fits ↘</h2>
          <button class="sort-dropdown-btn" id="btn-feed-sort">
            <span>Latest first</span>
            ${icons.chevronDown}
          </button>
        </div>
        <p class="feed-header-lede">A LITTLE INSPIRATION WHILE YOUR CIRCLE GETS DRESSED</p>
      </div>

      <!-- Feed Cards -->
      <div class="feed-cards-grid" id="feed-cards-container">
        ${posts.map(renderPostCard).join("")}
      </div>
    </div>
  `;
}

/* ---------- Column 3: Right Sidebar (In the Mix) ---------- */
function renderRightRail() {
  return `
    <aside class="app-rail-right">
      <div class="rail-section-head">
        <span class="rail-section-title">IN THE MIX <span class="asterisk-coral">✱</span></span>
      </div>

      <!-- Green Fit Check Card -->
      <div class="rail-fitcheck-card">
        <h3 class="fitcheck-title">The fit check.</h3>
        <p class="fitcheck-body">That outfit sitting in your cart? Let your friends weigh in before you hit buy.</p>
        <button class="btn-ask-group" id="btn-ask-group-cart">
          <span>Ask the group</span>
          <span>${icons.arrowRight}</span>
        </button>
      </div>

      <!-- Your People Widget -->
      <div class="rail-people-widget">
        <div class="rail-section-head">
          <span class="rail-section-title">YOUR PEOPLE ↗</span>
        </div>
        <small style="color:var(--muted); font-size:0.8rem;">Your people will show up here.</small>

        <div class="people-list">
          ${friendsList.slice(0, 4).map((f) => `
            <div class="people-item">
              <div class="people-item-info">
                <span class="avatar-chip micro" style="background:${f.color}; color:#fff;">${f.initial}</span>
                <div class="people-item-text">
                  <strong>${f.name}</strong>
                  <small>${f.handle}</small>
                </div>
              </div>
              <button class="btn-follow-toggle ${f.following ? "following" : ""}" data-friend-id="${f.id}">
                ${f.following ? "Following" : "+ Follow"}
              </button>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="rail-tagline-footer">
        <span>NO JUDGMENT. JUST GOOD TASTE.</span>
        <span class="asterisk-coral">✱</span>
      </div>
    </aside>
  `;
}

/* ---------- Post Your Fit Modal (Image 5) ---------- */
function renderPostYourFitModal() {
  return `
    <dialog class="sheet sheet-large" id="post-fit-modal" aria-labelledby="post-fit-title">
      <div class="sheet-card">
        <button type="button" class="icon-button close" id="close-post-modal" aria-label="Close">${icons.close}</button>
        <div>
          <p class="eyebrow" style="color:var(--brand-green);">A LOOK WORTH SHARING <span class="asterisk-coral">✱</span></p>
          <h2 id="post-fit-title" style="font-family:var(--font-display); font-size:2rem; font-weight:800;">Post your fit.</h2>
          <p class="sheet-lede">Give your circle something to talk about.</p>
        </div>

        <form class="fit-form-grid" id="form-post-fit">
          <label class="photo-uploader-dropzone" id="fit-photo-dropzone">
            <input type="file" id="fit-file-input" accept="image/*" hidden />
            <div class="dropzone-icon-circle">${icons.camera}</div>
            <strong>Add your fit photo</strong>
            <small style="color:var(--muted);">JPEG, PNG, or WEBP · up to 10 MB</small>
            <img id="fit-image-preview" class="uploader-preview-img" hidden alt="Fit Preview" />
          </label>

          <div style="text-align:center;">
            <a href="#try-on" class="sublink-virtual-tryon" id="link-tryon-first">
              ${icons.sparkleIcon}<span>Or make a virtual try-on first</span>
            </a>
          </div>

          <label class="field-label">
            Fit name
            <input type="text" id="input-fit-name" class="field-input" required placeholder="Give this look a name" />
          </label>

          <label class="field-label">
            What's the question?
            <textarea id="input-fit-question" class="field-input" required placeholder="Be honest — is this the one?"></textarea>
          </label>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <label class="field-label">
              Piece (optional)
              <input type="text" id="input-fit-piece" class="field-input" placeholder="e.g. Knit cardigan" />
            </label>
            <label class="field-label">
              Shop link (optional)
              <input type="url" id="input-fit-link" class="field-input" placeholder="https://..." />
            </label>
          </div>

          <label class="field-label">
            Who can see it?
            <select id="select-fit-audience" class="field-input">
              <option value="Everyone on Outfitted">Everyone on Outfitted</option>
              <option value="Close friends">Close friends</option>
              <option value="Followers only">Followers only</option>
            </select>
          </label>

          <button type="submit" class="button button-primary button-block" style="height:48px; margin-top:8px;">
            <span>Post fit</span>
            <span>${icons.arrowRight}</span>
          </button>
        </form>
      </div>
    </dialog>
  `;
}

/* ---------- Comments Drawer Dialog ---------- */
function renderCommentsDialog() {
  return `
    <dialog class="sheet" id="comments-sheet-dialog" aria-labelledby="comments-sheet-title">
      <div class="sheet-card">
        <button type="button" class="icon-button close" id="close-comments-sheet" aria-label="Close">${icons.close}</button>
        <div>
          <p class="eyebrow" style="color:var(--brand-green);">CIRCLE OPINIONS</p>
          <h2 id="comments-sheet-title" style="font-size:1.4rem;">Fit Discussion</h2>
          <p class="sheet-lede" id="comments-sheet-lede">Feedback and advice from your people.</p>
        </div>

        <div class="comments-list" id="modal-comments-list" style="display:flex; flex-direction:column; gap:12px; max-height:360px; overflow-y:auto;">
          <!-- Dynamically filled -->
        </div>

        <form class="comment-compose-bar" id="comments-sheet-form" style="display:flex; gap:10px; margin-top:12px;">
          <input type="text" id="sheet-comment-input" class="field-input" style="flex:1;" required placeholder="Drop styling advice or opinion..." />
          <button type="submit" class="button button-dark">${icons.send}</button>
        </form>
      </div>
    </dialog>
  `;
}

/* ---------- Notifications Dropdown Drawer ---------- */
function renderNotificationsDrawer() {
  return `
    <dialog class="sheet" id="notifications-dialog" aria-labelledby="notif-heading">
      <div class="sheet-card">
        <button type="button" class="icon-button close" id="close-notif-dialog" aria-label="Close">${icons.close}</button>
        <div>
          <p class="eyebrow" style="color:var(--brand-coral);">ACTIVITY</p>
          <h2 id="notif-heading">Notifications</h2>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; gap:12px; padding:10px; background:var(--surface-sunk); border-radius:8px;">
            <span class="avatar-chip micro" style="background:#275038; color:#fff;">MC</span>
            <div>
              <p style="font-size:0.85rem;"><strong>Maya Chen</strong> voted <strong>Wear it</strong> on your live fit.</p>
              <small style="color:var(--muted);">15m ago</small>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  `;
}

/* ---------- Account Profile & Studio Drawer ---------- */
function renderAccountDrawer() {
  return `
    <dialog class="sheet sheet-account" id="account-sheet-dialog" aria-labelledby="account-sheet-title">
      <div class="sheet-card account-card">
        <div class="sheet-drag-handle"></div>
        <button type="button" class="icon-button close" id="close-account-sheet" aria-label="Close">${icons.close}</button>
        
        <div class="account-profile-header">
          <span class="avatar-chip lg overflow-hidden" style="background:#0f3728; color:#fff;">${currentUser.avatarUrl ? `<img src="${escapeHtml(mediaUrl(currentUser.avatarUrl))}" alt="" class="w-full h-full object-cover rounded-full" />` : escapeHtml(currentUser.initial || "HI")}</span>
          <div class="account-profile-info">
            <h3 id="account-sheet-title">${escapeHtml(currentUser.name)}</h3>
            <p class="account-handle">${escapeHtml(currentUser.handle)} · <span class="account-tier-badge">Stylist Circle</span></p>
          </div>
        </div>

        <div class="account-nav-grid">
          <button class="account-nav-tile" data-nav="friends">
            <span class="tile-icon" style="background:#ebf7f0; color:#0f3728;">${icons.users}</span>
            <div class="tile-text">
              <strong>Friends & Followers</strong>
              <small>Taste you trust · ${friendsList.length} ${friendsList.length === 1 ? "person" : "people"}</small>
            </div>
            <span class="tile-arrow">${icons.arrowRight}</span>
          </button>

          <button class="account-nav-tile" data-nav="profile">
            <span class="tile-icon" style="background:#fef8e2; color:#b07800;">${icons.hanger}</span>
            <div class="tile-text">
              <strong>Your profile</strong>
              <small>Your posted fits, followers & sign out</small>
            </div>
            <span class="tile-arrow">${icons.arrowRight}</span>
          </button>

          <button class="account-nav-tile" data-nav="assistant">
            <span class="tile-icon" style="background:#ebf7f0; color:#0f3728;">${icons.wand}</span>
            <div class="tile-text">
              <strong>Stylist AI Assistant</strong>
              <small>Chat, outfit generator, screenshot search</small>
            </div>
            <span class="tile-arrow">${icons.arrowRight}</span>
          </button>

          <button class="account-nav-tile" id="account-open-branding">
            <span class="tile-icon" style="background:#fcedea; color:#e26250;">${icons.sparkleIcon}</span>
            <div class="tile-text">
              <strong>Brand Suite & Splash</strong>
              <small>Marks, Didot startup sequence</small>
            </div>
            <span class="tile-arrow">${icons.arrowRight}</span>
          </button>
        </div>

        <div class="account-appearance">
          <span class="account-appearance-label" id="appearance-label">Appearance</span>
          <div class="grid grid-cols-3 p-1 rounded-full bg-surface-container" role="radiogroup" aria-labelledby="appearance-label">
            ${[
              ["light", "light_mode", "Light"],
              ["dark", "dark_mode", "Dark"],
              ["system", "contrast", "System"],
            ]
              .map(
                ([value, icon, label]) => `
              <button type="button" role="radio" data-theme-option="${value}" aria-checked="false"
                class="compare-tab h-9 rounded-full font-label-md text-label-md font-semibold flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[16px]">${icon}</span>${label}
              </button>`
              )
              .join("")}
          </div>
        </div>

        <div class="account-sheet-footer" style="display:flex; flex-direction:column; gap:8px;">
          <button class="button button-primary button-block" id="btn-open-signin">
            <span>Switch account</span>
          </button>
          <button class="button button-outline button-block" id="btn-signout-demo">
            <span>Sign Out (${escapeHtml(currentUser.handle)})</span>
          </button>
        </div>
      </div>
    </dialog>
  `;
}

/* ---------- Sign In / Sign Up Sheet Dialog ---------- */
function renderAuthDialog() {
  return `
    <dialog class="sheet sheet-auth" id="auth-sheet-dialog" aria-labelledby="auth-modal-title">
      <div class="sheet-card auth-card">
        <div class="sheet-drag-handle"></div>
        <button type="button" class="icon-button close" id="close-auth-sheet" aria-label="Close">${icons.close}</button>

        <div>
          <p class="eyebrow" style="color:var(--brand-coral);">ACCOUNT ACCESS <span class="asterisk-coral">✱</span></p>
          <h2 id="auth-modal-title" style="font-family:var(--font-display); font-size:1.85rem; font-weight:800;">Welcome to Outfitted</h2>
          <p class="sheet-lede" id="auth-modal-lede">Sign in to your style profile or join the circle.</p>
        </div>

        <div class="auth-tabs-row" role="tablist">
          <button type="button" class="auth-tab-btn active" id="tab-auth-login" data-mode="login">Sign In</button>
          <button type="button" class="auth-tab-btn" id="tab-auth-signup" data-mode="signup">Create Account</button>
        </div>

        <form class="auth-form-body" id="auth-sheet-form">
          <div id="auth-signup-fields" hidden>
            <label class="field-label">
              Full Name
              <input type="text" id="auth-input-name" class="field-input" placeholder="e.g. Jane Doe" />
            </label>
            <label class="field-label" style="margin-top:12px;">
              Username
              <input type="text" id="auth-input-username" class="field-input" placeholder="e.g. janedoe" autocapitalize="none" />
            </label>
          </div>

          <label class="field-label" style="margin-top:12px;">
            Email or Username
            <input type="text" id="auth-input-email" class="field-input" required placeholder="you@example.com" autocapitalize="none" />
          </label>

          <label class="field-label" style="margin-top:12px;">
            Password
            <input type="password" id="auth-input-password" class="field-input" required placeholder="••••••••" autocomplete="current-password" />
          </label>

          <div class="auth-status-banner" id="auth-status-banner" hidden></div>

          <button type="submit" class="button button-primary button-block" id="btn-auth-submit" style="height:46px; margin-top:16px;">
            <span>Sign In</span>
            <span>${icons.arrowRight}</span>
          </button>
        </form>

        <div class="auth-divider">
          <span>OR SWITCH PROFILE</span>
        </div>

        <div class="quick-profiles-list">
          <button type="button" class="quick-profile-chip" data-profile="sofoniyas">
            <span class="avatar-chip micro" style="background:#0f3728; color:#fff;">S</span>
            <span>Sofoniyas (@sofoniyas) — Default</span>
          </button>
          <button type="button" class="quick-profile-chip" data-profile="maya">
            <span class="avatar-chip micro" style="background:#275038; color:#fff;">MC</span>
            <span>Maya Chen (@mayamakesfits)</span>
          </button>
        </div>
      </div>
    </dialog>
  `;
}

/* ---------- Mobile Bottom Navigation Bar (Image 6) ---------- */
function renderMobileBottomNav() {
  return `
    <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button class="mobile-nav-btn ${activeTab === "feed" ? "active" : ""}" data-nav="feed">
        ${icons.feed}
        <span>Feed</span>
      </button>
      <button class="mobile-nav-btn ${activeTab === "wardrobe" ? "active" : ""}" data-nav="wardrobe">
        ${icons.hanger}
        <span>My fits</span>
      </button>
      <button class="mobile-nav-btn btn-mobile-new" id="btn-mobile-create-fit" aria-label="Post a new fit">
        <span class="plus-badge">${icons.plus}</span>
        <span>Post</span>
      </button>
      <button class="mobile-nav-btn ${activeTab === "assistant" ? "active" : ""}" data-nav="assistant">
        ${icons.wand}
        <span>Stylist AI</span>
      </button>
      <button class="mobile-nav-btn ${activeTab === "messages" ? "active" : ""}" data-nav="messages">
        <div class="mobile-nav-icon-wrap">
          ${icons.message}
        </div>
        <span>Messages</span>
      </button>
    </nav>
  `;
}

/* ---------- Main Render Loop ---------- */
function render() {
  app.innerHTML = `
    <div id="app-shell" class="${sidebarCollapsed ? "sidebar-collapsed" : ""}">
      ${renderTopBar()}

      <div class="app-body-container">
        ${renderSidebar()}

        <main id="main-content-region">
          ${
            activeTab === "feed"
              ? renderMainFeed()
              : activeTab === "wardrobe"
              ? renderWardrobePage()
              : activeTab === "friends"
              ? renderFriendsView()
              : activeTab === "messages"
              ? renderMessagesView()
              : activeTab === "assistant"
              ? renderStylistAssistant()
              : activeTab === "profile"
              ? renderProfileView()
              : renderMainFeed()
          }
        </main>

        ${activeTab === "feed" ? renderRightRail() : ""}
      </div>

      ${renderMobileBottomNav()}
      ${renderCreateSheet()}
      <div id="steal-swap-modal-root" class="hidden"></div>
      <div id="dorm-closet-modal-root" class="hidden"></div>
      <div id="style-friend-modal-root" class="hidden"></div>
      ${renderPostYourFitModal()}
      ${renderVirtualDressingRoomModal()}
      ${renderShareModal()}
      ${renderBrandingDialog()}
      ${renderCommentsDialog()}
      ${renderNotificationsDrawer()}
      ${renderAccountDrawer()}
      ${renderAuthDialog()}
    </div>
  `;

  bindEvents();
  connectBackend();
}

function bindEvents() {
  const accountSheet = document.querySelector("#account-sheet-dialog");

  // Navigation tabs
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      accountSheet?.close();
      const target = el.dataset.nav;
      activeTab = target;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });

  // Collapse / expand the wide-screen sidebar. Only the shell class changes, so the open page
  // keeps its state.
  const sidebarToggle = document.querySelector("#btn-sidebar-toggle");
  if (sidebarToggle) {
    sidebarToggle.onclick = () => {
      sidebarCollapsed = !sidebarCollapsed;
      document.querySelector("#app-shell").classList.toggle("sidebar-collapsed", sidebarCollapsed);
      sidebarToggle.setAttribute("aria-expanded", String(!sidebarCollapsed));
      sidebarToggle.setAttribute("aria-label", sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
      sidebarToggle.querySelector(".material-symbols-outlined").textContent = sidebarCollapsed
        ? "left_panel_open"
        : "left_panel_close";
      try {
        localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
      } catch {}
    };
  }

  // Connect submodules if active
  if (activeTab === "assistant") {
    connectStylistAssistant(
      (outfit) => openVirtualDressingRoom(outfit),
      (outfit) => openPostFitModalWithData(outfit)
    );
  } else if (activeTab === "messages") {
    connectMessages();
  } else if (activeTab === "wardrobe") {
    connectWardrobe(
      (outfit) => openVirtualDressingRoom(outfit),
      (outfit) => openShareModalForPost(outfit)
    );
  } else if (activeTab === "friends") {
    connectFriends(
      (friendName) => {
        activeTab = "messages";
        render();
      },
      { toast: showToast, onFollowChanged: loadProfileCounts }
    );
  }

  // Connect common dialogs
  connectVirtualDressingRoom((newFit) => {
    posts.unshift({
      id: `fit-${Date.now()}`,
      fileTag: `THE FIT FILES / 0${posts.length + 1}`,
      author: currentUser.name,
      handle: currentUser.handle,
      initial: currentUser.initial,
      initialBg: "#0f3728",
      time: "Just now",
      title: newFit.title,
      question: newFit.question,
      image: newFit.image,
      piecesSummary: newFit.pieces,
      pieces: [{ name: newFit.pieces, color: "#244b3c" }],
      votes: { yes: 1, no: 0 },
      likes: 1,
      hasLiked: true,
      superReactions: { "🎧": 0, "💍": 0, "🍦": 0, "💖": 1, "🧁": 0, "🎀": 0 },
      comments: 0,
      commentsList: [],
    });
    activeTab = "feed";
    render();
    showToast("Virtual try-on posted to your Circle!");
  });

  connectShareModal((recipient) => {
    showToast(`Shared fit with ${recipient}!`);
  });

  connectBrandingDialog();

  // Create a fit (sidebar, hero, mobile "New", profile): the create sheet, which posts to the
  // backend with piece detection and shop links. "Try it on" goes straight to the real try-on.
  ["#btn-open-create-fit", "#btn-hero-post-fit", "#btn-mobile-create-fit", "#btn-profile-new-fit"].forEach((id) => {
    const btn = document.querySelector(id);
    if (btn) btn.onclick = () => openCreate();
  });

  const btnHeroTryOn = document.querySelector("#btn-hero-try-on");
  if (btnHeroTryOn) btnHeroTryOn.onclick = () => openCreate("tryon");

  const btnBrandingSuite = document.querySelector("#open-branding-suite");
  if (btnBrandingSuite) {
    btnBrandingSuite.onclick = () => {
      const dialog = document.querySelector("#branding-dialog");
      if (dialog) dialog.showModal();
    };
  }

  // Account profile drawer triggers
  const btnAccountBadge = document.querySelector("#account-badge");
  const closeAccount = document.querySelector("#close-account-sheet");
  const authDialog = document.querySelector("#auth-sheet-dialog");
  const closeAuth = document.querySelector("#close-auth-sheet");
  const openAuthBtn = document.querySelector("#btn-open-signin");
  const linkSidebarAuth = document.querySelector("#link-sidebar-auth");

  const openAuth = (mode = "login") => {
    accountSheet?.close();
    setAuthSheetMode(mode);
    authDialog?.showModal();
  };

  if (btnAccountBadge && accountSheet) {
    btnAccountBadge.onclick = () => accountSheet.showModal();
  }
  if (closeAccount && accountSheet) {
    closeAccount.onclick = () => accountSheet.close();
  }

  // Appearance: light / dark / follow the system.
  const themeOptions = document.querySelectorAll("[data-theme-option]");
  const markTheme = () => {
    const preference = getThemePreference();
    themeOptions.forEach((option) => {
      option.setAttribute("aria-checked", String(option.dataset.themeOption === preference));
    });
  };
  themeOptions.forEach((option) => {
    option.onclick = () => {
      setThemePreference(option.dataset.themeOption);
      markTheme();
    };
  });
  markTheme();
  if (openAuthBtn) openAuthBtn.onclick = () => openAuth("login");
  if (linkSidebarAuth) {
    linkSidebarAuth.onclick = (e) => {
      e.preventDefault();
      openAuth("signup");
    };
  }
  if (closeAuth) closeAuth.onclick = () => authDialog?.close();

  function setAuthSheetMode(mode) {
    const isSignup = mode === "signup";
    const tabLogin = document.querySelector("#tab-auth-login");
    const tabSignup = document.querySelector("#tab-auth-signup");
    const signupFields = document.querySelector("#auth-signup-fields");
    const title = document.querySelector("#auth-modal-title");
    const submitBtn = document.querySelector("#btn-auth-submit");
    const form = document.querySelector("#auth-sheet-form");
    const banner = document.querySelector("#auth-status-banner");

    if (banner) banner.hidden = true;
    if (form) form.dataset.mode = mode;
    if (tabLogin) tabLogin.classList.toggle("active", !isSignup);
    if (tabSignup) tabSignup.classList.toggle("active", isSignup);
    if (signupFields) signupFields.hidden = !isSignup;
    if (title) title.textContent = isSignup ? "Create your account" : "Welcome back";
    if (submitBtn) {
      submitBtn.querySelector("span").textContent = isSignup ? "Create Account" : "Sign In";
    }
  }

  document.querySelector("#tab-auth-login")?.addEventListener("click", () => setAuthSheetMode("login"));
  document.querySelector("#tab-auth-signup")?.addEventListener("click", () => setAuthSheetMode("signup"));

  // Quick profile switches
  document.querySelectorAll(".quick-profile-chip").forEach((chip) => {
    chip.onclick = () => {
      const p = chip.dataset.profile;
      if (p === "maya") {
        currentUser.name = "Maya Chen";
        currentUser.handle = "@mayamakesfits";
        currentUser.initial = "M";
        currentUser.bio = "Stylist & architecture student. Always oversized denim.";
      } else {
        currentUser.name = "Sofoniyas";
        currentUser.handle = "@sofoniyas";
        currentUser.initial = "S";
        currentUser.bio = "Curating textures, tailoring & everyday ease. Brooklyn, NY.";
      }
      authDialog?.close();
      render();
      showToast(`Switched profile to ${currentUser.name}!`);
    };
  });

  // Auth form submission
  const authForm = document.querySelector("#auth-sheet-form");
  if (authForm) {
    authForm.onsubmit = async (e) => {
      e.preventDefault();
      const isSignup = authForm.dataset.mode === "signup";
      const email = document.querySelector("#auth-input-email")?.value.trim();
      const password = document.querySelector("#auth-input-password")?.value;
      const username = document.querySelector("#auth-input-username")?.value.trim() || (email ? email.split("@")[0] : "user");
      const fullName = document.querySelector("#auth-input-name")?.value.trim() || username;
      const banner = document.querySelector("#auth-status-banner");
      const submitBtn = document.querySelector("#btn-auth-submit");

      if (!email || !password) return;

      submitBtn.disabled = true;
      submitBtn.querySelector("span").textContent = isSignup ? "Connecting…" : "Signing in…";
      if (banner) banner.hidden = true;

      try {
        if (isSignup) {
          await signUp({ email, username, password, fullName });
        }
        await logIn(email, password);
        const me = await getMe();
        authDialog?.close();
        // Full sign-in setup (username for the profile and fits, then re-render).
        enterApp(me);
        showToast(isSignup ? "Account created successfully!" : "Signed in to Outfitted!");
      } catch (err) {
        console.warn("Auth request could not reach backend:", err);
        if (banner) {
          banner.hidden = false;
          banner.innerHTML = `
            <div style="font-size:0.84rem; color:var(--brand-coral); margin-bottom:8px; line-height:1.4;">
              <strong>Backend server offline:</strong> ${err.message || "Cannot reach server at port 8000."}
            </div>
            <button type="button" class="button button-outline button-block" id="btn-fallback-local-login" style="height:38px; font-size:0.82rem;">
              Continue in Offline/Demo Mode as "${fullName}"
            </button>
          `;
          const fallbackBtn = banner.querySelector("#btn-fallback-local-login");
          if (fallbackBtn) {
            fallbackBtn.onclick = () => {
              currentUser.name = fullName;
              currentUser.handle = `@${username.toLowerCase().replace(/\s+/g, "")}`;
              currentUser.initial = (fullName || "U")[0].toUpperCase();
              authDialog?.close();
              render();
              showToast(`Signed in locally as ${currentUser.name}!`);
            };
          }
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector("span").textContent = isSignup ? "Create Account" : "Sign In";
      }
    };
  }

  const accountOpenBranding = document.querySelector("#account-open-branding");
  if (accountOpenBranding) {
    accountOpenBranding.onclick = () => {
      accountSheet?.close();
      document.querySelector("#branding-dialog")?.showModal();
    };
  }
  const btnSignOut = document.querySelector("#btn-signout-demo");
  if (btnSignOut) {
    btnSignOut.onclick = async () => {
      accountSheet?.close();
      await logOut().catch(() => {});
      // The app requires signing in (see start()), so go back to the sign-in screen.
      showAuthScreen();
      showToast("Signed out");
    };
  }

  const btnNotifs = document.querySelector("#btn-notifications");
  if (btnNotifs) {
    btnNotifs.onclick = () => {
      const dialog = document.querySelector("#notifications-dialog");
      if (dialog) dialog.showModal();
    };
  }

  const closeNotif = document.querySelector("#close-notif-dialog");
  if (closeNotif) {
    closeNotif.onclick = () => document.querySelector("#notifications-dialog")?.close();
  }

  const btnAskGroup = document.querySelector("#btn-ask-group-cart");
  if (btnAskGroup) {
    btnAskGroup.onclick = () => {
      activeTab = "messages";
      render();
    };
  }

  // Post fit modal photo upload handling
  const postModal = document.querySelector("#post-fit-modal");
  const postClose = document.querySelector("#close-post-modal");
  if (postClose && postModal) postClose.onclick = () => postModal.close();

  const fileInput = document.querySelector("#fit-file-input");
  const filePreview = document.querySelector("#fit-image-preview");
  const dropzone = document.querySelector("#fit-photo-dropzone");
  let chosenImgSrc = "./assets/feed/about_me_reactions.png";

  if (fileInput && filePreview) {
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (file) {
        chosenImgSrc = URL.createObjectURL(file);
        filePreview.src = chosenImgSrc;
        filePreview.hidden = false;
      }
    };
  }

  const linkTryOnFirst = document.querySelector("#link-tryon-first");
  if (linkTryOnFirst) {
    linkTryOnFirst.onclick = (e) => {
      e.preventDefault();
      postModal?.close();
      openCreate("tryon");
    };
  }

  const postForm = document.querySelector("#form-post-fit");
  if (postForm) {
    postForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.querySelector("#input-fit-name")?.value.trim();
      const question = document.querySelector("#input-fit-question")?.value.trim();
      const piece = document.querySelector("#input-fit-piece")?.value.trim() || "Curated look";
      const audience = document.querySelector("#select-fit-audience")?.value;

      posts.unshift({
        id: `fit-${Date.now()}`,
        fileTag: `THE FIT FILES / 0${posts.length + 1}`,
        author: currentUser.name,
        handle: currentUser.handle,
        initial: currentUser.initial,
        initialBg: "#0f3728",
        audience: audience,
        time: "Just now",
        title: name,
        question: question,
        image: chosenImgSrc,
        piecesSummary: piece,
        pieces: [{ name: piece, color: "#244b3c" }],
        votes: { yes: 1, no: 0 },
        likes: 1,
        hasLiked: true,
        superReactions: { "🎧": 0, "💍": 0, "🍦": 0, "💖": 1, "🧁": 0, "🎀": 0 },
        comments: 0,
        commentsList: [],
      });

      postModal?.close();
      activeTab = "feed";
      render();
      showToast("Look shared to Outfitted Circle!");
    };
  }

  // Interactive Feed Card Handlers (Likes, Polls, Super Reactions, Comments, Try on)
  document.querySelectorAll(".btn-card-like").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.postId;
      const post = posts.find((p) => p.id === id);
      if (post) {
        post.hasLiked = !post.hasLiked;
        post.likes += post.hasLiked ? 1 : -1;
        btn.classList.toggle("liked", post.hasLiked);
        btn.querySelector(".like-count").textContent = post.likes;
      }
    };
  });

  document.querySelectorAll(".btn-poll-option").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.postId;
      const vote = btn.dataset.vote;
      const post = posts.find((p) => p.id === id);
      if (post && post.userVote !== vote) {
        if (post.userVote) post.votes[post.userVote]--;
        post.userVote = vote;
        post.votes[vote]++;

        const total = post.votes.yes + post.votes.no;
        const yesShare = Math.round((post.votes.yes / total) * 100);
        const pollWrap = btn.closest(".poll-component");
        if (pollWrap) {
          pollWrap.querySelectorAll(".btn-poll-option").forEach((b) => b.classList.remove("voted"));
          btn.classList.add("voted");
          pollWrap.querySelector(".poll-progress-fill").style.width = `${yesShare}%`;
          pollWrap.querySelector(".poll-results-stat").innerHTML = `<strong>${yesShare}%</strong> say wear it · ${total} votes`;
        }
      }
    };
  });

  document.querySelectorAll(".reaction-sticker-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.postId;
      const emoji = btn.dataset.emoji;
      const post = posts.find((p) => p.id === id);
      if (post && post.superReactions) {
        btn.classList.toggle("active");
        const active = btn.classList.contains("active");
        post.superReactions[emoji] = (post.superReactions[emoji] || 0) + (active ? 1 : -1);
        btn.querySelector(".rx-count").textContent = post.superReactions[emoji];
      }
    };
  });

  document.querySelectorAll(".btn-card-comment").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.postId;
      const post = posts.find((p) => p.id === id);
      if (post) openCommentsSheet(post);
    };
  });

  document.querySelectorAll(".btn-card-share").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.postId;
      const post = posts.find((p) => p.id === id);
      if (post) openShareModalForPost(post);
    };
  });

  document.querySelectorAll(".btn-try-look-cta").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.postId;
      const post = posts.find((p) => p.id === id);
      if (post) {
        openVirtualDressingRoom({
          image: post.image,
          name: post.title,
        });
      }
    };
  });

  // Follow toggles on right rail
  document.querySelectorAll(".btn-follow-toggle").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.friendId;
      const friend = friendsList.find((f) => f.id === id);
      if (friend) {
        friend.following = !friend.following;
        btn.textContent = friend.following ? "Following" : "+ Follow";
        btn.classList.toggle("following", friend.following);
      }
    };
  });
}

function openCommentsSheet(post) {
  activePostForComments = post;
  const sheet = document.querySelector("#comments-sheet-dialog");
  const title = document.querySelector("#comments-sheet-title");
  const lede = document.querySelector("#comments-sheet-lede");
  const list = document.querySelector("#modal-comments-list");
  const closeBtn = document.querySelector("#close-comments-sheet");
  const form = document.querySelector("#comments-sheet-form");
  const input = document.querySelector("#sheet-comment-input");

  if (!sheet) return;

  title.textContent = `Discussion on "${post.title}"`;
  lede.textContent = `Posted by ${post.author} · ${post.time}`;

  function refreshComments() {
    list.innerHTML = (post.commentsList || [])
      .map(
        (c) => `
        <div style="display:flex; gap:10px; background:var(--surface-sunk); padding:10px 14px; border-radius:10px;">
          <span class="avatar-chip micro" style="background:#244b3c; color:#fff;">${c.initial}</span>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between;">
              <strong style="font-size:0.84rem;">${c.author}</strong>
              <small style="color:var(--muted); font-size:0.72rem;">${c.time}</small>
            </div>
            <p style="font-size:0.88rem; margin-top:2px;">${c.text}</p>
          </div>
        </div>
      `
      )
      .join("");
  }

  refreshComments();

  if (closeBtn) closeBtn.onclick = () => sheet.close();

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      post.commentsList = post.commentsList || [];
      post.commentsList.push({
        id: `c_${Date.now()}`,
        author: currentUser.name,
        initial: currentUser.initial,
        time: "Just now",
        text: val,
      });
      post.comments++;
      input.value = "";
      refreshComments();
      render();
    };
  }

  sheet.showModal();
}

function openPostFitModalWithData(data) {
  const dialog = document.querySelector("#post-fit-modal");
  if (!dialog) return;

  const nameInput = document.querySelector("#input-fit-name");
  const questionInput = document.querySelector("#input-fit-question");
  const pieceInput = document.querySelector("#input-fit-piece");
  const preview = document.querySelector("#fit-image-preview");

  if (nameInput) nameInput.value = data.title || "";
  if (questionInput) questionInput.value = data.description || "What do you think of this generated fit?";
  if (pieceInput && data.items) {
    pieceInput.value = data.items.map((i) => i.name).join(" · ");
  }
  if (preview && data.image) {
    preview.src = data.image;
    preview.hidden = false;
  }

  dialog.showModal();
}

/* ---------- Backend: real fits, profile, and the create sheet ---------- */

function emptyState(title, text) {
  return `
    <div class="flex flex-col items-center text-center gap-1 py-space-lg">
      <span class="material-symbols-outlined text-[32px] text-secondary">checkroom</span>
      <span class="font-title-ui text-title-ui text-on-surface font-semibold">${title}</span>
      <span class="font-body-md text-body-md text-on-surface-variant">${text}</span>
    </div>`;
}

async function loadProfileCounts() {
  try {
    const profile = await getProfile(currentUser.username);
    const counts = {
      "#profile-fit-count": profile.fit_count,
      "#profile-follower-count": profile.follower_count,
      "#profile-following-count": profile.following_count,
    };
    for (const [id, value] of Object.entries(counts)) {
      const el = document.querySelector(id);
      if (el) el.textContent = value;
    }
  } catch (err) {
    console.error(err);
  }
}

// Called after every render(): mounts whichever backend-connected parts are on screen.
function connectBackend() {
  const feedList = document.querySelector("#feed-fits");
  if (feedList) {
    mountFitList({
      list: feedList,
      status: document.querySelector("#feed-status"),
      sentinel: document.querySelector("#feed-sentinel"),
      path: "/fits",
      empty: emptyState("No fits yet", "Be the first: post what you're wearing, or try an outfit on."),
      toast: showToast,
    });
  }

  const profileList = document.querySelector("#profile-fits");
  if (profileList) {
    mountFitList({
      list: profileList,
      status: document.querySelector("#profile-status"),
      sentinel: document.querySelector("#profile-sentinel"),
      path: `/users/${encodeURIComponent(currentUser.username)}/fits`,
      empty: emptyState("You haven't posted yet", "Your fits will show up here."),
      toast: showToast,
      onChange: loadProfileCounts,
    });
    loadProfileCounts();
  }

  initCreate({
    toast: showToast,
    onPosted: () => {
      activeTab = "feed";
      render();
    },
  });

  const btnSignout = document.querySelector("#btn-profile-signout");
  if (btnSignout) {
    btnSignout.onclick = async () => {
      btnSignout.disabled = true;
      await logOut();
      showAuthScreen();
      showToast("Signed out");
    };
  }

  const btnAvatar = document.querySelector("#btn-profile-avatar");
  const inputAvatar = document.querySelector("#profile-avatar-input");
  if (btnAvatar && inputAvatar) {
    btnAvatar.onclick = () => inputAvatar.click();
    inputAvatar.onchange = async () => {
      const file = inputAvatar.files?.[0];
      if (!file) return;
      showToast("Uploading profile photo...");
      try {
        const uploaded = await uploadImage(file);
        await updateProfile({ avatarImageId: uploaded.id });
        currentUser.avatarUrl = uploaded.url;
        showToast("Profile photo updated!");
        render();
      } catch (err) {
        showToast(err.message || "Failed to update profile photo.");
      }
    };
  }

  document.querySelectorAll("[data-nav-tab]").forEach((btn) => {
    btn.onclick = () => {
      activeTab = btn.dataset.navTab;
      render();
    };
  });
}

// AI mode, Dorm Closets, and Style a Friend (also inside cards that load later).
document.addEventListener("click", (e) => {
  // AI mode is a placeholder until the feature is built.
  if (e.target.closest("[data-ai-mode]")) {
    e.preventDefault();
    showToast("AI mode is coming soon");
    return;
  }
  if (e.target.closest("[data-open-dorm-closet]")) {
    e.preventDefault();
    openDormCloset("formal-2026", showToast);
    return;
  }
  if (e.target.closest("[data-open-style-friend]")) {
    e.preventDefault();
    openStyleFriend(null, showToast);
  }
});

/* ---------- Account (see src/auth.js) ---------- */

function enterApp(user) {
  const name = user.full_name || user.username;
  Object.assign(currentUser, {
    name,
    username: user.username,
    handle: `@${user.username}`,
    initial: name.charAt(0).toUpperCase(),
    bio: user.bio || "",
    avatarUrl: user.avatar?.url || null,
  });
  activeTab = "feed";
  render();
}

function showAuthScreen(message = "") {
  app.innerHTML = renderAuthScreen();
  setAuthMode("login");
  if (message) showAuthErrors(message);

  document.querySelectorAll("[data-auth-mode]").forEach((tab) => {
    tab.onclick = () => setAuthMode(tab.dataset.authMode);
  });

  // Demo mode: explore the app without an account (backend features fall back to samples).
  const btnDemo = document.querySelector("#btn-auth-demo");
  if (btnDemo) {
    btnDemo.onclick = () => {
      enterApp({ username: "sofoniyas", full_name: "Sofoniyas Alemayehu", bio: "Building Outfitted · CS @ Virginia Tech" });
      showToast("Welcome to Outfitted Demo Mode!");
    };
  }

  const form = document.querySelector("#auth-form");
  const submit = document.querySelector("#auth-submit");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const signup = form.dataset.mode === "signup";
    const values = Object.fromEntries(new FormData(form));
    const email = values.email.trim();
    const { password } = values;

    if (!email || !password) {
      return showAuthErrors("", {
        ...(!email && { email: "Enter your email." }),
        ...(!password && { password: "Enter your password." }),
      });
    }

    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = signup ? "Creating account…" : "Signing in…";
    showAuthErrors();
    try {
      if (signup) {
        await signUp({ email, username: values.username.trim(), password, fullName: values.full_name.trim() });
      }
      await logIn(email, password);
      enterApp(await getMe());
      showToast(signup ? "Welcome to Outfitted!" : "Signed in");
    } catch (err) {
      if (err instanceof ApiError) {
        // 409s name the field that's taken; 422s come back as per-field errors.
        const fields = { ...err.fields };
        if (err.status === 409) fields[/username/i.test(err.message) ? "username" : "email"] = err.message;
        showAuthErrors(err.status === 409 ? "" : err.message, fields);
      } else {
        console.error(err);
        showAuthErrors("Something went wrong. Please try again.");
      }
      submit.disabled = false;
      submit.textContent = label;
    }
  };
}

async function start() {
  setSessionExpiredHandler(() => showAuthScreen("Your session expired. Please sign in again."));
  try {
    if (await restoreSession()) {
      const user = await getMe();
      if (user) return enterApp(user);
    }
    showAuthScreen();
  } catch (err) {
    showAuthScreen(err.message);
  }
}

start();
