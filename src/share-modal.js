import { icons } from "./icons.js";
import { friendsList, messagesData } from "./data.js";

export function renderShareModal() {
  return `
    <dialog class="sheet sheet-share" id="share-fit-dialog" aria-labelledby="share-fit-heading">
      <div class="sheet-card share-card">
        <button type="button" class="icon-button close" id="close-share-dialog" aria-label="Close">${icons.close}</button>
        <div class="share-head">
          <p class="eyebrow" style="color:var(--brand-green);">FIT SHARING ✱</p>
          <h2 id="share-fit-heading">Share this look</h2>
          <p class="sheet-lede">Send directly to friends for opinions, copy a link, or broadcast to your group.</p>
        </div>

        <div class="share-preview-card" id="share-preview-card">
          <img src="./assets/feed/maya_fit.png" alt="Fit to share" id="share-modal-img" />
          <div class="share-preview-meta">
            <span class="file-tag" id="share-modal-tag">THE FIT FILES / 01</span>
            <strong id="share-modal-title">the denim dilemma</strong>
            <p id="share-modal-question">Is this giving effortless or did I just roll out of bed?</p>
          </div>
        </div>

        <div class="direct-share-section">
          <h4>Direct Send to Friends</h4>
          <div class="friends-share-strip">
            ${friendsList
              .map(
                (f) => `
                <button class="friend-share-chip" data-recipient="${f.id}" data-name="${f.name}">
                  <span class="avatar-chip micro" style="background:${f.color}; color:#fff;">${f.initial}</span>
                  <span>${f.name}</span>
                </button>
              `
              )
              .join("")}
          </div>
        </div>

        <div class="share-link-section">
          <h4>Copy Direct Link</h4>
          <div class="link-input-row">
            <input type="text" id="share-link-url" readonly value="https://outfitted.app/fit/denim-dilemma" />
            <button class="button button-dark" id="btn-copy-share-link">
              ${icons.link}<span>Copy link</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  `;
}

export function connectShareModal(onDirectSent) {
  const dialog = document.querySelector("#share-fit-dialog");
  if (!dialog) return;

  const closeBtn = dialog.querySelector("#close-share-dialog");
  const copyBtn = dialog.querySelector("#btn-copy-share-link");
  const urlInput = dialog.querySelector("#share-link-url");

  if (closeBtn) {
    closeBtn.onclick = () => dialog.close();
  }

  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.close();
  };

  if (copyBtn && urlInput) {
    copyBtn.onclick = () => {
      navigator.clipboard?.writeText(urlInput.value).catch(() => {});
      copyBtn.innerHTML = `${icons.check}<span>Copied!</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `${icons.link}<span>Copy link</span>`;
      }, 2000);
    };
  }

  dialog.querySelectorAll(".friend-share-chip").forEach((chip) => {
    chip.onclick = () => {
      const recipient = chip.dataset.name || "The Fit Check Group";
      dialog.close();
      if (onDirectSent) onDirectSent(recipient);
    };
  });
}

export function openShareModalForPost(post) {
  const dialog = document.querySelector("#share-fit-dialog");
  if (!dialog || !post) return;

  const img = dialog.querySelector("#share-modal-img");
  const tag = dialog.querySelector("#share-modal-tag");
  const title = dialog.querySelector("#share-modal-title");
  const question = dialog.querySelector("#share-modal-question");
  const linkInput = dialog.querySelector("#share-link-url");

  if (img) img.src = post.image;
  if (tag) tag.textContent = post.fileTag || "THE FIT FILES / 01";
  if (title) title.textContent = post.title;
  if (question) question.textContent = post.question;
  if (linkInput) linkInput.value = `https://outfitted.app/fit/${post.id || "look"}`;

  dialog.showModal();
}
