import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * Portal navigation bar with a smooth sliding pill glider behind the active route.
 */
export function PrimaryNav({ items, ariaLabel }) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const [glider, setGlider] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    visible: false,
    animate: false,
  });

  const measure = useCallback((shouldAnimate) => {
    const nav = navRef.current;
    if (!nav) return;

    const activeEl = nav.querySelector('.primary-nav__link--active');
    if (!activeEl) {
      setGlider((prev) =>
        prev.visible || prev.animate ? { ...prev, visible: false, animate: false } : prev
      );
      return;
    }

    const left = activeEl.offsetLeft;
    const top = activeEl.offsetTop;
    const width = activeEl.offsetWidth;
    const height = activeEl.offsetHeight;

    setGlider((prev) => ({
      left,
      top,
      width,
      height,
      visible: true,
      animate: shouldAnimate && prev.visible,
    }));
  }, []);

  useLayoutEffect(() => {
    measure(true);
  }, [pathname, items, measure]);

  useEffect(() => {
    let active = true;
    const nav = navRef.current;
    if (!nav) return undefined;

    const handleResize = () => measure(false);
    window.addEventListener('resize', handleResize);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize);
      observer.observe(nav);
    }

    document.fonts?.ready?.then(() => {
      if (active) measure(false);
    });

    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [measure]);

  return (
    <nav
      ref={navRef}
      className={`primary-nav ${glider.visible ? 'primary-nav--gliding' : ''}`}
      aria-label={ariaLabel}
    >
      <span
        className={`primary-nav__glider ${glider.animate ? 'primary-nav__glider--animate' : ''}`}
        aria-hidden="true"
        style={{
          width: `${glider.width}px`,
          height: `${glider.height}px`,
          transform: `translate3d(${glider.left}px, ${glider.top}px, 0)`,
          opacity: glider.visible ? 1 : 0,
        }}
      />
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `primary-nav__link ${isActive ? 'primary-nav__link--active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
