import styles from './PageHeader.module.css';

export default function PageHeader({ title, subtitle }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle != null && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}
