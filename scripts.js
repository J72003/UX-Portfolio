/* ============================================================
   PORTFOLIO — minimal, intentional motion
   ============================================================ */

(function () {
  'use strict';

  /* ---------- NAV: scroll state ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- REVEAL: intersection observer fade-up ---------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- LIVE TIME (nav indicator) ---------- */
  const timeEl = document.querySelector('[data-time]');
  if (timeEl) {
    const update = () => {
      const now = new Date();
      const opts = {
        timeZone: 'America/Chicago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      timeEl.textContent = now.toLocaleTimeString('en-US', opts) + ' SAT';
    };
    update();
    setInterval(update, 30 * 1000);
  }

  /* ---------- LIGHTBOX: click artifact to zoom ---------- */
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
      frame.innerHTML = '';
    };

    const openLightbox = (svgEl) => {
      const clone = svgEl.cloneNode(true);
      clone.removeAttribute('aria-labelledby');
      clone.removeAttribute('id');
      frame.appendChild(clone);
      lb.classList.add('open');
      closeBtn.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    artifacts.forEach((wrap) => {
      const svg = wrap.querySelector('svg');
      if (!svg) return;
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('aria-label', 'Enlarge artifact');
      wrap.style.cursor = 'zoom-in';

      wrap.addEventListener('click', () => openLightbox(svg));
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(svg);
        }
      });
    });

    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });

    closeBtn.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
    });
  }

  /* ---------- KEYBOARD: 'g' shortcuts for fast nav ----------
     g + h = home, g + w = work, g + a = about, g + c = contact
     Personal touch — for the keyboard-shortcut-loving recruiter
     out there.
  ----------------------------------------------------------- */
  let gPressed = false;
  let gTimer;
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'g') {
      gPressed = true;
      clearTimeout(gTimer);
      gTimer = setTimeout(() => (gPressed = false), 800);
      return;
    }
    if (gPressed) {
      const targets = { h: '#top', w: '#work', a: '#about', c: '#contact' };
      const target = targets[e.key];
      if (target) {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      gPressed = false;
    }
  });
})();
