import { ApiError, logIn, signUp } from './auth.js';
import { escapeHtml } from './format.js';
import { withPasswordToggle } from './password-toggle.js';

const DONE_KEY = 'of.onboarded';
const HERO = './assets/landing/outfitted-hero.jpg';

const svg = (size, paths, width) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const icon = {
  arrow: svg(18, '<path d="M5 12h14M13 6l6 6-6 6"/>', 2.2),
  back: svg(18, '<path d="M15 6l-6 6 6 6"/>', 2.2)
};

const state = {
  returning: false, busy: false, error: '', signedIn: false,
  email: '', password: '', name: '', username: ''
};
const USERNAME = /^[a-z0-9_.]{3,30}$/;
let root;
let current = 'loading';
let fromLanding = false; // opened by Get started / Log in on the landing page

const cta = (label, act, variant = 'dark', extra = '') =>
  `<button type="button" class="ob-cta ob-cta-${variant}" data-act="${act}" ${extra}>${label}<span class="ob-cta-chip">${icon.arrow}</span></button>`;

const errorLine = () => (state.error ? `<p class="ob-error" role="alert">${state.error}</p>` : '');

const heading = (kicker, title, sub = '') => `<div class="ob-heading">
    <div class="ob-kicker">${kicker}</div>
    <h1 class="ob-title">${title}</h1>
    ${sub ? `<p class="ob-sub">${sub}</p>` : ''}
  </div>`;

function loadingView() {
  return `<section class="ob-screen ob-load">
    <div class="ob-load-center">
      <span class="wordmark splash-wordmark" role="img" aria-label="Outfitted">OUTFITTED<span class="wordmark-dot">.</span></span>
      <div class="ob-bar"><div class="ob-bar-fill"></div></div>
    </div>
    <div class="ob-load-foot">
      <div class="ob-load-tag">GOOD FITS. BETTER FRIENDS.</div>
      <div class="ob-load-sub">Warming up your fitting room…</div>
    </div>
  </section>`;
}

function welcomeView() {
  return `<section class="ob-screen ob-welcome">
    <img class="ob-hero" src="${HERO}" alt="Woman in a long black wool coat over a champagne satin skirt">
    <div class="ob-hero-fade"></div>
    <div class="ob-top">
      <div class="ob-badge">OF<span class="ob-badge-dot"></span></div>
      <button type="button" class="ob-skip" data-act="skip">Skip</button>
    </div>
    <div class="ob-welcome-body">
      <div class="ob-welcome-kicker"><span></span>THE SOCIAL FIT CHECK</div>
      <h1 class="ob-welcome-title">Ask your circle <span class="ob-italic">before</span> you buy.</h1>
      <p class="ob-welcome-sub">Try it on in 3D, post the fit, get honest votes from the people whose taste you trust.</p>
      <div class="ob-pager" aria-hidden="true"><span class="on"></span><span></span><span></span></div>
      ${cta('Create my account', 'start', 'lime')}
      <button type="button" class="ob-welcome-link" data-act="signin">I already have an account</button>
    </div>
  </section>`;
}

function head(back) {
  const button = back ? `<button type="button" class="ob-back" data-act="${back}" aria-label="Back">${icon.back}</button>` : "";
  return `<div class="ob-head">${button}</div>`;
}

function signinView() {
  const r = state.returning;
  return `<section class="ob-screen ob-quiz">
    ${head('toWelcome')}
    <div class="ob-body">
      ${heading(r ? 'SIGN IN' : 'CREATE ACCOUNT · 1 / 2', r ? 'Welcome back.' : 'Welcome to your circle.', r ? '' : 'Start with your email and a password (at least 8 characters).')}
      <div class="ob-stack">
        <input class="ob-field" id="ob-email" type="email" placeholder="Email" autocomplete="email" autocapitalize="off" value="${escapeHtml(state.email)}">
        ${withPasswordToggle(`<input class="ob-field" id="ob-pass" type="password" placeholder="Password" autocomplete="${r ? 'current-password' : 'new-password'}">`)}
      </div>
      ${errorLine()}
    </div>
    <div class="ob-foot">
      ${cta(state.busy ? 'Signing in…' : r ? 'Log in' : 'Continue', 'auth', 'dark', 'disabled')}
      <button type="button" class="ob-switch" data-act="${r ? 'start' : 'signin'}">${r ? 'New here? <b>Create an account</b>' : 'Have an account? <b>Log in</b>'}</button>
    </div>
  </section>`;
}

