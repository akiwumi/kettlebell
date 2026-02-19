import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import Button from './Button';
import ProGate from './payment/ProGate';
import {
  getCuratedRoutines,
  getRoutines,
  getUserRoutineExercises,
  saveUserRoutine,
  deleteUserRoutine,
  getExercisesByIds,
} from '../lib/routines';
import { exercises } from '../data/exercises';
import styles from './RoutinePage.module.css';

const TABS = [
  { id: 'curated', label: 'Pre-curated' },
  { id: 'mine', label: 'My routines' },
  { id: 'build', label: 'Build your own' },
];

export default function RoutinePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('curated');
  const [userRoutines, setUserRoutines] = useState([]);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customIds, setCustomIds] = useState([]);
  const [saveCustom, setSaveCustom] = useState(false);
  const [loadingRoutines, setLoadingRoutines] = useState(false);

  const curated = getCuratedRoutines();

  useEffect(() => {
    if (tab === 'mine') {
      setLoadingRoutines(true);
      getRoutines().then((list) => {
        setUserRoutines(list);
        setLoadingRoutines(false);
      });
    }
  }, [tab]);

  const handleSelectCurated = (r) => {
    const exs = r.getExercises();
    setSelectedRoutine({ type: 'curated', id: r.id, name: r.name, exercises: exs });
  };

  const handleSelectUser = (r) => {
    const exs = getUserRoutineExercises(r);
    setSelectedRoutine({ type: 'user', id: r.id, name: r.name, exercises: exs });
  };

  const toggleCustomExercise = (id) => {
    setCustomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleStartWithSelected = () => {
    if (!selectedRoutine?.exercises?.length) return;
    navigate('/timer-setup', { state: { exercises: selectedRoutine.exercises } });
  };

  const handleStartWithCustom = async () => {
    const exs = getExercisesByIds(customIds);
    if (!exs.length) return;
    if (saveCustom) {
      const name = customName.trim() || 'My routine';
      await saveUserRoutine({ name, exerciseIds: customIds });
      const list = await getRoutines();
      setUserRoutines(list);
    }
    navigate('/timer-setup', { state: { exercises: exs } });
  };

  const handleDeleteRoutine = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this routine?')) return;
    await deleteUserRoutine(id);
    const list = await getRoutines();
    setUserRoutines(list);
    if (selectedRoutine?.type === 'user' && selectedRoutine?.id === id) {
      setSelectedRoutine(null);
    }
  };

  const clearSelection = () => setSelectedRoutine(null);

  return (
    <Layout>
      <div className={styles.page}>
        <BackLink />
        <PageHeader
          title="Choose your routine"
          subtitle="Pick a pre-curated routine, use one of yours, or build your own"
        />

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'curated' && (
          <section className={styles.section}>
            <p className={styles.hint}>Tap a routine to select it, then continue to set your timer.</p>
            <ul className={styles.routineList}>
              {curated.map((r) => {
                const exs = r.getExercises();
                const isSelected =
                  selectedRoutine?.type === 'curated' && selectedRoutine?.id === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={isSelected ? `${styles.routineCard} ${styles.routineCardSelected}` : styles.routineCard}
                      onClick={() => handleSelectCurated(r)}
                    >
                      <h3 className={styles.routineName}>{r.name}</h3>
                      <p className={styles.routineDesc}>{r.description}</p>
                      <p className={styles.routineMeta}>{exs.length} exercises</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === 'mine' && (
          <ProGate feature="custom_routines" title="My routines" description="Save and use your own routines with Pro.">
          <section className={styles.section}>
            <p className={styles.hint}>Saved in the app’s routine database. Tap to select, or delete to remove.</p>
            {loadingRoutines ? (
              <p className={styles.empty}>Loading…</p>
            ) : userRoutines.length === 0 ? (
              <p className={styles.empty}>
                You don’t have any saved routines yet. Build one in the “Build your own” tab and
                check “Save as my routine.”
              </p>
            ) : (
              <ul className={styles.routineList}>
                {userRoutines.map((r) => {
                  const isSelected =
                    selectedRoutine?.type === 'user' && selectedRoutine?.id === r.id;
                  return (
                    <li key={r.id} className={styles.routineListItem}>
                      <div className={isSelected ? `${styles.routineCard} ${styles.routineCardSelected}` : styles.routineCard}>
                        <button
                          type="button"
                          className={styles.routineCardBtn}
                          onClick={() => handleSelectUser(r)}
                        >
                          <h3 className={styles.routineName}>{r.name}</h3>
                          <p className={styles.routineMeta}>
                            {(r.exerciseIds || []).length} exercises
                          </p>
                        </button>
                        <button
                          type="button"
                          className={styles.deleteRoutineBtn}
                          onClick={(e) => handleDeleteRoutine(e, r.id)}
                          aria-label={`Delete ${r.name}`}
                          title="Delete routine"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          </ProGate>
        )}

        {tab === 'build' && (
          <ProGate feature="custom_routines" title="Build your own" description="Create and save custom routines with Pro.">
          <section className={styles.section}>
            <p className={styles.hint}>
              Select exercises in order. Optionally name and save as “My routine.”
            </p>
            <label className={styles.field}>
              <span>Routine name (optional)</span>
              <input
                type="text"
                placeholder="e.g. Morning flow"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={saveCustom}
                onChange={(e) => setSaveCustom(e.target.checked)}
              />
              <span>Save as my routine</span>
            </label>
            <div className={styles.exerciseScroll}>
              <p className={styles.exerciseListLabel}>Exercises (tap to add/remove)</p>
              <ul className={styles.exerciseList}>
                {exercises.filter((e) => e.id && e.name && e.cues).map((ex) => {
                  const on = customIds.includes(ex.id);
                  return (
                    <li key={ex.id}>
                      <button
                        type="button"
                        className={on ? `${styles.exerciseChip} ${styles.exerciseChipOn}` : styles.exerciseChip}
                        onClick={() => toggleCustomExercise(ex.id)}
                      >
                        {ex.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {customIds.length > 0 && (
              <p className={styles.orderNote}>
                Order: {customIds.map((id) => exercises.find((e) => e.id === id)?.name || id).join(' → ')}
              </p>
            )}
          </section>
          </ProGate>
        )}

        {(tab === 'curated' || tab === 'mine') && selectedRoutine?.exercises?.length > 0 && (
          <div className={styles.actions}>
            <Button onClick={handleStartWithSelected} className={styles.primaryAction}>
              Continue to timer setup
            </Button>
            <button type="button" className={styles.clearBtn} onClick={clearSelection}>
              Clear selection
            </button>
          </div>
        )}

        {tab === 'build' && (
          <div className={styles.actions}>
            <Button
              onClick={handleStartWithCustom}
              disabled={customIds.length === 0}
            >
              Start with {customIds.length} exercise{customIds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
