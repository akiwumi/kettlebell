import { Link } from 'react-router-dom';
import styles from './BackLink.module.css';

export default function BackLink({ to = '/', children = '← Back' }) {
  return (
    <Link to={to} className={styles.back}>
      {children}
    </Link>
  );
}
