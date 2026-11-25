import { createElement, useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Observes when an element enters the viewport once and triggers reveal state.
 * Immediately marks visible when `prefers-reduced-motion` is enabled or IntersectionObserver is missing.
 */
export function useInView(options = {}) {
  const { threshold = 0.14, rootMargin = '0px 0px -40px 0px' } = options;
  const ref = useRef(null);
  const [inView, setInView] = useState(
    () => prefersReducedMotion() || typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (inView) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, threshold, rootMargin]);

  return [ref, inView];
}

/**
 * Scroll-reveal wrapper that smoothly glides content into view once on intersection.
 */
export function Reveal({ children, className = '', delay = 0, as: Tag = 'div', style, ...props }) {
  const [ref, inView] = useInView();

  const mergedClassName = [
    'lp-reveal',
    inView ? 'lp-reveal--visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createElement(
    Tag,
    {
      ref,
      className: mergedClassName,
      style: { '--reveal-delay': `${delay}ms`, ...style },
      ...props,
    },
    children
  );
}

/**
 * Animated number counter that eases from 0 to `value` on entering the viewport.
 */
export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 900 }) {
  const [ref, inView] = useInView({ threshold: 0.25, rootMargin: '0px 0px -20px 0px' });
  const [displayValue, setDisplayValue] = useState(() =>
    prefersReducedMotion() ? value : 0
  );

  useEffect(() => {
    if (!inView) return undefined;

    if (prefersReducedMotion() || duration <= 0 || value === 0) {
      setDisplayValue(value);
      return undefined;
    }

    let frameId = 0;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out for Apple Keynote crisp deceleration
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [inView, value, duration]);

  return createElement(
    'span',
    { ref, className: 'lp-animated-number' },
    `${prefix}${displayValue}${suffix}`
  );
}
