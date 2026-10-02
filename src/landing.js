// Signed-out landing page, ported from the Outfitted waitlist site. Waitlist forms became account actions:
// any element with data-auth-open="signin" | "signup" opens the account dialog in that mode.

export function landingPage() {
  return `
    <header class="site-nav">
      <a class="wordmark" href="#top" aria-label="Outfitted home">OUTFITTED<span class="wordmark-dot">.</span></a>
      <nav aria-label="Main navigation">
        <a href="#experience">The experience</a>
        <a href="#fit-check">Fit check</a>
      </nav>
      <div class="nav-actions">
        <button type="button" class="nav-signin" data-auth-open="signin">Sign in</button>
        <button type="button" class="button" data-auth-open="signup">Get started</button>
      </div>
    </header>

    <section class="hero" id="top">
      <div class="hero-copy">
        <div class="eyebrow"><span aria-hidden="true">✦</span> Your virtual fitting room, everywhere</div>
        <h1>See the outfit on <em>you</em> before the box arrives.</h1>
        <p class="hero-lede">
          Try on pieces from select stores with your private avatar, build a complete fit,
          and send it to friends who can wear it too. We're starting with supported
          retailers and working toward a fitting room that travels wherever you shop.
        </p>
        <form class="start-form" id="landing-start">
          <label class="sr-only" for="landing-email">Email address</label>
          <input id="landing-email" type="email" autocomplete="email" placeholder="you@school.edu" required />
          <button class="button" type="submit">Get started <span aria-hidden="true">→</span></button>
        </form>
        <p class="form-note">Already have an account? <button type="button" data-auth-open="signin">Sign in</button></p>
      </div>

      <div class="hero-visual">
        <img
          class="hero-image"
          src="./assets/landing/outfitted-hero.webp"
          alt="Before and after virtual outfit preview showing the same shopper in a starting outfit and an Outfitted styled look"
          width="480"
          height="400"
        />
        <div class="item-stack"><span>3 pieces</span><strong>One complete fit</strong></div>
      </div>
    </section>

    <section class="proof-strip" aria-label="Why Outfitted matters">
      <div><strong>20–40%</strong><span>estimated online apparel return rate</span></div>
      <div><strong>One avatar</strong><span>for try-ons at supported stores</span></div>
      <div><strong>One tap</strong><span>for friends to try your fit</span></div>
    </section>

    <section class="experience" id="experience">
      <div class="section-heading">
        <p class="kicker">FROM SCREENSHOT TO OUTFIT</p>
        <h2>Trying it on is only the beginning.</h2>
        <p>Outfitted turns isolated product photos into something personal, social, and easier to trust.</p>
      </div>

      <div class="feature-grid">
        <article class="feature-card feature-primary">
          <div class="feature-number">01</div>
          <div class="avatar-copy">
            <div class="feature-icon" aria-hidden="true">⌗</div>
            <h3>A detailed 3D version of you.</h3>
            <p>
              Create a reusable digital body model with the shape and proportions needed
              for more meaningful fit checks and realistic clothing simulation, not just a
              look-alike profile picture.
            </p>
            <div class="avatar-inputs" aria-label="Ways to build your avatar">
              <span>⌗ A few photos</span>
              <span>▶ Optional guided video</span>
              <span>↔ Basic measurements</span>
            </div>
          </div>
          <div class="avatar-render" aria-label="Front and side views of an Outfitted body avatar scan">
            <div class="avatar-view">
              <img class="avatar-image" src="./assets/landing/avatar-scan.webp" alt="Front view of a 3D body avatar with measurement landmarks and a simulated blue jacket" width="360" height="601" loading="lazy" />
            </div>
            <div class="avatar-view">
              <img class="avatar-image" src="./assets/landing/avatar-side-scan.webp" alt="Side view of a 3D body avatar with measurement landmarks and a simulated blue jacket" width="1122" height="1402" loading="lazy" />
            </div>
          </div>
        </article>

        <article class="feature-card feature-share">
          <div class="feature-number">02</div>
          <div class="feature-icon" aria-hidden="true">💬</div>
          <h3>Send the fit, not a screenshot.</h3>
          <p>
            Every shared look keeps the exact pieces and shopping links. Your friend can
            tap <strong>Try this on</strong> and see the whole outfit on their own avatar.
          </p>
          <div class="share-preview" aria-hidden="true">
            <div class="mini-avatar">A</div>
            <div><span>Maya shared a fit</span><strong>Blue hour</strong></div>
            <span class="share-cta">Try this on <span>›</span></span>
          </div>
        </article>
      </div>
    </section>

    <section class="fit-section" id="fit-check">
      <div class="fit-copy">
        <div class="eyebrow dark"><span aria-hidden="true">↔</span> Quick Fit Check</div>
        <h2>A fast answer before a full try-on.</h2>
        <p>
          Sometimes you don't need a new image; you need to know whether the medium will
          sit the way you expect. We compare your measurements and fit preferences with
          the item's size, cut, dimensions, and material behavior.
        </p>
        <ul>
          <li><span class="check">✓</span> Faster than generating a full look</li>
          <li><span class="check">✓</span> Specific to you and the exact item</li>
          <li><span class="check">✓</span> Designed to improve as vendor data gets richer</li>
        </ul>
      </div>

      <div class="fit-panel">
        <div class="fit-panel-top">
          <div class="product-thumb" aria-hidden="true">👕</div>
          <div><span>Oversized poplin shirt</span><strong>Size M</strong></div>
          <div class="match-score">87<span>% match</span></div>
        </div>
        <div class="recommendation">
          <span class="pulse-dot"></span>
          <div><strong>Likely relaxed through the chest</strong><p>Sleeves may run 1–2 cm long based on your preference.</p></div>
        </div>
        <div class="signal-grid">
          <div><span>Size</span><strong>M</strong></div>
          <div><span>Cut</span><strong>Relaxed</strong></div>
          <div><span>Stretch</span><strong>Low</strong></div>
          <div><span>Drape</span><strong>Structured</strong></div>
        </div>
        <div class="confidence-bar"><span></span></div>
        <small>Fit guidance is an estimate, not a guarantee.</small>
      </div>
    </section>

    <section class="clothing-data">
      <div class="data-copy">
        <div class="eyebrow"><span aria-hidden="true">⌁</span> A richer language for clothing</div>
        <h2>Because "medium, blue" doesn't tell you how it wears.</h2>
      </div>
      <div class="data-cloud" aria-label="Clothing properties Outfitted can represent">
        <span class="data-pill">linen blend</span><span class="data-pill pill-1">midweight</span><span class="data-pill pill-2">low stretch</span><span class="data-pill pill-3">structured</span><span class="data-pill">breathable</span><span class="data-pill pill-1">soft texture</span><span class="data-pill pill-2">relaxed cut</span><span class="data-pill pill-3">fluid drape</span>
      </div>
      <p class="data-note">
        We're building a consistent clothing profile across products and vendors, so fit
        advice can account for how a garment behaves, not just the number on its tag.
      </p>
    </section>

    <section class="steps">
      <div class="section-heading small">
        <p class="kicker">HOW IT WORKS</p>
        <h2>Your next fit in three moves.</h2>
      </div>
      <div class="step-grid">
        <article><span>1</span><h3>Build your avatar</h3><p>Add a few photos, an optional guided video, and basic measurements once.</p></article>
        <article><span>2</span><h3>Add a supported item</h3><p>Paste a product link or upload a clean screenshot from a supported store.</p></article>
        <article><span>3</span><h3>Try, check, share</h3><p>See the look, check the likely fit, and ask your people.</p></article>
      </div>
    </section>

    <section class="final-cta">
      <p class="kicker">START YOUR FITTING ROOM</p>
      <h2>Your group chat is about to get a fitting room.</h2>
      <p>Build your avatar once, then try, check, and share every fit with your people.</p>
      <div class="final-actions">
        <button type="button" class="button" data-auth-open="signup">Create your account <span aria-hidden="true">→</span></button>
        <button type="button" class="button button-outline" data-auth-open="signin">Sign in</button>
      </div>
    </section>

    <footer>
      <a class="wordmark" href="#top">OUTFITTED<span class="wordmark-dot">.</span></a>
      <p>Try the fit. Ask your people. Buy with confidence.</p>
      <span>© 2026 Outfitted</span>
    </footer>`;
}
