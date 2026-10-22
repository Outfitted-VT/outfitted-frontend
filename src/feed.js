// A paginated list of fits (feed or profile) with likes, saves, and deleting your own fits.

import { currentUser } from "./data.js";
import { deleteFit, listFits, setLiked, setSaved } from "./fits.js";
import { renderFitCard } from "./views/fit-card.js";

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
 */
export function mountFitList({ list, status, sentinel, path, empty, toast, onChange = () => {} }) {
  const fits = new Map();
  let cursor = null;
  let done = false;
  let loading = false;
  let generation = 0;

  const isMine = (fit) => fit.author.username === currentUser.username;

  function card(fit) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderFitCard(fit, { mine: isMine(fit) }).trim();
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
      page.items.forEach((fit) => {
        if (fits.has(fit.id)) return;
        fits.set(fit.id, fit);
        list.append(card(fit));
      });
      cursor = page.next_cursor;
      done = !cursor;
      status.innerHTML = fits.size === 0 ? empty : "";
    } catch (err) {
      if (current !== generation) return;
      console.error(err);
      status.innerHTML = `
        <button class="h-10 px-4 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold" data-retry>
          Couldn't load fits. Tap to retry
        </button>`;
      status.querySelector("[data-retry]").onclick = loadMore;
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

  async function remove(fit) {
    if (!confirm("Delete this fit? Its photos will be deleted too.")) return;
    try {
      await deleteFit(fit.id);
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

  list.addEventListener("click", (event) => {
    const article = event.target.closest("[data-fit-id]");
    const fit = article && fits.get(article.dataset.fitId);
    if (!fit) return;
    if (event.target.closest("[data-fit-like]")) toggle(fit, "liked_by_me", setLiked);
    else if (event.target.closest("[data-fit-save]")) toggle(fit, "saved_by_me", setSaved);
    else if (event.target.closest("[data-fit-delete]")) remove(fit);
  });

  // Carousel dots follow the photo that's in view.
  list.addEventListener(
    "scroll",
    (event) => {
      const slides = event.target.closest?.("[data-slides]");
      if (!slides) return;
      const index = Math.round(slides.scrollLeft / slides.clientWidth);
      slides.parentElement.querySelectorAll(".fit-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
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
