import styles from './FilterBar.module.css';

export default function FilterBar({ options, value, onChange }) {
  return (
    <div className={styles.bar}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={value === opt.id ? styles.active : styles.btn}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
