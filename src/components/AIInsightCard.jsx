import { Link } from 'react-router-dom';
import styles from './AIInsightCard.module.css';

/**
 * Card for a single AI insight: title, summary, optional metric, and CTA link.
 */
export default function AIInsightCard({ insight, compact = false }) {
  const { title, summary, metric, suggestion, link } = insight || {};
  const Wrapper = link ? Link : 'div';
  const wrapperProps = link ? { to: link } : {};

  return (
    <Wrapper className={styles.card} {...wrapperProps}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.summary}>{summary}</p>
      {metric && <p className={styles.metric}>{metric}</p>}
      {suggestion && link && (
        <span className={styles.cta}>
          {suggestion} →
        </span>
      )}
    </Wrapper>
  );
}
