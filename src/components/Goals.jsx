import { useState, useEffect } from 'react';
import Layout from './Layout';
import PageHeader from './PageHeader';
import ProGate from './payment/ProGate';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import styles from './Goals.module.css';

const GOAL_TYPES = [
  { value: 'workouts_per_week', label: 'Workouts per week', unit: 'sessions' },
  { value: 'weight_target', label: 'Weight target (kg)', unit: 'kg' },
  { value: 'strength', label: 'Strength (e.g. press weight)', unit: 'kg' },
  { value: 'consistency', label: 'Adherence %', unit: '%' },
  { value: 'custom', label: 'Custom', unit: '' },
];

export default function Goals() {
  const { user, isPro } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setGoals(data ?? []);
        setLoading(false);
      });
  }, [user?.id]);

  const content = (
    <Layout>
      <PageHeader
        title="Goals"
        subtitle="Set and track your training goals"
      />
      <div className={styles.wrap}>
        {loading ? (
          <p className={styles.loading}>Loading goals…</p>
        ) : goals.length === 0 ? (
          <p className={styles.empty}>
            No goals yet. Add a goal to track progress over time.
          </p>
        ) : (
          <ul className={styles.list}>
            {goals.map((g) => (
              <li key={g.id} className={styles.card}>
                <h3 className={styles.goalTitle}>{g.title}</h3>
                <p className={styles.goalMeta}>
                  {GOAL_TYPES.find((t) => t.value === g.goal_type)?.label ?? g.goal_type}
                  {g.unit && ` · ${g.unit}`}
                </p>
                {g.target_value != null && (
                  <div className={styles.progressWrap}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(g.current_value) / Number(g.target_value)) * 100
                        )}%`,
                      }}
                    />
                    <span className={styles.progressText}>
                      {g.current_value} / {g.target_value} {g.unit}
                    </span>
                  </div>
                )}
                <span className={styles.status}>{g.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );

  return (
    <ProGate feature="goals" title="Goal setting" description="Set and track goals with Pro.">
      {content}
    </ProGate>
  );
}
