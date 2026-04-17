/**
 * reveal.ts — Scroll-reveal via IntersectionObserver
 *
 * Zero React re-renders. Pure DOM/CSS.
 * Call initReveal() once in main.tsx after mount.
 * Elements with class "reveal" animate in when they enter the viewport.
 * Elements with class "reveal-stagger" stagger their children.
 * Once visible, the class is pinned — no re-animation on scroll-up.
 */

export function initReveal() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Immediately show all reveal elements — no animation
    document.querySelectorAll<HTMLElement>('.reveal, .reveal-item').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;

        // Stagger parent: animate children with 60ms offset
        if (el.classList.contains('reveal-stagger')) {
          const children = Array.from(
            el.querySelectorAll<HTMLElement>(':scope > .reveal-item, :scope > [data-reveal-item]')
          );
          if (children.length === 0) {
            // No tagged children — stagger direct children
            Array.from(el.children).forEach((child, i) => {
              const c = child as HTMLElement;
              c.style.transitionDelay = `${i * 60}ms`;
              c.classList.add('visible');
              setTimeout(() => { c.style.transitionDelay = ''; }, 800);
            });
          } else {
            children.forEach((child, i) => {
              child.style.transitionDelay = `${i * 60}ms`;
              child.classList.add('visible');
              setTimeout(() => { child.style.transitionDelay = ''; }, 800);
            });
          }
          el.classList.add('visible');
        } else {
          el.classList.add('visible');
        }

        io.unobserve(el); // Fire once — never re-animate
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  function observeAll() {
    document.querySelectorAll<HTMLElement>('.reveal, .reveal-stagger').forEach(el => {
      if (!el.classList.contains('visible')) {
        io.observe(el);
      }
    });
  }

  // Initial scan
  observeAll();

  // Re-scan when new content mounts (lazy-loaded pages)
  const mo = new MutationObserver(() => observeAll());
  mo.observe(document.body, { childList: true, subtree: true });
}
