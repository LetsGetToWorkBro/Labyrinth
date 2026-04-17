/**
 * micro.ts — Labyrinth BJJ micro-interaction utilities
 * Visual layer only. No logic or data changes.
 */

// ── Ripple effect ─────────────────────────────────────────────────
export function addRipple(e: React.MouseEvent | React.TouchEvent, element: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rect = element.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = `${clientX - rect.left}px`;
  ripple.style.top  = `${clientY - rect.top}px`;

  element.classList.add('ripple-container');
  element.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

// ── Number flip — call when a displayed number changes ────────────
export function flashNumFlip(el: HTMLElement | null) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.classList.remove('num-flip-change');
  // Force reflow
  void el.offsetWidth;
  el.classList.add('num-flip-change');
  el.addEventListener('animationend', () => el.classList.remove('num-flip-change'), { once: true });
}

// ── Button success state (morphs label → checkmark for 1.5s) ──────
export function buttonSuccess(btn: HTMLButtonElement | null, originalHTML: string) {
  if (!btn) return;
  btn.innerHTML = `
    <span class="btn-success-check">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Done
    </span>`;
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }, 1500);
}

// ── Input error shake ──────────────────────────────────────────────
export function shakeInput(input: HTMLInputElement | HTMLTextAreaElement | null) {
  if (!input || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  input.classList.add('input-error');
  input.addEventListener('animationend', () => input.classList.remove('input-error'), { once: true });
}
