import "@google/model-viewer";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { currentUser, posts, history } from "./data.js";
import { icons } from "./icons.js";
import { PIPELINE_STEPS, rebuildAvatar } from "./pipeline.js";
import { tryOnPage, connectTryOn } from "./tryon.js";
import { getCurrentUser, signIn, signOut, signUp } from "./auth.js";
import { landingPage } from "./landing.js";

// Native Capacitor platform initialization
if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
  try {
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#f6f6f3" }).catch(() => {});
    SplashScreen.hide().catch(() => {});
  } catch (err) {
    console.debug("Capacitor features not initialized:", err);
  }
}

const app = document.querySelector("#app");

const CAMERA_VIEWS = {
  front: "0deg 82deg auto",
  side: "90deg 82deg auto",
  back: "180deg 82deg auto",
};

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

function pieceTile(piece) {
  const visual = piece.model
    ? `<model-viewer
        class="piece-model"
        src="${piece.model}"
        alt="${piece.name}, 3D model"
        camera-controls
        disable-zoom
        disable-pan
        touch-action="pan-y"
        interaction-prompt="none"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="20deg"
        camera-orbit="20deg 80deg auto"
        environment-image="neutral"
        tone-mapping="neutral"
        shadow-intensity="0.6"
        loading="lazy"
      ></model-viewer>
      <span class="piece-badge">3D</span>`
    : "";
  return `
    <figure class="piece${piece.model ? " piece-featured" : ""}" style="--swatch:${piece.color}">
      <div class="piece-swatch">${visual}</div>
      <figcaption>${piece.name}</figcaption>
    </figure>`;
}

function lookBoard(pieces) {
  const featured = pieces.some((piece) => piece.model);
  const ordered = featured ? [...pieces].sort((a, b) => Boolean(b.model) - Boolean(a.model)) : pieces;
  return `
    <div class="look-board${featured ? " look-board-featured" : ""}">
      ${ordered.map(pieceTile).join("")}
    </div>`;
}

function poll(post) {
  const total = post.votes.yes + post.votes.no;
  const yesShare = total > 0 ? Math.round((post.votes.yes / total) * 100) : 50;
  return `
    <div class="poll" data-post="${post.id}">
      <p class="poll-question">Would you wear it?</p>
      <div class="poll-options">
        <button class="poll-option" data-vote="yes">Wear it</button>
        <button class="poll-option" data-vote="no">Rethink</button>
      </div>
      <div class="poll-result" hidden>
        <div class="poll-bar"><span style="width:${yesShare}%"></span></div>
        <p><strong>${yesShare}%</strong> say wear it · ${total} votes</p>
      </div>
    </div>`;
}

function postCard(post) {
  const commentCount = post.commentsList ? post.commentsList.length : post.comments;
  const recentComments = post.commentsList || [];
  return `
    <article class="post" id="post-${post.id}">
      <header class="post-head">
        <span class="avatar-chip">${post.initial}</span>
        <div class="post-meta">
          <strong>${post.author}</strong>
          <small>${post.audience} · ${post.time}</small>
        </div>
        <button class="icon-button" aria-label="Post options">${icons.more}</button>
      </header>
      ${lookBoard(post.pieces)}
      <div class="post-body">
        <h3>${post.title}</h3>
        <p>${post.caption}</p>
        ${poll(post)}

        <div class="post-discussion" id="discussion-${post.id}">
          <div class="discussion-head">
            <h4>Friend Discussion (${commentCount})</h4>
            ${commentCount > 2 ? `<button type="button" class="text-link comment-trigger" data-comment-post="${post.id}" style="font-size:0.75rem;">View all</button>` : ""}
          </div>
          <div class="comments-inline-list" id="inline-comments-${post.id}">
            ${recentComments.slice(-3).map((c) => `
              <div class="comment-inline-row">
                <span class="avatar-chip micro">${c.initial}</span>
                <p><strong>${c.author}</strong> <span>${c.text}</span> <small>${c.time}</small></p>
              </div>
            `).join("")}
          </div>
          <form class="inline-comment-form" data-inline-post="${post.id}">
            <input type="text" placeholder="Add styling advice or opinion..." required />
            <button type="submit" class="button button-dark" style="height:34px; padding:0 14px; font-size:0.75rem;">Post</button>
          </form>
        </div>
      </div>
      <footer class="post-actions">
        <button class="action like-button" aria-pressed="false">${icons.heart}<span>${post.likes}</span></button>
        <button class="action comment-trigger" data-comment-post="${post.id}">${icons.comment}<span>${commentCount}</span></button>
        <button class="action action-end share-trigger" data-share-post="${post.id}">${icons.share}<span>Share</span></button>
      </footer>
    </article>`;
}

