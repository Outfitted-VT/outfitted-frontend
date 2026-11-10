import { escapeHtml } from "../format.js";
import { iconButton, ofIcons } from "./components.js";

export function openSheet({ title, body, label = title, onClose = () => {} }) {
  const backdrop = document.createElement("div");
  backdrop.className = "of-sheet-backdrop";
  backdrop.innerHTML = `<div class="of-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}">
    <span class="of-sheet-handle" aria-hidden="true"></span>
    <div class="of-sheet-head"><h2 class="of-sheet-title">${escapeHtml(title)}</h2>${iconButton({ icon: ofIcons.close(), label: "Close", data: { "data-sheet-close": true } })}</div>
    ${body}
  </div>`;
  const previousFocus = document.activeElement;
  const close = () => {
    document.removeEventListener("keydown", onKey);
    backdrop.remove();
    previousFocus?.focus?.();
    onClose();
  };
  const onKey = (event) => event.key === "Escape" && close();
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop || event.target.closest("[data-sheet-close]")) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.append(backdrop);
  backdrop.querySelector("input, button:not([data-sheet-close])")?.focus({ preventScroll: true });
  return { root: backdrop.querySelector(".of-sheet"), close };
}
