import { useState, useEffect } from 'react';
import styles from './AddToHomeScreen.module.css';

/**
 * Shows how to add the app to the device home screen (PWA / Add to Home Screen).
 * On supported browsers, may show an "Install" button when the install prompt is available.
 */
export default function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document));
    setIsStandalone(
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
    );

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
  };

  if (isStandalone) return null;

  return (
    <section className={styles.section} aria-label="Add to home screen">
      <h2 className={styles.title}>Add app icon to your phone</h2>
      <p className={styles.desc}>
        Add Kettlebell Gym to your home screen for quick access, like an app.
      </p>

      {isIOS && (
        <div className={styles.steps}>
          <p className={styles.stepLabel}>On iPhone / iPad (Safari):</p>
          <ol className={styles.list}>
            <li>Tap the <strong>Share</strong> button (square with arrow).</li>
            <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong>.</li>
          </ol>
        </div>
      )}

      {!isIOS && (
        <div className={styles.steps}>
          <p className={styles.stepLabel}>On Android (Chrome):</p>
          <ol className={styles.list}>
            <li>Tap the <strong>menu</strong> (⋮) in the browser.</li>
            <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
          </ol>
        </div>
      )}

      {showInstall && deferredPrompt && (
        <button
          type="button"
          className={styles.installBtn}
          onClick={handleInstall}
        >
          Install app
        </button>
      )}
    </section>
  );
}