function fittingRoom() {
  return `
    <section class="fitting-room" id="fitting-room" aria-labelledby="fitting-room-title">
      <div class="room-head">
        <div>
          <p class="eyebrow">Fitting room</p>
          <h2 id="fitting-room-title">Your avatar</h2>
        </div>
        <span class="status-pill" id="avatar-status">Default body</span>
      </div>

      <div class="stage">
        <model-viewer
          id="avatar"
          src="./assets/avatar.glb"
          alt="Your 3D avatar"
          camera-controls
          touch-action="pan-y"
          disable-zoom
          interaction-prompt="none"
          camera-orbit="${CAMERA_VIEWS.front}"
          min-camera-orbit="auto 40deg auto"
          max-camera-orbit="auto 100deg auto"
          field-of-view="26deg"
          environment-image="neutral"
          tone-mapping="neutral"
          exposure="0.95"
          shadow-intensity="1.1"
          shadow-softness="0.9"
          rotation-per-second="18deg"
        ></model-viewer>
        <button class="rebuild-button" id="open-rebuild">${icons.camera}<span>Rebuild avatar</span></button>
        <div class="stage-controls" role="group" aria-label="Camera view">
          ${Object.keys(CAMERA_VIEWS)
            .map((view) => `<button class="view-button${view === "front" ? " active" : ""}" data-view="${view}">${view}</button>`)
            .join("")}
          <button class="icon-button spin-button" id="spin" aria-label="Auto-rotate" aria-pressed="false">${icons.rotate}</button>
        </div>
      </div>

      <dl class="measurements">
        <div><dt>Height</dt><dd>163 cm</dd></div>
        <div><dt>Build</dt><dd>Average</dd></div>
        <div><dt>Fit pref.</dt><dd>Relaxed</dd></div>
      </dl>

      <a class="passport-link" href="#try-on">
        <span><strong>Fit passport</strong><small>Use this avatar at partner stores</small></span>
        <span class="beta-tag">Beta</span>
      </a>
    </section>`;
}

function historyPanel() {
  return `
    <section class="history" id="history" aria-labelledby="history-title">
      <div class="room-head">
        <h2 id="history-title">Shared history</h2>
        <a class="text-link" href="#history">View all</a>
      </div>
      <ul id="history-list">
        ${history
          .map(
            (item) => `
              <li>
                <span>${item.name}<small>${item.date}</small></span>
                <b class="tag ${item.status === "Live" ? "tag-live" : ""}">${item.status}</b>
              </li>`
          )
          .join("")}
      </ul>
    </section>`;
}

