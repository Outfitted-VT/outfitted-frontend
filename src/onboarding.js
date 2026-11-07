import { ApiError, logIn, signUp } from './auth.js';
import { followUser, getSuggestions, mediaUrl, updateStyleProfile } from './fits.js';
import { escapeHtml } from './format.js';

const DONE_KEY = 'of.onboarded';
const QUIZ_KEY = 'of.quiz';

const STYLES = [
  ['Minimal', 'Clean, neutral, quiet', '#ECEAE2', ['#F7F4EC', '#BFB8A8', '#121212']],
  ['Tailored', 'Blazers, sharp trousers', '#E3E5EC', ['#3B3F4A', '#8A8F9C', '#D9D3C7']],
  ['Streetwear', 'Oversized, graphic, bold', '#1F1F1F', ['#DCEF63', '#2340E0', '#FFFFFF']],
  ['Y2K', 'Shine, baby tees, color', '#EEDFF5', ['#E58BC3', '#B9A4F0', '#9AD7F0']],
  ['Romantic', 'Satin, lace, soft lines', '#F4E5E1', ['#E7B9B1', '#FFFFFF', '#8C3B3B']],
  ['Sporty', 'Track, knit, sneakers', '#DEE5FB', ['#2340E0', '#FFFFFF', '#DCEF63']]
];
const FITS = [
  ['Fitted', 'Close to body', 'M14 6h12l-2 6 2 22H14l2-22z'],
  ['True', 'As designed', 'M12 6h16l-2 6 3 22H11l3-22z'],
  ['Relaxed', 'Room to move', 'M9 6h22l-2 6 5 22H6l5-22z']
];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const TONES = [
  ['10/10', 'Brutally honest', 'Tell me if it does not work.', 'honest'],
  ['Kind', 'Kind but real', 'Honest, with a fix to try.', 'kind'],
  ['Hype', 'Hype me up', 'Mostly cheers, light notes.', 'hype']
];
const AVATAR_TONES = ['ink', 'lime', 'blue'];
const HERO = './assets/landing/outfitted-hero.jpg';

