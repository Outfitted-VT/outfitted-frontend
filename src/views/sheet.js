import { escapeHtml } from "../format.js";
import { iconButton, ofIcons } from "./components.js";

// variant "dialog": a centered card instead of a sheet from the bottom (styles: .of-dialog in
// src/connected.css).
export function openSheet({ title, body, label = title, onClose = () => {}, variant = "sheet" }) {
  const dialog = variant === "dialog";
  const backdrop = document.createElement("div");
  backdrop.className = `of-sheet-backdrop${dialog ? " of-dialog-backdrop" : ""}`;
  backdrop.innerHTML = `<div class="of-sheet${dialog ? " of-dialog" : ""}" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}">
    ${dialog ? "" : `<span class="of-sheet-handle" aria-hidden="true"></span>`}
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
