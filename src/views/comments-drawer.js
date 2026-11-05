// Styling feedback ("takes") on a fit. Phones: a bottom sheet. 768px and up: a contained dialog.
// Styles: .comments-* in src/connected.css.

import { currentUser } from "../data.js";
import { addComment, deleteComment, getFollowing, listComments, mediaUrl } from "../fits.js";
import { escapeHtml, initialOf, timeAgo } from "../format.js";

// Quick replies above the input; tapping one fills the box so it can be edited before posting.
const SUGGESTIONS = ["Proportions work", "Roll the sleeves", "Try white sneakers", "Add a statement bag"];

// "wear" needs each commenter's vote, which comments don't carry yet: the chip is shown but
// lists every take, with a note saying so.
const FILTERS = [
  { id: "all", label: "All Takes" },
  { id: "following", label: "Following" },
  { id: "wear", label: "Wear it" },
];

export function renderCommentsDrawer() {
  return `
    <div class="comments-backdrop hidden" id="comments-drawer-backdrop">
      <div class="comments-dialog" id="comments-drawer-sheet" role="dialog" aria-modal="true" aria-labelledby="comments-drawer-title">
        <div class="comments-handle" aria-hidden="true"></div>

        <header class="comments-header">
          <div class="flex items-center justify-between gap-space-sm">
            <h2 class="font-headline-md text-headline-md text-on-surface tracking-tight" id="comments-drawer-title">
              Styling Feedback <span class="font-title-editorial text-title-editorial italic text-on-surface-variant ml-1" id="comments-drawer-count"></span>
            </h2>
            <button type="button" class="comments-close" id="btn-close-comments-drawer" aria-label="Close">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <nav class="comments-filters" aria-label="Filter takes" id="comments-filter-nav">
            ${FILTERS.map(
              (f, i) => `<button type="button" class="comments-filter" data-comment-filter="${f.id}" aria-pressed="${i === 0}">${f.label}</button>`
            ).join("")}
          </nav>
        </header>

        <section class="comments-recap" id="comments-post-recap"></section>

        <div class="comments-list" id="comments-list-feed"></div>

        <footer class="comments-footer">
          <div class="comments-suggestions">
            ${SUGGESTIONS.map((s) => `<button type="button" class="comments-suggestion" data-suggestion>${s}</button>`).join("")}
          </div>
          <form class="comments-form" id="critique-form">
            <span class="comments-form-icon"><span class="material-symbols-outlined text-[17px]">chat</span></span>
            <input id="critique-input" type="text" placeholder="Add your styling take…" autocomplete="off" maxlength="2000" aria-label="Add your styling take" />
            <button type="submit" class="comments-send" id="btn-submit-critique" aria-label="Post take" disabled>
              <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </form>
        </footer>
      </div>
    </div>
  `;
}

function avatar(user, size = "w-8 h-8") {
  const url = user.avatar?.url;
  return `<span class="${size} rounded-full overflow-hidden bg-primary text-on-primary flex items-center justify-center font-label-sm font-semibold flex-shrink-0">${
    url ? `<img src="${escapeHtml(mediaUrl(url))}" alt="" class="w-full h-full object-cover" />` : escapeHtml(initialOf(user))
  }</span>`;
}

function renderTake(comment) {
  const mine = comment.author.username === currentUser.username;
  return `
    <article class="comments-take" data-comment-id="${comment.id}">
      <div class="flex items-center justify-between gap-space-xs">
        <div class="flex items-center gap-space-xs min-w-0">
          ${avatar(comment.author)}
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="font-title-ui text-label-md text-on-surface font-semibold truncate">@${escapeHtml(comment.author.username)}</span>
              ${mine ? `<span class="comments-you">You</span>` : ""}
            </div>
            <span class="font-label-sm text-[11px] text-on-surface-variant">${timeAgo(comment.created_at)}</span>
          </div>
        </div>
        ${
          mine
            ? `<button type="button" class="comments-delete" data-delete-comment="${comment.id}" aria-label="Delete take">
                 <span class="material-symbols-outlined text-[17px]">delete</span>
               </button>`
            : ""
        }
      </div>
      <p class="comments-text">${escapeHtml(comment.content)}</p>
    </article>`;
}

// The post being discussed: thumbnail, caption, author, and the real wear-it share.
function renderRecap(fit) {
  const image = fit.images?.[0];
  const votes = fit.votes || { wear: 0, rethink: 0 };
  const total = votes.wear + votes.rethink;
  const verdict = total ? `${Math.round((votes.wear / total) * 100)}% Wear` : "No votes yet";
  return `
    <div class="flex items-center gap-space-xs min-w-0">
      ${image ? `<img class="comments-recap-img" alt="" src="${escapeHtml(mediaUrl(image.url))}" />` : ""}
      <div class="flex flex-col min-w-0">
        <p class="font-title-ui text-label-md text-on-surface truncate">${escapeHtml(fit.caption?.split("\n")[0] || "Styling feedback")}</p>
        <span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[13px] text-secondary">person</span>@${escapeHtml(fit.author.username)}
        </span>
      </div>
    </div>
    <span class="comments-verdict ${total ? "" : "muted"}">${verdict}</span>`;
}

