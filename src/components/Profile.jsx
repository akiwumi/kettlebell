import { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import PageHeader from './PageHeader';
import Button from './Button';
import ManageSubscription from './payment/ManageSubscription';
import ProGate from './payment/ProGate';
import { useAuth } from '../contexts/AuthContext';
import styles from './Profile.module.css';

const MAX_PHOTO_BYTES = 350000; // ~350KB to stay under localStorage limits
const MAX_PHOTO_DIM = 400;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > MAX_PHOTO_DIM || height > MAX_PHOTO_DIM) {
        if (width > height) {
          height = Math.round((height / width) * MAX_PHOTO_DIM);
          width = MAX_PHOTO_DIM;
        } else {
          width = Math.round((width / height) * MAX_PHOTO_DIM);
          height = MAX_PHOTO_DIM;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      let result = canvas.toDataURL('image/jpeg', 0.85);
      if (result.length > MAX_PHOTO_BYTES) result = canvas.toDataURL('image/jpeg', 0.7);
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const PROFILE_KEY = 'kettlebell-profile';

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PRIMARY_GOALS = ['Weight Loss', 'Muscle Building', 'Strength', 'Endurance', 'General Fitness'];
const DURATIONS = ['20 min', '30 min', '45 min', '60 min'];
const TIMELINES = ['4 weeks', '8 weeks', '12 weeks', '6 months', '1 year'];
const KETTLEBELL_WEIGHTS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32];
const OTHER_EQUIPMENT = ['Yoga mat', 'Bench', 'Pull-up bar', 'Resistance bands', 'TRX', 'Other'];

const defaultProfile = {
  name: '',
  age: '',
  gender: '',
  photoUrl: '',
  weight: '',
  height: '',
  targetWeight: '',
  chest: '',
  waist: '',
  hips: '',
  arms: '',
  thighs: '',
  calves: '',
  fitnessLevel: '',
  yearsExperience: '',
  injuriesLimitations: '',
  kettlebellWeights: [],
  otherEquipment: [],
  spaceAvailable: '',
  primaryGoal: '',
  secondaryGoals: [],
  timeline: '',
  preferredDuration: '',
  trainingDaysPerWeek: '',
  preferredTimes: '',
  restDayPreferences: '',
  coachVoice: 'female', // 'off' | 'female' | 'male' – default on so coach speaks during session
};

function loadProfile() {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    if (s) return { ...defaultProfile, ...JSON.parse(s) };
  } catch (_) {}
  return { ...defaultProfile };
}

function saveProfile(data) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch (_) {}
}

