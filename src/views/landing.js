// What people see before signing in: what Outfitted is, and Get started / Log in. Styles:
// src/landing.css (everything is under .lp). Get started and Log in hand off to the onboarding
// screens (src/onboarding.js) through the "of:start-onboarding" event.

const TRYON = "./assets/landing/tryon-before-after.webp";

const ARROW = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const SPARK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>`;
const FLAME = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.2-5 .2 1.6 1 2.7 2.3 3.2C11 8.6 11 5 12 2z"/></svg>`;
const CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

const cta = (label, mode, variant = "ink") =>
  `<button type="button" class="lp-btn lp-btn-${variant}" data-landing="${mode}">${label}${variant === "ink" || variant === "lime" ? `<span class="lp-btn-chip">${ARROW}</span>` : ""}</button>`;

const wordmark = `<span class="wordmark lp-wordmark" role="img" aria-label="Outfitted">OUTFITTED<span class="wordmark-dot">.</span></span>`;

function pollCard() {
  return `<div class="lp-poll" aria-hidden="true">
    <div class="lp-poll-who"><span class="lp-dot-avatar">M</span><span><b>@maya</b> · 2m</span></div>
    <p class="lp-poll-q">Blue jacket for Friday?</p>
    <div class="lp-poll-bar on"><span style="width:82%"></span><b>${CHECK}Wear it</b><em>82%</em></div>
    <div class="lp-poll-bar"><span style="width:18%"></span><b>Rethink</b><em>18%</em></div>
    <small>14 votes from your circle</small>
  </div>`;
}

function hero() {
  return `<section class="lp-hero" id="lp-top">
    <div class="lp-hero-copy">
      <p class="lp-kicker"><span class="lp-kicker-dot"></span>The social fit check</p>
      <h1 class="lp-h1">Ask your circle <em>before</em> you buy.</h1>
      <p class="lp-lede">Post a fit and put it to a vote. Try on a friend's look with a photo of you. Get honest takes from the people whose taste you trust.</p>
      <div class="lp-cta-row">
        ${cta("Get started", "signup")}
        ${cta("I have an account", "login", "ghost")}
      </div>
      <p class="lp-note">Free to join. You pick who sees every fit.</p>
    </div>
    <div class="lp-hero-visual">
      <figure class="lp-tryon">
        <img src="${TRYON}" alt="The same person before and after trying on a blue cropped jacket and silver bag" width="1536" height="1024" />
        <span class="lp-tag lp-tag-before">Before</span>
        <span class="lp-tag lp-tag-after">${SPARK}Tried on</span>
      </figure>
      ${pollCard()}
      <span class="lp-float-chip" aria-hidden="true">${FLAME}12-day streak</span>
    </div>
  </section>`;
}

function ticker() {
  const words = ["Post the fit", "Get the vote", "Try the look", "Keep your circle", "Wear it with confidence"];
  const run = words.map((w) => `<span>${w}</span><i aria-hidden="true">✦</i>`).join("");
  return `<div class="lp-ticker" aria-hidden="true"><div class="lp-ticker-track">${run}${run}</div></div>`;
}