function authDialog() {
  return `
    <dialog class="auth" id="auth-dialog" aria-labelledby="auth-heading">
      <form class="auth-card" id="auth-form" method="dialog">
        <button type="button" class="icon-button close" id="close-auth" aria-label="Close">${icons.close}</button>
        <p class="eyebrow">Outfitted</p>
        <h2 id="auth-heading">Welcome back</h2>
        <p class="auth-lede">Sign in to save fits, follow friends, and start sharing.</p>
        <div class="segmented" role="tablist">
          <button type="button" role="tab" class="active" data-mode="signin" aria-selected="true">Sign in</button>
          <button type="button" role="tab" data-mode="signup" aria-selected="false">Create account</button>
        </div>
        <label id="name-row" hidden>Name<input type="text" id="auth-name" autocomplete="name" maxlength="80" placeholder="Your name" /></label>
        <label>Email<input type="email" id="auth-email" required autocomplete="email" placeholder="you@example.com" /></label>
        <label>Password<input type="password" id="auth-password" required minlength="8" autocomplete="current-password" placeholder="At least 8 characters" /></label>
        <p class="form-error" id="auth-error" role="alert" hidden></p>
        <button class="button button-dark button-block" id="auth-submit">Sign in</button>
      </form>
    </dialog>`;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function voteShare(post) {
  const total = post.votes.yes + post.votes.no;
  return { total, yes: total > 0 ? Math.round((post.votes.yes / total) * 100) : 50 };
}

function liveFitCard() {
  const live = posts.find((post) => post.author === currentUser.name) || posts[0];
  if (!live) return "";
  const { total, yes } = voteShare(live);
  return `
    <a class="today-card live-card" href="#post-${live.id}">
      <div class="today-head">
        <p class="eyebrow">Your live fit</p>
        <span class="tag tag-live">Live</span>
      </div>
      <div class="live-body">
        <div class="mini-swatches">
          ${live.pieces.map((piece) => `<span style="--swatch:${piece.color}"></span>`).join("")}
        </div>
        <div>
          <h2>${live.title}</h2>
          <p class="live-stat" id="live-stat"><strong>${yes}%</strong> say wear it</p>
        </div>
      </div>
      <div class="poll-bar"><span id="live-bar" style="width:${yes}%"></span></div>
      <p class="today-foot" id="live-foot">${total} votes · ${live.commentsList ? live.commentsList.length : live.comments} comments</p>
    </a>`;
}

function waitingCard() {
  const waiting = posts.filter((post) => post.author !== currentUser.name);
  return `
    <a class="today-card" href="#post-${waiting[0]?.id}">
      <p class="eyebrow">Waiting on you</p>
      <div class="face-stack">
        ${waiting.map((post) => `<span class="avatar-chip">${post.initial}</span>`).join("")}
      </div>
      <h2>${waiting.length} friends want your take</h2>
      <p class="today-foot today-cta">Start voting →</p>
    </a>`;
}

function createCard() {
  return `
    <button class="today-card create-card" id="card-open-new-fit">
      <span class="create-icon">${icons.plus}</span>
      <h2>Start a new fit</h2>
      <p>Put a look on your avatar and ask your circle.</p>
    </button>`;
}

/* ---------- New Fit Creator Dialog ---------- */
function newFitDialog() {
  return `
    <dialog class="sheet sheet-medium" id="new-fit-dialog" aria-labelledby="new-fit-heading">
      <div class="sheet-card">
        <button type="button" class="icon-button close" data-close-new-fit aria-label="Close">${icons.close}</button>
        <p class="eyebrow">Fit Sharing</p>
        <h2 id="new-fit-heading">Create a new fit</h2>
        <p class="sheet-lede">Assemble pieces and get instant feedback from friends.</p>

        <form class="fit-form-grid" id="new-fit-form">
          <label>
            Fit Title
            <input type="text" id="fit-title" required placeholder="e.g. Friday night dinner" />
          </label>

          <label>
            Question / Caption
            <textarea id="fit-caption" rows="2" required placeholder="e.g. Thinking of pairing this with dark boots. Honest thoughts?"></textarea>
          </label>

          <label>
            Audience
            <select id="fit-audience">
              <option value="Close friends">Close friends</option>
              <option value="Followers">Followers</option>
              <option value="Public">Public circle</option>
            </select>
          </label>

          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:0.82rem; font-weight:600;">Pieces & Swatches</span>
              <button type="button" class="text-link" id="add-piece-row" style="font-size:0.75rem;">+ Add piece</button>
            </div>
            <div class="pieces-inputs-list" id="pieces-inputs-list">
              <div class="piece-input-row">
                <input type="color" class="piece-color-input" value="#111111" title="Swatch color" />
                <input type="text" class="piece-name-input" required placeholder="Piece name (e.g. Oversized knit)" />
              </div>
              <div class="piece-input-row">
                <input type="color" class="piece-color-input" value="#34466b" title="Swatch color" />
                <input type="text" class="piece-name-input" required placeholder="Piece name (e.g. Straight denim)" />
              </div>
            </div>
          </div>

          <button class="button button-primary button-block" type="submit" style="margin-top: 12px;">
            ${icons.plus}<span>Publish to Circle</span>
          </button>
        </form>
      </div>
    </dialog>`;
}

/* ---------- Comments Drawer Dialog ---------- */
function commentsDialog() {
  return `
    <dialog class="sheet sheet-medium" id="comments-dialog" aria-labelledby="comments-heading">
      <div class="sheet-card">
        <button type="button" class="icon-button close" data-close-comments aria-label="Close">${icons.close}</button>
        <p class="eyebrow">Discussion</p>
        <h2 id="comments-heading">Fit Comments</h2>
        <p class="sheet-lede" id="comments-subheading">Feedback and styling takes from friends.</p>

        <div class="comments-list" id="comments-list-container"></div>

        <form class="comment-form" id="comment-add-form">
          <input type="text" id="comment-input" required placeholder="Give your honest opinion or styling tip..." />
          <button class="button button-dark" type="submit">${icons.send}</button>
        </form>
      </div>
    </dialog>`;
}

/* ---------- 3D Rebuild Avatar Dialog ---------- */
function rebuildDialog() {
  return `
    <dialog class="sheet" id="rebuild-dialog" aria-labelledby="rebuild-heading">
      <div class="sheet-card">
        <button type="button" class="icon-button close" data-close aria-label="Close">${icons.close}</button>
        <p class="eyebrow">Fitting room</p>
        <h2 id="rebuild-heading">Rebuild your avatar</h2>

        <div class="rebuild-step" data-stage="pick">
          <p class="sheet-lede">Upload one full-body photo. We will build a 3D body that matches your shape.</p>
          <label class="dropzone" id="dropzone">
            <input type="file" id="photo-input" accept="image/*" hidden />
            <img id="photo-preview" alt="Selected photo" hidden />
            <span class="dropzone-empty" id="dropzone-empty">
              <span class="rebuild-icon">${icons.camera}</span>
              <strong>Choose a photo</strong>
              <small>or drop it here · JPG or PNG</small>
            </span>
          </label>
          <ul class="tips">
            <li>Stand straight, head to toe in frame</li>
            <li>Fitted clothes, arms slightly away from the body</li>
            <li>Plain background, good light</li>
          </ul>
          <button class="button button-primary button-block" id="start-rebuild" disabled>${icons.sparkle}<span>Build my avatar</span></button>
        </div>

        <div class="rebuild-step" data-stage="run" hidden>
          <p class="sheet-lede">This usually takes under a minute. You can keep this open.</p>
          <ol class="pipeline">
            ${PIPELINE_STEPS.map(
              (step) => `
                <li data-step="${step.id}">
                  <span class="step-dot"></span>
                  <span>${step.label}${step.detail ? `<small>${step.detail}</small>` : ""}</span>
                </li>`
            ).join("")}
          </ol>
        </div>

        <div class="rebuild-step" data-stage="done" hidden>
          <div class="done-badge">${icons.check}</div>
          <p class="sheet-lede">Your new avatar is ready in the fitting room.</p>
          <button class="button button-dark button-block" data-close>See my avatar</button>
        </div>
      </div>
    </dialog>`;
}

function render() {
  app.innerHTML = `
    <div class="landing" id="landing" hidden>${landingPage()}</div>

    <div id="app-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="/">OUTFITTED<span>.</span></a>
        <nav class="nav" aria-label="Primary">
          <a href="#feed" data-nav="home">Feed</a>
          <a href="#fitting-room" data-nav="home">Fitting room</a>
          <a href="#history" data-nav="home">History</a>
          <a href="#try-on" data-nav="try-on">Try on <span class="beta-tag">Beta</span></a>
        </nav>
        <div class="topbar-actions">
          <div class="account" id="account"></div>
          <button class="button button-primary" id="open-new-fit">${icons.plus}<span>New fit</span></button>
        </div>
      </div>
    </header>

    <main class="page" data-page="home">
      <section class="today" aria-labelledby="today-title">
        <h1 id="today-title">${greeting()}</h1>
        <div class="today-grid">
          ${liveFitCard()}
          ${waitingCard()}
          ${createCard()}
        </div>
      </section>

      <div class="layout">
        <section class="feed" id="feed" aria-labelledby="feed-title">
          <div class="section-head">
            <h2 id="feed-title">From your circle</h2>
            <span id="feed-count">${posts.length} new fits</span>
          </div>
          <div id="posts-container">
            ${posts.map(postCard).join("")}
          </div>
        </section>

        <aside class="rail">
          ${fittingRoom()}
          ${historyPanel()}
        </aside>
      </div>
    </main>

    <main class="page" data-page="try-on" hidden>
      ${tryOnPage()}
    </main>
    </div>

    ${authDialog()}
    ${rebuildDialog()}
    ${newFitDialog()}
    ${commentsDialog()}
  `;

  connectInteractions();
  connectLanding();
  connectTryOn();
  route();
  // Default to currentUser so the prototype is immediately interactive without forced landing gate
  getCurrentUser().then((user) => setUser(user || currentUser));
}

// Minimal hash routing: #try-on is its own page; every other hash is an anchor on the home page.
function route() {
  const page = location.hash === "#try-on" ? "try-on" : "home";
  document.querySelectorAll("[data-page]").forEach((el) => (el.hidden = el.dataset.page !== page));
  const current = page === "try-on" ? "#try-on" : location.hash || "#feed";
  document.querySelectorAll("[data-nav]").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === current));
  if (page === "try-on") window.scrollTo(0, 0);
  else if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

