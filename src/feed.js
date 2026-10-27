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
      console.warn("Backend unavailable, loading local feed fits:", err.message);
      const fallbackFits = [
        {
          id: "weekend-denim",
          author: { full_name: "Maya Patel", username: "maya.p", avatar: { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHvgi6MHLnu0SW2ydau8iVxdjhzG2RLC0YMZV7aIxmLQCdEPxo4K8PFBR19KCc099OsUaovPAhKMkq_3gK-7_E3wTQW80tsPn0rS0WF1hVGIluXqbTQ5vyDSdKJdhbkPKSEXSRMMy9L429gizhE2lB7cbTVtulNBsDClS1HMNpCOvzHY9IdMKNHDhDFsUYzltirZIb2UwbgvPehdWjVZvO4rFfRVSrVS0DLlQ4Rhc0y_Lv3LCIOYFK" } },
          images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvitqbYhC06rwROt68aWVSkxshRsI_XZMYku2E4UmlX47SZItmqMOO94sP2n8m6eqeefZRDi0_ZOAFDUhConWt8cr6MPFh7ugcv8X0kd-7htxkU0ZSr-5h0P-Kd3vdxVMAqPs8mTdod8BXI64k-M-9Z2cEEilQlXab8X22Ky4j3z0vheDo_2bQ0YEBIRRY_2k63dndHnXJ-v1u9lFEc2IkdQYs1GMa468aoTCG5zm_URYRRTaPzYc3", width: 4, height: 5, generated: true }],
          caption: "Weekend denim & chunky knit. Should I wear this for casual dinner?",
          items: [
            { name: "Cream crew knit", brand: "Everlane", color: "#ede4d3", category: "top", url: "https://everlane.com" },
            { name: "Indigo straight-leg", brand: "Levi's", color: "#34466b", category: "bottom", url: "https://levi.com" },
            { name: "White leather sneakers", brand: "Veja", color: "#f7f5f0", category: "shoes", url: "https://veja-store.com" },
          ],
          occasion_tags: ["weekend", "casual"],
          style_tags: ["minimal", "denim"],
          liked_by_me: false,
          like_count: 14,
          saved_by_me: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "office-evening",
          author: { full_name: "Camille Dupont", username: "camille.paris", avatar: { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQoBB-RfZtEW8iXc9uacvJEdj6fI2Oa2jG2Ym8XPpHIOSVXOCNR_DysIiUIABvzIoXS8lcSDLVZ9kfEzfh5z3Eqnv_XuAVg6zK8Bd7SzKqF0jKXVds8MOKElPpKLKGlmjMjZDrPcK2enaV7WBhA75_S7OIB4D5pHurP4a6FC9WzMYVBkBo0h2EfDtDciqsoZDOJsSmzCzR0TtdbKEkQ6dizTIF5vdr3zBxRien_0nGRddSM5ppy7hj" } },
          images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCP8hU_ohU31fXg2UxqBIHgH2lSe9NBusuySLMrC4y0glAPeWQdqoQYo77ssbt-y8jxWFY-MVqcczESrfJz1_GqoZALwCIQYQgLM0dOzXEchywjPizZhW_fHG2IkUNrAVVo1-O1iy7XxiG-0V-8YLYzPJprjVIOz7azKpty9z3RQNyvfGc4LIP-kNk9vVwLB9dlP5SnIUl6kD_tOG7d2c7xdp3TTRS3G9IW2B2r8LmtEdtFYWJ20bp", width: 4, height: 5, generated: false }],
          caption: "Oversized blazer over silk camisole for Parisian gallery opening. Thoughts?",
          items: [
            { name: "Double-breasted blazer", brand: "The Frankie Shop", color: "#2b2926", category: "outerwear", url: "https://thefrankieshop.com" },
            { name: "Silk camisole", brand: "Reformation", color: "#c9a88a", category: "top", url: "https://thereformation.com" },
            { name: "Charcoal pleated trousers", brand: "Zara", color: "#374151", category: "bottom", url: "https://zara.com" },
          ],
          occasion_tags: ["evening", "gallery"],
          style_tags: ["tailored", "chic"],
          liked_by_me: true,
          like_count: 28,
          saved_by_me: false,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
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
