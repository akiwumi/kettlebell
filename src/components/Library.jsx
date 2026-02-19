import { useState } from 'react';
import { exercises, categories } from '../data/exercises';
import { isInTodayRotation } from '../lib/dailyRotation';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';
import ExerciseListItem from './ExerciseListItem';
import styles from './Library.module.css';

const filterOptions = [{ id: '', label: 'All' }, ...categories];

export default function Library() {
  const [category, setCategory] = useState('');

  const filtered = category
    ? exercises.filter((e) => e.category === category)
    : exercises;

  return (
    <Layout fillViewport={false} className={styles.libLayout}>
      <BackLink />
      <PageHeader
        title="Exercise library"
        subtitle={`${exercises.length} exercises`}
      />

      <FilterBar
        options={filterOptions}
        value={category}
        onChange={setCategory}
      />

      <ul className={styles.list}>
        {filtered.map((ex) => (
          <ExerciseListItem
            key={ex.id}
            exercise={ex}
            showTodayBadge={isInTodayRotation(ex.id)}
          />
        ))}
      </ul>
    </Layout>
  );
}