window.addEventListener("hashchange", route);

// --- Account (see src/auth.js and scripts/serve.py) ---
function setUser(user) {
  const landing = document.querySelector("#landing");
  const shell = document.querySelector("#app-shell");
  const firstLoad = shell.hidden && landing.hidden;
  const wasSignedIn = !shell.hidden;
  shell.hidden = !user;
  landing.hidden = Boolean(user);
  if (!firstLoad && wasSignedIn !== Boolean(user)) {
    // Signing in or out: drop the other view's anchor and start at the top.
    window.history.replaceState(null, "", location.pathname); // `history` here is the sample list from data.js
    route();
    window.scrollTo(0, 0);
  }

  const account = document.querySelector("#account");
  const firstName = user?.name.split(" ")[0];
  document.querySelector("#today-title").textContent = user ? `${greeting()}, ${firstName}` : greeting();

  if (!user) {
    account.innerHTML = `<button class="button button-ghost" id="open-auth">Sign in</button>`;
    document.querySelector("#open-auth").onclick = () => document.querySelector("#auth-dialog").showModal();
    return;
  }

  account.innerHTML = `
    <button class="account-button" id="account-button" aria-haspopup="menu" aria-expanded="false">
      <span class="avatar-chip"></span><span class="account-name"></span>
    </button>
    <div class="account-menu" id="account-menu" role="menu" hidden>
      <p><strong></strong><small></small></p>
      <button role="menuitem" id="sign-out">Sign out</button>
    </div>`;
  // Names come from users, so they go in as text, never as HTML.
  account.querySelector(".avatar-chip").textContent = user.name[0].toUpperCase();
  account.querySelector(".account-name").textContent = firstName;
  account.querySelector(".account-menu strong").textContent = user.name;
  account.querySelector(".account-menu small").textContent = user.email;

  const button = document.querySelector("#account-button");
  const menu = document.querySelector("#account-menu");
  const toggleMenu = (open) => {
    menu.hidden = !open;
    button.setAttribute("aria-expanded", open);
  };
  button.onclick = () => toggleMenu(menu.hidden);
  document.querySelector("#sign-out").onclick = async () => {
    await signOut().catch(() => {});
    setUser(null);
  };
}

