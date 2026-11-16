import "./onboarding.js";
import { currentUser, posts } from "./data.js";
import { icons } from "./icons.js";
import { renderStylistAssistant, connectStylistAssistant } from "./assistant.js";
import { renderWardrobePage, connectWardrobe } from "./wardrobe.js";
import { renderFriendsView, connectFriends } from "./friends.js";
import { renderVirtualDressingRoomModal, connectVirtualDressingRoom, openVirtualDressingRoom } from "./tryon-modal.js";
import { renderShareModal, connectShareModal, openShareModalForPost } from "./share-modal.js";
import { renderBrandingDialog, connectBrandingDialog } from "./branding-dialog.js";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { ApiError, getMe, logIn, logOut, restoreSession, setSessionExpiredHandler, signUp } from "./auth.js";
import { initCreate, openCreate, openEditFit, openTryOnFrom } from "./create.js";
import { getProfile, getFollowing, followUser, unfollowUser, uploadImage, updateProfile, mediaUrl } from "./fits.js";
import { escapeHtml, initialOf } from "./format.js";
import { withPasswordToggle } from "./password-toggle.js";
import { mountLanding, renderLanding } from "./views/landing.js";
import { mountProfile, renderProfileView, resetProfile } from "./views/profile.js";
import { renderCommentsDrawer, openCommentsDrawer } from "./views/comments-drawer.js";
import { renderCreateSheet } from "./views/create-sheet.js";
import { openDormCloset } from "./dorm-closet.js";
import { openStyleFriend } from "./style-friend.js";
import { applyTheme, getThemePreference, isDarkTheme, onThemeChange, setThemePreference } from "./theme.js";
import { appHeader, avatar as ofAvatar, paintStreakChip, setBellDot, setChatUnreadDot, tabBar } from "./views/components.js";
import { mountFeed, renderFeedScreen } from "./views/feed-view.js";
import { initKeyboard } from "./keyboard.js";
import { startConversation, startMessaging, stopMessaging, subscribe as onMessagesChange, unreadTotal } from "./messages-store.js";
import * as stories from "./stories-store.js";
import * as notifications from "./notifications-store.js";
import { clearStreak, currentStreak, loadStreak, subscribe as onStreakChange, syncTimezone } from "./streak-store.js";
import { mountStoriesRow } from "./views/stories-row.js";
import { openStoryViewer, openViewersSheet } from "./views/story-viewer.js";
import { openStoryComposer } from "./views/story-composer.js";
import { celebrateIfMilestone, openStreakSheet } from "./views/streak-sheet.js";
import { isStreakType, mountActivity, renderActivity, unmountActivity } from "./views/activity.js";
import { showNotificationToast } from "./views/notification-toast.js";
import { openFitSheet } from "./views/fit-sheet.js";
import { mountUserProfile, renderUserProfile, setPerson } from "./views/user-profile.js";
import { openPushPrompt } from "./views/push-prompt.js";
import { initPush, shouldAskForPush, syncAppBadge, unregisterPush } from "./push.js";
import { parseLink } from "./deep-link.js";
import { mountInbox, renderInbox } from "./views/messages-inbox.js";
import { mountThread, renderThread, unmountThread } from "./views/messages-thread.js";
import { openNewChatSheet } from "./views/new-chat-sheet.js";
import { openFitCheckSheet } from "./views/fit-check-sheet.js";

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
    </aside>
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
        <!-- Filled with the people you follow by loadYourPeople(). -->
        <div class="people-list" id="rail-people">
          <small class="people-note">Loading…</small>
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

/* ---------- Account menu (the header avatar) ---------- */
// A small dropdown under the avatar (styles: .of-account-* in src/connected.css). The ids and
// data attributes are the ones the handlers in connectApp use.
const MENU_CHEVRON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;

function accountMenuRow({ attrs, icon, label }) {
  return `<button type="button" class="of-account-row" ${attrs}>
    <span class="of-account-row-icon">${icon}</span>
    <span class="of-account-row-label">${label}</span>
    ${MENU_CHEVRON}
  </button>`;
}

