import { useState, useEffect } from 'react';
import { getBodyMetrics, saveBodyMetric } from '../lib/trackingStorage';
import PageHeader from './PageHeader';
import Button from './Button';
import styles from './BodyMetrics.module.css';

const defaultEntry = {
  date: new Date().toISOString().slice(0, 10),
  weight: '',
  chest: '',
  waist: '',
  hips: '',
  arms: '',
  thighs: '',
  calves: '',
  bodyFat: '',
  clothesFit: '',
  photoUrl: '',
};

export default function BodyMetrics() {
  const [entry, setEntry] = useState(defaultEntry);
  const [entries, setEntries] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEntries(getBodyMetrics());
  }, [saved]);

  const update = (key, value) => setEntry((e) => ({ ...e, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const toSave = {
      ...entry,
      weight: entry.weight ? Number(entry.weight) : null,
      chest: entry.chest ? Number(entry.chest) : null,
      waist: entry.waist ? Number(entry.waist) : null,
      hips: entry.hips ? Number(entry.hips) : null,
      arms: entry.arms ? Number(entry.arms) : null,
      thighs: entry.thighs ? Number(entry.thighs) : null,
      calves: entry.calves ? Number(entry.calves) : null,
      bodyFat: entry.bodyFat ? Number(entry.bodyFat) : null,
    };
    saveBodyMetric(toSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEntry({ ...defaultEntry, date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <>
      <PageHeader title="Body metrics" subtitle="Weight, measurements, progress photos" />

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <div className={styles.field}>
            <label>Date (weigh-in / measurement day)</label>
            <input
              type="date"
              value={entry.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Weight (kg)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={entry.weight}
              onChange={(e) => update('weight', e.target.value)}
              placeholder="kg"
            />
          </div>
          <div className={styles.field}>
            <label>Body fat % (optional)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={entry.bodyFat}
              onChange={(e) => update('bodyFat', e.target.value)}
              placeholder="%"
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Body measurements (cm)</h2>
          <div className={styles.grid2}>
            {['chest', 'waist', 'hips', 'arms', 'thighs', 'calves'].map((key) => (
              <div key={key} className={styles.field}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={entry[key] || ''}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder="cm"
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.field}>
            <label>How clothes fit (subjective)</label>
            <input
              type="text"
              value={entry.clothesFit}
              onChange={(e) => update('clothesFit', e.target.value)}
              placeholder="e.g. Looser around waist, same as last week"
            />
          </div>
          <div className={styles.field}>
            <label>Progress photo (optional)</label>
            <div className={styles.photoWrap}>
              {entry.photoUrl ? (
                <img src={entry.photoUrl} alt="Progress" className={styles.photoImg} />
              ) : (
                <span className={styles.photoPlaceholder}>Photo</span>
              )}
              <label className={styles.photoLabel}>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.photoInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) update('photoUrl', URL.createObjectURL(f));
                  }}
                />
                <span className={styles.photoBtn}>Choose photo</span>
              </label>
            </div>
          </div>
        </section>

        <Button type="submit">{saved ? 'Saved!' : 'Save entry'}</Button>
      </form>

      {entries.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent entries</h2>
          <ul className={styles.recentList}>
            {entries.slice(0, 8).map((e, i) => (
              <li key={i} className={styles.recentItem}>
                <span>{e.date}</span>
                <span>{e.weight != null ? `${e.weight} kg` : '—'} {e.bodyFat != null ? `· ${e.bodyFat}% fat` : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
