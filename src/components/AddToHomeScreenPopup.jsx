import { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import styles from './AddToHomeScreenPopup.module.css';

const STORAGE_KEY = 'kettlebell-add-to-homescreen-dismissed';

function getIsStandalone() {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function getIsIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

export default function AddToHomeScreenPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    setIsIOS(getIsIOS());
    setIsStandalone(getIsStandalone());

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (isStandalone) return;
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed) return;
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    } catch (_) {
      setVisible(true);
    }
  }, [isStandalone]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (_) {}
  }, []);

  const handleAdd = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') dismiss();
    } else {
      dismiss();
    }
  }, [deferredPrompt, dismiss]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="ath-title" aria-describedby="ath-desc">
      <div className={styles.backdrop} onClick={dismiss} aria-hidden="true" />
      <div className={styles.card}>
        <button
          type="button"
          className={styles.close}
          onClick={dismiss}
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="ath-title" className={styles.title}>Add to Home Screen</h2>
        <p id="ath-desc" className={styles.desc}>
          Get quick access like an app. Add Kettlebell Gym to your home screen for a better experience.
        </p>
        <div className={styles.actions}>
          {deferredPrompt ? (
            <Button className={styles.primaryBtn} onClick={handleAdd}>
              Add to Home Screen
            </Button>
          ) : isIOS ? (
            <p className={styles.iosHint}>
              In Safari: tap <strong>Share</strong> → <strong>Add to Home Screen</strong> → <strong>Add</strong>.
            </p>
          ) : (
            <p className={styles.hint}>
              Use your browser menu (⋮) and choose &quot;Add to Home screen&quot; or &quot;Install app&quot;.
            </p>
          )}
          <button type="button" className={styles.notNow} onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
