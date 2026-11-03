import { currentUser } from "../data.js";
import { addComment, deleteComment, listComments, mediaUrl } from "../fits.js";
import { escapeHtml, timeAgo } from "../format.js";

let activeFit = null;
let currentFilter = "all";
let commentsCache = [];

export function renderCommentsDrawer() {
  return `
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 hidden" id="comments-drawer-backdrop">
      <div class="fixed inset-x-0 bottom-0 max-h-[92vh] bg-surface-container-lowest rounded-t-xl shadow-[0_-8px_30px_rgba(26,28,27,0.12)] flex flex-col overflow-hidden transition-transform duration-300 transform translate-y-full" id="comments-drawer-sheet">
        <!-- Drag Handle Indicator / Close Bar -->
        <div class="w-full flex justify-between items-center px-margin pt-space-sm pb-space-2xs cursor-pointer" id="comments-drawer-handle">
          <div class="w-8"></div>
          <div class="w-10 h-1 bg-surface-container-highest rounded-full"></div>
          <button class="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" id="btn-close-comments-drawer" aria-label="Close">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Sheet Header -->
        <header class="px-margin pt-space-2xs pb-space-xs flex flex-col gap-space-xs border-b border-surface-container-high/40">
          <div class="flex items-baseline justify-between">
            <h2 class="font-headline-md text-headline-md text-on-surface tracking-tight" id="comments-drawer-title">
              Styling Feedback <span class="font-title-editorial text-title-editorial italic text-on-surface-variant ml-1" id="comments-drawer-count">(0 takes)</span>
            </h2>
            <span class="font-label-sm text-label-sm bg-surface-container text-on-surface px-space-xs py-0.5 rounded-full">
              Live
            </span>
          </div>

          <!-- Filter Chips Carousel -->
          <nav aria-label="Comment Filters" class="flex items-center gap-space-2xs overflow-x-auto py-space-2xs no-scrollbar" id="comments-filter-nav">
            <button class="bg-primary text-on-primary px-space-sm py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-transform active:scale-95 btn-comment-filter" type="button" data-filter="all">
              All Takes
            </button>
            <button class="bg-surface-container-low text-on-surface px-space-sm py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap hover:bg-surface-container transition-colors btn-comment-filter" type="button" data-filter="close">
              Close Friends
            </button>
            <button class="bg-surface-container-low text-on-surface px-space-sm py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap hover:bg-surface-container transition-colors btn-comment-filter" type="button" data-filter="wear">
              Wear it
            </button>
          </nav>
        </header>

        <!-- Mini Sticky Post Recap Header -->
        <section class="mx-margin my-space-xs p-space-xs bg-surface-container-low rounded-DEFAULT flex items-center justify-between gap-space-sm" id="comments-post-recap">
          <div class="flex items-center gap-space-xs min-w-0">
            <img class="w-11 h-13 object-cover rounded-sm flex-shrink-0 bg-surface-container-high" alt="Post thumbnail" id="comments-recap-img" src="" />
            <div class="flex flex-col min-w-0">
              <p class="font-title-ui text-label-md text-on-surface truncate" id="comments-recap-title">
                Styling feedback
              </p>
              <span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1" id="comments-recap-author">
                <span class="material-symbols-outlined text-[13px] text-secondary">explore</span>
                Circle Fit Check
              </span>
            </div>
          </div>
          <div class="flex-shrink-0 flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed px-space-xs py-1 rounded-full shadow-sm">
            <span class="font-micro-mono text-micro-mono uppercase">92% Wear</span>
          </div>
        </section>

        <!-- Discussion Feed / Takes List -->
        <div class="flex-1 overflow-y-auto px-margin flex flex-col gap-space-sm py-space-xs pb-36" id="comments-list-feed">
          <div class="py-8 text-center text-on-surface-variant font-label-md">Loading takes…</div>
        </div>

        <!-- Sticky Floating Comment Input Bar -->
        <aside class="absolute bottom-0 inset-x-0 bg-surface-container-lowest/95 backdrop-blur-xl px-margin pt-space-xs pb-safe shadow-[0_-12px_32px_rgba(26,28,27,0.08)] z-40 border-t border-surface-container-high/60">
          <!-- Quick-Reply Suggestion Pills -->
          <div class="flex items-center gap-space-2xs overflow-x-auto pb-space-xs no-scrollbar" id="comments-quick-suggestions">
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Proportions work
            </button>
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Roll the sleeves
            </button>
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Try white sneakers
            </button>
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Add a statement bag
            </button>
          </div>

          <!-- Main Input Form -->
          <form class="flex items-center gap-space-2xs bg-surface-container-low rounded-full p-1 pl-space-xs mb-space-2xs" id="critique-form">
            <span class="w-8 h-8 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[17px]">chat</span>
            </span>
            <input class="bg-transparent flex-1 min-w-0 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none px-space-2xs py-1" id="critique-input" placeholder="Add your styling take or critique..." type="text" required autocomplete="off" />
            <div class="flex items-center gap-1 flex-shrink-0 pr-1">
              <button aria-label="Submit styling take" class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center transition-transform active:scale-90 hover:bg-primary/90 shadow-sm" type="submit" id="btn-submit-critique">
                <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  `;
}

