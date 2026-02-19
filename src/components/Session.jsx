/**
 * Session.jsx
 *
 * Live workout screen: Work → 20 s "Next in" countdown → next exercise.
 * Plays per-exercise video (or image) as a full-screen background behind
 * the timer UI.
 *
 * VIDEO-PLAYBACK FIX (the main change):
 *  1.  `key={currentExercise.id}` on the <video> forces React to fully
 *      remount the element when the exercise changes, which is far more
 *      reliable than swapping `src` on a reused element (avoids stale
 *      buffered data and playback promise races).
 *  2.  A callback ref calls `.play()` as soon as the DOM node exists.
 *  3.  `onLoadedData` and `onCanPlay` also call `.play()` as a safety net
 *      (some mobile browsers ignore the autoplay attribute but honour a
 *      programmatic play triggered from these events).
 *  4.  `autoPlay muted loop playsInline` cover the HTML spec requirements
 *      for auto-playing without user gesture.
 *  5.  `<source>` inside `<video>` with explicit `type="video/mp4"` helps
 *      the browser skip codec sniffing.
 *  6.  On video error → fall back to the image; on image error → dark bg.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getExerciseMedia } from '../lib/exerciseMedia';
import { getCoachVoice } from '../lib/profileStorage';
import {
  playCountdownBeep,
  speakStart,
  speakCountdownNumber,
  speakNextExerciseIs,
  speakSessionStart,
  speakSessionComplete,
  preloadVoices,
} from '../lib/coachVoice';
import TimerDisplay from './TimerDisplay';
import SessionProgress from './SessionProgress';
import SessionComplete from './SessionComplete';
import CueList from './CueList';
import styles from './Session.module.css';

// ── Constants ────────────────────────────────────────────────────────
const COUNTDOWN_SECONDS = 10; // "Next in" phase (no pause; next exercise video plays through countdown)

// ── Component ────────────────────────────────────────────────────────
export default function Session() {
  const location = useLocation();
  const navigate = useNavigate();

  // Passed from TimerSetup via router state
  const {
    exercises = [],
    workSeconds = 30,
    rounds = 1,
  } = location.state || {};

  // ── Timer state ──────────────────────────────────────────────────
  const [phase, setPhase] = useState('work');        // 'work' | 'countdown' | 'done'
  const [timeLeft, setTimeLeft] = useState(workSeconds);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [paused, setPaused] = useState(false);

  // ── Media state ──────────────────────────────────────────────────
  const [mediaError, setMediaError] = useState(false);   // video failed
  const [imageError, setImageError] = useState(false);    // image also failed

  // Avoid double-firing on the tick that hits zero
  const justHitZero = useRef(false);
  const coachVoice = useRef(getCoachVoice());
  const sessionStartAnnouncedRef = useRef(false);

  const currentExercise = exercises[exerciseIdx] || {};
  const nextExerciseIdx = exerciseIdx < exercises.length - 1 ? exerciseIdx + 1 : 0;
  const nextExercise = exercises[nextExerciseIdx] || {};
  const displayExercise = phase === 'work' ? currentExercise : nextExercise;
  const media = getExerciseMedia(displayExercise.id);

  // ── Reset media errors when exercise changes ─────────────────────
  useEffect(() => {
    setMediaError(false);
    setImageError(false);
  }, [exerciseIdx]);

  // ── Preload voices on mount ──────────────────────────────────────
  useEffect(() => {
    preloadVoices();
  }, []);

  // ── Cancel speech on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── Coach: session start (audio already unlocked by "Start session" tap) ─────
  useEffect(() => {
    if (
      phase !== 'work' ||
      coachVoice.current === 'off' ||
      !exercises[0]?.name ||
      sessionStartAnnouncedRef.current
    )
      return;
    sessionStartAnnouncedRef.current = true;
    const t = setTimeout(() => speakSessionStart(exercises[0].name, coachVoice.current), 100);
    return () => clearTimeout(t);
  }, [phase, exercises]);

  // ── Coach: announce session complete when phase becomes done ─────
  useEffect(() => {
    if (phase !== 'done' || coachVoice.current === 'off') return;
    speakSessionComplete(coachVoice.current);
  }, [phase]);

  // ── Coach: "Start" at beginning of each work phase ───────────────
  useEffect(() => {
    if (phase !== 'work' || coachVoice.current === 'off') return;
    const t = setTimeout(() => speakStart(coachVoice.current), 80);
    return () => clearTimeout(t);
  }, [phase, exerciseIdx, round]);

  // ── Coach: "And now the next exercise is X" when entering countdown ─
  useEffect(() => {
    if (phase !== 'countdown' || !exercises.length || coachVoice.current === 'off') return;
    const nextIdx = exerciseIdx < exercises.length - 1 ? exerciseIdx + 1 : 0;
    const nextEx = exercises[nextIdx];
    if (!nextEx?.name) return;
    const t = setTimeout(() => speakNextExerciseIs(nextEx.name, coachVoice.current), 120);
    return () => clearTimeout(t);
  }, [phase, exerciseIdx, exercises]);

  // ── Coach: count down last 10 seconds of work (10, 9, … 1) ───────
  useEffect(() => {
    if (phase !== 'work' || paused || coachVoice.current === 'off') return;
    if (timeLeft >= 1 && timeLeft <= 10) {
      speakCountdownNumber(timeLeft, coachVoice.current);
    }
  }, [phase, paused, timeLeft]);

  // ── Countdown beep: "Next in" phase, last 10 seconds ────────────
  useEffect(() => {
    if (phase !== 'countdown' || paused || coachVoice.current === 'off') return;
    if (timeLeft >= 1 && timeLeft <= 10) {
      const freq = timeLeft <= 3 ? 1200 : 880;
      playCountdownBeep(freq, 120);
    }
  }, [phase, paused, timeLeft]);

  // ── Tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'done' || paused) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!justHitZero.current) {
            justHitZero.current = true;
            setTimeout(() => advancePhase(), 0);
          }
          return 0;
        }
        justHitZero.current = false;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, exerciseIdx, round]);

  // ── Phase transitions ─────────────────────────────────────────────
  function advancePhase() {
    justHitZero.current = false;

    if (phase === 'work') {
      // After work → is there a next exercise or next round?
      const lastExercise = exerciseIdx >= exercises.length - 1;
      const lastRound = round >= rounds;

      if (lastExercise && lastRound) {
        setPhase('done');
        return;
      }

      // Start "Next in" countdown
      setPhase('countdown');
      setTimeLeft(COUNTDOWN_SECONDS);

    } else if (phase === 'countdown') {
      // Advance to next exercise (or next round)
      if (exerciseIdx < exercises.length - 1) {
        setExerciseIdx((i) => i + 1);
      } else {
        // next round
        setExerciseIdx(0);
        setRound((r) => r + 1);
      }
      setPhase('work');
      setTimeLeft(workSeconds);
    }
  }

  const togglePause = () => {
    setPaused((p) => !p);
  };
  const quit = () => {
    navigate('/');
  };

  // ── Video ref callback ────────────────────────────────────────────
  // Called once when the <video> mounts (and with null on unmount).
  // Immediately attempts .play() so playback begins ASAP.
  const videoRefCallback = useCallback((node) => {
    if (!node) return;
    node.play().catch(() => {
      /* Autoplay blocked or source missing — error handler will fire */
    });
  }, []);

  // Also try play on these events as a safety net for mobile browsers
  const handleCanPlay = (e) => {
    e.target.play().catch(() => {});
  };

  // ── Render: session complete ──────────────────────────────────────
  if (phase === 'done') {
    return <SessionComplete exercises={exercises} rounds={rounds} />;
  }

  if (!exercises.length) {
    return (
      <div className={styles.empty}>
        <p>No exercises loaded.</p>
        <button onClick={() => navigate('/routine')}>Pick a routine</button>
      </div>
    );
  }

  // ── Background: work = current exercise; countdown = next exercise (plays through into next card)
  const showVideo = (phase === 'work' || phase === 'countdown') && media.video && !mediaError;
  const showImage = (phase === 'work' || phase === 'countdown') && media.image && !imageError && !showVideo;

  return (
    <div className={styles.session} role="presentation">
      {/* ── Background media inside mobile app boundary (max 430px) ─ */}
      <div className={styles.mediaBoundary}>
        {showVideo && (
          <video
            key={displayExercise.id}
            ref={videoRefCallback}
            className={styles.bgVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={handleCanPlay}
            onLoadedData={handleCanPlay}
            onError={() => setMediaError(true)}
          >
            <source src={media.video} type="video/mp4" />
          </video>
        )}

        {showImage && (
          <img
            key={`img-${displayExercise.id}`}
            className={styles.bgImage}
            src={media.image}
            alt=""
            onError={() => setImageError(true)}
          />
        )}

        <div className={styles.overlay} />
      </div>

      {/* ── Session UI: bottom of frame, above bottom nav ─────────── */}
      <div className={styles.content} role="presentation">
        <div className={styles.timerFrame}>
          <SessionProgress
            roundIndex={round - 1}
            rounds={rounds}
            exerciseIndex={exerciseIdx}
            totalExercises={exercises.length}
          />

          <TimerDisplay
            phase={phase}
            timeLeft={timeLeft}
            label={phase === 'work' ? currentExercise.name : nextExercise.name}
            variant="light"
          />

          {phase === 'work' && currentExercise.cues && (
            <CueList cues={currentExercise.cues} />
          )}
        </div>

        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={togglePause}>
            {paused ? '▶ Start' : '⏸ Pause'}
          </button>
          <button
            className={`${styles.controlBtn} ${styles.quit}`}
            onClick={quit}
          >
            ✕ Quit
          </button>
        </div>
      </div>
    </div>
  );
}