function features() {
  return `<section class="lp-section" id="lp-features">
    <div class="lp-head">
      <p class="lp-kicker">What you can do</p>
      <h2 class="lp-h2">Everything a fit check <em>should</em> be.</h2>
    </div>
    <div class="lp-bento">
      <article class="lp-card lp-card-blue lp-span-2">
        <span class="lp-num">01</span>
        <div class="lp-card-copy">
          <h3>Post it. Poll it.</h3>
          <p>Share a fit with a question attached. Your circle votes <b>Wear it</b> or <b>Rethink</b>, and you see the split in real time.</p>
        </div>
        <div class="lp-card-mock">${pollCard()}</div>
      </article>

      <article class="lp-card lp-card-white">
        <span class="lp-num">02</span>
        <h3>Try on their look.</h3>
        <p>See a friend's fit on you from one photo. Take the whole outfit, or just the pieces you like.</p>
        <div class="lp-pieces" aria-hidden="true"><span>Jacket</span><span>Bag</span><span class="off">Jeans</span><span>Sneakers</span></div>
      </article>

      <article class="lp-card lp-card-lime">
        <span class="lp-num">03</span>
        <h3>Your circle, your rules.</h3>
        <ul class="lp-tiers">
          <li><b>Public</b><span>Anyone on Outfitted</span></li>
          <li><b>Friends</b><span>People you follow who follow you back</span></li>
          <li><b>Vault</b><span>Only you</span></li>
        </ul>
      </article>

      <article class="lp-card lp-card-ink lp-span-2">
        <span class="lp-num">04</span>
        <div class="lp-card-copy">
          <h3>Send the fit, not a screenshot.</h3>
          <p>Share a look straight into a chat. Your friend opens the real post, votes, saves it, or tries it on in a tap.</p>
        </div>
        <div class="lp-chat" aria-hidden="true">
          <div class="lp-bubble">is this too much for dinner??</div>
          <div class="lp-share-card">
            <span class="lp-share-photo" style="background-image:url(${TRYON})"></span>
            <span class="lp-share-text"><b>Blue hour</b><small>@maya</small></span>
          </div>
          <div class="lp-bubble mine">wear it. trying it on rn ${SPARK}</div>
        </div>
      </article>

      <article class="lp-card lp-card-white lp-small">
        <h3>${FLAME}Keep a streak.</h3>
        <p>Post a fit or a story each day and watch the count climb.</p>
      </article>
      <article class="lp-card lp-card-white lp-small">
        <h3>${SPARK}Ask the Stylist.</h3>
        <p>Not sure what goes with it? Get ideas from the AI stylist.</p>
      </article>
      <article class="lp-card lp-card-white lp-small">
        <h3>Save what you love.</h3>
        <p>Keep looks in My fits and come back to try them on later.</p>
      </article>
    </div>
  </section>`;
}

function steps() {
  const step = (n, title, text) => `<article><span>${n}</span><h3>${title}</h3><p>${text}</p></article>`;
  return `<section class="lp-section lp-steps" id="lp-how">
    <div class="lp-head">
      <p class="lp-kicker">How it works</p>
      <h2 class="lp-h2">Your next fit in three moves.</h2>
    </div>
    <div class="lp-step-grid">
      ${step("01", "Post or try on", "Snap what you're wearing, or try on a look you found.")}
      ${step("02", "Ask your circle", "Add a question and let the people you trust weigh in.")}
      ${step("03", "Wear it, or don't", "Go with the vote, save the look, and keep your streak going.")}
    </div>
  </section>`;
}

function finalCta() {
  return `<section class="lp-final">
    <p class="lp-kicker">Good fits. Better friends.</p>
    <h2 class="lp-h2">Your group chat just got a <em>fitting room.</em></h2>
    <div class="lp-cta-row center">
      ${cta("Get started", "signup")}
      ${cta("Log in", "login", "ghost")}
    </div>
  </section>`;
}

export function renderLanding() {
  return `<div class="lp" id="landing">
    <header class="lp-nav">
      <a href="#lp-top" data-landing-scroll="lp-top" aria-label="Outfitted, back to top">${wordmark}</a>
      <nav class="lp-links" aria-label="Sections">
        <a href="#lp-features" data-landing-scroll="lp-features">Features</a>
        <a href="#lp-how" data-landing-scroll="lp-how">How it works</a>
      </nav>
      <div class="lp-nav-actions">
        <button type="button" class="lp-login" data-landing="login">Log in</button>
        <button type="button" class="lp-btn lp-btn-ink lp-btn-sm" data-landing="signup">Get started</button>
      </div>
    </header>
    <main>
      ${hero()}
      ${ticker()}
      ${features()}
      ${steps()}
      ${finalCta()}
    </main>
    <footer class="lp-foot">
      ${wordmark}
      <p>Post the fit. Ask your people. Wear it with confidence.</p>
      <span>© ${new Date().getFullYear()} Outfitted</span>
    </footer>
  </div>`;
}

export function mountLanding() {
  const root = document.querySelector("#landing");
  if (!root) return;
  root.addEventListener("click", (event) => {
    const scroll = event.target.closest("[data-landing-scroll]");
    if (scroll) {
      event.preventDefault();
      document.getElementById(scroll.dataset.landingScroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const button = event.target.closest("[data-landing]");
    if (button) window.dispatchEvent(new CustomEvent("of:start-onboarding", { detail: { mode: button.dataset.landing } }));
  });
}
