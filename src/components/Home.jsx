import { Link } from 'react-router-dom';
import Layout from './Layout';
import Button from './Button';
import ProBanner from './payment/ProBanner';
import AddToHomeScreenPopup from './AddToHomeScreenPopup';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { getDisplayName, getPhotoUrl } from '../lib/profileStorage';
import { getWorkouts } from '../lib/trackingStorage';
import { getTopInsight } from '../services/aiService';
import styles from './Home.module.css';

function getWelcomeMessage(name) {
  const n = name.toLowerCase() === 'there' ? '' : name;
  const messages = [
    n ? `${n}, you've got this!` : "You've got this!",
    n ? `Great to see you, ${n}!` : 'Great to see you!',
    n ? `Let's go, ${n}!` : "Let's go!",
    n ? `${n}, today's the day.` : "Today's the day.",
    n ? `Ready to move, ${n}?` : 'Ready to move?',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function LockBadge() {
  return <span className={styles.lockBadge} title="Pro feature">🔒</span>;
}

export default function Home() {
  const { user, profile, isPro, signOut } = useAuth();
  const { isAdmin, adminLogout } = useAdmin();

  const handleLogout = () => {
    signOut();
    adminLogout();
  };
  const name = profile?.full_name?.trim() || getDisplayName();
  const photoUrl = profile?.avatar_url || getPhotoUrl();
  const workouts = getWorkouts();
  const recentCount = workouts.slice(0, 5).length;
  const welcome = getWelcomeMessage(name || 'there');
  const topInsight = getTopInsight();
  // Show lock on Pro features for non-Pro users (admin has full access)
  const showLock = !isPro && !isAdmin;

  return (
    <Layout className={styles.homeCard}>
      <AddToHomeScreenPopup />
      <div className={styles.home}>
        <header className={styles.hero}>
          <div className={styles.profileRow}>
            <div className={styles.avatarWrap}>
              {photoUrl ? (
                <img src={photoUrl} alt="" className={styles.avatar} />
              ) : (
                <span className={styles.avatarPlaceholder}>
                  {(name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className={styles.welcomeWrap}>
              <h1 className={styles.heroTitle}>Welcome back</h1>
              <p className={styles.welcomeMessage}>{welcome}</p>
            </div>
            {user ? (
              <button
                type="button"
                className={styles.loginBtn}
                onClick={handleLogout}
                aria-label="Log out"
              >
                Log out
              </button>
            ) : (
              <Link to="/sign-in" className={styles.loginBtn} aria-label="Log in">
                Log in
              </Link>
            )}
          </div>
        </header>

        <ProBanner />

        <section className={styles.dashboard}>
          <h2 className={styles.sectionTitle}>Your dashboard</h2>

          <div className={styles.cards}>
            <Link to="/progress" className={styles.card}>
              <span className={styles.cardIcon}>📈</span>
              {showLock && <LockBadge />}
              <h3 className={styles.cardTitle}>Progression charts</h3>
              <p className={styles.cardDesc}>Weight, volume, strength, goal progress</p>
            </Link>
            <Link to="/data" className={styles.card}>
              <span className={styles.cardIcon}>📋</span>
              {showLock && <LockBadge />}
              <h3 className={styles.cardTitle}>Data & logs</h3>
              <p className={styles.cardDesc}>
                {recentCount ? `${recentCount} recent workout(s)` : 'Workout log, body metrics, PRs'}
              </p>
            </Link>
            <Link to="/community" className={styles.card}>
              <span className={styles.cardIcon}>💬</span>
              {showLock && <LockBadge />}
              <h3 className={styles.cardTitle}>Shared by friends</h3>
              <p className={styles.cardDesc}>Messages and progress shared with you</p>
            </Link>
            <Link to="/ai-assistant" className={styles.card}>
              <span className={styles.cardIcon}>🤖</span>
              {showLock && <LockBadge />}
              <h3 className={styles.cardTitle}>AI insights</h3>
              <p className={styles.cardDesc}>
                {topInsight?.summary ?? 'Personalized tips from your workout and body data'}
              </p>
            </Link>
          </div>
        </section>

        <nav className={styles.nav}>
          <Button as={Link} to="/routine" className={styles.primaryBtn}>
            Choose routine & start workout
          </Button>
          <Link to="/library" className={styles.secondaryLink}>
            Exercise library
          </Link>
        </nav>
      </div>
    </Layout>
  );
}
