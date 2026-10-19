import "@google/model-viewer";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { currentUser, posts, history } from "./data.js";
import { rebuildAvatar } from "./pipeline.js";
import { renderFeedView } from "./views/feed.js";
import { renderFittingRoomView } from "./views/fitting-room.js";
import { renderChatView } from "./views/chat.js";
import { renderProfileView } from "./views/profile.js";
import { renderCommentsDrawer } from "./views/comments-drawer.js";
import { renderCreateFitSheet } from "./views/create-fit-sheet.js";
import { renderRebuildModal } from "./views/rebuild-modal.js";

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
let is3DModelActive = false;
let isZoomed = false;
let isSpinning = false;
let activePostForComments = "sophia";

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
        <div class="flex items-center gap-space-xs">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs tracking-tighter">
            OF
          </div>
          <span class="font-title-editorial text-title-editorial tracking-tight text-on-surface font-semibold">Outfitted</span>
          <span class="font-micro-mono text-micro-mono uppercase text-secondary font-bold tracking-widest pl-space-2xs pt-0.5" id="header-tab-indicator">Feed</span>
        </div>
        <div class="flex items-center gap-space-xs">
          <button aria-label="Notifications" class="w-10 h-10 relative flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors" id="btn-notifications">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            <span class="absolute top-2 right-2 w-2 h-2 bg-tertiary-fixed rounded-full shadow-[0_0_8px_rgba(208,240,67,0.8)]"></span>
          </button>
          <button aria-label="Profile" class="w-10 h-10 flex items-center justify-center rounded-full hover:opacity-90 transition-opacity" data-nav="profile">
            <img alt="Profile" class="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBdkI5tA3KwmZ4Zpg1UOO242PpvUP6lUoJcfyIaaz4nLFpF69LXtOt6emgVEW-0d6n46G5tOLaU_tpRSPOnLM3VLkXAeOddFzzr8x6C408zwKPLTtwpLWh5_k5P75XqMvQpXCWxMjU92qnWCv4lD3FKFd0vIVXyF3sUCbaDuGPNWs9P0TCrGAVexl8CLqZOFMogl0dLaThBZKVScxpf04hXjbLNAGYtR8r1vna5fCM3GfKKhxL61-g" />
          </button>
        </div>
      </div>
    </header>

    <!-- MAIN VIEWS CONTAINER -->
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-20 bg-surface">
      <div id="view-feed" class="view-panel ${currentTab === "feed" ? "" : "hidden"}">
        ${renderFeedView(posts)}
      </div>

      <div id="view-fitting-room" class="view-panel ${currentTab === "fitting-room" ? "" : "hidden"}">
        ${renderFittingRoomView()}
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
    ${renderCreateFitSheet()}
    ${renderRebuildModal()}

    <!-- FLOATING BOTTOM NAVIGATION BAR -->
    <div class="fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-safe">
      <div class="px-margin pb-space-sm flex justify-center">
        <nav class="pointer-events-auto w-full max-w-sm h-16 bg-surface-container-lowest/90 backdrop-blur-2xl rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.08)] px-space-xs flex items-center justify-between border border-surface-container-high/60">
          <button aria-label="Feed" class="nav-tab group relative flex-1 h-12 flex flex-col items-center justify-center rounded-full transition-all duration-200 ${currentTab === "feed" ? "text-on-surface bg-surface-container-highest shadow-[0_2px_12px_rgba(0,0,0,0.06)]" : "text-on-surface-variant hover:text-on-surface"}" data-nav="feed">
            <span class="material-symbols-outlined text-[22px]">auto_awesome</span>
            <span class="font-micro-mono text-[10px] uppercase tracking-wider mt-0.5 font-bold">Feed</span>
          </button>

          <button aria-label="Fitting Room" class="nav-tab group relative flex-1 h-12 flex flex-col items-center justify-center rounded-full transition-all duration-200 ${currentTab === "fitting-room" ? "text-on-surface bg-surface-container-highest shadow-[0_2px_12px_rgba(0,0,0,0.06)]" : "text-on-surface-variant hover:text-on-surface"}" data-nav="fitting-room">
            <span class="material-symbols-outlined text-[22px]">view_in_ar</span>
            <span class="font-micro-mono text-[10px] uppercase tracking-wider mt-0.5 font-bold">3D Room</span>
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
      </div>
    </div>
  `;

  attachEventHandlers();
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
    "fitting-room": "Fitting Room",
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

  // Floating New Fit & Profile New Fit buttons
  const openNewFitSheet = () => {
    const backdrop = document.querySelector("#create-fit-backdrop");
    const sheet = document.querySelector("#create-fit-sheet");
    if (backdrop && sheet) {
      backdrop.classList.remove("hidden");
      setTimeout(() => {
        sheet.classList.remove("translate-y-full");
      }, 10);
    }
  };

  const closeNewFitSheet = () => {
    const backdrop = document.querySelector("#create-fit-backdrop");
    const sheet = document.querySelector("#create-fit-sheet");
    if (sheet) sheet.classList.add("translate-y-full");
    setTimeout(() => {
      if (backdrop) backdrop.classList.add("hidden");
    }, 280);
  };

  const btnFloatingFit = document.querySelector("#btn-floating-new-fit");
  if (btnFloatingFit) btnFloatingFit.onclick = openNewFitSheet;

  const btnProfileNewFit = document.querySelector("#btn-profile-new-fit");
  if (btnProfileNewFit) btnProfileNewFit.onclick = openNewFitSheet;

  const btnCancelCreate = document.querySelector("#btn-cancel-create-fit");
  if (btnCancelCreate) btnCancelCreate.onclick = closeNewFitSheet;

  const createBackdrop = document.querySelector("#create-fit-backdrop");
  if (createBackdrop) {
    createBackdrop.onclick = (e) => {
      if (e.target === createBackdrop) closeNewFitSheet();
    };
  }

  // Create Fit Audience selection
  document.querySelectorAll(".btn-audience-opt").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".btn-audience-opt").forEach((b) => {
        b.className =
          "flex flex-col items-center justify-center p-space-xs rounded-DEFAULT bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-left btn-audience-opt";
      });
      btn.className =
        "group relative flex flex-col items-center justify-center p-space-xs rounded-DEFAULT bg-primary text-on-primary shadow-sm text-left transition-all btn-audience-opt";
    };
  });

  // Create Fit Duration selection
  document.querySelectorAll(".btn-duration-opt").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".btn-duration-opt").forEach((b) => {
        b.className = "px-space-xs py-0.5 rounded-full text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm btn-duration-opt";
      });
      btn.className = "px-space-xs py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs font-semibold btn-duration-opt";
    };
  });

  // Submit Fit Dilemma
  const createFitForm = document.querySelector("#create-fit-form");
  if (createFitForm) {
    createFitForm.onsubmit = (e) => {
      e.preventDefault();
      const title = document.querySelector("#fit-title")?.value || "New Fit Dilemma";
      const prompt = document.querySelector("#dilemma-prompt")?.value || "";

      // Prepend to posts list in data.js
      posts.unshift({
        id: `fit-${Date.now()}`,
        author: currentUser.name || "Sofoniyas",
        initial: "S",
        audience: "Close Friends",
        time: "Just now",
        title,
        caption: prompt,
        pieces: [
          { name: "Structured Wool Blazer", color: "#4A5568" },
          { name: "Silk High-Neck Top", color: "#FFFDD0" },
          { name: "Relaxed Pleated Trouser", color: "#2D3748" },
        ],
        votes: { yes: 1, no: 0 },
        likes: 1,
        comments: 0,
        commentsList: [],
      });

      closeNewFitSheet();
      showToast("Fit dilemma published to Circle!");
      switchTab("feed");
    };
  }

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

  // Feed Post Poll Voting
  document.querySelectorAll("[data-poll-vote]").forEach((btn) => {
    btn.onclick = () => {
      const type = btn.dataset.pollVote;
      const wearBar = document.querySelector("#poll-wear-bar");
      const rethinkBar = document.querySelector("#poll-rethink-bar");
      const wearNum = document.querySelector("#poll-wear-num");
      const rethinkNum = document.querySelector("#poll-rethink-num");
      const wearText = document.querySelector("#poll-wear-text");

      if (type === "wear") {
        if (wearBar) wearBar.style.width = "72%";
        if (rethinkBar) rethinkBar.style.width = "28%";
        if (wearNum) wearNum.innerText = "72%";
        if (rethinkNum) rethinkNum.innerText = "28%";
        if (wearText) wearText.innerText = "72% majority (Voted)";
        showToast("Voted: Wear it!");
      } else {
        if (wearBar) wearBar.style.width = "64%";
        if (rethinkBar) rethinkBar.style.width = "36%";
        if (wearNum) wearNum.innerText = "64%";
        if (rethinkNum) rethinkNum.innerText = "36%";
        showToast("Voted: Rethink!");
      }
    };
  });

  // Like Buttons
  document.querySelectorAll(".btn-toggle-like").forEach((btn) => {
    btn.onclick = () => {
      const heart = btn.querySelector(".heart-icon");
      const count = btn.querySelector(".count-num");
      const isLiked = heart?.style.fontVariationSettings?.includes("'FILL' 1");
      if (isLiked) {
        if (heart) {
          heart.style.fontVariationSettings = "'FILL' 0";
          heart.classList.remove("text-error");
        }
        if (count) count.innerText = String(Number(count.innerText) - 1);
      } else {
        if (heart) {
          heart.style.fontVariationSettings = "'FILL' 1";
          heart.classList.add("text-error");
        }
        if (count) count.innerText = String(Number(count.innerText) + 1);
      }
    };
  });

  // Bookmark Buttons
  document.querySelectorAll(".btn-toggle-bookmark").forEach((btn) => {
    btn.onclick = () => {
      const icon = btn.querySelector(".bookmark-icon");
      const isSaved = icon?.style.fontVariationSettings?.includes("'FILL' 1");
      if (icon) {
        icon.style.fontVariationSettings = isSaved ? "'FILL' 0" : "'FILL' 1";
      }
      showToast(isSaved ? "Removed from Capsule" : "Saved to Capsule");
    };
  });

  // Share Buttons
  document.querySelectorAll(".btn-share-look").forEach((btn) => {
    btn.onclick = () => {
      const url = `${window.location.origin}/#post-${btn.dataset.postId || "look"}`;
      navigator.clipboard?.writeText(url);
      showToast("Look link copied to clipboard!");
    };
  });

  // 3D Fitting Room Camera Controls
  const avatarImg = document.querySelector("#avatarStageImage");
  const modelViewer = document.querySelector("#fitting-stage-model");

  document.querySelectorAll(".cam-angle").forEach((btn, idx) => {
    btn.onclick = () => {
      document.querySelectorAll(".cam-angle").forEach((b) => {
        b.className = "cam-angle px-3.5 py-1.5 text-on-surface rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-all duration-200";
      });
      btn.className = "cam-angle active-cam px-3.5 py-1.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm transition-all duration-200";

      const angle = btn.dataset.angle;
      if (modelViewer && !modelViewer.classList.contains("hidden")) {
        const orbits = { front: "0deg 82deg auto", side: "90deg 82deg auto", back: "180deg 82deg auto" };
        modelViewer.cameraOrbit = orbits[angle] || "0deg 82deg auto";
      }
      if (avatarImg) {
        const transforms = ["scale-100 rotate-0", "scale-105 -rotate-1", "scale-105 rotate-1"];
        avatarImg.className = "w-full h-full object-cover object-center transition-all duration-500 ease-out " + transforms[idx % 3];
      }
    };
  });

  // 360 Spin in Fitting Room
  const spinBtn = document.querySelector("#spinBtn");
  const spinBadge = document.querySelector("#spinBadge");
  if (spinBtn) {
    spinBtn.onclick = () => {
      isSpinning = !isSpinning;
      if (isSpinning) {
        spinBtn.classList.add("bg-secondary", "text-on-secondary");
        spinBadge?.classList.remove("hidden");
        spinBadge?.classList.add("flex");
        if (modelViewer) modelViewer.setAttribute("auto-rotate", "");
        if (avatarImg) avatarImg.classList.add("scale-105");
      } else {
        spinBtn.classList.remove("bg-secondary", "text-on-secondary");
        spinBadge?.classList.add("hidden");
        spinBadge?.classList.remove("flex");
        if (modelViewer) modelViewer.removeAttribute("auto-rotate");
        if (avatarImg) avatarImg.classList.remove("scale-105");
      }
    };
  }

  // Toggle 3D Interactive Model vs Photo Render
  const lightingBtn = document.querySelector("#lightingBtn");
  if (lightingBtn) {
    lightingBtn.onclick = () => {
      is3DModelActive = !is3DModelActive;
      if (modelViewer && avatarImg) {
        if (is3DModelActive) {
          modelViewer.classList.remove("hidden");
          avatarImg.classList.add("hidden");
          lightingBtn.classList.add("text-secondary");
          showToast("Interactive 3D WebGL Avatar Active");
        } else {
          modelViewer.classList.add("hidden");
          avatarImg.classList.remove("hidden");
          lightingBtn.classList.remove("text-secondary");
          showToast("Studio Editorial Scene Active");
        }
      }
    };
  }

  // Zoom Button in Fitting Room
  const zoomBtn = document.querySelector("#zoomBtn");
  if (zoomBtn) {
    zoomBtn.onclick = () => {
      isZoomed = !isZoomed;
      if (avatarImg) {
        avatarImg.style.transform = isZoomed ? "scale(1.2)" : "scale(1)";
      }
      zoomBtn.classList.toggle("text-secondary", isZoomed);
    };
  }

  // Rebuild Avatar Modal Handlers
  const btnOpenRebuild = document.querySelector("#btn-open-rebuild-scan");
  const rebuildBackdrop = document.querySelector("#rebuild-modal-backdrop");
  const btnCloseRebuild = document.querySelector("#btn-close-rebuild-modal");
  const rebuildFileInput = document.querySelector("#rebuild-file-input");
  const rebuildDropzone = document.querySelector("#rebuild-dropzone");
  const rebuildPreview = document.querySelector("#rebuild-photo-preview");
  const rebuildPrompt = document.querySelector("#rebuild-dropzone-prompt");
  const btnStartRebuild = document.querySelector("#btn-start-rebuild-pipeline");
  const rebuildStagePick = document.querySelector("#rebuild-stage-pick");
  const rebuildStageRun = document.querySelector("#rebuild-stage-run");
  const rebuildStageDone = document.querySelector("#rebuild-stage-done");

  if (btnOpenRebuild && rebuildBackdrop) {
    btnOpenRebuild.onclick = () => {
      rebuildBackdrop.classList.remove("hidden");
      if (rebuildStagePick) rebuildStagePick.classList.remove("hidden");
      if (rebuildStageRun) rebuildStageRun.classList.add("hidden");
      if (rebuildStageDone) rebuildStageDone.classList.add("hidden");
    };
  }

  if (btnCloseRebuild && rebuildBackdrop) {
    btnCloseRebuild.onclick = () => rebuildBackdrop.classList.add("hidden");
  }

  if (rebuildFileInput && rebuildPreview && btnStartRebuild) {
    rebuildFileInput.onchange = () => {
      const file = rebuildFileInput.files?.[0];
      if (file) {
        rebuildPreview.src = URL.createObjectURL(file);
        rebuildPreview.classList.remove("hidden");
        if (rebuildPrompt) rebuildPrompt.classList.add("hidden");
        btnStartRebuild.disabled = false;
      }
    };
  }

  if (btnStartRebuild) {
    btnStartRebuild.onclick = async () => {
      if (rebuildStagePick) rebuildStagePick.classList.add("hidden");
      if (rebuildStageRun) rebuildStageRun.classList.remove("hidden");

      const items = [...document.querySelectorAll("[data-rebuild-step]")];
      await rebuildAvatar("user-photo", (stepId) => {
        const index = items.findIndex((item) => item.dataset.rebuildStep === stepId);
        items.forEach((item, i) => {
          const icon = item.querySelector(".step-icon span");
          if (i < index) {
            item.className = "flex items-center space-x-3 text-secondary py-1 text-label-sm";
            if (icon) icon.innerText = "check_circle";
          } else if (i === index) {
            item.className = "flex items-center space-x-3 text-primary py-1 text-label-sm font-bold";
            if (icon) icon.innerText = "progress_activity";
          }
        });
      });

      if (rebuildStageRun) rebuildStageRun.classList.add("hidden");
      if (rebuildStageDone) rebuildStageDone.classList.remove("hidden");
    };
  }

  const btnSeeAvatar = document.querySelector("#btn-rebuild-see-avatar");
  if (btnSeeAvatar && rebuildBackdrop) {
    btnSeeAvatar.onclick = () => {
      rebuildBackdrop.classList.add("hidden");
      switchTab("fitting-room");
      showToast("Avatar successfully calibrated!");
    };
  }

  // Chat Deep-link to 3D Fitting Room
  const btnOpen3DFit = document.querySelector("#btn-open-fit-in-3d");
  if (btnOpen3DFit) {
    btnOpen3DFit.onclick = () => {
      switchTab("fitting-room");
      showToast("Opened look in 3D Fitting Room");
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
    btnSignout.onclick = () => {
      showToast("Signed out of session");
    };
  }
}

// Initial Render
renderApp();
