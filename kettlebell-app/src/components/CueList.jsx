import styles from './CueList.module.css';

export default function CueList({ cues = [], maxItems }) {
  const list = maxItems ? cues.slice(0, maxItems) : cues;
  if (!list.length) return null;

  return (
    <ul className={styles.list}>
      {list.map((cue, i) => (
        <li key={i}>{cue}</li>
      ))}
    </ul>
  );
}
