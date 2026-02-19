import { Link } from 'react-router-dom';
import Layout from '../Layout';
import Button from '../Button';
import styles from './PaymentCancel.module.css';

export default function PaymentCancel() {
  return (
    <Layout>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Maybe later</h1>
          <p className={styles.text}>
            No problem. You can upgrade to Pro anytime from the home screen or
            when you tap a locked feature.
          </p>
          <Button as={Link} to="/" className={styles.btn}>
            Back to app
          </Button>
        </div>
      </div>
    </Layout>
  );
}