const svg = (size, paths, width) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const icon = {
  arrow: svg(18, '<path d="M5 12h14M13 6l6 6-6 6"/>', 2.2),
  back: svg(18, '<path d="M15 6l-6 6 6 6"/>', 2.2),
  check: svg(14, '<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3),
  cube: svg(22, '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>', 1.8),
  fit: path => `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`
};

const state = {
  step: 0, returning: false, styles: new Set(), fit: 'Relaxed', top: 'S', bottom: 'M', tone: 'Kind but real',
  busy: false, error: '', scan: false, people: null, added: new Set(), signedIn: false
};
let root;
let current = 'loading';

const cta = (label, act, variant = 'dark', extra = '') =>
  `<button type="button" class="ob-cta ob-cta-${variant}" data-act="${act}" ${extra}>${label}<span class="ob-cta-chip">${icon.arrow}</span></button>`;

const errorLine = () => (state.error ? `<p class="ob-error" role="alert">${state.error}</p>` : '');

const heading = (kicker, title, sub = '') => `<div class="ob-heading">
    <div class="ob-kicker">${kicker}</div>
    <h1 class="ob-title">${title}</h1>
    ${sub ? `<p class="ob-sub">${sub}</p>` : ''}
  </div>`;

const pressed = on => `aria-pressed="${on}"`;

function loadingView() {
  return `<section class="ob-screen ob-load">
    <div class="ob-load-center">
      <div class="ob-mark"><span>Outf</span><span class="ob-i">ı<span class="ob-i-dot"></span></span><span>tted</span></div>
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
      ${cta('Build my style profile', 'start', 'lime')}
      <button type="button" class="ob-welcome-link" data-act="signin">I already have an account</button>
    </div>
  </section>`;
}

function head(back, count = '') {
  const prog = count
    ? `<div class="ob-prog">${[0, 1, 2].map(i => `<span class="${i <= state.step ? 'on' : ''}"></span>`).join('')}</div><div class="ob-count">${count}</div>`
    : '';
  return `<div class="ob-head"><button type="button" class="ob-back" data-act="${back}" aria-label="Back">${icon.back}</button>${prog}</div>`;
}

function signinView() {
  const r = state.returning;
  return `<section class="ob-screen ob-quiz">
    ${head('toWelcome')}
    <div class="ob-body">
      ${heading(r ? 'SIGN IN' : 'CREATE ACCOUNT', r ? 'Welcome back.' : 'Welcome to your circle.')}
      <div class="ob-stack">
        <input class="ob-field" id="ob-email" type="email" placeholder="Email" autocomplete="email" autocapitalize="off">
        <input class="ob-field" id="ob-pass" type="password" placeholder="Password" autocomplete="${r ? 'current-password' : 'new-password'}">
      </div>
      ${errorLine()}
    </div>
    <div class="ob-foot">${cta(state.busy ? 'Signing in…' : 'Continue', 'auth', 'dark', 'disabled')}</div>
  </section>`;
}

function styleTile([name, words, tint, dots]) {
  const on = state.styles.has(name);
  const check = on ? `<span class="ob-tile-check">${icon.check}</span>` : '';
  return `<button type="button" class="ob-tile ${on ? 'on' : ''}" data-act="style" data-val="${name}" ${pressed(on)}>
    <div class="ob-tile-vis" style="background:${tint}">${dots.map(d => `<span class="ob-tile-dot" style="background:${d}"></span>`).join('')}${check}</div>
    <div class="ob-tile-text"><span class="ob-tile-name">${name}</span><span class="ob-tile-words">${words}</span></div>
  </button>`;
}

function styleStep() {
  return heading('STEP 1 · YOUR STYLE', 'What do you reach for most?', 'Pick up to 3. We tune your feed and fit picks to match.') +
    `<div class="ob-grid">${STYLES.map(styleTile).join('')}</div>`;
}

function fitCard([name, sub, path]) {
  const on = state.fit === name;
  return `<button type="button" class="ob-fit ${on ? 'on' : ''}" data-act="fit" data-val="${name}" ${pressed(on)}>
    ${icon.fit(path)}<span class="ob-fit-name">${name}</span><span class="ob-fit-sub">${sub}</span>
  </button>`;
}

function sizeSection(label, key, note, cls) {
  const chips = SIZES.map(z => `<button type="button" class="ob-size ${state[key] === z ? 'on' : ''}" data-act="${key}" data-val="${z}" ${pressed(state[key] === z)}>${z}</button>`).join('');
  const labelRow = note
    ? `<div class="ob-label-row"><span class="ob-label">${label}</span><span class="ob-label-note">${note}</span></div>`
    : `<div class="ob-label">${label}</div>`;
  return `<div class="ob-size-sec ${cls}">${labelRow}<div class="ob-sizes">${chips}</div></div>`;
}

function scanBanner() {
  return `<div class="ob-scan">
    <div class="ob-scan-icon">${icon.cube}<span class="ob-scan-dot"></span></div>
    <div class="ob-scan-text"><span class="ob-scan-title">Skip the tape measure</span><span class="ob-scan-sub">A 5-second video scan builds your 3D avatar.</span></div>
    <button type="button" class="ob-scan-btn" data-act="scan" ${pressed(state.scan)}>${state.scan ? 'After setup' : 'Scan'}</button>
  </div>`;
}

function fitStep() {
  return heading('STEP 2 · YOUR FIT', 'How do you like things to sit?') +
    `<div class="ob-fits">${FITS.map(fitCard).join('')}</div>` +
    sizeSection('TOPS', 'top', 'US sizing', 'tops') +
    sizeSection('BOTTOMS', 'bottom', '', 'bottoms') +
    scanBanner();
}

function toneRow([tag, name, sub]) {
  const on = state.tone === name;
  return `<button type="button" class="ob-tone ${on ? 'on' : ''}" data-act="tone" data-val="${name}" ${pressed(on)}>
    <span class="ob-tone-tag">${tag}</span>
    <span class="ob-tone-text"><span class="ob-tone-name">${name}</span><span class="ob-tone-sub">${sub}</span></span>
    <span class="ob-radio"><span class="ob-radio-dot"></span></span>
  </button>`;
}

function toneStep() {
  return heading('STEP 3 · YOUR CIRCLE', 'How should your circle talk to you?') +
    `<div class="ob-tones">${TONES.map(toneRow).join('')}</div>` + circleCard();
}

function personAvatar(user, i) {
  if (user.avatar?.url) return `<span class="ob-av"><img src="${escapeHtml(mediaUrl(user.avatar.url))}" alt=""></span>`;
  const name = user.full_name || user.username;
  const letters = name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return `<span class="ob-av ${AVATAR_TONES[i % 3]}" aria-hidden="true">${escapeHtml(letters)}</span>`;
}

function personRow(user, i) {
  const on = state.added.has(user.username);
  const mutuals = user.mutual_count ? ` · ${user.mutual_count} mutual${user.mutual_count === 1 ? '' : 's'}` : '';
  return `<div class="ob-person">${personAvatar(user, i)}
    <span class="ob-person-text"><span class="ob-person-name">${escapeHtml(user.full_name || user.username)}</span><span class="ob-person-handle">@${escapeHtml(user.username)}${mutuals}</span></span>
    <button type="button" class="ob-add ${on ? 'on' : ''}" data-act="friend" data-val="${escapeHtml(user.username)}" ${pressed(on)}>${on ? 'Added' : 'Add'}</button>
  </div>`;
}

function circleCard() {
  const people = state.people;
  const body = people === null
    ? '<p class="ob-note">Finding people you know…</p>'
    : people.length ? people.map(personRow).join('') : '<p class="ob-note">No suggestions yet. Invite friends once you are in.</p>';
  return `<div class="ob-circle"><div class="ob-label-row"><span class="ob-label">START YOUR CIRCLE</span><span class="ob-label-note">${state.added.size} added</span></div>${body}</div>`;
}

function quizView() {
  const s = state.step;
  const last = s === 2;
  const label = last ? 'Finish and open my feed' : s === 0 ? `Continue · ${state.styles.size} picked` : 'Continue';
  return `<section class="ob-screen ob-quiz">
    ${head('back', `${s + 1} / 3`)}
    <div class="ob-body">${[styleStep, fitStep, toneStep][s]()}</div>
    <div class="ob-foot">${last ? errorLine() : ''}${cta(state.busy ? 'Saving…' : label, 'next', last ? 'lime' : 'dark', state.busy ? 'disabled' : '')}</div>
  </section>`;
}

const views = { loading: loadingView, welcome: welcomeView, signin: signinView, quiz: quizView };

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
  const auth = root.querySelector('[data-act="auth"]');
  if (auth) auth.disabled = !authReady();
}