function renderAccountDrawer() {
  const user = { full_name: currentUser.name, username: currentUser.username, avatarUrl: currentUser.avatarUrl };
  return `
    <dialog class="of-account-menu" id="account-sheet-dialog" aria-labelledby="account-sheet-title">
      <div class="of-account-card">
        <div class="of-account-head">
          ${ofAvatar(user, { size: 44 })}
          <div class="of-account-who">
            <b id="account-sheet-title">${escapeHtml(currentUser.name)}</b>
            <small>${escapeHtml(currentUser.handle)}</small>
          </div>
          <button type="button" class="of-account-close" id="close-account-sheet" aria-label="Close">${icons.close}</button>
        </div>

        <nav class="of-account-rows" aria-label="Account">
          ${accountMenuRow({ attrs: 'data-nav="profile"', icon: icons.hanger, label: "Your profile" })}
          ${accountMenuRow({ attrs: 'data-nav="friends"', icon: icons.users, label: "Friends" })}
          ${accountMenuRow({ attrs: 'data-nav="assistant"', icon: icons.wand, label: "Stylist AI" })}
          ${accountMenuRow({ attrs: 'id="account-open-branding"', icon: icons.sparkleIcon, label: "Brand & splash" })}
        </nav>

        <div class="of-account-section">
          <span class="of-account-label" id="appearance-label">Appearance</span>
          <div class="of-account-theme" role="radiogroup" aria-labelledby="appearance-label">
            ${[
              ["light", "light_mode", "Light"],
              ["dark", "dark_mode", "Dark"],
              ["system", "contrast", "System"],
            ]
              .map(
                ([value, icon, label]) => `
              <button type="button" role="radio" data-theme-option="${value}" aria-checked="false">
                <span class="material-symbols-outlined">${icon}</span>${label}
              </button>`
              )
              .join("")}
          </div>
        </div>

        <div class="of-account-foot">
          <button type="button" class="of-account-link" id="btn-open-signin">Switch account</button>
          <button type="button" class="of-account-link danger" id="btn-signout-demo">Sign out</button>
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
            ${withPasswordToggle(`<input type="password" id="auth-input-password" class="field-input" required placeholder="••••••••" autocomplete="current-password" />`)}
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

/* ---------- Main Render Loop ---------- */
const OWN_HEADER_TABS = new Set(["profile", "activity", "person"]);
let chatConversationId = null;
let releaseInbox = () => {};
let releaseThreadDialog = () => {};
let releaseStoriesRow = () => {};
let returnTab = "feed";
let personReturnTab = "feed";

// An open conversation sits over the inbox: full screen on phones, a small dialog from 861px
// (styles: .of-thread-backdrop in src/outfitted.css).
function renderChatScreen() {
  const thread = chatConversationId
    ? `<div class="of-thread-backdrop" data-thread-backdrop>${renderThread(chatConversationId)}</div>`
    : "";
  return renderInbox() + thread;
}

function openChat(id) {
  activeTab = "messages";
  chatConversationId = id;
  render();
}

function connectChat() {
  if (chatConversationId) {
    const close = () => openChat(null);
    mountThread({
      id: chatConversationId,
      toast: showToast,
      onBack: close,
      onOpenStory: openUserStories,
      onOpenFit: openFit,
    });
    // Clicking outside the dialog or pressing Escape closes it.
    const backdrop = document.querySelector("[data-thread-backdrop]");
    backdrop.onclick = (event) => {
      if (event.target === backdrop) close();
    };
    const onKey = (event) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open], .of-sheet-backdrop")) close();
    };
    document.addEventListener("keydown", onKey);
    releaseThreadDialog = () => document.removeEventListener("keydown", onKey);
  }
  releaseInbox = mountInbox({
    onOpen: openChat,
    onCompose: () => openNewChatSheet({ onStarted: openChat }),
    onOpenStory: openUserStories,
    toast: showToast,
  });
}

function releaseScreens() {
  releaseInbox();
  releaseInbox = () => {};
  releaseThreadDialog();
  releaseThreadDialog = () => {};
  releaseStoriesRow();
  releaseStoriesRow = () => {};
  unmountThread();
  unmountActivity();
}

/* ---------- Stories, streaks, activity ---------- */

function openStories(userId, storyId = null) {
  const groups = stories.storyGroups();
  const index = groups.findIndex((group) => group.user.id === userId);
  if (index >= 0) return openStoryViewer({ groups, groupIndex: index, storyId, toast: showToast, onOpenFit: openFit });
  return openUserStories(userId, storyId);
}

async function openUserStories(userId, storyId = null) {
  try {
    const group = await stories.loadUserGroup(userId);
    const found = !storyId || group.stories.some((story) => story.id === storyId);
    if (!group.stories.length || !found) return showToast("Story expired");
    openStoryViewer({ groups: [group], storyId, toast: showToast, onOpenFit: openFit });
  } catch {
    showToast("Story expired");
  }
}

function openFit(fitId) {
  openFitSheet(fitId, {
    toast: showToast,
    onOpenComments: (fit, onUpdated) => openCommentsDrawer(fit, { toast: showToast, onCommentAdded: onUpdated }),
    onOpenTryOn: openTryOnFrom,
  });
}

function openStoryComposerSheet() {
  openStoryComposer({
    toast: showToast,
    onPosted: () => {
      stories.loadStoryFeed();
      refreshStreak();
    },
  });
}

async function refreshStreak() {
  celebrateIfMilestone(await loadStreak());
}

function openStreak() {
  openStreakSheet({ onPost: () => openCreate("compose") });
}

function openActivity() {
  if (activeTab !== "activity") returnTab = activeTab;
  activeTab = "activity";
  render();
  window.scrollTo({ top: 0 });
}

async function messageUser(userId) {
  try {
    openChat(await startConversation({ memberIds: [userId] }));
  } catch (err) {
    showToast(err.message || "Couldn't start the chat.");
  }
}

function openStoryById(storyId) {
  const found = stories.findStory(storyId);
  if (found) return openStories(found.group.user.id, storyId);
  showToast("Story expired");
}

// Someone's profile page (src/views/user-profile.js); your own name opens your profile. Back
// returns to where you came from.
function openUser(username) {
  if (!username) return;
  document.querySelectorAll(".of-sheet-backdrop, .of-sv").forEach((overlay) => overlay.remove());
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  if (username === currentUser.username) {
    activeTab = "profile";
    resetProfile();
  } else {
    if (activeTab !== "person") personReturnTab = activeTab;
    setPerson(username);
    activeTab = "person";
  }
  render();
  window.scrollTo({ top: 0 });
}

// Any element with data-open-user="username" opens that profile, unless the click was on a
// button or link inside it (Follow, Message, ...).
document.addEventListener(
  "click",
  (event) => {
    const el = event.target.closest?.("[data-open-user]");
    if (!el) return;
    const inner = event.target.closest("button, a, input, textarea, select, label");
    if (inner && inner !== el && el.contains(inner)) return;
    event.preventDefault();
    event.stopPropagation();
    openUser(el.dataset.openUser);
  },
  true
);

function openLink(link) {
  document.querySelectorAll(".of-sheet-backdrop, .of-sv").forEach((overlay) => overlay.remove());
  const target = parseLink(link);
  if (!target) return;
  if (target.type === "conversation") return openChat(target.id);
  if (target.type === "fit") return openFit(target.id);
  if (target.type === "streak") return openStreak();
  if (target.type === "story-viewers") return openViewersSheet(target.id);
  if (target.type === "story") return openStoryById(target.id);
  if (target.type === "user") openUser(target.username);
}

function openNotification(item) {
  notifications.markRead([item.id]);
  openLink(item.link);
}

function isShowing(item) {
  if (activeTab === "activity") return true;
  const target = parseLink(item.link);
  return target?.type === "conversation" && activeTab === "messages" && chatConversationId === target.id;
}

function onNotificationChange(change) {
  if (change.type === "count") {
    setBellDot(change.unread > 0);
    syncAppBadge(change.unread + unreadTotal());
  }
  if (change.type !== "new") return;
  const item = change.notification;
  if (isStreakType(item.type)) loadStreak().then((streak) => item.type === "streak_milestone" && celebrateIfMilestone(streak, item.data?.count));
  if (!isShowing(item)) showNotificationToast(item, openNotification);
}

function render() {
  releaseScreens();
  app.innerHTML = `
    <div id="app-shell" class="${sidebarCollapsed ? "sidebar-collapsed" : ""}">
      ${OWN_HEADER_TABS.has(activeTab) ? "" : appHeader({ user: currentUser, notificationsUnread: notifications.unreadCount() > 0, streak: currentStreak() })}

      <div class="app-body-container">
        ${renderSidebar()}

        <main id="main-content-region">
          ${
            activeTab === "feed"
              ? renderFeedScreen()
              : activeTab === "wardrobe"
              ? renderWardrobePage()
              : activeTab === "friends"
              ? renderFriendsView()
              : activeTab === "messages"
              ? renderChatScreen()
              : activeTab === "assistant"
              ? renderStylistAssistant()
              : activeTab === "profile"
              ? renderProfileView()
              : activeTab === "activity"
              ? renderActivity()
              : activeTab === "person"
              ? renderUserProfile()
              : renderFeedScreen()
          }
        </main>

        ${activeTab === "feed" ? renderRightRail() : ""}
      </div>

      ${tabBar({ active: activeTab, chatUnread: unreadTotal() > 0 })}
      ${renderCreateSheet()}
      <div id="dorm-closet-modal-root" class="hidden"></div>
      <div id="style-friend-modal-root" class="hidden"></div>
      ${renderPostYourFitModal()}
      ${renderVirtualDressingRoomModal()}
      ${renderShareModal()}
      ${renderBrandingDialog()}
      ${renderCommentsDrawer()}
      ${renderCommentsDialog()}
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
      if (target === "messages") chatConversationId = null;
      if (target === "profile") resetProfile();
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
    connectChat();
  } else if (activeTab === "wardrobe") {
    connectWardrobe(
      (outfit) => openVirtualDressingRoom(outfit),
      (outfit) => openShareModalForPost(outfit),
      showToast
    );
  } else if (activeTab === "person") {
    mountUserProfile({
      toast: showToast,
      onBack: () => {
        activeTab = personReturnTab;
        render();
      },
      onMessage: messageUser,
      onOpenFit: openFit,
      onFollowChanged: loadProfileCounts,
    });
  } else if (activeTab === "friends") {
    connectFriends(
      (userId) =>
        startConversation({ memberIds: [userId] })
          .then(openChat)
          .catch((err) => showToast(err.message || "Couldn't open the chat.")),
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

  connectShareModal({ toast: showToast });

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

  const openAuth = (mode = "login") => {
    accountSheet?.close();
    setAuthSheetMode(mode);
    authDialog?.showModal();
  };

  if (btnAccountBadge && accountSheet) {
    btnAccountBadge.onclick = () => accountSheet.showModal();
    // Clicking outside the card (on the dialog's backdrop) closes it.
    accountSheet.onclick = (event) => {
      if (event.target === accountSheet) accountSheet.close();
    };
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
      await unregisterPush();
      await logOut().catch(() => {});
      showLanding();
      showToast("Signed out");
    };
  }

  const btnNotifs = document.querySelector("#btn-notifications");
  if (btnNotifs) btnNotifs.onclick = openActivity;

  const btnAskGroup = document.querySelector("#btn-ask-group-cart");
  if (btnAskGroup) btnAskGroup.onclick = postFitDilemma;

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

// Feed's right rail: the people you follow, most recently followed first. Unfollowing keeps the
// row (as "+ Follow") so a mis-tap can be undone.
const RAIL_PEOPLE_LIMIT = 5;

async function loadYourPeople() {
  const list = document.querySelector("#rail-people");
  if (!list) return;
  const note = (text) => `<small class="people-note">${text}</small>`;
  try {
    const page = await getFollowing(currentUser.username, { limit: RAIL_PEOPLE_LIMIT });
    if (!list.isConnected) return;
    if (!page.items.length) {
      list.innerHTML = `${note("You're not following anyone yet.")}
        <button type="button" class="people-find-btn">Find people</button>`;
      list.querySelector(".people-find-btn").onclick = () => {
        activeTab = "friends";
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      return;
    }
    list.innerHTML = page.items
      .map((user) => {
        const name = user.full_name || user.username;
        const avatar = user.avatar?.url
          ? `<img src="${escapeHtml(mediaUrl(user.avatar.url))}" alt="" class="w-full h-full object-cover rounded-full" />`
          : escapeHtml(initialOf(user));
        return `
          <div class="people-item">
            <div class="people-item-info">
              <span class="avatar-chip micro overflow-hidden" style="background:#275038; color:#fff;">${avatar}</span>
              <div class="people-item-text">
                <strong>${escapeHtml(name)}</strong>
                <small>@${escapeHtml(user.username)}</small>
              </div>
            </div>
            <button type="button" class="btn-follow-toggle following" data-follow-username="${escapeHtml(user.username)}">Following</button>
          </div>`;
      })
      .join("");
  } catch (err) {
    console.error(err);
    if (list.isConnected) list.innerHTML = note("Couldn't load your people.");
  }
}

document.addEventListener("click", async (e) => {
  const button = e.target.closest("#rail-people [data-follow-username]");
  if (!button || button.disabled) return;
  const following = button.classList.contains("following");
  button.disabled = true;
  try {
    await (following ? unfollowUser : followUser)(button.dataset.followUsername);
    button.classList.toggle("following", !following);
    button.textContent = following ? "+ Follow" : "Following";
    loadProfileCounts();
  } catch (err) {
    console.error(err);
    showToast(following ? "Couldn't unfollow. Try again." : "Couldn't follow. Try again.");
  } finally {
    button.disabled = false;
  }
});

// Called after every render(): mounts whichever backend-connected parts are on screen.
function connectBackend() {
  loadYourPeople();
  releaseStoriesRow = mountStoriesRow({ onOpen: openStories, onCompose: openStoryComposerSheet });
  mountActivity({
    onBack: () => {
      activeTab = returnTab;
      render();
    },
    onOpen: openNotification,
    onFindFriends: () => {
      activeTab = "friends";
      render();
    },
    toast: showToast,
  });
  mountFeed({
    listOptions: {
      empty: emptyState("No fits yet", "Be the first: post what you're wearing, or try an outfit on."),
      toast: showToast,
      onOpenComments: (fit, onUpdated) => {
        openCommentsDrawer(fit, {
          toast: showToast,
          onCommentAdded: onUpdated,
        });
      },
      onOpenTryOn: openTryOnFrom,
      onEdit: openEditFit,
    },
  });

  mountProfile({ toast: showToast, rerender: render });
  if (document.querySelector("#profile-fit-count")) loadProfileCounts();

  initCreate({
    toast: showToast,
    onDilemma: postFitDilemma,
    onStory: openStoryComposerSheet,
    onPosted: () => {
      activeTab = "feed";
      render();
      refreshStreak();
    },
  });

  const btnSignout = document.querySelector("#btn-profile-signout");
  if (btnSignout) {
    btnSignout.onclick = async () => {
      btnSignout.disabled = true;
      await unregisterPush();
      await logOut();
      showLanding();
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

// Try this look, Dorm Closets, and Style a Friend (also inside cards that load later).
document.addEventListener("click", (e) => {
  // "Try this look" outside a fit card (e.g. the profile's studio): an empty try-on. On a fit
  // card the fit list handles it, prefilled with that fit (openTryOnFrom).
  const tryButton = e.target.closest("[data-ai-mode]");
  if (tryButton && !tryButton.closest("article[data-fit-id]")) {
    e.preventDefault();
    openCreate("tryon");
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

function postFitDilemma() {
  openFitCheckSheet({ onSent: openChat });
}

/* ---------- Account (see src/auth.js) ---------- */

function enterApp(user) {
  const name = user.full_name || user.username;
  Object.assign(currentUser, {
    id: user.id,
    name,
    username: user.username,
    handle: `@${user.username}`,
    initial: name.charAt(0).toUpperCase(),
    bio: user.bio || "",
    avatarUrl: user.avatar?.url || null,
    styleTags: user.style_tags || [],
    fitPreference: user.fit_preference || null,
    topSize: user.top_size || null,
    bottomSize: user.bottom_size || null,
    currentStreak: user.current_streak || 0,
  });
  activeTab = "feed";
  chatConversationId = null;
  resetProfile();
  render();
  startMessaging();
  if (user.id) startSignedIn();
}

function startSignedIn() {
  stories.startStories();
  notifications.startNotifications();
  syncTimezone().then(refreshStreak);
  initPush({ onOpenLink: openLink }).catch(() => {});
}

function stopSignedIn() {
  stories.stopStories();
  notifications.stopNotifications();
  clearStreak();
}

function onAppResume() {
  if (document.visibilityState !== "visible" || !currentUser.id || !document.querySelector(".of-tabbar")) return;
  syncTimezone().then(refreshStreak);
  notifications.loadUnreadCount();
  stories.loadStoryFeed();
}

function onboardingDone() {
  try {
    return localStorage.getItem("of.onboarded") === "1" && !document.querySelector(".ob:not(.ob-out)");
  } catch {
    return false;
  }
}

async function askForPushLater() {
  if (onboardingDone() && (await shouldAskForPush().catch(() => false))) openPushPrompt();
}

onMessagesChange((change) => {
  setChatUnreadDot(unreadTotal() > 0);
  if (change.type === "delivered" && change.message.kind === "fit_check") refreshStreak();
});
notifications.subscribe(onNotificationChange);
onStreakChange(paintStreakChip);
document.addEventListener("visibilitychange", onAppResume);
document.addEventListener("click", (event) => event.target.closest("#btn-streak") && openStreak());
initKeyboard();

async function enterAppFromSession() {
  const user = await getMe().catch(() => null);
  if (user) enterApp(user);
}

window.addEventListener("of:signed-in", enterAppFromSession);
window.addEventListener("of:navigate", (event) => {
  document.querySelectorAll(".of-sheet-backdrop").forEach((sheet) => sheet.remove());
  activeTab = event.detail.tab;
  render();
});
window.addEventListener("of:onboarded", async (event) => {
  if (!event.detail?.signedIn) return;
  await enterAppFromSession();
  if (event.detail?.scan) openCreate("tryon");
  else askForPushLater();
});

// Signed out: what Outfitted is, with Get started / Log in (src/views/landing.js). With a
// message (session expired, couldn't start), Log in opens over it with that message.
function showLanding(message = "") {
  releaseScreens();
  stopMessaging();
  stopSignedIn();
  app.innerHTML = renderLanding();
  mountLanding();
  if (message) window.dispatchEvent(new CustomEvent("of:start-onboarding", { detail: { mode: "login", message } }));
  else openAuthFromHash();
}

// Direct links: /#login and /#signup open Log in / Create account over the landing page.
function openAuthFromHash() {
  const mode = { "#login": "login", "#signup": "signup" }[location.hash];
  if (mode && document.querySelector("#landing")) window.dispatchEvent(new CustomEvent("of:start-onboarding", { detail: { mode } }));
}
window.addEventListener("hashchange", openAuthFromHash);

async function start() {
  setSessionExpiredHandler(() => showLanding("Your session expired. Please log in again."));
  try {
    if (await restoreSession()) {
      const user = await getMe();
      if (user) {
        enterApp(user);
        return askForPushLater();
      }
    }
    showLanding();
  } catch (err) {
    showLanding(err.message);
  }
}

start();
