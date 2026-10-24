import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { currentUser } from "./data.js";
import { ApiError, getMe, logIn, logOut, restoreSession, setSessionExpiredHandler, signUp } from "./auth.js";
import { initCreate, openCreate } from "./create.js";
import { mountFitList } from "./feed.js";
import { getProfile, mediaUrl } from "./fits.js";
import { escapeHtml } from "./format.js";
import { renderAuthScreen, setAuthMode, showAuthErrors } from "./views/auth-screen.js";
import { renderFeedView } from "./views/feed.js";
import { renderChatView } from "./views/chat.js";
import { renderProfileView } from "./views/profile.js";
import { renderCommentsDrawer } from "./views/comments-drawer.js";
import { renderCreateSheet } from "./views/create-sheet.js";
import { openStealSwap } from "./steal-swap.js";
import { openDormCloset } from "./dorm-closet.js";
import { openStyleFriend } from "./style-friend.js";

// Native Capacitor platform initialization
if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
  try {
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#f9f9f6" }).catch(() => {});
    SplashScreen.hide().catch(() => {});
  } catch (err) {
    console.debug("Capacitor features not initialized:", err);
  }
}

const app = document.querySelector("#app");

// Current app state
let currentTab = "feed";
let activePostForComments = "sophia";
let feedList;
let profileList;

