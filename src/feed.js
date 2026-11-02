// A paginated list of fits (feed or profile) with likes, saves, and deleting your own fits.

import { confirmDialog } from "./confirm-dialog.js";
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
 * @param {(fit: object, onUpdated: (n: number) => void) => void} [options.onOpenComments]
 * @param {(fit: object) => void} [options.onOpenTryOn]
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
      console.warn("Backend unavailable, loading local feed fits:", err.message);
      const fallbackFits = [
        {
          id: "weekend-denim",
          author: { full_name: "Maya Patel", username: "maya.p", avatar: { url: "./assets/feed/maya_fit.png" } },
          images: [{ url: "./assets/feed/maya_fit.png", width: 4, height: 5, generated: false }],
          caption: "The Denim Dilemma 👀 Faded oversized denim shell over fluid wide-leg red trousers and metallic runners. Is this giving effortless, or did I just roll out of bed? Be honest!",
          items: [
            { name: "Oversized Vintage Denim Jacket", brand: "Levi's", color: "#546e82", category: "outerwear", url: "https://levi.com" },
            { name: "Fluid Wide-Leg Red Trousers", brand: "COS", color: "#a83232", category: "bottom", url: "https://cos.com" },
            { name: "Gel-Kayano 14 Silver Metallic", brand: "ASICS", color: "#c8cbcf", category: "shoes", url: "https://asics.com" },
          ],
          occasion_tags: ["casual", "gallery"],
          style_tags: ["streetwear", "oversized"],
          liked_by_me: false,
          like_count: 38,
          saved_by_me: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "roastery-sunday",
          author: { full_name: "Jordan Kim", username: "jordan.k", avatar: { url: "./assets/feed/jordan_fit.png" } },
          images: [{ url: "./assets/feed/jordan_fit.png", width: 4, height: 5, generated: false }],
          caption: "Warm Roastery Sunday. Chunky forest rib-knit cardigan layered over a boxy heavyweight white tee, paired with fluid pleated charcoal wool trousers and polished penny loafers.",
          items: [
            { name: "Chunky Forest Cable Knit Cardigan", brand: "Aimé Leon Dore", color: "#244b3c", category: "top", url: "https://aimeleondore.com" },
            { name: "Heavyweight Boxy Mockneck Tee", brand: "Lady White Co.", color: "#ffffff", category: "top", url: "https://ladywhiteco.com" },
            { name: "Fluid Pleated Charcoal Wool Trousers", brand: "Zara", color: "#2b2e35", category: "bottom", url: "https://zara.com" },
            { name: "Polished Lug Penny Loafers", brand: "Dr. Martens", color: "#111111", category: "shoes", url: "https://drmartens.com" },
          ],
          occasion_tags: ["weekend", "coffee"],
          style_tags: ["knitwear", "minimal"],
          liked_by_me: true,
          like_count: 46,
          saved_by_me: true,
          created_at: new Date(Date.now() - 18000000).toISOString(),
        },
        {
          id: "concert-night",
          author: { full_name: "Camille Dupont", username: "camille.paris", avatar: { url: "./assets/wardrobe/outfit_chic3.png" } },
          images: [{ url: "./assets/wardrobe/outfit_concert1.png", width: 4, height: 5, generated: false }],
          caption: "Concert night in Marais. Tartan high-rise flare trousers paired with a fitted sage polo knit, platform block-heel leather boots, and espresso patent baguette bag.",
          items: [
            { name: "Fitted Sage Polo Knit", brand: "Paloma Wool", color: "#3f6212", category: "top", url: "https://palomawool.com" },
            { name: "High-Rise Tartan Plaid Flares", brand: "Vivienne Westwood", color: "#713f12", category: "bottom", url: "https://viviennewestwood.com" },
            { name: "Glossy Platform Leather Chelsea Boots", brand: "Ganni", color: "#451a03", category: "shoes", url: "https://ganni.com" },
          ],
          occasion_tags: ["evening", "concert"],
          style_tags: ["indie", "statement"],
          liked_by_me: false,
          like_count: 52,
          saved_by_me: false,
          created_at: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: "studio-crit",
          author: { full_name: "Alex Rivera", username: "alex.rivera", avatar: { url: "./assets/feed/alex_fit.png" } },
          images: [{ url: "./assets/wardrobe/outfit_uni2.png", width: 4, height: 5, generated: false }],
          caption: "Architectural minimal tailoring for Monday critiques. Unstructured double-breasted camel wool blazer over collegiate hood and straight raw selvedge denim.",
          items: [
            { name: "Structured Camel Wool Blazer", brand: "Acne Studios", color: "#c5a059", category: "outerwear", url: "https://acnestudios.com" },
            { name: "Collegiate Neutral Hooded Sweatshirt", brand: "Anine Bing", color: "#f1f5f9", category: "top", url: "https://aninebing.com" },
            { name: "Straight-Cut Raw Selvedge Denim", brand: "A.P.C.", color: "#1e3a8a", category: "bottom", url: "https://apc-us.com" },
          ],
          occasion_tags: ["studio", "campus"],
          style_tags: ["tailored", "minimal"],
          liked_by_me: false,
          like_count: 61,
          saved_by_me: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "cyber-grunge",
          author: { full_name: "Elena Volkova", username: "elena.v", avatar: { url: "./assets/feed/about_me_reactions.png" } },
          images: [{ url: "./assets/wardrobe/outfit_friends1.png", width: 4, height: 5, generated: false }],
          caption: "Cyber Grunge flash back. Vintage washed band graphic tour tee, distressed knee-slit dark wash denim, silver grommet belt, and canvas backpack.",
          items: [
            { name: "Faded Vintage Graphic Tour Tee", brand: "Thrifted", color: "#18181b", category: "top", url: "https://grailed.com" },
            { name: "Distressed Knee-Slit Black Denim", brand: "Our Legacy", color: "#52525b", category: "bottom", url: "https://ourlegacy.com" },
            { name: "Vintage Silver Grommet Belt", brand: "Diesel", color: "#64748b", category: "accessory", url: "https://diesel.com" },
          ],
          occasion_tags: ["weekend", "vintage"],
          style_tags: ["grunge", "y2k"],
          liked_by_me: false,
          like_count: 48,
          saved_by_me: false,
          created_at: new Date(Date.now() - 129600000).toISOString(),
        },
      ];
      fallbackFits.forEach((fit) => {
        if (!fits.has(fit.id)) {
          fits.set(fit.id, fit);
          list.append(card(fit));
        }
      });
      done = true;
      status.innerHTML = "";
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

  list.addEventListener("click", (event) => {
    const article = event.target.closest("[data-fit-id]");
    const fit = article && fits.get(article.dataset.fitId);
    if (!fit) return;
    if (event.target.closest("[data-fit-like]")) toggle(fit, "liked_by_me", setLiked);
    else if (event.target.closest("[data-fit-save]")) toggle(fit, "saved_by_me", setSaved);
    else if (event.target.closest("[data-fit-delete]")) remove(fit);
    else if (event.target.closest("[data-fit-comments]")) {
      onOpenComments?.(fit, (newCount) => {
        fit.comment_count = newCount;
        const counter = article.querySelector("[data-comment-count]");
        if (counter) counter.textContent = newCount;
      });
    } else if (event.target.closest("[data-ai-mode]")) {
      onOpenTryOn?.(fit);
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
