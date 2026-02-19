/**
 * Load profile for display (name, photoUrl).
 */

const PROFILE_KEY = 'kettlebell-profile';

export function loadProfile() {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return {};
  }
}

export function getDisplayName() {
  const p = loadProfile();
  const name = (p.name || '').trim();
  return name || 'there';
}

export function getPhotoUrl() {
  const p = loadProfile();
  return p.photoUrl || '';
}

/** Coach voice for session: 'off' | 'female' | 'male'. Default 'female' so coach is on. */
export function getCoachVoice() {
  const p = loadProfile();
  const v = p.coachVoice;
  if (v === 'off') return 'off';
  if (v === 'male') return 'male';
  return 'female'; // default when unset or 'female'
}
