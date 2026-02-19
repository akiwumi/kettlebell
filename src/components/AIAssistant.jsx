import { useMemo, useState } from 'react';
import Layout from './Layout';
import PageHeader from './PageHeader';
import AIInsightCard from './AIInsightCard';
import ProGate from './payment/ProGate';
import { getAllInsights } from '../services/aiService';
import styles from './AIAssistant.module.css';

export default function AIAssistant() {
  const [refreshKey, setRefreshKey] = useState(0);
  const insights = useMemo(() => getAllInsights(), [refreshKey]);

  return (
    <ProGate feature="ai_assistant" title="AI Assistant" description="Get personalized insights and chat with the AI coach with Pro.">
      <Layout>
        <div className={styles.page}>
          <PageHeader
            title="AI Assistant"
            subtitle="Insights from your workout and body data"
          />
          <p className={styles.intro}>
            These insights are generated locally from your logged workouts, body metrics, schedule, and profile. No data is sent to any server.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => setRefreshKey((k) => k + 1)}
              aria-label="Refresh insights"
            >
              Refresh insights
            </button>
          </div>
          <ul className={styles.list} aria-label="AI insights">
            {insights.map((insight) => (
              <li key={insight.id}>
                <AIInsightCard insight={insight} />
              </li>
            ))}
          </ul>
        </div>
      </Layout>
    </ProGate>
  );
}
