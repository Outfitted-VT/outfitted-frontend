// A confirmation modal in the app's style, replacing the browser's confirm() popup.
//
//   const ok = await confirmDialog({ title: "Delete this fit?", confirmLabel: "Delete", danger: true });
//
// Pass `onConfirm` to run the action while the dialog stays open showing a busy button, so
// it can't be clicked twice. If it throws, the dialog closes and the error is rethrown.

import { escapeHtml } from "./format.js";

let dialog;

const buttonBase =
  "h-11 flex-1 rounded-full font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 disabled:active:scale-100";

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "confirm-dialog";
  dialog.setAttribute("aria-labelledby", "confirm-dialog-title");
  dialog.setAttribute("aria-describedby", "confirm-dialog-message");
  dialog.className = "confirm-dialog m-auto w-[calc(100%-32px)] max-w-[380px] rounded-lg bg-surface-container-lowest p-0 shadow-xl";
  dialog.innerHTML = `
    <div class="flex flex-col gap-space-md p-space-lg">
      <div class="flex flex-col items-center gap-space-sm text-center">
        <span class="w-12 h-12 rounded-full flex items-center justify-center" id="confirm-dialog-icon-wrap">
          <span class="material-symbols-outlined text-[24px]" id="confirm-dialog-icon"></span>
        </span>
        <h2 class="font-title-ui text-title-ui font-semibold text-on-surface" id="confirm-dialog-title"></h2>
        <p class="font-body-md text-body-md text-on-surface-variant" id="confirm-dialog-message"></p>
      </div>
      <div class="flex gap-space-xs">
        <button type="button" class="${buttonBase} bg-surface-container text-on-surface" data-confirm-cancel></button>
        <button type="button" class="${buttonBase}" data-confirm-ok></button>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  return dialog;
}

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.message]
 * @param {string} [options.confirmLabel]
 * @param {string} [options.busyLabel] - shown on the confirm button while onConfirm runs
 * @param {string} [options.cancelLabel]
 * @param {boolean} [options.danger] - red confirm button, for destructive actions
 * @param {string} [options.icon] - Material Symbols name
 * @param {() => Promise<void>} [options.onConfirm]
 * @returns {Promise<boolean>} true if confirmed (and onConfirm succeeded)
 */
export function confirmDialog({
  title,
  message = "",
  confirmLabel = "Confirm",
  busyLabel = "Working…",
  cancelLabel = "Cancel",
  danger = false,
  icon = danger ? "delete" : "help",
  onConfirm,
}) {
  const el = ensureDialog();
  const ok = el.querySelector("[data-confirm-ok]");
  const cancel = el.querySelector("[data-confirm-cancel]");

  el.querySelector("#confirm-dialog-title").textContent = title;
  const messageEl = el.querySelector("#confirm-dialog-message");
  messageEl.textContent = message;
  messageEl.classList.toggle("hidden", !message);
  el.querySelector("#confirm-dialog-icon").textContent = icon;
  el.querySelector("#confirm-dialog-icon-wrap").className =
    `w-12 h-12 rounded-full flex items-center justify-center ${danger ? "bg-error-container text-error" : "bg-surface-container text-secondary"}`;
  cancel.textContent = cancelLabel;
  ok.innerHTML = escapeHtml(confirmLabel);
  ok.className = `${buttonBase} ${danger ? "bg-error text-on-error" : "bg-primary text-on-primary"}`;
  ok.disabled = cancel.disabled = false;

  return new Promise((resolve, reject) => {
    let busy = false;

    const finish = (result, error) => {
      el.removeEventListener("cancel", onCancel);
      el.onclick = ok.onclick = cancel.onclick = null;
      el.close();
      if (error) reject(error);
      else resolve(result);
    };
    // Escape key. While busy, ignore it so the action isn't abandoned halfway.
    const onCancel = (event) => {
      event.preventDefault();
      if (!busy) finish(false);
    };

    el.addEventListener("cancel", onCancel);
    cancel.onclick = () => finish(false);
    // A click on the backdrop lands on the <dialog> itself.
    el.onclick = (event) => {
      if (event.target === el && !busy) finish(false);
    };
    ok.onclick = async () => {
      if (!onConfirm) return finish(true);
      busy = true;
      ok.disabled = cancel.disabled = true;
      ok.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>${escapeHtml(busyLabel)}`;
      try {
        await onConfirm();
        finish(true);
      } catch (error) {
        finish(false, error);
      }
    };

    el.showModal();
    // Focus Cancel first, so an accidental Enter doesn't confirm a destructive action.
    cancel.focus();
  });
}