// Everyone you follow (the API pages at most 50 at a time).
async function followedUsernames() {
  const names = new Set();
  let cursor = null;
  do {
    const page = await getFollowing(currentUser.username, { cursor, limit: 50 });
    page.items.forEach((user) => names.add(user.username));
    cursor = page.next_cursor;
  } while (cursor);
  return names;
}

let close = () => {};

export function openCommentsDrawer(fit, options = {}) {
  const backdrop = document.querySelector("#comments-drawer-backdrop");
  if (!backdrop) return;
  const list = document.querySelector("#comments-list-feed");
  const count = document.querySelector("#comments-drawer-count");
  const form = document.querySelector("#critique-form");
  const input = document.querySelector("#critique-input");
  const send = document.querySelector("#btn-submit-critique");
  const filterButtons = document.querySelectorAll("[data-comment-filter]");
  let comments = [];
  let filter = "all";
  let following = null; // usernames you follow, loaded the first time "Following" is picked

  document.querySelector("#comments-post-recap").innerHTML = renderRecap(fit);
  input.value = "";
  send.disabled = true;
  filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.commentFilter === "all")));

  // Open: fade the backdrop in and lift the dialog. The page behind stops scrolling.
  backdrop.classList.remove("hidden");
  document.documentElement.classList.add("comments-open");
  void backdrop.offsetHeight; // apply the closed position first, so adding .open animates
  backdrop.classList.add("open");
  if (window.matchMedia("(min-width: 768px)").matches) input.focus({ preventScroll: true });

  close = () => {
    backdrop.classList.remove("open");
    document.documentElement.classList.remove("comments-open");
    document.removeEventListener("keydown", onKey);
    setTimeout(() => {
      if (!backdrop.classList.contains("open")) backdrop.classList.add("hidden");
    }, 200);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);
  backdrop.onclick = (e) => {
    if (e.target === backdrop || e.target.closest("#btn-close-comments-drawer")) close();
  };

  const message = (title, text = "") => `
    <div class="comments-empty">
      <span class="material-symbols-outlined text-[30px] text-secondary">forum</span>
      <p class="font-label-md font-semibold text-on-surface">${title}</p>
      ${text ? `<p>${text}</p>` : ""}
    </div>`;

  function renderList() {
    count.textContent = `(${comments.length} ${comments.length === 1 ? "take" : "takes"})`;
    let shown = comments;
    let note = "";
    if (filter === "following") {
      shown = comments.filter((c) => following.has(c.author.username) || c.author.username === currentUser.username);
    } else if (filter === "wear") {
      note = `<p class="comments-note">Sorting takes by vote is coming soon. Showing every take for now.</p>`;
    }
    if (!comments.length) {
      list.innerHTML = message("No styling takes yet", "Be the first in your circle to weigh in!");
    } else if (!shown.length) {
      list.innerHTML = message("No takes from people you follow", "Switch to All Takes to see everyone's.");
    } else {
      list.innerHTML = note + shown.map(renderTake).join("");
    }
  }

  async function load() {
    list.innerHTML = `<div class="comments-empty"><span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span></div>`;
    try {
      comments = await listComments(fit.id);
      renderList();
    } catch {
      count.textContent = "";
      list.innerHTML = `
        <div class="comments-empty">
          <p>Couldn't load the takes.</p>
          <button type="button" class="comments-retry">Try again</button>
        </div>`;
      list.querySelector(".comments-retry").onclick = load;
    }
  }

  filterButtons.forEach((button) => {
    button.onclick = async () => {
      const next = button.dataset.commentFilter;
      if (next === "following" && !following) {
        try {
          following = await followedUsernames();
        } catch {
          options.toast?.("Couldn't load who you follow. Try again.");
          return;
        }
      }
      filter = next;
      filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      renderList();
    };
  });

  list.onclick = async (e) => {
    const button = e.target.closest("[data-delete-comment]");
    if (!button) return;
    button.disabled = true;
    try {
      await deleteComment(fit.id, button.dataset.deleteComment);
      comments = comments.filter((c) => c.id !== button.dataset.deleteComment);
      renderList();
      options.onCommentAdded?.(comments.length);
      options.toast?.("Take removed");
    } catch {
      button.disabled = false;
      options.toast?.("Couldn't delete that take. Try again.");
    }
  };

  document.querySelectorAll("[data-suggestion]").forEach((chip) => {
    chip.onclick = () => {
      input.value = chip.textContent;
      send.disabled = false;
      input.focus();
    };
  });
  input.oninput = () => {
    send.disabled = !input.value.trim();
  };

  // Takes come oldest first, so a new one goes at the bottom.
  form.onsubmit = async (e) => {
    e.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    send.disabled = true;
    input.disabled = true;
    try {
      comments.push(await addComment(fit.id, content));
      input.value = "";
      renderList();
      list.scrollTop = list.scrollHeight;
      options.onCommentAdded?.(comments.length);
    } catch {
      send.disabled = false;
      options.toast?.("Couldn't post your take. Try again.");
    } finally {
      input.disabled = false;
      input.focus();
    }
  };

  load();
}