function go(screen) {
  current = screen;
  render(true);
}

function set(key, value) {
  state[key] = value;
  render();
}

function toggleStyle(name) {
  const s = state.styles;
  if (s.has(name)) s.delete(name);
  else if (s.size < 3) s.add(name);
  render();
}

function credentials() {
  return {
    email: (root.querySelector('#ob-email')?.value || '').trim(),
    password: root.querySelector('#ob-pass')?.value || ''
  };
}

function authReady() {
  const { email, password } = credentials();
  return !state.busy && email.includes('@') && password.length >= 6;
}

function usernameFrom(email, suffix = '') {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '').replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '');
  const padded = base.length >= 3 ? base : `${base}fit`.padEnd(3, '0');
  return `${padded.slice(0, 30 - suffix.length)}${suffix}`;
}

async function createAccount(email, password) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const suffix = attempt ? String(Math.floor(1000 + Math.random() * 9000)) : '';
    try {
      return await signUp({ email, username: usernameFrom(email, suffix), password });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409 && /username/i.test(err.message))) throw err;
    }
  }
  throw new ApiError(409, 'Could not pick a username. Please try again.');
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
  state.error = '';
  setBusy(true);
  try {
    if (!state.returning) await createAccount(email, password);
    await logIn(email, password);
    state.signedIn = true;
    window.dispatchEvent(new CustomEvent('of:signed-in'));
    state.busy = false;
    if (state.returning) finish();
    else go('quiz');
  } catch (err) {
    state.error = authMessage(err);
    setBusy(false);
  }
}

