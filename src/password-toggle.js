// An eye button inside a password field that shows or hides what's typed.
// Wrap the <input> markup with withPasswordToggle(); one click handler (below) serves every
// field on the page. Styles: .pw-wrap / .pw-toggle in src/connected.css.

const icon = (paths) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const EYE = icon('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
const EYE_OFF = icon(
  '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2"/><path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.9 9.9 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'
);

export function withPasswordToggle(inputHtml) {
  return `<span class="pw-wrap">${inputHtml}<button type="button" class="pw-toggle" data-password-toggle aria-label="Show password" aria-pressed="false">${EYE}</button></span>`;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-password-toggle]");
  if (!button) return;
  event.preventDefault();
  const input = button.parentElement.querySelector("input");
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.setAttribute("aria-pressed", String(show));
  button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  button.innerHTML = show ? EYE_OFF : EYE;
  input.focus({ preventScroll: true });
});