// Sign-up step 2: the name and @username friends will see. The username starts from the email.
function profileView() {
  return `<section class="ob-screen ob-quiz">
    ${head('toAccount')}
    <div class="ob-body">
      ${heading('CREATE ACCOUNT · 2 / 2', 'How should we call you?', 'Your name and @username show on your fits. Friends search by username.')}
      <div class="ob-stack">
        <input class="ob-field" id="ob-name" type="text" placeholder="Name" autocomplete="name" maxlength="100" value="${escapeHtml(state.name)}">
        <label class="ob-handle"><span>@</span><input class="ob-field" id="ob-username" type="text" placeholder="username" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="30" value="${escapeHtml(state.username)}"></label>
        <p class="ob-hint">3–30 characters: lowercase letters, numbers, _ and .</p>
      </div>
      ${errorLine()}
    </div>
    <div class="ob-foot">${cta(state.busy ? 'Creating your account…' : 'Create account', 'create', 'dark', 'disabled')}</div>
  </section>`;
}

const views = { loading: loadingView, welcome: welcomeView, signin: signinView, profile: profileView };

function fieldValues() {
  return [...root.querySelectorAll('.ob-field')].map(field => [field.id, field.value]);
}

function render(animate = false) {
  const body = root.querySelector('.ob-body');
  const scroll = animate || !body ? 0 : body.scrollTop;
  const values = animate ? [] : fieldValues();
  root.innerHTML = views[current]();
  if (animate) root.firstElementChild.classList.add('ob-anim');
  values.forEach(([id, value]) => { const field = root.querySelector(`#${id}`); if (field) field.value = value; });
  const next = root.querySelector('.ob-body');
  if (next) next.scrollTop = scroll;
  const pass = root.querySelector('#ob-pass');
  if (pass && !pass.value) pass.value = state.password;
  refreshButtons();
}

function refreshButtons() {
  const auth = root.querySelector('[data-act="auth"]');
  if (auth) auth.disabled = !authReady();
  const create = root.querySelector('[data-act="create"]');
  if (create) create.disabled = state.busy || !USERNAME.test(handle());
}

const handle = () => (root.querySelector('#ob-username')?.value || '').trim().toLowerCase();

function go(screen) {
  current = screen;
  render(true);
}

function credentials() {
  return {
    email: (root.querySelector('#ob-email')?.value || '').trim(),
    password: root.querySelector('#ob-pass')?.value || ''
  };
}

function authReady() {
  const { email, password } = credentials();
  return !state.busy && email.includes('@') && password.length >= (state.returning ? 1 : 8);
}

function usernameFrom(email, suffix = '') {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '').replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '');
  const padded = base.length >= 3 ? base : `${base}fit`.padEnd(3, '0');
  return `${padded.slice(0, 30 - suffix.length)}${suffix}`;
}

// Sign-up step 1 done: keep the email and password, suggest a username from the email.
function toProfile() {
  Object.assign(state, credentials(), { error: '' });
  if (!state.username) state.username = usernameFrom(state.email);
  go('profile');
}

function profileMessage(err) {
  if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.';
  if (err.status === 409 && /username/i.test(err.message)) return 'That username is taken. Try another one.';
  if (err.fields.username) return escapeHtml(err.fields.username);
  if (err.fields.full_name) return escapeHtml(err.fields.full_name);
  return escapeHtml(err.message);
}

// Sign-up step 2: create the account with the chosen name and username, sign in, open the app.
async function createAccount() {
  state.name = (root.querySelector('#ob-name')?.value || '').trim();
  state.username = handle();
  state.error = '';
  setBusy(true);
  try {
    await signUp({ email: state.email, username: state.username, password: state.password, fullName: state.name || undefined });
  } catch (err) {
    state.busy = false;
    // A taken email belongs on the first step.
    if (err instanceof ApiError && (err.status === 409 && !/username/i.test(err.message) || err.fields.email || err.fields.password)) {
      state.error = authMessage(err);
      return go('signin');
    }
    state.error = profileMessage(err);
    return render();
  }
  try {
    await logIn(state.email, state.password);
    state.signedIn = true;
    state.password = '';
    window.dispatchEvent(new CustomEvent('of:signed-in'));
    state.busy = false;
    finish();
  } catch (err) {
    state.error = authMessage(err);
    setBusy(false);
  }
}

