/**
 * GetReady.jsx
 *
 * After "Start session": 10-second countdown with first exercise video playing.
 * Coach says "Get ready." on first tap (unlocks audio). Then flows into Session.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getExerciseMedia } from '../lib/exerciseMedia';
import { getCoachVoice } from '../lib/profileStorage';
import { unlockAudio, speakGetReady, preloadVoices } from '../lib/coachVoice';
import styles from './GetReady.module.css';

const COUNTDOWN_SECONDS = 10;

export default function GetReady() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exercises = [], workSeconds = 30, rounds = 1 } = location.state || {};

  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [mediaError, setMediaError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const audioUnlockedRef = useRef(false);
  const coachVoice = useRef(getCoachVoice());

  const firstExercise = exercises[0] || {};
  const media = getExerciseMedia(firstExercise.id);
  const showVideo = media.video && !mediaError;
  const showImage = media.image && !imageError && !showVideo;

  useEffect(() => {
    preloadVoices();
  }, []);

  const handleTap = () => {
    if (!audioUnlockedRef.current) {
      unlockAudio();
      audioUnlockedRef.current = true;
      if (coachVoice.current && coachVoice.current !== 'off') {
        speakGetReady(coachVoice.current);
      }
    }
  };

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
    <div className={styles.page} onClick={handleTap} role="presentation">
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
        <p className={styles.hint}>
          {coachVoice.current && coachVoice.current !== 'off' ? 'Tap to hear coach' : 'Tap to continue'}
        </p>
        <div className={styles.countdown} aria-live="polite">
          {timeLeft}
        </div>
        <p className={styles.label}>Get ready</p>
      </div>
    </div>
  );
}
