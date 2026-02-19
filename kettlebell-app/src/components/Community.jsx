import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';
import ShareWithFriends from './ShareWithFriends';
import styles from './Community.module.css';

const features = [
  { title: 'Challenge friends', desc: 'Create or join challenges with friends.', icon: '👋' },
  { title: 'Leaderboards', desc: 'Optional leaderboards by volume, consistency, or goals.', icon: '📊' },
];

export default function Community() {
  return (
    <>
      <PageHeader title="Community" subtitle="Share and connect (optional)" />
      <div className={styles.content}>
        <div className={styles.shareSection}>
          <ShareWithFriends />
        </div>
        <p className={styles.intro}>
          More ways to connect with others:
        </p>
        <div className={styles.grid}>
          {features.map((f) => (
            <section key={f.title} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">{f.icon}</span>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </section>
          ))}
        </div>
        <p className={styles.coming}>Challenges and leaderboards coming soon.</p>
        <Link to="/dashboard" className={styles.link}>Go to Dashboard</Link>
      </div>
    </>
  );
}
