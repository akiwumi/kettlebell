/**
 * GetReady.jsx
 *
 * After "Start session": 10-second countdown with first exercise video playing.
 * Coach says "Get ready." automatically (audio was unlocked by the Start session tap).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getExerciseMedia } from '../lib/exerciseMedia';
import { getCoachVoice } from '../lib/profileStorage';
import { unlockAudio, speakGetReady, preloadVoices, playCountdownBeep } from '../lib/coachVoice';
import styles from './GetReady.module.css';

const COUNTDOWN_SECONDS = 10;

export default function GetReady() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exercises = [], workSeconds = 30, rounds = 1 } = location.state || {};

  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [mediaError, setMediaError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const coachVoice = useRef(getCoachVoice());

  const firstExercise = exercises[0] || {};
  const media = getExerciseMedia(firstExercise.id);
  const showVideo = media.video && !mediaError;
  const showImage = media.image && !imageError && !showVideo;

  useEffect(() => {
    preloadVoices();
  }, []);

  // Coach speaks + countdown beep at start; audio was unlocked when user clicked "Start session"
  useEffect(() => {
    unlockAudio();
    playCountdownBeep(660, 150); // Start-of-countdown beep
    if (coachVoice.current && coachVoice.current !== 'off') {
      const t = setTimeout(() => speakGetReady(coachVoice.current), 200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      navigate('/session', { state: { exercises, workSeconds, rounds }, replace: true });
      return;
    }
    const id = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, navigate, exercises, workSeconds, rounds]);

  const videoRefCallback = useCallback((node) => {
    if (!node) return;
    node.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!exercises.length) {
      navigate('/timer-setup', { replace: true });
    }
  }, [exercises.length, navigate]);

  if (!exercises.length) {
    return null;
  }

  return (
    <div className={styles.page} role="presentation">
      <div className={styles.mediaBoundary}>
        {showVideo && (
          <video
            key={firstExercise.id}
            ref={videoRefCallback}
            className={styles.bgVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setMediaError(true)}
          >
            <source src={media.video} type="video/mp4" />
          </video>
        )}
        {showImage && (
          <img
            className={styles.bgImage}
            src={media.image}
            alt=""
            onError={() => setImageError(true)}
          />
        )}
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <p className={styles.hint}>Get set</p>
        <div className={styles.countdown} aria-live="polite">
          {timeLeft}
        </div>
        <p className={styles.label}>Get ready</p>
      </div>
    </div>
  );
}
