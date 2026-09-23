import { useCallback, useEffect, useRef, useState } from "react";

const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const CYCLE_MS = INHALE_MS + EXHALE_MS;

type BreathPhase = "inhale" | "exhale";

type BreathDisplay = {
  phase: BreathPhase;
  secondsLeft: number;
};

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="12" cy="16" r="8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="20" cy="16" r="8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6v12M15 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 6 9 6-9 6V6Z" fill="currentColor" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 11a7.5 7.5 0 1 1 1.65 5.25M4.5 16.5v-5.25h5.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [display, setDisplay] = useState<BreathDisplay>({ phase: "inhale", secondsLeft: 4 });
  const elapsedRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const guideButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const updateBreath = useCallback((elapsed: number) => {
    const position = elapsed % CYCLE_MS;
    const isInhaling = position < INHALE_MS;
    const phase: BreathPhase = isInhaling ? "inhale" : "exhale";
    const phaseProgress = isInhaling
      ? position / INHALE_MS
      : (position - INHALE_MS) / EXHALE_MS;
    const easedProgress = (1 - Math.cos(Math.PI * phaseProgress)) / 2;
    const scale = isInhaling
      ? 0.76 + 0.36 * easedProgress
      : 1.12 - 0.36 * easedProgress;

    stageRef.current?.style.setProperty("--breath-scale", scale.toString());

    const secondsLeft = Math.ceil(
      (isInhaling ? INHALE_MS - position : CYCLE_MS - position) / 1000,
    );
    setDisplay((previous) =>
      previous.phase === phase && previous.secondsLeft === secondsLeft
        ? previous
        : { phase, secondsLeft },
    );
  }, []);

  useEffect(() => {
    updateBreath(elapsedRef.current);
    if (!isPlaying) return;

    let frameId: number;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      elapsedRef.current += now - lastFrame;
      lastFrame = now;
      updateBreath(elapsedRef.current);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, updateBreath]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setIsPlaying(false);
    };

    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  useEffect(() => {
    if (!showGuide) return;
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGuide();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showGuide]);

  const closeGuide = () => {
    setShowGuide(false);
    requestAnimationFrame(() => guideButtonRef.current?.focus());
  };

  const restart = () => {
    elapsedRef.current = 0;
    updateBreath(0);
    setIsPlaying(true);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="small-brand" aria-label="Zen-Pulse">
          <span className="brand-symbol"><BrandMark /></span>
          <span>zen-pulse</span>
        </div>
        <button
          ref={guideButtonRef}
          className="guide-button"
          type="button"
          aria-label="How it works"
          onClick={() => setShowGuide(true)}
        >
          <span aria-hidden="true">i</span>
        </button>
      </header>

      <main className="main-content">
        <div className="intro">
          <p className="eyebrow">A QUIET MOMENT BEFORE YOUR OGE</p>
          <h1>Zen-Pulse<span className="title-period">.</span></h1>
          <p className="intro-description">A little calm, one breath at a time.</p>
        </div>

        <div className="breathing-area">
          <div className="breath-stage" ref={stageRef}>
            <div className="guide-ring guide-ring-outer" aria-hidden="true" />
            <div className="guide-ring guide-ring-inner" aria-hidden="true" />
            <div className="breath-halo" aria-hidden="true" />
            <div className="breath-orb" aria-hidden="true" />
            <div className="orb-content">
              <span className="orb-label" key={isPlaying ? display.phase : "paused"}>
                {isPlaying
                  ? display.phase === "inhale" ? "Breathe in" : "Breathe out"
                  : "Paused"}
              </span>
              <span className="orb-countdown">
                {isPlaying
                  ? `${display.secondsLeft} ${display.secondsLeft === 1 ? "second" : "seconds"}`
                  : "Take your time"}
              </span>
            </div>
          </div>

          <div className="rhythm-guide" aria-label="Breathe in for 4 seconds, then out for 6 seconds">
            <span className={isPlaying && display.phase === "inhale" ? "rhythm-active" : ""}>
              INHALE <strong>4s</strong>
            </span>
            <span className="rhythm-divider" aria-hidden="true" />
            <span className={isPlaying && display.phase === "exhale" ? "rhythm-active" : ""}>
              EXHALE <strong>6s</strong>
            </span>
          </div>
          <span className="sr-only" aria-live="polite">
            {isPlaying
              ? display.phase === "inhale" ? "Breathe in" : "Breathe out"
              : "Breathing paused"}
          </span>
        </div>
      </main>

      <footer className="footer">
        <div className="controls">
          <button
            className="primary-button"
            type="button"
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
            <span>{isPlaying ? "Pause breathing" : "Continue breathing"}</span>
          </button>
          <button className="restart-button" type="button" onClick={restart} aria-label="Start again">
            <RestartIcon />
          </button>
        </div>
        <p className="footer-note">There is nowhere else you need to be right now.</p>
      </footer>

      {showGuide && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeGuide();
        }}>
          <section className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-title">
            <button
              ref={closeButtonRef}
              type="button"
              className="dialog-close"
              aria-label="Close guide"
              onClick={closeGuide}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
            <p className="eyebrow">THE 4-6 RHYTHM</p>
            <h2 id="guide-title">Just follow the circle.</h2>
            <p>As it grows, breathe in gently for 4 seconds. As it gets smaller, breathe out slowly for 6 seconds.</p>
            <p>There is no perfect way to do this. Take the pause you need before your OGE exam.</p>
            <button type="button" className="dialog-action" onClick={closeGuide}>
              Back to breathing
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
