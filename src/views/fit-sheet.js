import { getFit, setVote } from "../fits.js";
import { bindShopScroll, renderFitCard, withVote } from "./fit-card.js";
import { openSheet } from "./sheet.js";

export async function openFitSheet(fitId, { toast }) {
  const { root } = openSheet({ title: "Fit", body: `<div class="of-sheet-body of-fit-sheet" data-fit-sheet><p class="of-muted">Loading…</p></div>` });
  const body = root.querySelector("[data-fit-sheet]");
  let fit = null;
  const paint = () => {
    body.innerHTML = renderFitCard(fit, { withActions: false });
    bindShopScroll(body.querySelector(".of-fitcard"));
  };
  try {
    fit = await getFit(fitId);
    paint();
  } catch (err) {
    body.innerHTML = `<p class="of-muted">${err.status === 404 ? "This fit isn't available anymore." : "Couldn't load this fit."}</p>`;
    return;
  }
  body.addEventListener("click", async (event) => {
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
