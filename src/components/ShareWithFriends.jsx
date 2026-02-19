import { useState } from 'react';
import { buildShareText, shareOrCopy } from '../lib/shareData';
import styles from './ShareWithFriends.module.css';

export default function ShareWithFriends() {
  const [includeProgression, setIncludeProgression] = useState(true);
  const [includeExerciseData, setIncludeExerciseData] = useState(true);
  const [includeName, setIncludeName] = useState(true);
  const [status, setStatus] = useState(null); // 'shared' | 'copied' | 'unsupported' | 'cancelled' | 'error'
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setStatus(null);
    setBusy(true);
    try {
      const text = buildShareText({
        includeProgression,
        includeExerciseData,
        includeName,
      });
      const result = await shareOrCopy(text, 'My Kettlebell Progress');
      setStatus(result);
    } catch (_) {
      setStatus('error');
    } finally {
      setBusy(false);
    }
  };

  const shareText = buildShareText({
    includeProgression,
    includeExerciseData,
    includeName,
  });

  return (
    <section className={styles.card} aria-labelledby="share-heading">
      <h2 id="share-heading" className={styles.heading}>Share with friends</h2>
      <p className={styles.desc}>
        Share your progression and exercise data as a text summary. Choose what to include, then share via your device’s share sheet or copy to clipboard.
      </p>
      <div className={styles.options}>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={includeProgression}
            onChange={(e) => setIncludeProgression(e.target.checked)}
          />
          <span>Progression (streak, weight, measurements, goals, training time)</span>
        </label>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={includeExerciseData}
            onChange={(e) => setIncludeExerciseData(e.target.checked)}
          />
          <span>Exercise data (workout count, volume, recent workouts, PRs)</span>
        </label>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={includeName}
            onChange={(e) => setIncludeName(e.target.checked)}
          />
          <span>Include my name in the summary</span>
        </label>
      </div>
      <button
        type="button"
        className={styles.shareBtn}
        onClick={handleShare}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? 'Preparing…' : 'Share progress'}
      </button>
      {status === 'shared' && <p className={styles.feedback}>Shared successfully.</p>}
      {status === 'copied' && <p className={styles.feedback}>Copied to clipboard. Paste in a message to share.</p>}
      {status === 'cancelled' && <p className={styles.feedbackMuted}>Share cancelled.</p>}
      {status === 'unsupported' && (
        <div className={styles.fallback}>
          <p className={styles.feedbackMuted}>Sharing not available. Copy the text below:</p>
          <textarea
            className={styles.preview}
            readOnly
            value={shareText}
            aria-label="Share text preview"
          />
          <button
            type="button"
            className={styles.copyBtn}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareText);
                setStatus('copied');
              } catch (_) {
                // leave as unsupported, user can select and copy manually
              }
            }}
          >
            Copy to clipboard
          </button>
        </div>
      )}
      {status === 'error' && <p className={styles.feedbackError}>Something went wrong. Try again.</p>}
    </section>
  );
}
