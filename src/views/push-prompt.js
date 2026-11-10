import { declinePush, enablePush } from "../push.js";
import { ofIcons, pillCta } from "./components.js";
import { openSheet } from "./sheet.js";

export function openPushPrompt() {
  let answered = false;
  const { root, close } = openSheet({
    title: "Know when your circle votes",
    body: `<div class="of-sheet-body of-push-prompt">
      <span class="of-push-icon" aria-hidden="true">${ofIcons.bell(26)}</span>
      <p class="of-muted">Get a heads-up when friends vote on your fit, reply to your story, or your streak needs you. You choose what comes through in Settings.</p>
    </div>
    ${pillCta({ label: "Turn on", data: { "data-push-allow": true } })}
    <button type="button" class="of-btn of-btn-soft of-push-later" data-push-later>Not now</button>`,
    onClose: () => answered || declinePush(),
  });
  root.querySelector("[data-push-allow]").addEventListener("click", () => {
    answered = true;
    close();
    enablePush().catch(() => {});
  });
  root.querySelector("[data-push-later]").addEventListener("click", () => {
    answered = true;
    declinePush();
    close();
  });
}
