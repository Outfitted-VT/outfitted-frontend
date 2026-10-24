import { currentUser, posts, friendsList, wardrobeOutfits, history, messagesData } from "./data.js";
import { icons } from "./icons.js";
import { renderStylistAssistant, connectStylistAssistant } from "./assistant.js";
import { renderMessagesView, connectMessages } from "./messages.js";
import { renderWardrobePage, connectWardrobe } from "./wardrobe.js";
import { renderLab3D, connectLab3D } from "./lab3d.js";
import { renderFriendsView, connectFriends } from "./friends.js";
import { renderVirtualDressingRoomModal, connectVirtualDressingRoom, openVirtualDressingRoom } from "./tryon-modal.js";
import { renderShareModal, connectShareModal, openShareModalForPost } from "./share-modal.js";
import { renderBrandingDialog, connectBrandingDialog } from "./branding-dialog.js";
import { getCurrentUser, signIn, signOut, signUp } from "./auth.js";

const app = document.querySelector("#app");

let activeTab = "feed"; // 'feed' | 'wardrobe' | 'friends' | 'messages' | 'assistant' | 'lab3d'
let activePostForComments = null;

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
        <a class="topbar-brand" href="#feed" data-nav="feed">
          <img src="./assets/branding/logo_star.png" alt="Outfitted" class="brand-logo-img" id="brand-header-icon" />
          <div class="brand-text-wrap">
            <span class="brand-name">outfitted<span class="asterisk-coral">*</span></span>
            <span class="brand-tagline">GOOD FITS. BETTER FRIENDS.</span>
          </div>
        </a>

        <div class="topbar-center-banner">
          <div class="feed-header-pill">The feed <span class="asterisk-coral">✱</span></div>
          <span class="daily-dose-tag">YOUR DAILY DOSE OF GOOD TASTE</span>
        </div>

        <div class="topbar-actions">
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
          <div class="user-badge-hi" id="account-badge" title="Account profile">
            HI
          </div>
        </div>
      </div>
    </header>
  `;
}

/* ---------- Left Navigation Sidebar ---------- */
function renderSidebar() {
  return `
    <aside class="app-sidebar">
      <nav class="sidebar-nav-list" aria-label="Main Navigation">
        <a href="#feed" class="nav-item ${activeTab === "feed" ? "active" : ""}" data-nav="feed">
          ${icons.feed}
          <span>Feed</span>
        </a>
        <a href="#wardrobe" class="nav-item ${activeTab === "wardrobe" ? "active" : ""}" data-nav="wardrobe">
          ${icons.hanger}
          <span>My fits</span>
        </a>
        <a href="#friends" class="nav-item ${activeTab === "friends" ? "active" : ""}" data-nav="friends">
          ${icons.users}
          <span>Friends</span>
        </a>
        <a href="#messages" class="nav-item ${activeTab === "messages" ? "active" : ""}" data-nav="messages">
          ${icons.message}
          <span>Messages</span>
          <span class="nav-badge">2</span>
        </a>
        <a href="#assistant" class="nav-item ${activeTab === "assistant" ? "active" : ""}" data-nav="assistant">
          ${icons.wand}
          <span>✦ Stylist AI</span>
        </a>
        <a href="#lab3d" class="nav-item ${activeTab === "lab3d" ? "active" : ""}" data-nav="lab3d">
          ${icons.cube}
          <span>3D Lab</span>
        </a>
      </nav>

      <button class="btn-sidebar-create" id="btn-open-create-fit">
        <span>+ Create a fit</span>
        <span>${icons.arrowRight}</span>
      </button>

      <div class="sidebar-bottom-card">
        <span class="mustard-sparkle">✱</span>
        <div class="mustard-title">Your style, your circle.</div>
        <p class="mustard-desc">Looks worth sharing. Opinions worth hearing.</p>
        <a href="#account" class="mustard-link" id="link-sidebar-auth">
          <span>Join Outfitted</span>
          <span>${icons.arrowRight}</span>
        </a>
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
        ${post.pieces.some((p) => p.model) ? `
          <button class="media-3d-toggle-btn btn-view-3d-model" data-post-id="${post.id}">
            ${icons.cube} 3D View
          </button>
        ` : ""}
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
          <div style="display:flex; gap:12px; padding:10px; background:var(--surface-sunk); border-radius:8px;">
            <span class="avatar-chip micro" style="background:#c85f47; color:#fff;">JL</span>
            <div>
              <p style="font-size:0.85rem;"><strong>Jordan Lee</strong> asked for a fit check on <strong>The Fit Check Circle</strong>.</p>
              <small style="color:var(--muted);">45m ago</small>
            </div>
          </div>
          <div style="display:flex; gap:12px; padding:10px; background:var(--surface-sunk); border-radius:8px;">
            <span class="avatar-chip micro" style="background:#d4a42b; color:#fff;">AK</span>
            <div>
              <p style="font-size:0.85rem;"><strong>Alex Kim</strong> super-reacted with 💖 on your outfit.</p>
              <small style="color:var(--muted);">2h ago</small>
            </div>
          </div>
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
      <button class="mobile-nav-btn btn-mobile-new" id="btn-mobile-create-fit">
        <span class="plus-badge">${icons.plus}</span>
        <span>New</span>
      </button>
      <button class="mobile-nav-btn ${activeTab === "friends" ? "active" : ""}" data-nav="friends">
        ${icons.users}
        <span>Friends</span>
      </button>
      <button class="mobile-nav-btn ${activeTab === "messages" ? "active" : ""}" data-nav="messages">
        ${icons.message}
        <span>Messages</span>
      </button>
    </nav>
  `;
}

/* ---------- Main Render Loop ---------- */
function render() {
  app.innerHTML = `
    <div id="app-shell">
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
              : renderLab3D()
          }
        </main>

        ${activeTab === "feed" ? renderRightRail() : ""}
      </div>

      ${renderMobileBottomNav()}
      ${renderPostYourFitModal()}
      ${renderVirtualDressingRoomModal()}
      ${renderShareModal()}
      ${renderBrandingDialog()}
      ${renderCommentsDialog()}
      ${renderNotificationsDrawer()}
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  // Navigation tabs
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      const target = el.dataset.nav;
      activeTab = target;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });

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
  } else if (activeTab === "lab3d") {
    connectLab3D();
  } else if (activeTab === "friends") {
    connectFriends((friendName) => {
      activeTab = "messages";
      render();
    });
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

  // Header and sidebar modal triggers
  const openPostModal = () => {
    const dialog = document.querySelector("#post-fit-modal");
    if (dialog) dialog.showModal();
  };

  const btnSidebarCreate = document.querySelector("#btn-open-create-fit");
  if (btnSidebarCreate) btnSidebarCreate.onclick = openPostModal;

  const btnHeroPost = document.querySelector("#btn-hero-post-fit");
  if (btnHeroPost) btnHeroPost.onclick = openPostModal;

  const btnMobileCreate = document.querySelector("#btn-mobile-create-fit");
  if (btnMobileCreate) btnMobileCreate.onclick = openPostModal;

  const btnHeroTryOn = document.querySelector("#btn-hero-try-on");
  if (btnHeroTryOn) btnHeroTryOn.onclick = () => openVirtualDressingRoom();

  const btnBrandingSuite = document.querySelector("#open-branding-suite");
  if (btnBrandingSuite) {
    btnBrandingSuite.onclick = () => {
      const dialog = document.querySelector("#branding-dialog");
      if (dialog) dialog.showModal();
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
      openVirtualDressingRoom();
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

render();