function openAuth(mode) {
  document.querySelector(`[data-mode="${mode}"]`).click();
  document.querySelector("#auth-dialog").showModal();
}

function connectLanding() {
  document.querySelectorAll("[data-auth-open]").forEach((button) => {
    button.onclick = () => openAuth(button.dataset.authOpen);
  });
  // "Get started" carries the typed email into the create-account form.
  document.querySelector("#landing-start").onsubmit = (event) => {
    event.preventDefault();
    document.querySelector("#auth-email").value = document.querySelector("#landing-email").value;
    openAuth("signup");
    document.querySelector("#auth-name").focus();
  };
}

function connectAuth() {
  const dialog = document.querySelector("#auth-dialog");
  const form = document.querySelector("#auth-form");
  const submit = document.querySelector("#auth-submit");
  const error = document.querySelector("#auth-error");
  const password = document.querySelector("#auth-password");
  let mode = "signin";

  const showError = (message) => {
    error.textContent = message;
    error.hidden = !message;
  };

  document.querySelector("#close-auth").onclick = () => dialog.close();
  dialog.onclick = (event) => {
    if (event.target === dialog) dialog.close();
  };
  dialog.onclose = () => showError("");

  // Close the account menu on any click outside it.
  document.addEventListener("click", (event) => {
    const menu = document.querySelector("#account-menu");
    if (menu && !document.querySelector("#account").contains(event.target)) {
      menu.hidden = true;
      document.querySelector("#account-button").setAttribute("aria-expanded", false);
    }
  });

  document.querySelectorAll("[data-mode]").forEach((tab) => {
    tab.onclick = () => {
      mode = tab.dataset.mode;
      const signup = mode === "signup";
      document.querySelectorAll("[data-mode]").forEach((item) => {
        item.classList.toggle("active", item === tab);
        item.setAttribute("aria-selected", item === tab);
      });
      document.querySelector("#name-row").hidden = !signup;
      document.querySelector("#auth-name").required = signup;
      password.autocomplete = signup ? "new-password" : "current-password";
      document.querySelector("#auth-heading").textContent = signup ? "Create your account" : "Welcome back";
      submit.textContent = signup ? "Create account" : "Sign in";
      showError("");
    };
  });

  form.onsubmit = async (event) => {
    event.preventDefault();
    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = mode === "signup" ? "Creating account…" : "Signing in…";
    showError("");
    try {
      const email = document.querySelector("#auth-email").value;
      const user =
        mode === "signup"
          ? await signUp(document.querySelector("#auth-name").value, email, password.value)
          : await signIn(email, password.value);
      form.reset();
      dialog.close();
      setUser(user);
    } catch (err) {
      showError(err.message);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  };
}

function connectInteractions() {
  connectAuth();

  // Likes
  document.querySelectorAll(".like-button").forEach((button) => {
    button.onclick = () => {
      const count = button.querySelector("span");
      const liked = button.classList.toggle("liked");
      button.setAttribute("aria-pressed", liked);
      count.textContent = Number(count.textContent) + (liked ? 1 : -1);
    };
  });

  // Polls
  document.querySelectorAll(".poll").forEach((pollEl) => {
    const post = posts.find((item) => item.id === pollEl.dataset.post);
    if (!post) return;
    pollEl.querySelectorAll("[data-vote]").forEach((button) => {
      button.onclick = () => {
        post.votes[button.dataset.vote] += 1;
        const total = post.votes.yes + post.votes.no;
        const yesShare = Math.round((post.votes.yes / total) * 100);
        pollEl.querySelector(".poll-bar span").style.width = `${yesShare}%`;
        pollEl.querySelector(".poll-result p").innerHTML = `<strong>${yesShare}%</strong> say wear it · ${total} votes`;
        pollEl.querySelector(".poll-options").hidden = true;
        pollEl.querySelector(".poll-result").hidden = false;
        if (post.author === currentUser.name) {
          const liveBar = document.querySelector("#live-bar");
          const liveStat = document.querySelector("#live-stat");
          const liveFoot = document.querySelector("#live-foot");
          if (liveBar) liveBar.style.width = `${yesShare}%`;
          if (liveStat) liveStat.innerHTML = `<strong>${yesShare}%</strong> say wear it`;
          if (liveFoot) liveFoot.textContent = `${total} votes · ${post.commentsList ? post.commentsList.length : post.comments} comments`;
        }
      };
    });
  });

  // 3D Model viewer camera views & spin
  const avatar = document.querySelector("#avatar");
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.onclick = () => {
      avatar.cameraOrbit = CAMERA_VIEWS[button.dataset.view];
      document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
    };
  });

  const spin = document.querySelector("#spin");
  if (spin) {
    spin.onclick = () => {
      const on = !avatar.hasAttribute("auto-rotate");
      avatar.toggleAttribute("auto-rotate", on);
      spin.setAttribute("aria-pressed", on);
      spin.classList.toggle("active", on);
    };
  }

  // 3D Rebuild avatar
  connectRebuild(avatar);

  // New Fit Modal & Form
  connectNewFit();

  // Comments Dialog
  connectComments();

  // Share buttons
  document.querySelectorAll(".share-trigger").forEach((btn) => {
    btn.onclick = () => {
      const postId = btn.dataset.sharePost;
      const url = `${window.location.origin}/#post-${postId}`;
      navigator.clipboard.writeText(url);
      showToast("Fit link copied to clipboard!");
    };
  });
}

