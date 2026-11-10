// A paginated list of fits (feed or profile) with likes, saves, and deleting your own fits.

import { confirmDialog } from "./confirm-dialog.js";
import { currentUser } from "./data.js";
import { deleteFit, listFits, setLiked, setSaved, setVote } from "./fits.js";
import { bindShopScroll, renderFitCard } from "./views/fit-card.js";
import { ofIcons, stateBlock } from "./views/components.js";

const errorState = stateBlock({
  icon: ofIcons.cloudOff(),
  title: "Couldn't load fits",
  body: "Check your connection and try again.",
  cta: { label: "Try again", data: { "data-fit-retry": true } },
});

const spinner = `<span class="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>`;

/**
 * @param {object} options
 * @param {HTMLElement} options.list - where cards go
 * @param {HTMLElement} options.status - loading / empty / error messages
 * @param {HTMLElement} options.sentinel - loads the next page when it scrolls into view
 * @param {string} options.path - "/fits", or "/users/<name>/fits"
 * @param {string} options.empty - HTML shown when there are no fits
 * @param {(message: string) => void} options.toast
 * @param {() => void} [options.onChange] - a fit was added or removed
 * @param {(fit: object, onUpdated: (n: number) => void) => void} [options.onOpenComments]
 * @param {(fit: object) => void} [options.onOpenTryOn]
 * @param {(fit: object, options: { onSaved: (fit: object) => void, item?: number }) => void} [options.onEdit]
 * @param {(fit: object) => boolean} [options.filter] - only fits that pass are shown
 * @param {(fits: object[]) => void} [options.onFirstPage] - the fits shown from the first page
 */
