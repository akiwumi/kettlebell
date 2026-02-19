import Layout from './Layout';
import PageHeader from './PageHeader';
import styles from './Data.module.css';

export default function Data() {
  return (
    <Layout>
      <PageHeader title="Data" subtitle="Track your workouts and progress" />
      <div className={styles.placeholder}>
        <p>Workout history and stats coming soon.</p>
      </div>
    </Layout>
  );
}