function connectNewFit() {
  const dlg = document.querySelector("#new-fit-dialog");
  const openButtons = [document.querySelector("#open-new-fit"), document.querySelector("#card-open-new-fit")];
  openButtons.forEach((btn) => {
    if (btn) btn.onclick = () => dlg.showModal();
  });
  dlg.querySelectorAll("[data-close-new-fit]").forEach((btn) => (btn.onclick = () => dlg.close()));
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };

  const piecesList = document.querySelector("#pieces-inputs-list");
  document.querySelector("#add-piece-row").onclick = () => {
    const row = document.createElement("div");
    row.className = "piece-input-row";
    row.innerHTML = `
      <input type="color" class="piece-color-input" value="#${Math.floor(Math.random()*16777215).toString(16)}" title="Swatch color" />
      <input type="text" class="piece-name-input" required placeholder="Piece name" />
    `;
    piecesList.appendChild(row);
  };

  const form = document.querySelector("#new-fit-form");
  form.onsubmit = (e) => {
    e.preventDefault();
    const title = document.querySelector("#fit-title").value.trim();
    const caption = document.querySelector("#fit-caption").value.trim();
    const audience = document.querySelector("#fit-audience").value;

    const pieceRows = piecesList.querySelectorAll(".piece-input-row");
    const pieces = [];
    pieceRows.forEach((row) => {
      const name = row.querySelector(".piece-name-input").value.trim();
      const color = row.querySelector(".piece-color-input").value;
      if (name) pieces.push({ name, color });
    });

    const newPost = {
      id: `fit-${Date.now()}`,
      author: currentUser.name,
      initial: currentUser.initial,
      audience,
      time: "now",
      title,
      caption,
      pieces: pieces.length > 0 ? pieces : [{ name: "Core Look", color: "#111111" }],
      votes: { yes: 1, no: 0 },
      likes: 1,
      comments: 0,
      commentsList: []
    };

    posts.unshift(newPost);
    history.unshift({ name: title, status: "Live", date: "Today" });

    dlg.close();
    form.reset();
    showToast("New fit published to your circle!");
    render();
  };
}