function showToast(message) {
  const existing = document.querySelector(".app-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className =
    "app-toast fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-4 py-2.5 rounded-full font-label-md text-label-md shadow-2xl flex items-center gap-2 animate-bounce";
  toast.innerHTML = `<span class="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function renderApp() {
  app.innerHTML = `
    <!-- GLOBAL PERSISTENT HEADER -->
    <header class="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_12px_rgba(0,0,0,0.03)] border-b border-surface-container-high/40">
      <div class="h-16 px-margin flex items-center justify-between">
        <div class="flex items-baseline gap-space-xs">
          <button type="button" class="wordmark" data-nav="feed" aria-label="Outfitted home">OUTFITTED<span class="wordmark-dot">.</span></button>
          <span class="font-micro-mono text-micro-mono uppercase text-secondary font-bold tracking-widest pl-space-2xs" id="header-tab-indicator">Feed</span>
        </div>
        <div class="flex items-center gap-space-xs">
          <button aria-label="Notifications" class="w-10 h-10 relative flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors" id="btn-notifications">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            <span class="absolute top-2 right-2 w-2 h-2 bg-tertiary-fixed rounded-full shadow-[0_0_8px_rgba(208,240,67,0.8)]"></span>
          </button>
          <button aria-label="Profile" class="w-10 h-10 flex items-center justify-center rounded-full hover:opacity-90 transition-opacity" data-nav="profile">
            ${
              currentUser.avatarUrl
                ? `<img alt="Profile" class="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-lowest" src="${escapeHtml(mediaUrl(currentUser.avatarUrl))}" />`
                : `<span class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-bold ring-2 ring-surface-container-lowest">${escapeHtml(currentUser.initial)}</span>`
            }
          </button>
        </div>
      </div>
    </header>

    <!-- MAIN VIEWS CONTAINER -->
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-20 bg-surface">
      <div id="view-feed" class="view-panel ${currentTab === "feed" ? "" : "hidden"}">
        ${renderFeedView()}
      </div>

      <div id="view-chat" class="view-panel ${currentTab === "chat" ? "" : "hidden"}">
        ${renderChatView()}
      </div>

      <div id="view-profile" class="view-panel ${currentTab === "profile" ? "" : "hidden"}">
        ${renderProfileView()}
      </div>
    </main>

    <!-- MODALS & SHEETS -->
    ${renderCommentsDrawer()}
    ${renderCreateSheet()}
    <div id="steal-swap-modal-root" class="hidden"></div>
    <div id="dorm-closet-modal-root" class="hidden"></div>
    <div id="style-friend-modal-root" class="hidden"></div>

    <!-- FLOATING BOTTOM NAVIGATION BAR -->
    <div class="fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-safe">
      <div class="px-margin pb-space-sm flex items-center justify-center gap-space-xs">
        <nav class="pointer-events-auto flex-1 max-w-[19rem] h-16 bg-surface-container-lowest/90 backdrop-blur-2xl rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.08)] px-space-xs flex items-center justify-between border border-surface-container-high/60">
          <button aria-label="Feed" class="nav-tab group relative flex-1 h-12 flex flex-col items-center justify-center rounded-full transition-all duration-200 ${currentTab === "feed" ? "text-on-surface bg-surface-container-highest shadow-[0_2px_12px_rgba(0,0,0,0.06)]" : "text-on-surface-variant hover:text-on-surface"}" data-nav="feed">
            <span class="material-symbols-outlined text-[22px]">auto_awesome</span>
            <span class="font-micro-mono text-[10px] uppercase tracking-wider mt-0.5 font-bold">Feed</span>
          </button>

          <button aria-label="Messages" class="nav-tab group relative flex-1 h-12 flex flex-col items-center justify-center rounded-full transition-all duration-200 ${currentTab === "chat" ? "text-on-surface bg-surface-container-highest shadow-[0_2px_12px_rgba(0,0,0,0.06)]" : "text-on-surface-variant hover:text-on-surface"}" data-nav="chat">
            <div class="relative flex items-center justify-center">
              <span class="material-symbols-outlined text-[22px]">forum</span>
              <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary"></span>
            </div>
            <span class="font-micro-mono text-[10px] uppercase tracking-wider mt-0.5 font-bold">Chat</span>
          </button>

          <button aria-label="Profile" class="nav-tab group relative flex-1 h-12 flex flex-col items-center justify-center rounded-full transition-all duration-200 ${currentTab === "profile" ? "text-on-surface bg-surface-container-highest shadow-[0_2px_12px_rgba(0,0,0,0.06)]" : "text-on-surface-variant hover:text-on-surface"}" data-nav="profile">
            <span class="material-symbols-outlined text-[22px]">person</span>
            <span class="font-micro-mono text-[10px] uppercase tracking-wider mt-0.5 font-bold">Profile</span>
          </button>
        </nav>

        <!-- New fit: docked beside the tabs, opens the create sheet (not a tab) -->
        <button type="button" aria-label="New fit" id="btn-nav-new-fit"
          class="pointer-events-auto flex-shrink-0 w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_12px_32px_rgba(0,0,0,0.22)] active:scale-90 transition-transform">
          <span class="material-symbols-outlined text-[30px] text-tertiary-fixed">add</span>
        </button>
      </div>
    </div>
  `;

  attachEventHandlers();
  mountFits();
}

// Real fits: the explore feed, your own fits on the profile, and the create sheet.
function mountFits() {
  feedList = mountFitList({
    list: document.querySelector("#feed-fits"),
    status: document.querySelector("#feed-status"),
    sentinel: document.querySelector("#feed-sentinel"),
    path: "/fits",
    empty: emptyState("No fits yet", "Be the first: post what you're wearing, or try an outfit on."),
    toast: showToast,
    onChange: () => profileList?.reload(),
  });
  profileList = mountFitList({
    list: document.querySelector("#profile-fits"),
    status: document.querySelector("#profile-status"),
    sentinel: document.querySelector("#profile-sentinel"),
    path: `/users/${encodeURIComponent(currentUser.username)}/fits`,
    empty: emptyState("You haven't posted yet", "Your fits will show up here."),
    toast: showToast,
    onChange: () => {
      feedList?.reload();
      loadProfileCounts();
    },
  });
  initCreate({
    toast: showToast,
    onPosted: (fit) => {
      feedList.prepend(fit);
      profileList.prepend(fit);
      loadProfileCounts();
      switchTab("feed");
    },
  });
  loadProfileCounts();
}

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

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `view-${tabId}`);
  });

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    const isActive = btn.dataset.nav === tabId;
    btn.className = `nav-tab group relative flex-1 h-12 flex flex-col items-center justify-center rounded-full transition-all duration-200 ${
      isActive
        ? "text-on-surface bg-surface-container-highest shadow-[0_2px_12px_rgba(0,0,0,0.06)] font-bold"
        : "text-on-surface-variant hover:text-on-surface"
    }`;
  });

  const tabNames = {
    feed: "Feed",
    chat: "Chat",
    profile: "Profile",
  };
  const indicator = document.querySelector("#header-tab-indicator");
  if (indicator) indicator.textContent = tabNames[tabId] || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function attachEventHandlers() {
  // Navigation tabs
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.nav);
  });

  // Notifications button toast
  const btnNotif = document.querySelector("#btn-notifications");
  if (btnNotif) {
    btnNotif.onclick = () => showToast("No new notifications");
  }

  // New fit buttons open the create sheet (src/create.js)
  document.querySelectorAll("#btn-nav-new-fit, #btn-profile-new-fit").forEach((btn) => {
    btn.onclick = () => openCreate();
  });

  // Comments Drawer Open/Close
  const openCommentsDrawer = (postId = "sophia") => {
    activePostForComments = postId;
    const backdrop = document.querySelector("#comments-drawer-backdrop");
    const sheet = document.querySelector("#comments-drawer-sheet");
    if (backdrop && sheet) {
      backdrop.classList.remove("hidden");
      setTimeout(() => {
        sheet.classList.remove("translate-y-full");
      }, 10);
    }
  };

  const closeCommentsDrawer = () => {
    const backdrop = document.querySelector("#comments-drawer-backdrop");
    const sheet = document.querySelector("#comments-drawer-sheet");
    if (sheet) sheet.classList.add("translate-y-full");
    setTimeout(() => {
      if (backdrop) backdrop.classList.add("hidden");
    }, 280);
  };

  document.querySelectorAll(".btn-open-comments").forEach((btn) => {
    btn.onclick = () => openCommentsDrawer(btn.dataset.postId);
  });

  const btnCloseComments = document.querySelector("#btn-close-comments-drawer");
  if (btnCloseComments) btnCloseComments.onclick = closeCommentsDrawer;

  const commentsBackdrop = document.querySelector("#comments-drawer-backdrop");
  if (commentsBackdrop) {
    commentsBackdrop.onclick = (e) => {
      if (e.target === commentsBackdrop) closeCommentsDrawer();
    };
  }

  // Critique suggestions inside Comments Drawer
  document.querySelectorAll(".btn-critique-suggestion").forEach((btn) => {
    btn.onclick = () => {
      const input = document.querySelector("#critique-input");
      if (input) {
        input.value = btn.innerText.trim() + " ";
        input.focus();
      }
    };
  });

  // Submit Critique Form
  const critiqueForm = document.querySelector("#critique-form");
  if (critiqueForm) {
    critiqueForm.onsubmit = (e) => {
      e.preventDefault();
      const input = document.querySelector("#critique-input");
      const text = input?.value.trim();
      if (!text) return;

      const feed = document.querySelector("#comments-list-feed");
      if (feed) {
        const newCard = document.createElement("article");
        newCard.className = "p-space-sm bg-surface-container-low rounded-DEFAULT flex flex-col gap-space-xs shadow-sm";
        newCard.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-xs">
              <div class="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-label-md font-bold">You</div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-title-ui text-label-md text-on-surface font-semibold">@you</span>
                  <span class="bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">Just now</span>
                </div>
                <span class="font-label-sm text-label-sm text-on-surface-variant">Live take</span>
              </div>
            </div>
          </div>
          <p class="font-body-md text-body-md text-on-surface mt-0.5 leading-relaxed">${text}</p>
          <footer class="flex items-center justify-between pt-space-2xs mt-space-2xs text-on-surface-variant">
            <span class="font-label-md text-label-md text-secondary">▲ 1 helpful</span>
            <span class="font-micro-mono text-micro-mono text-on-surface-variant">Verified</span>
          </footer>
        `;
        feed.prepend(newCard);
      }
      input.value = "";
      showToast("Styling take posted!");
    };
  }

  // Quick vote on Today's Radar
  document.querySelectorAll("[data-quick-vote]").forEach((btn) => {
    btn.onclick = () => {
      const parent = btn.closest("#vote-btn-group-a");
      const choice = btn.dataset.quickVote;
      if (parent) {
        parent.querySelectorAll("button").forEach((b) => {
          b.className = "h-9 px-3 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1 opacity-60";
        });
        btn.className = "h-9 px-3 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-semibold flex items-center justify-center gap-1 active:scale-95 shadow-sm";
      }
      const status = document.querySelector("#poll-a-status");
      const bar = document.querySelector("#poll-a-bar");
      if (status && bar) {
        if (choice === "wear") {
          status.innerText = "76% say wear it (Voted)";
          bar.style.width = "76%";
        } else {
          status.innerText = "Rethink voted (70% say wear it)";
          bar.style.width = "70%";
        }
      }
      showToast(choice === "wear" ? "Voted 'Wear it'!" : "Voted 'Rethink'!");
    };
  });

  // Waiting on you card
  const btnCastVote = document.querySelector("#btn-cast-vote");
  if (btnCastVote) {
    btnCastVote.onclick = () => {
      const postSophia = document.querySelector("#post-sophia");
      if (postSophia) postSophia.scrollIntoView({ behavior: "smooth" });
    };
  }

  // In-chat Voting
  document.querySelectorAll("[data-chat-vote]").forEach((btn) => {
    btn.onclick = () => {
      const voteType = btn.dataset.chatVote;
      const wearBtn = document.querySelector("#chatVoteWear");
      const rethinkBtn = document.querySelector("#chatVoteRethink");
      const wearPct = document.querySelector("#chatWearPercent");
      const rethinkPct = document.querySelector("#chatRethinkPercent");
      const barWear = document.querySelector("#chatBarWear");
      const barRethink = document.querySelector("#chatBarRethink");

      if (voteType === "wear") {
        if (wearBtn) wearBtn.className = "flex-1 py-3 px-3 rounded-full bg-secondary text-on-secondary font-title-ui text-label-md flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform ring-2 ring-secondary/30";
        if (rethinkBtn) rethinkBtn.className = "flex-1 py-3 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-title-ui text-label-md flex items-center justify-between active:scale-[0.98] transition-all";
        if (wearPct) wearPct.textContent = "74%";
        if (rethinkPct) rethinkPct.textContent = "26%";
        if (barWear) barWear.style.width = "74%";
        if (barRethink) barRethink.style.width = "26%";
        showToast("Voted in Chat: Wear it (74%)!");
      } else {
        if (rethinkBtn) rethinkBtn.className = "flex-1 py-3 px-3 rounded-full bg-primary text-on-primary font-title-ui text-label-md flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform ring-2 ring-primary/30";
        if (wearBtn) wearBtn.className = "flex-1 py-3 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-title-ui text-label-md flex items-center justify-between active:scale-[0.98] transition-all";
        if (wearPct) wearPct.textContent = "61%";
        if (rethinkPct) rethinkPct.textContent = "39%";
        if (barWear) barWear.style.width = "61%";
        if (barRethink) barRethink.style.width = "39%";
        showToast("Voted in Chat: Rethink (39%)!");
      }
    };
  });

  // Chat Quick Cues
  document.querySelectorAll(".btn-chat-cue").forEach((btn) => {
    btn.onclick = () => {
      const input = document.querySelector("#chatInput");
      if (input) {
        input.value = btn.innerText.trim();
        input.focus();
      }
    };
  });

  // Chat Form Message Send
  const chatForm = document.querySelector("#chat-form");
  if (chatForm) {
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      const input = document.querySelector("#chatInput");
      const text = input?.value.trim();
      if (!text) return;

      const container = document.querySelector("#chat-messages-container");
      if (container) {
        const bubble = document.createElement("div");
        bubble.className = "flex items-end gap-2 max-w-[82%] self-end animate-fade-in";
        bubble.innerHTML = `
          <div class="bg-primary text-on-primary px-4 py-3 rounded-2xl rounded-br-sm shadow-sm text-body-md leading-relaxed">
            ${text}
          </div>
          <span class="material-symbols-outlined text-[15px] text-secondary mb-1">done_all</span>
        `;
        container.appendChild(bubble);
        bubble.scrollIntoView({ behavior: "smooth" });
      }
      input.value = "";
    };
  }

  // Sign out in Profile
  const btnSignout = document.querySelector("#btn-profile-signout");
  if (btnSignout) {
    btnSignout.onclick = async () => {
      btnSignout.disabled = true;
      await logOut();
      showAuthScreen();
      showToast("Signed out");
    };
  }

  // Steal & Swap, Dorm Closet, and Style Friend Event Triggers
  document.querySelectorAll("[data-steal-swap-fit]").forEach((btn) => {
    btn.onclick = () => openStealSwap(btn.dataset.stealSwapFit || "weekend-denim", showToast);
  });

  document.querySelectorAll("[data-open-dorm-closet]").forEach((btn) => {
    btn.onclick = () => openDormCloset("formal-2026", showToast);
  });

  document.querySelectorAll("[data-open-style-friend]").forEach((btn) => {
    btn.onclick = () => openStyleFriend(null, showToast);
  });

  // Global delegation for dynamically inserted items (e.g. from feed cards)
  if (!window.__outfitted_delegated) {
    window.__outfitted_delegated = true;
    document.addEventListener("click", (e) => {
      const swapBtn = e.target.closest("[data-steal-swap-fit]");
      if (swapBtn) {
        e.preventDefault();
        openStealSwap(swapBtn.dataset.stealSwapFit || "weekend-denim", showToast);
        return;
      }
      const closetBtn = e.target.closest("[data-open-dorm-closet]");
      if (closetBtn) {
        e.preventDefault();
        openDormCloset("formal-2026", showToast);
        return;
      }
      const styleBtn = e.target.closest("[data-open-style-friend]");
      if (styleBtn) {
        e.preventDefault();
        openStyleFriend(null, showToast);
        return;
      }
    });
  }
}

// --- Account (see src/auth.js) ---

function enterApp(user) {
  Object.assign(currentUser, {
    name: user.full_name || user.username,
    username: user.username,
    initial: (user.full_name || user.username).charAt(0).toUpperCase(),
    bio: user.bio,
    avatarUrl: user.avatar?.url || null,
  });
  currentTab = "feed";
  renderApp();
}

function showAuthScreen(message = "") {
  app.innerHTML = renderAuthScreen();
  setAuthMode("login");
  if (message) showAuthErrors(message);

  document.querySelectorAll("[data-auth-mode]").forEach((tab) => {
    tab.onclick = () => setAuthMode(tab.dataset.authMode);
  });

  const btnDemo = document.querySelector("#btn-auth-demo");
  if (btnDemo) {
    btnDemo.onclick = () => {
      enterApp({
        username: "sofoniyas",
        full_name: "Sofoniyas Alemayehu",
        bio: "Building Outfitted · CS @ Virginia Tech",
        avatar: null,
      });
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