export default function Profile() {
  const { user, profile: authProfile, signOut, updateProfile } = useAuth();
  const [profile, setProfile] = useState(loadProfile);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (authProfile) {
      setProfile((p) => ({
        ...p,
        name: authProfile.full_name,
        photoUrl: authProfile.avatar_url || p.photoUrl,
        coachVoice: authProfile.coach_voice ?? p.coachVoice ?? 'female',
      }));
    }
  }, [authProfile?.id, authProfile?.full_name, authProfile?.avatar_url, authProfile?.coach_voice]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const update = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  const handlePhotoChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      let dataUrl = await fileToDataUrl(f);
      if (dataUrl.length > MAX_PHOTO_BYTES) dataUrl = await compressDataUrl(dataUrl);
      update('photoUrl', dataUrl);
    } catch (_) {
      // fallback: use blob URL (won't persist across reloads)
      update('photoUrl', URL.createObjectURL(f));
    }
    e.target.value = '';
  };

  const toggleArray = (key, item) => {
    setProfile((p) => {
      const arr = p[key] || [];
      const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
      return { ...p, [key]: next };
    });
  };

  return (
    <Layout>
      <PageHeader title="User Profile Setup" subtitle="Your details and preferences" />

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {/* Session audio – visible at top so users can find coach/audio settings */}
        <section className={styles.section} aria-label="Session audio settings">
          <h2 className={styles.sectionTitle}>Session audio</h2>
          <p className={styles.audioDescription}>
            Coach voice announces the next exercise during the countdown and plays a beep in the last 10 seconds.
          </p>
          <div className={styles.field}>
            <label htmlFor="coachVoice">Coach voice</label>
            <select
              id="coachVoice"
              value={profile.coachVoice || 'off'}
              onChange={(e) => update('coachVoice', e.target.value)}
              aria-describedby="coachVoiceHint"
            >
              <option value="off">Off</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <span id="coachVoiceHint" className={styles.hint}>Choose Off for a silent workout.</span>
          </div>
        </section>

        {/* Basic Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>

          <div className={styles.photoWrap}>
            <div className={styles.photoPlaceholder}>
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className={styles.photoImg} />
              ) : (
                <span className={styles.photoText}>Photo</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.photoInput}
              onChange={handlePhotoChange}
              aria-label="Upload profile picture"
            />
            <Button
              type="button"
              variant="secondary"
              className={styles.editPhotoBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              Edit photo
            </Button>
          </div>

          <div className={styles.field}>
            <label>Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Your name"
            />
          </div>
        </section>

        <ProGate feature="full_profile" title="Pro settings" description="Unlock age, goals, equipment, body metrics, and training preferences with Pro.">
          <section className={styles.section} aria-label="Pro settings">
            <h2 className={styles.sectionTitle}>Pro settings</h2>
            <p className={styles.audioDescription}>
              Age, body metrics, equipment, goals, and training preferences are available with a Pro subscription.
            </p>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Age</label>
              <input
                type="number"
                min="10"
                max="120"
                value={profile.age}
                onChange={(e) => update('age', e.target.value)}
                placeholder="Age"
              />
            </div>
            <div className={styles.field}>
              <label>Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => update('gender', e.target.value)}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Current weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={profile.weight}
                onChange={(e) => update('weight', e.target.value)}
                placeholder="kg"
              />
            </div>
            <div className={styles.field}>
              <label>Height (cm)</label>
              <input
                type="number"
                min="0"
                value={profile.height}
                onChange={(e) => update('height', e.target.value)}
                placeholder="cm"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Target weight (kg, optional)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={profile.targetWeight}
              onChange={(e) => update('targetWeight', e.target.value)}
              placeholder="Target kg"
            />
          </div>

          <h3 className={styles.subsectionTitle}>Body measurements (cm)</h3>
          <div className={styles.grid2}>
            {['chest', 'waist', 'hips', 'arms', 'thighs', 'calves'].map((key) => (
              <div key={key} className={styles.field}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={profile[key] || ''}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder="cm"
                />
              </div>
            ))}
          </div>

          <div className={styles.field}>
            <label>Current fitness level (kettlebells)</label>
            <select
              value={profile.fitnessLevel}
              onChange={(e) => update('fitnessLevel', e.target.value)}
            >
              <option value="">Select</option>
              {FITNESS_LEVELS.map((l) => (
                <option key={l} value={l.toLowerCase()}>{l}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Years of training experience</label>
            <input
              type="text"
              value={profile.yearsExperience}
              onChange={(e) => update('yearsExperience', e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
          <div className={styles.field}>
            <label>Injuries or physical limitations</label>
            <textarea
              value={profile.injuriesLimitations}
              onChange={(e) => update('injuriesLimitations', e.target.value)}
              placeholder="List any injuries or limitations"
              rows={3}
            />
          </div>
        </section>

        {/* Equipment Inventory */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Equipment Inventory</h2>
          <div className={styles.field}>
            <label>Kettlebell weights owned (kg)</label>
            <div className={styles.chipGroup}>
              {KETTLEBELL_WEIGHTS.map((kg) => (
                <button
                  key={kg}
                  type="button"
                  className={profile.kettlebellWeights.includes(kg) ? styles.chipActive : styles.chip}
                  onClick={() => toggleArray('kettlebellWeights', kg)}
                >
                  {kg} kg
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label>Other equipment</label>
            <div className={styles.checkGroup}>
              {OTHER_EQUIPMENT.map((item) => (
                <label key={item} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={profile.otherEquipment.includes(item)}
                    onChange={() => toggleArray('otherEquipment', item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label>Space available for training</label>
            <input
              type="text"
              value={profile.spaceAvailable}
              onChange={(e) => update('spaceAvailable', e.target.value)}
              placeholder="e.g. Living room, garage, gym"
            />
          </div>
        </section>

        {/* Goal & Preference Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Goal & Preference Settings</h2>
          <div className={styles.field}>
            <label>Primary goal</label>
            <select
              value={profile.primaryGoal}
              onChange={(e) => update('primaryGoal', e.target.value)}
            >
              <option value="">Select</option>
              {PRIMARY_GOALS.map((g) => (
                <option key={g} value={g.replace(/\s+/g, '-').toLowerCase()}>{g}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Secondary goals (select all that apply)</label>
            <div className={styles.checkGroup}>
              {PRIMARY_GOALS.map((g) => (
                <label key={g} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={profile.secondaryGoals.includes(g)}
                    onChange={() => toggleArray('secondaryGoals', g)}
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Target timeline</label>
              <select
                value={profile.timeline}
                onChange={(e) => update('timeline', e.target.value)}
              >
                <option value="">Select</option>
                {TIMELINES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Preferred workout duration</label>
              <select
                value={profile.preferredDuration}
                onChange={(e) => update('preferredDuration', e.target.value)}
              >
                <option value="">Select</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Available training days per week</label>
            <input
              type="number"
              min="1"
              max="7"
              value={profile.trainingDaysPerWeek}
              onChange={(e) => update('trainingDaysPerWeek', e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
          <div className={styles.field}>
            <label>Preferred workout times</label>
            <input
              type="text"
              value={profile.preferredTimes}
              onChange={(e) => update('preferredTimes', e.target.value)}
              placeholder="e.g. Morning, Lunch, Evening"
            />
          </div>
          <div className={styles.field}>
            <label>Rest day preferences</label>
            <input
              type="text"
              value={profile.restDayPreferences}
              onChange={(e) => update('restDayPreferences', e.target.value)}
              placeholder="e.g. No training on Sundays"
            />
          </div>
        </section>
        </ProGate>

        <Button type="submit">Save profile</Button>

        <ManageSubscription />

        {user && (
          <div className={styles.signOutWrap}>
            <Button type="button" variant="secondary" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        )}
      </form>
    </Layout>
  );
}
