// Full-screen sign in / create account, shown when there's no session.

const inputClass =
  "w-full h-12 px-space-sm rounded-DEFAULT bg-surface-container-low text-on-surface font-body-md text-body-md border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all placeholder:text-on-surface-variant/60";

function field({ name, label, type = "text", autocomplete, placeholder, hint, signupOnly, attrs = "" }) {
  return `
    <label class="flex flex-col gap-space-2xs ${signupOnly ? "auth-signup-only hidden" : ""}" data-field="${name}">
      <span class="font-label-md text-label-md text-on-surface font-semibold">${label}</span>
      <input class="${inputClass}" name="${name}" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}" ${attrs} />
      ${hint ? `<span class="auth-hint font-label-sm text-label-sm text-on-surface-variant font-normal">${hint}</span>` : ""}
      <span class="auth-field-error font-label-sm text-label-sm text-error font-normal hidden"></span>
    </label>`;
}

export function renderAuthScreen() {
  return `
    <div class="min-h-screen flex flex-col bg-surface pt-safe pb-safe">
      <div class="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto px-margin py-space-2xl">
        <div class="flex items-center gap-space-xs mb-space-xl">
          <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm tracking-tighter">OF</div>
          <span class="font-title-editorial text-title-editorial tracking-tight text-on-surface font-semibold">Outfitted</span>
        </div>

        <h1 class="font-display-hero-mobile text-display-hero-mobile text-on-surface" id="auth-heading">Welcome back</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-space-xs mb-space-lg" id="auth-lede">Sign in to see your circle's fits.</p>

        <div class="grid grid-cols-2 p-1 rounded-full bg-surface-container mb-space-lg" role="tablist">
          <button type="button" role="tab" data-auth-mode="login" class="auth-tab h-10 rounded-full font-label-md text-label-md font-semibold transition-all">Sign in</button>
          <button type="button" role="tab" data-auth-mode="signup" class="auth-tab h-10 rounded-full font-label-md text-label-md font-semibold transition-all">Create account</button>
        </div>

        <form id="auth-form" class="flex flex-col gap-space-md" novalidate>
          ${field({ name: "full_name", label: "Name", autocomplete: "name", placeholder: "Jane Doe", signupOnly: true, attrs: 'maxlength="100"' })}
          ${field({
            name: "username",
            label: "Username",
            autocomplete: "username",
            placeholder: "jane.doe",
            hint: "3–30 characters: lowercase letters, numbers, _ and .",
            signupOnly: true,
            attrs: 'maxlength="30" autocapitalize="none" autocorrect="off" spellcheck="false"',
          })}
          ${field({ name: "email", label: "Email", type: "email", autocomplete: "email", placeholder: "you@example.com", attrs: 'autocapitalize="none" required' })}
          ${field({ name: "password", label: "Password", type: "password", autocomplete: "current-password", placeholder: "At least 8 characters", attrs: 'maxlength="128" required' })}

          <p id="auth-error" role="alert" class="hidden font-label-md text-label-md text-on-error-container bg-error-container rounded-DEFAULT px-space-sm py-space-xs"></p>

          <button type="submit" id="auth-submit" class="h-12 rounded-full bg-primary text-on-primary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60">
            Sign in
          </button>
        </form>
      </div>
    </div>`;
}

// mode: "login" | "signup". Updates the tabs, copy and which fields show.
export function setAuthMode(mode) {
  const signup = mode === "signup";
  document.querySelector("#auth-form").dataset.mode = mode;
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    const active = tab.dataset.authMode === mode;
    tab.setAttribute("aria-selected", String(active));
    tab.classList.toggle("bg-surface-container-lowest", active);
    tab.classList.toggle("shadow-sm", active);
    tab.classList.toggle("text-on-surface", active);
    tab.classList.toggle("text-on-surface-variant", !active);
  });
  document.querySelectorAll(".auth-signup-only").forEach((el) => el.classList.toggle("hidden", !signup));
  document.querySelector("#auth-heading").textContent = signup ? "Create your account" : "Welcome back";
  document.querySelector("#auth-lede").textContent = signup
    ? "Build your avatar once, then try, check, and share every fit."
    : "Sign in to see your circle's fits.";
  document.querySelector("#auth-submit").textContent = signup ? "Create account" : "Sign in";
  document.querySelector('[name="password"]').autocomplete = signup ? "new-password" : "current-password";
  showAuthErrors();
}

// message: shown above the submit button. fields: { fieldName: message } shown under each input.
export function showAuthErrors(message = "", fields = {}) {
  const banner = document.querySelector("#auth-error");
  banner.textContent = message;
  banner.classList.toggle("hidden", !message);
  document.querySelectorAll("[data-field]").forEach((label) => {
    const error = fields[label.dataset.field] || "";
    const el = label.querySelector(".auth-field-error");
    el.textContent = error;
    el.classList.toggle("hidden", !error);
    label.querySelector(".auth-hint")?.classList.toggle("hidden", Boolean(error));
    label.querySelector("input").classList.toggle("!border-error", Boolean(error));
  });
}