function connectComments() {
  const dlg = document.querySelector("#comments-dialog");
  dlg.querySelectorAll("[data-close-comments]").forEach((btn) => (btn.onclick = () => dlg.close()));
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };

  document.querySelectorAll(".comment-trigger").forEach((btn) => {
    btn.onclick = () => {
      const postId = btn.dataset.commentPost;
      activePostForComments = posts.find((p) => p.id === postId);
      if (!activePostForComments) return;
      openCommentsForPost(activePostForComments);
      dlg.showModal();
    };
  });

  const form = document.querySelector("#comment-add-form");
  form.onsubmit = (e) => {
    e.preventDefault();
    const input = document.querySelector("#comment-input");
    const text = input.value.trim();
    if (!text || !activePostForComments) return;

    if (!activePostForComments.commentsList) activePostForComments.commentsList = [];
    activePostForComments.commentsList.push({
      id: `c-${Date.now()}`,
      author: currentUser.name,
      initial: currentUser.initial,
      time: "just now",
      text
    });
    activePostForComments.comments = activePostForComments.commentsList.length;

    input.value = "";
    openCommentsForPost(activePostForComments);
    updatePostCommentUI(activePostForComments);
    showToast("Comment posted!");
  };

  document.querySelectorAll(".inline-comment-form").forEach((inlineForm) => {
    inlineForm.onsubmit = (e) => {
      e.preventDefault();
      const postId = inlineForm.dataset.inlinePost;
      const input = inlineForm.querySelector("input");
      const text = input.value.trim();
      const post = posts.find((p) => p.id === postId);
      if (!text || !post) return;

      if (!post.commentsList) post.commentsList = [];
      post.commentsList.push({
        id: `c-${Date.now()}`,
        author: currentUser.name,
        initial: currentUser.initial,
        time: "just now",
        text
      });
      post.comments = post.commentsList.length;
      input.value = "";

      updatePostCommentUI(post);
      showToast("Comment added to discussion!");
    };
  });
}