function authMessage(err) {
  if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.';
  if (err.status === 401) return 'That email and password do not match.';
  if (err.status === 409) return 'That email already has an account. <button data-act="signin">Sign in instead</button>';
  if (err.fields.password) return 'Password must be at least 8 characters.';
  if (err.fields.email) return 'Enter a valid email address.';
  return escapeHtml(err.message);
}

function setBusy(busy) {
  state.busy = busy;
  render();
}

async function authenticate() {
  const { email, password } = credentials();
  if (!state.returning) return toProfile();
  state.error = '';
  setBusy(true);
  try {
    await logIn(email, password);
    state.signedIn = true;
    window.dispatchEvent(new CustomEvent('of:signed-in'));
    state.busy = false;
    finish();
  } catch (err) {
    state.error = authMessage(err);
    setBusy(false);
  }
}

function setHash(hash) {
  const url = location.pathname + location.search + hash;
  if (location.hash !== hash) history.replaceState(history.state, '', url);
}

// el: the overlay to close (the start-up splash closes only itself).
function close(el = root) {
  if (el === root && fromLanding) setHash('');
  const closing = el;
  closing.classList.add('ob-out');
  setTimeout(() => closing.remove(), 350);
}

function finish() {
  localStorage.setItem(DONE_KEY, '1');
  close();
  window.dispatchEvent(new CustomEvent('of:onboarded', { detail: { signedIn: state.signedIn } }));
}

const actions = {
  start() { state.returning = false; state.error = ''; if (fromLanding) setHash('#signup'); go('signin'); },
  signin() { state.returning = true; state.error = ''; if (fromLanding) setHash('#login'); go('signin'); },
  toWelcome() { if (fromLanding) close(); else go('welcome'); },
  toAccount() { state.error = ''; state.name = (root.querySelector('#ob-name')?.value || '').trim(); state.username = handle(); go('signin'); },
  create() { if (USERNAME.test(handle()) && !state.busy) createAccount(); },
  skip: finish,
  auth() { if (authReady()) authenticate(); }
};

function onClick(e) {
  const btn = e.target.closest('[data-act]');
  if (btn && !btn.disabled) actions[btn.dataset.act]?.(btn.dataset.val);
}

function onInput(e) {
  if (!e.target?.classList.contains('ob-field')) return;
  if (e.target.id === 'ob-username') {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (clean !== e.target.value) e.target.value = clean;
  }
  refreshButtons();
}

function onEnter(e) {
  if (e.key !== 'Enter' || !e.target.classList?.contains('ob-field')) return;
  if (current === 'profile') actions.create();
  else if (authReady()) authenticate();
}

// Over the landing page, the account steps can be dismissed (nothing is created yet).
const dismissible = () => fromLanding && (current === 'signin' || current === 'profile') && !state.busy;

function onBackdrop(e) {
  if (e.target === root && dismissible()) close();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && root?.isConnected && !root.classList.contains('ob-out') && dismissible()) close();
});

function mount() {
  root = document.createElement('div');
  root.className = 'ob';
  document.body.append(root);
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onEnter);
  root.addEventListener('click', onBackdrop);
}

// The splash, then the app (or the landing page when signed out). ?onboard shows the old welcome.
function boot() {
  mount();
  go('loading');
  const splash = root;
  const welcome = new URLSearchParams(location.search).has('onboard');
  setTimeout(() => (welcome && root === splash ? go('welcome') : close(splash)), 1900);
}

// Get started (mode "signup": create an account) or Log in ("login").
window.addEventListener('of:start-onboarding', (event) => {
  // A fresh overlay unless one is already open for these steps (the start-up splash closes on its own).
  if (!root?.isConnected || root.classList.contains('ob-out') || current === 'loading') mount();
  root.classList.add('ob-modal');
  fromLanding = true;
  state.returning = event.detail?.mode === 'login';
  state.error = event.detail?.message ? escapeHtml(event.detail.message) : '';
  setHash(state.returning ? '#login' : '#signup');
  go('signin');
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
