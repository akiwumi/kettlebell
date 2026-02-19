import styles from './Layout.module.css';

export default function Layout({ children, className = '', fillViewport = true }) {
  return (
    <div
      className={`${styles.layout} ${fillViewport ? styles.layoutFillViewport : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