export function mountFitList({
  list,
  status,
  sentinel,
  path,
  empty,
  toast,
  onChange = () => {},
  onOpenComments,
  onOpenTryOn,
  onEdit,
  filter = () => true,
  onFirstPage = () => {},
}) {
  const fits = new Map();
  let cursor = null;
  let done = false;
  let loading = false;
  let generation = 0;

  const isMine = (fit) => fit.author.username === currentUser.username;

  function card(fit) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderFitCard(fit, { mine: isMine(fit) }).trim();
    bindShopScroll(wrapper.firstElementChild);
    return wrapper.firstElementChild;
  }

  async function loadMore() {
    if (loading || done) return;
    loading = true;
    const current = generation;
    status.innerHTML = spinner;
    try {
      const page = await listFits(path, cursor);
      if (current !== generation) return;
      const first = cursor === null;
      page.items.forEach((fit) => {
        if (fits.has(fit.id) || !filter(fit)) return;
        fits.set(fit.id, fit);
        list.append(card(fit));
      });
      if (first) onFirstPage([...fits.values()]);
      cursor = page.next_cursor;
      done = !cursor;
      status.innerHTML = fits.size === 0 ? empty : "";
    } catch (err) {
      if (current !== generation) return;
      console.error(err);
      status.innerHTML = errorState;
    } finally {
      if (current === generation) loading = false;
    }
  }

  function reload() {
    generation++;
    fits.clear();
    cursor = null;
    done = false;
    loading = false;
    list.innerHTML = "";
    loadMore();
  }

  function prepend(fit) {
    fits.set(fit.id, fit);
    list.prepend(card(fit));
    status.innerHTML = "";
  }

  function replaceCard(fit) {
    fits.set(fit.id, fit);
    list.querySelector(`[data-fit-id="${fit.id}"]`)?.replaceWith(card(fit));
  }

  // Likes and saves update immediately, and roll back if the request fails.
  async function toggle(fit, key, request) {
    const before = { ...fit };
    const on = !fit[key];
    const next = { ...fit, [key]: on };
    if (key === "liked_by_me") next.like_count = fit.like_count + (on ? 1 : -1);
    replaceCard(next);
    try {
      await request(fit.id, on);
    } catch (err) {
      console.error(err);
      replaceCard(before);
      toast("Couldn't update. Check your connection.");
    }
  }

  // Moving the bar before the request lands, so voting feels instant.
  function withVote(fit, choice) {
    const votes = { wear: 0, rethink: 0, ...(fit.votes || {}) };
    if (fit.my_vote) votes[fit.my_vote] = Math.max(0, votes[fit.my_vote] - 1);
    if (choice) votes[choice] += 1;
    return { ...fit, votes, my_vote: choice };
  }

  // Tapping the option you already picked clears your vote.
  async function vote(fit, picked) {
    const choice = picked && picked !== fit.my_vote ? picked : null;
    const before = { ...fit };
    replaceCard(withVote(fit, choice));
    try {
      // The response carries everyone's tallies, not just ours, so it also picks up
      // votes cast since this card was rendered.
      replaceCard(await setVote(fit.id, choice));
    } catch (err) {
      console.error(err);
      replaceCard(before);
      toast("Couldn't save your vote. Check your connection.");
    }
  }

  async function remove(fit) {
    try {
      const deleted = await confirmDialog({
        title: "Delete this fit?",
        message: "Its photos will be deleted too. This can't be undone.",
        confirmLabel: "Delete",
        busyLabel: "Deleting…",
        danger: true,
        onConfirm: () => deleteFit(fit.id),
      });
      if (!deleted) return;
      fits.delete(fit.id);
      list.querySelector(`[data-fit-id="${fit.id}"]`)?.remove();
      if (!fits.size) status.innerHTML = empty;
      toast("Fit deleted");
      onChange();
    } catch (err) {
      console.error(err);
      toast("Couldn't delete the fit");
    }
  }

  status.addEventListener("click", (event) => {
    if (event.target.closest("[data-fit-retry]")) reload();
  });

  list.addEventListener("click", (event) => {
    const article = event.target.closest("[data-fit-id]");
    const fit = article && fits.get(article.dataset.fitId);
    if (!fit) return;
    const voteButton = event.target.closest("[data-fit-vote]");
    if (voteButton) vote(fit, voteButton.dataset.fitVote || null);
    else if (event.target.closest("[data-fit-like]")) toggle(fit, "liked_by_me", setLiked);
    else if (event.target.closest("[data-fit-save]")) toggle(fit, "saved_by_me", setSaved);
    else if (event.target.closest("[data-fit-delete]")) remove(fit);
    else if (event.target.closest("[data-fit-edit]")) onEdit?.(fit, { onSaved: replaceCard });
    else if (event.target.closest("[data-fit-add-link]")) {
      const item = Number(event.target.closest("[data-fit-add-link]").dataset.fitAddLink);
      onEdit?.(fit, { onSaved: replaceCard, item });
    }
    else if (event.target.closest("[data-fit-comments]")) {
      onOpenComments?.(fit, (newCount) => {
        fit.comment_count = newCount;
        const counter = article.querySelector("[data-comment-count]");
        if (counter) counter.textContent = newCount;
      });
    } else if (event.target.closest("[data-ai-mode]")) {
      onOpenTryOn?.(fit);
    } else if (event.target.closest("[data-slide-step]")) {
      const button = event.target.closest("[data-slide-step]");
      const slides = button.parentElement.querySelector("[data-slides]");
      slides.scrollBy({ left: Number(button.dataset.slideStep) * slides.clientWidth, behavior: "smooth" });
    }
  });

  // Double-tap on post slide triggers the Instagram/Wearly heart burst animation and likes the fit
  let lastTapTime = 0;
  let lastTapSlide = null;

  list.addEventListener("pointerdown", (event) => {
    // Avoid interfering with interactive controls/buttons
    if (event.target.closest("button, a, input, [data-fit-like], [data-fit-save], [data-fit-comments]")) return;

    const slide = event.target.closest(".fit-slide");
    if (!slide) return;

    const now = Date.now();
    const isDoubleTap = now - lastTapTime < 350 && lastTapSlide === slide;
    lastTapTime = now;
    lastTapSlide = slide;

    if (isDoubleTap) {
      const rect = slide.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const burst = document.createElement("div");
      burst.className = "double-tap-heart-burst";
      burst.style.left = `${x}px`;
      burst.style.top = `${y}px`;
      burst.innerHTML = `<span class="material-symbols-outlined">favorite</span>`;
      slide.appendChild(burst);
      setTimeout(() => burst.remove(), 900);

      const article = slide.closest("[data-fit-id]");
      const fit = article && fits.get(article.dataset.fitId);
      if (fit && !fit.liked_by_me) {
        toggle(fit, "liked_by_me", setLiked);
      }
    }
  });

  // Carousel dots, counter, and arrows follow the photo that's in view.
  list.addEventListener(
    "scroll",
    (event) => {
      const slides = event.target.closest?.("[data-slides]");
      if (!slides) return;
      const count = slides.children.length;
      const index = Math.round(slides.scrollLeft / slides.clientWidth);
      const carousel = slides.parentElement;
      carousel.parentElement.querySelectorAll(".fit-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
      const counter = carousel.querySelector("[data-slide-count]");
      if (counter) counter.textContent = `${index + 1}/${count}`;
      carousel.querySelectorAll("[data-slide-step]").forEach((button) => {
        const step = Number(button.dataset.slideStep);
        button.hidden = step < 0 ? index === 0 : index === count - 1;
      });
    },
    true
  );

  new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadMore(), {
    rootMargin: "600px",
  }).observe(sentinel);

  reload();
  return { reload, prepend };
}
