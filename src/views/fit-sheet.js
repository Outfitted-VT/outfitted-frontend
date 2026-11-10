import { getFit, setVote } from "../fits.js";
import { renderFitCard } from "./fit-card.js";
import { openSheet } from "./sheet.js";

function withVote(fit, choice) {
  const votes = { wear: 0, rethink: 0, ...(fit.votes || {}) };
  if (fit.my_vote) votes[fit.my_vote] = Math.max(0, votes[fit.my_vote] - 1);
  if (choice) votes[choice] += 1;
  return { ...fit, votes, my_vote: choice };
}

export async function openFitSheet(fitId, { toast }) {
  const { root } = openSheet({ title: "Fit", body: `<div class="of-sheet-body of-fit-sheet" data-fit-sheet><p class="of-muted">Loading…</p></div>` });
  const body = root.querySelector("[data-fit-sheet]");
  let fit = null;
  const paint = () => (body.innerHTML = renderFitCard(fit));
  try {
    fit = await getFit(fitId);
    paint();
  } catch (err) {
    body.innerHTML = `<p class="of-muted">${err.status === 404 ? "This fit isn't available anymore." : "Couldn't load this fit."}</p>`;
    return;
  }
  body.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-fit-vote]");
    if (!button) return;
    const picked = button.dataset.fitVote;
    const choice = picked !== fit.my_vote ? picked : null;
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