function updatePostCommentUI(post) {
  const postEl = document.querySelector(`#post-${post.id}`);
  if (!postEl) return;

  const countEl = postEl.querySelector(".comment-trigger span");
  if (countEl) countEl.textContent = post.comments;

  const headH4 = postEl.querySelector(".discussion-head h4");
  if (headH4) headH4.textContent = `Friend Discussion (${post.comments})`;

  const listEl = postEl.querySelector(`#inline-comments-${post.id}`);
  if (listEl && post.commentsList) {
    listEl.innerHTML = post.commentsList.slice(-3).map((c) => `
      <div class="comment-inline-row">
        <span class="avatar-chip micro">${c.initial}</span>
        <p><strong>${c.author}</strong> <span>${c.text}</span> <small>${c.time}</small></p>
      </div>
    `).join("");
  }
}

function openCommentsForPost(post) {
  document.querySelector("#comments-heading").textContent = `Comments on "${post.title}"`;
  document.querySelector("#comments-subheading").textContent = `Posted by ${post.author} · ${post.audience}`;
  const container = document.querySelector("#comments-list-container");
  const list = post.commentsList || [];

  if (list.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--muted); padding:20px 0;">No comments yet. Be the first friend to weigh in!</p>`;
    return;
  }

  container.innerHTML = list
    .map(
      (c) => `
      <div class="comment-item">
        <span class="avatar-chip" style="width:30px; height:30px; font-size:0.75rem;">${c.initial}</span>
        <div class="comment-content">
          <div class="comment-header">
            <strong>${c.author}</strong>
            <small>${c.time}</small>
          </div>
          <p class="comment-text">${c.text}</p>
        </div>
      </div>`
    )
    .join("");
  container.scrollTop = container.scrollHeight;
}

function connectRebuild(avatar) {
  const dialog = document.querySelector("#rebuild-dialog");
  const input = document.querySelector("#photo-input");
  const preview = document.querySelector("#photo-preview");
  const dropzone = document.querySelector("#dropzone");
  const start = document.querySelector("#start-rebuild");
  let photo = null;
  let running = false;

  const showStage = (stage) => {
    dialog.querySelectorAll("[data-stage]").forEach((el) => (el.hidden = el.dataset.stage !== stage));
  };

  const choosePhoto = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    photo = file;
    if (preview.src) URL.revokeObjectURL(preview.src);
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    document.querySelector("#dropzone-empty").hidden = true;
    start.disabled = false;
  };

  document.querySelector("#open-rebuild").onclick = () => {
    if (!running) showStage("pick");
    dialog.showModal();
  };
  dialog.querySelectorAll("[data-close]").forEach((button) => (button.onclick = () => dialog.close()));
  dialog.onclick = (event) => {
    if (event.target === dialog) dialog.close();
  };

  input.onchange = () => choosePhoto(input.files[0]);
  dropzone.ondragover = (event) => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  };
  dropzone.ondragleave = () => dropzone.classList.remove("dragging");
  dropzone.ondrop = (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
    choosePhoto(event.dataTransfer.files[0]);
  };

  start.onclick = async () => {
    running = true;
    showStage("run");
    const items = [...dialog.querySelectorAll("[data-step]")];
    items.forEach((item) => (item.className = ""));

    const { modelUrl } = await rebuildAvatar(photo, (stepId) => {
      const index = items.findIndex((item) => item.dataset.step === stepId);
      items.forEach((item, i) => (item.className = i < index ? "done" : i === index ? "active" : ""));
    });

    items.forEach((item) => (item.className = "done"));
    avatar.src = `${modelUrl}?v=${Date.now()}`;
    document.querySelector("#avatar-status").textContent = "Rebuilt · just now";
    running = false;
    showStage("done");
  };
}

render();
