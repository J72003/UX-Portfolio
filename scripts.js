/* ============================================================
   PORTFOLIO — motion & interactions
   Lenis v1 (smooth scroll) + GSAP 3 + ScrollTrigger
   Falls back to CSS transitions + IntersectionObserver when
   libraries are unavailable or prefers-reduced-motion is set.
   ============================================================ */

(function () {
  'use strict';

  /* ── 0. MOTION PREFERENCE ─────────────────────────────────── */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. PAGE TRANSITION OVERLAY ───────────────────────────── */
  const overlay = document.getElementById('page-overlay');

  if (overlay && typeof gsap !== 'undefined' && !reduced) {
    // Curtain retreats upward, revealing the page beneath
    gsap.to(overlay, {
      scaleY: 0,
      transformOrigin: 'top',
      duration: 0.85,
      ease: 'power2.inOut',
      delay: 0.05,
    });

    // Wire departure transition to all same-site links
    let leaving = false;
    document.addEventListener('click', (e) => {
      if (leaving) return;
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('#') ||
        link.target === '_blank'
      ) return;

      e.preventDefault();
      leaving = true;
      // Curtain sweeps up from the bottom to cover the page
      gsap.fromTo(
        overlay,
        { scaleY: 0, transformOrigin: 'bottom' },
        {
          scaleY: 1,
          duration: 0.52,
          ease: 'power2.inOut',
          onComplete() { window.location.href = href; },
        }
      );
    });

  } else if (overlay) {
    overlay.style.display = 'none';
  }

  /* ── 2. LENIS SMOOTH SCROLL ───────────────────────────────── */
  let lenis = null;

  if (typeof Lenis !== 'undefined' && !reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function tick(t) {
        lenis.raf(t);
        requestAnimationFrame(tick);
      });
    }
  }

  /* ── 3. NAV: scroll state ─────────────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── 4. LIVE TIME ─────────────────────────────────────────── */
  const timeEl = document.querySelector('[data-time]');
  if (timeEl) {
    const update = () => {
      timeEl.textContent =
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/Chicago',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }) + ' CT';
    };
    update();
    setInterval(update, 30000);
  }

  /* ── 5. GSAP ANIMATIONS ───────────────────────────────────── */
  if (typeof gsap !== 'undefined' && !reduced) {

    gsap.registerPlugin(ScrollTrigger);

    // Keep ScrollTrigger positions in sync with Lenis
    if (lenis) lenis.on('scroll', ScrollTrigger.update);

    /* ·· Word splitter ··
       Wraps each word (and inline elements like <em>) in an
       overflow:hidden clip span + an animated inner span.
       Preserves <br> tags and nested HTML intact.            */
    function wrapWords(el) {
      const spans = [];
      const nodes = Array.from(el.childNodes);
      el.innerHTML = '';

      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent.split(/(\s+)/).forEach((token) => {
            if (/^\s+$/.test(token)) {
              el.appendChild(document.createTextNode(token));
            } else if (token) {
              const clip  = document.createElement('span');
              clip.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:0.18em;margin-bottom:-0.18em;';
              const inner = document.createElement('span');
              inner.style.cssText = 'display:inline-block;will-change:transform;';
              inner.textContent = token;
              clip.appendChild(inner);
              el.appendChild(clip);
              spans.push(inner);
            }
          });
        } else if (node.tagName === 'BR') {
          el.appendChild(node);
        } else {
          // Inline element (em, strong …) — treat as one animated unit
          const clip  = document.createElement('span');
          clip.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:0.18em;margin-bottom:-0.18em;';
          const inner = document.createElement('span');
          inner.style.cssText = 'display:inline-block;will-change:transform;';
          inner.appendChild(node);
          clip.appendChild(inner);
          el.appendChild(clip);
          spans.push(inner);
        }
      });

      return spans;
    }

    /* ·· Hero entrance — index.html ·· */
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      // Detach hero-content from the CSS stagger system; GSAP drives it
      const heroContent = document.querySelector('.hero-content');
      if (heroContent) heroContent.classList.remove('reveal-stagger');

      const words = wrapWords(heroTitle);
      gsap.set('.hero-eyebrow, .hero-sub, .hero-meta', { opacity: 0, y: 20 });

      // Timeline starts as the overlay is nearly done lifting
      gsap.timeline({ delay: 0.65 })
        .from(words, {
          y: '115%',
          duration: 1.0,
          stagger: 0.055,
          ease: 'power3.out',
        })
        .to(
          '.hero-eyebrow, .hero-sub, .hero-meta',
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.12, ease: 'power3.out' },
          '-=0.5'
        );
    }

    /* ·· Case study hero ·· */
    const caseTitle = document.querySelector('.case-title');
    if (caseTitle) {
      // Remove .reveal so ScrollTrigger doesn't double-fire these elements
      ['.case-eyebrow', '.case-summary', '.case-meta'].forEach((sel) =>
        document.querySelectorAll(sel).forEach((el) => el.classList.remove('reveal'))
      );

      const words = wrapWords(caseTitle);
      gsap.set('.case-eyebrow, .case-summary, .case-meta', { opacity: 0, y: 16 });

      gsap.timeline({ delay: 0.45 })
        .from(words, {
          y: '115%',
          duration: 0.9,
          stagger: 0.04,
          ease: 'power3.out',
        })
        .to(
          '.case-eyebrow, .case-summary, .case-meta',
          { opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out' },
          '-=0.35'
        );
    }

    /* ·· Scroll-triggered reveals ··
       GSAP drives .reveal directly; .reveal-stagger gets
       the existing CSS stagger by toggling the .in class.  */
    document.querySelectorAll('.reveal').forEach((el) => { el.style.transition = 'none'; });
    gsap.set('.reveal', { clipPath: 'inset(0 0 100% 0)', opacity: 1, y: 0 });

    ScrollTrigger.batch('.reveal', {
      onEnter: (batch) =>
        gsap.to(batch, {
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.9,
          stagger: 0.07,
          ease: 'power3.out',
        }),
      start: 'top 88%',
      once: true,
    });

    ScrollTrigger.batch('.reveal-stagger', {
      onEnter: (batch) => batch.forEach((el) => el.classList.add('in')),
      start: 'top 88%',
      once: true,
    });

    /* ·· Hero parallax — content drifts slightly slower than scroll ·· */
    if (heroTitle) {
      gsap.to('.hero-content', {
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    /* ·· Magnetic work cards ·· */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.work-link').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width * 10;
          const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height * 5;
          gsap.to(card, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
        });
      });
    }

  } else {
    /* ── Fallback: CSS transitions + IntersectionObserver ────── */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
          }),
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      document.querySelectorAll('.reveal, .reveal-stagger').forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll('.reveal, .reveal-stagger').forEach((el) => el.classList.add('in'));
    }
  }

  /* ── 5.5. READING PROGRESS BAR (case studies only) ──────────── */
  if (document.querySelector('.case-body')) {
    const bar = document.createElement('div');
    bar.id = 'reading-progress';
    document.body.prepend(bar);
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

  /* ── 6. CUSTOM CURSOR (desktop pointer only) ──────────────── */
  if (
    typeof gsap !== 'undefined' &&
    !reduced &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  ) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
    document.body.classList.add('has-custom-cursor');

    document.addEventListener('mousemove', (e) => {
      gsap.set(cursor, { x: e.clientX, y: e.clientY });
    });
    document.addEventListener('mouseleave', () => gsap.to(cursor, { opacity: 0, duration: 0.15 }));
    document.addEventListener('mouseenter', () => gsap.to(cursor, { opacity: 1, duration: 0.15 }));

    document.querySelectorAll('a, button, .artifact-svg, .work-link').forEach((el) => {
      el.addEventListener('mouseenter', () =>
        gsap.to(cursor, { scale: 2.2, duration: 0.25, ease: 'power2.out' })
      );
      el.addEventListener('mouseleave', () =>
        gsap.to(cursor, { scale: 1, duration: 0.25, ease: 'power2.out' })
      );
    });
  }

  /* ── 7. LIGHTBOX ──────────────────────────────────────────── */
  const artifacts = document.querySelectorAll('.artifact-svg');
  if (artifacts.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Artifact enlarged view');

    const frame = document.createElement('div');
    frame.className = 'lightbox-frame';
    lb.appendChild(frame);
    document.body.appendChild(lb);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close enlarged view');
    closeBtn.textContent = '×';
    document.body.appendChild(closeBtn);

    const closeLightbox = () => {
      lb.classList.remove('open');
      closeBtn.classList.remove('open');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      frame.innerHTML = '';
    };

    const openLightbox = (svgEl) => {
      frame.appendChild(svgEl.cloneNode(true));
      lb.classList.add('open');
      closeBtn.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    };

    artifacts.forEach((wrap) => {
      const svg = wrap.querySelector('svg');
      if (!svg) return;
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('aria-label', 'Enlarge artifact');
      wrap.addEventListener('click', () => openLightbox(svg));
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(svg); }
      });
    });

    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
    });
  }

  /* ── 8. KEYBOARD SHORTCUTS ────────────────────────────────── */
  /* g + h = home · g + w = work · g + a = about · g + c = contact */
  let gPressed = false, gTimer;
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'g') {
      gPressed = true;
      clearTimeout(gTimer);
      gTimer = setTimeout(() => (gPressed = false), 800);
      return;
    }
    if (gPressed) {
      const map = { h: '#top', w: '#work', a: '#about', c: '#contact' };
      const el  = document.querySelector(map[e.key]);
      if (el) lenis ? lenis.scrollTo(el, { offset: -80 }) : el.scrollIntoView({ behavior: 'smooth' });
      gPressed = false;
    }
  });

})();
