import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { hasEventEnded } from '../../utils/dateUtils';
import { Icon } from '../Icon';

const IFRAME_WIDTH = 1360;
const IFRAME_HEIGHT = 840;
const AUTO_ADVANCE_MS = 6500;

function getReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HeroShowcase() {
  if (typeof window !== 'undefined' && window.self !== window.top) {
    return null;
  }
  return <HeroShowcaseLive />;
}

function HeroShowcaseLive() {
  const { events } = useEvents('public');

  const scenes = useMemo(() => {
    const published = events
      .filter((ev) => ev.status === 'published')
      .sort((a, b) => {
        const aEnded = hasEventEnded(a) ? 1 : 0;
        const bEnded = hasEventEnded(b) ? 1 : 0;
        if (aEnded !== bEnded) return aEnded - bEnded;
        return String(a.startsAt || '').localeCompare(String(b.startsAt || ''));
      });

    const seatedEvent = published.find((ev) => ev.registrationMode === 'seated') || null;
    const detailEvent =
      published.find((ev) => ev.registrationMode !== 'seated') ||
      published.find((ev) => ev.id !== seatedEvent?.id) ||
      published[0] ||
      null;

    const list = [
      {
        id: 'explore',
        num: '01',
        label: 'สำรวจอีเวนต์',
        iframeSrc: '/user?embed=1',
        displayUrl: 'pulse.chiqq888.me/user',
      },
    ];

    if (detailEvent) {
      list.push({
        id: 'detail',
        num: '02',
        label: 'อ่านรายละเอียด',
        iframeSrc: `/user/events/${detailEvent.id}?embed=1`,
        displayUrl: `pulse.chiqq888.me/user/events`,
        // displayUrl: `pulse.chiqq888.me/user/events/${detailEvent.id}`,

      });
    }

    if (seatedEvent) {
      list.push({
        id: 'seatmap',
        num: detailEvent ? '03' : '02',
        label: 'เลือกที่นั่ง',
        iframeSrc: `/user/events/${seatedEvent.id}?embed=1&focus=seatmap`,
        displayUrl: `pulse.chiqq888.me/user/events`,
        // displayUrl: `pulse.chiqq888.me/user/events/${seatedEvent.id}`,

      });
    }

    return list;
  }, [events]);

  const [activeScene, setActiveScene] = useState(0);
  const [autoPlay, setAutoPlay] = useState(() => !getReducedMotion());
  const [isHovered, setIsHovered] = useState(false);
  const [mountedIds, setMountedIds] = useState(['explore']);
  const [loadedIds, setLoadedIds] = useState({});
  const [viewportWidth, setViewportWidth] = useState(0);
  const viewportRef = useRef(null);

  const safeIndex = Math.min(activeScene, Math.max(0, scenes.length - 1));
  const currentScene = scenes[safeIndex];

  useEffect(() => {
    if (activeScene !== safeIndex) {
      setActiveScene(safeIndex);
    }
  }, [activeScene, safeIndex]);

  useEffect(() => {
    setMountedIds((prev) => {
      const next = new Set(prev);
      next.add(currentScene.id);
      if (loadedIds.explore) {
        scenes.forEach((scene) => next.add(scene.id));
      }
      return next.size === prev.length ? prev : Array.from(next);
    });
  }, [loadedIds.explore, scenes, currentScene.id]);

  useEffect(() => {
    if (!autoPlay || isHovered || scenes.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveScene((prev) => (prev + 1) % scenes.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [autoPlay, isHovered, scenes.length]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'pulse-embed-interact') {
        setAutoPlay(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;

    const updateWidth = () => {
      const width = node.getBoundingClientRect().width;
      if (width > 0) {
        setViewportWidth(width);
      }
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const markLoaded = useCallback((sceneId) => {
    setLoadedIds((prev) => (prev[sceneId] ? prev : { ...prev, [sceneId]: true }));
  }, []);

  const goToScene = (index) => {
    const target = scenes[index];
    if (target) {
      setMountedIds((prev) => (prev.includes(target.id) ? prev : [...prev, target.id]));
    }
    setActiveScene(index);
    setAutoPlay(false);
  };

  const toggleAutoPlay = () => {
    if (scenes.length <= 1) return;
    setAutoPlay((prev) => !prev);
  };

  const scale = viewportWidth > 0 ? viewportWidth / IFRAME_WIDTH : 1;
  const viewportHeight = viewportWidth > 0 ? Math.round(IFRAME_HEIGHT * scale) : undefined;
  const isCurrentLoaded = Boolean(loadedIds[currentScene.id]);
  const mountedScenes = scenes.filter((scene) => mountedIds.includes(scene.id));

  return (
    <div className="lp-screen-stage">
      <div className="lp-screen-glow" aria-hidden="true" />

      <div className="lp-screen-frame" aria-label="หน้าจอตัวอย่างจริงของระบบ PULSE">
        {/* Browser Window Chrome */}
        <div className="lp-screen-chrome">
          <div className="lp-chrome-dots" aria-hidden="true">
            <span className="lp-chrome-dot lp-chrome-dot--red" />
            <span className="lp-chrome-dot lp-chrome-dot--yellow" />
            <span className="lp-chrome-dot lp-chrome-dot--green" />
          </div>

          <div className="lp-chrome-url" title={currentScene.displayUrl}>
            <Icon name="shieldCheck" size={12} />
            <span>{currentScene.displayUrl}</span>
          </div>

          <div className="lp-chrome-controls">
            <button
              type="button"
              className="lp-chrome-toggle"
              onClick={toggleAutoPlay}
              aria-pressed={autoPlay}
              disabled={scenes.length <= 1}
            >
              {autoPlay ? 'หยุดสลับหน้า' : 'เล่นอัตโนมัติ'}
            </button>
          </div>
        </div>

        {/* Simulated In-App Navigation Bar */}
        <div className="lp-app-bar">
          <img
            src="/images/pulse-logo.svg"
            alt="PULSE"
            width="58"
            height="22"
            className="lp-app-bar__logo"
          />

          <div
            className="lp-app-tabs"
            role="tablist"
            aria-label="เลือกดูตัวอย่างหน้าเว็บจริงของระบบ"
          >
            {scenes.map((scene, idx) => {
              const isActive = safeIndex === idx;
              return (
                <button
                  key={scene.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`lp-app-tab ${isActive ? 'lp-app-tab--active' : ''}`}
                  onClick={() => goToScene(idx)}
                >
                  <span className="lp-app-tab__num">{scene.num}</span>
                  <span>{scene.label}</span>
                  {isActive && scenes.length > 1 && (
                    <span
                      key={`${safeIndex}-${autoPlay ? 'run' : 'pause'}`}
                      className={`lp-app-tab__progress ${
                        autoPlay ? 'lp-app-tab__progress--running' : ''
                      }${autoPlay && isHovered ? ' lp-app-tab__progress--paused' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real Scaled Live Page Showcase */}
        <div className="lp-screen-body lp-screen-body--live">
          <div
            ref={viewportRef}
            className="lp-live-viewport"
            style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {mountedScenes.map((scene) => {
              const isActive = scene.id === currentScene.id;
              return (
                <div
                  key={scene.id}
                  className={`lp-live-layer ${isActive ? 'lp-live-layer--active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <iframe
                    src={scene.iframeSrc}
                    title={`หน้าตัวอย่างจริง: ${scene.label}`}
                    className="lp-live-iframe"
                    width={IFRAME_WIDTH}
                    height={IFRAME_HEIGHT}
                    loading="eager"
                    tabIndex={isActive ? 0 : -1}
                    style={{ transform: `scale(${scale})` }}
                    onLoad={() => markLoaded(scene.id)}
                  />
                </div>
              );
            })}

            {!isCurrentLoaded && (
              <div className="lp-live-skeleton" aria-hidden="true">
                <div className="lp-live-skeleton__nav lp-skeleton-shimmer" />
                <div className="lp-live-skeleton__hero lp-skeleton-shimmer" />
                <div className="lp-live-skeleton__grid">
                  <div className="lp-live-skeleton__card lp-skeleton-shimmer" />
                  <div className="lp-live-skeleton__card lp-skeleton-shimmer" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