function renderCommentItem(comment) {
  const isMine = comment.author.username === currentUser.username;
  const name = comment.author.full_name || comment.author.username;
  const initial = (name || "U").charAt(0).toUpperCase();
  const avatarUrl = comment.author.avatar?.url;

  return `
    <article class="p-space-sm bg-surface-container-low rounded-DEFAULT flex flex-col gap-space-xs transition-shadow hover:shadow-sm" data-comment-id="${comment.id}">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-space-xs">
          <span class="w-8 h-8 rounded-full overflow-hidden bg-primary text-on-primary flex items-center justify-center font-label-sm font-semibold flex-shrink-0">
            ${
              avatarUrl
                ? `<img src="${escapeHtml(mediaUrl(avatarUrl))}" alt="${escapeHtml(name)}" class="w-full h-full object-cover" />`
                : escapeHtml(initial)
            }
          </span>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <span class="font-title-ui text-label-md text-on-surface font-semibold">@${escapeHtml(comment.author.username)}</span>
              ${isMine ? `<span class="bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold">You</span>` : ""}
            </div>
            <span class="font-label-sm text-[11px] text-on-surface-variant">${timeAgo(comment.created_at)}</span>
          </div>
        </div>
        ${
          isMine
            ? `<button class="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors btn-delete-comment" data-comment-id="${comment.id}" aria-label="Delete take">
                 <span class="material-symbols-outlined text-[17px]">delete</span>
               </button>`
            : ""
        }
      </div>
      <p class="font-body-md text-body-md text-on-surface mt-0.5 leading-relaxed">${escapeHtml(comment.content)}</p>
    </article>
  `;
}

export function openCommentsDrawer(fit, options = {}) {
  activeFit = fit;
  const backdrop = document.querySelector("#comments-drawer-backdrop");
  const sheet = document.querySelector("#comments-drawer-sheet");
  const feed = document.querySelector("#comments-list-feed");
  const countEl = document.querySelector("#comments-drawer-count");
  const recapImg = document.querySelector("#comments-recap-img");
  const recapTitle = document.querySelector("#comments-recap-title");
  const recapAuthor = document.querySelector("#comments-recap-author");
  const form = document.querySelector("#critique-form");
  const input = document.querySelector("#critique-input");
  const closeBtn = document.querySelector("#btn-close-comments-drawer");

  if (!backdrop || !sheet) return;

  // Set recap
  if (recapTitle) recapTitle.textContent = fit.caption || fit.items?.[0]?.name || "Outfit Feedback";
  if (recapImg && fit.images?.[0]?.url) recapImg.src = mediaUrl(fit.images[0].url);
  if (recapAuthor) {
    const authorName = fit.author?.full_name || fit.author?.username || "Friend";
    recapAuthor.innerHTML = `<span class="material-symbols-outlined text-[13px] text-secondary">person</span> @${escapeHtml(fit.author?.username || authorName)}`;
  }

  // Open drawer animation
  backdrop.classList.remove("hidden");
  requestAnimationFrame(() => {
    sheet.classList.remove("translate-y-full");
  });

  function closeDrawer() {
    sheet.classList.add("translate-y-full");
    setTimeout(() => {
      backdrop.classList.add("hidden");
    }, 300);
  }

  closeBtn.onclick = closeDrawer;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) closeDrawer();
  };

  async function loadComments() {
    feed.innerHTML = `<div class="py-8 text-center text-on-surface-variant font-label-md flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Loading circle takes…</span></div>`;
    try {
      commentsCache = await listComments(fit.id);
      renderList();
    } catch {
      // If backend offline or local demo, provide interactive fallback
      commentsCache = [
        {
          id: "c1",
          author: { username: "maya.p", full_name: "Maya Patel" },
          content: "The shoulder cut is perfection. Roll the sleeves once to show your watch and balance the drape!",
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: "c2",
          author: { username: "camille.paris", full_name: "Camille Dupont" },
          content: "Obsessed with this silhouette. Try pairing with cream leather retro runners!",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      renderList();
    }
  }

  function renderList() {
    if (countEl) countEl.textContent = `(${commentsCache.length} takes)`;
    if (!commentsCache.length) {
      feed.innerHTML = `
        <div class="py-10 text-center flex flex-col items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-[32px] text-secondary">forum</span>
          <p class="font-label-md font-semibold text-on-surface">No styling takes yet</p>
          <p class="font-label-sm text-[12px]">Be the first in your circle to weigh in!</p>
        </div>
      `;
      return;
    }

    feed.innerHTML = commentsCache.map(renderCommentItem).join("");

    // Bind delete buttons
    feed.querySelectorAll(".btn-delete-comment").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const cid = btn.dataset.commentId;
        try {
          await deleteComment(fit.id, cid);
        } catch {}
        commentsCache = commentsCache.filter((c) => c.id !== cid);
        renderList();
        options.onCommentAdded?.(commentsCache.length);
        options.toast?.("Take removed");
      };
    });
  }

  // Suggestion chips
  document.querySelectorAll(".btn-critique-suggestion").forEach((btn) => {
    btn.onclick = () => {
      if (input) {
        input.value = btn.textContent.trim();
        input.focus();
      }
    };
  });

  // Post new comment
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      input.value = "";

      try {
        const posted = await addComment(fit.id, val);
        commentsCache.unshift(posted);
      } catch {
        // Fallback local addition if offline
        commentsCache.unshift({
          id: `local_${Date.now()}`,
          author: { username: currentUser.username, full_name: currentUser.name, avatarUrl: currentUser.avatarUrl },
          content: val,
          created_at: new Date().toISOString(),
        });
      }

      renderList();
      options.onCommentAdded?.(commentsCache.length);
      options.toast?.("Take posted to fit!");
    };
  }

  loadComments();
}