function quizAnswers() {
  const { styles, fit, top, bottom, tone } = state;
  return {
    styles: [...styles].map(name => name.toLowerCase()),
    fit: fit.toLowerCase(),
    top,
    bottom,
    tone: TONES.find(t => t[1] === tone)[3]
  };
}

async function saveQuiz() {
  const answers = quizAnswers();
  localStorage.setItem(QUIZ_KEY, JSON.stringify(answers));
  await updateStyleProfile(answers);
  await Promise.all([...state.added].map(name => followUser(name)));
}

async function loadPeople() {
  if (state.people !== null) return;
  try {
    state.people = (await getSuggestions(3)).slice(0, 3);
  } catch {
    state.people = [];
  }
  if (current === 'quiz' && state.step === 2) render();
}

function close() {
  root.classList.add('ob-out');
  setTimeout(() => root.remove(), 350);
}

function finish() {
  localStorage.setItem(DONE_KEY, '1');
  close();
  window.dispatchEvent(new CustomEvent('of:onboarded', { detail: { scan: state.scan, signedIn: state.signedIn } }));
}

async function complete() {
  state.error = '';
  setBusy(true);
  try {
    await saveQuiz();
    state.busy = false;
    finish();
  } catch {
    state.error = 'Could not save your answers. Check your connection and try again.';
    setBusy(false);
  }
}

function toggleFriend(username) {
  if (state.added.has(username)) state.added.delete(username);
  else state.added.add(username);
  render();
}

function nextStep() {
  if (state.busy) return;
  if (state.step === 2) return complete();
  state.step++;
  render();
  if (state.step === 2) loadPeople();
}

const actions = {
  start() { state.returning = false; state.error = ''; go('signin'); },
  signin() { state.returning = true; state.error = ''; go('signin'); },
  toWelcome() { go('welcome'); },
  skip: finish,
  auth() { if (authReady()) authenticate(); },
  back() { if (state.step === 0) go('signin'); else { state.step--; state.error = ''; render(); } },
  next: nextStep,
  scan() { state.scan = !state.scan; render(); },
  friend: toggleFriend,
  style: toggleStyle,
  fit: v => set('fit', v),
  top: v => set('top', v),
  bottom: v => set('bottom', v),
  tone: v => set('tone', v)
};

function onClick(e) {
  const btn = e.target.closest('[data-act]');
  if (btn && !btn.disabled) actions[btn.dataset.act]?.(btn.dataset.val);
}

function onInput(e) {
  if (!e.target?.classList.contains('ob-field')) return;
  const btn = root.querySelector('[data-act="auth"]');
  if (btn) btn.disabled = !authReady();
}

function onEnter(e) {
  if (e.key === 'Enter' && e.target.classList?.contains('ob-field') && authReady()) authenticate();
}

function onboarded() {
  return localStorage.getItem(DONE_KEY) === '1' && !new URLSearchParams(location.search).has('onboard');
}

function boot() {
  root = document.createElement('div');
  root.className = 'ob';
  document.body.append(root);
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onEnter);
  go('loading');
  setTimeout(() => (onboarded() ? close() : go('welcome')), 1900);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
