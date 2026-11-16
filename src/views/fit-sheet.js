import { getFit, setLiked, setSaved, setVote } from "../fits.js";
import { bindShopScroll, renderFitCard, withVote } from "./fit-card.js";
import { openSheet } from "./sheet.js";

// One fit in a sheet (from a profile, a chat, a story or a notification), with Like, Comments,
// Save and Try this look like a feed card. onOpenComments(fit, onCount) and onOpenTryOn(fit) come
// from src/main.js; without them those two buttons do nothing.
export async function openFitSheet(fitId, { toast, onOpenComments, onOpenTryOn }) {
  const { root, close } = openSheet({ title: "Fit", body: `<div class="of-sheet-body of-fit-sheet" data-fit-sheet><p class="of-muted">Loading…</p></div>` });
  const body = root.querySelector("[data-fit-sheet]");
  let fit = null;
  const paint = () => {
    body.innerHTML = renderFitCard(fit);
    bindShopScroll(body.querySelector(".of-fitcard"));
  };
  try {
    fit = await getFit(fitId);
    paint();
  } catch (err) {
    body.innerHTML = `<p class="of-muted">${err.status === 404 ? "This fit isn't available anymore." : "Couldn't load this fit."}</p>`;
    return;
  }
  // Like and Save: flip right away, undo if the request fails.
  const toggle = async (key, request) => {
    const before = fit;
    const on = !fit[key];
    fit = { ...fit, [key]: on };
    if (key === "liked_by_me") fit.like_count = (before.like_count || 0) + (on ? 1 : -1);
    paint();
    try {
      await request(fit.id, on);
      if (key === "saved_by_me") toast(on ? "Saved to My fits" : "Removed from saved");
    } catch {
      fit = before;
      paint();
      toast("Couldn't update. Check your connection.");
    }
  };

  body.addEventListener("click", async (event) => {
    if (event.target.closest("[data-fit-like]")) return toggle("liked_by_me", setLiked);
    if (event.target.closest("[data-fit-save]")) return toggle("saved_by_me", setSaved);
    if (event.target.closest("[data-fit-comments]")) {
      return onOpenComments?.(fit, (count) => {
        fit = { ...fit, comment_count: count };
        paint();
      });
    }
    if (event.target.closest("[data-ai-mode]")) {
      if (!onOpenTryOn) return;
      close();
      return onOpenTryOn(fit);
    }
    const step = event.target.closest("[data-slide-step]");
    if (step) {
      const slides = step.parentElement.querySelector("[data-slides]");
      return slides?.scrollBy({ left: Number(step.dataset.slideStep) * slides.clientWidth, behavior: "smooth" });
    }
    const button = event.target.closest("[data-fit-vote]");
    if (!button || !fit.poll) return;
    const picked = Number(button.dataset.fitVote);
    const choice = picked !== fit.poll.my_vote ? picked : null;
    const before = fit;
    fit = withVote(fit, choice);
    paint();
    try {
      fit = await setVote(fit.id, choice);
      paint();
    } catch {
      fit = before;
      paint();
      toast("Couldn't save your vote.");
    }
  });
}
