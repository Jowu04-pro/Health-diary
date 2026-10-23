/**
 * Extracts given name (名) from full Chinese name to address respectfully,
 * e.g., "王大明" -> "大明", "陳德榮" -> "德榮", "李淑芬" -> "淑芬"
 */
export function getGivenName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  
  // Check for common compound Chinese surnames
  const compoundSurnames = ['歐陽', '司馬', '諸葛', '令狐', '上官', '皇甫', '公孫', '慕容', '南宮', '夏侯'];
  for (const sur of compoundSurnames) {
    if (trimmed.startsWith(sur) && trimmed.length > 2) {
      return trimmed.slice(2);
    }
  }

  // Standard 3-character or more Chinese names (e.g. 王大明 -> 大明)
  if (trimmed.length >= 3) {
    return trimmed.slice(1);
  }

  // 2-character Chinese name (e.g. 王明 -> 明)
  if (trimmed.length === 2) {
    return trimmed.slice(1);
  }

  return trimmed;
}

/**
 * Normalizes birthday format for login matching (removes hyphens, slashes, spaces)
 * e.g., "1962-07-08" -> "19620708"
 */
export function normalizeBirthday(bday: string): string {
  return (bday || '').replace(/[-/.\s]/g, '');
}

/**
 * Accurately calculates age based on birthday string (e.g., '19680520' or '1968-05-20')
 * relative to the current date.
 */
export function calculateAge(bdayStr: string, fallbackAge?: number): number {
  if (!bdayStr) return fallbackAge ?? 0;
  
  const clean = normalizeBirthday(bdayStr);
  let birthYear = 0;
  let birthMonth = 1;
  let birthDay = 1;

  if (clean.length === 8) {
    birthYear = parseInt(clean.substring(0, 4), 10);
    birthMonth = parseInt(clean.substring(4, 6), 10);
    birthDay = parseInt(clean.substring(6, 8), 10);
  } else if (clean.length >= 4) {
    birthYear = parseInt(clean.substring(0, 4), 10);
  } else {
    return fallbackAge ?? 0;
  }

  if (isNaN(birthYear) || birthYear < 1900 || birthYear > 2100) {
    return fallbackAge ?? 0;
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed (1-12)
  const currentDay = today.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age >= 0 ? age : (fallbackAge ?? 0);
}

/**
 * Returns a deterministic, canonical case ID across all devices based on Name and Birthday.
 * This guarantees Phone, Tablet, PC, and different browsers point to the exact same Firestore document.
 */
export function getCanonicalCaseId(name: string, birthday: string): string {
  const normName = (name || '').trim().replace(/[\/\s#?\[\]]/g, '_');
  const normBday = normalizeBirthday(birthday);

  // Preserve preset aliases
  if (normName === '王大明' && (normBday === '19620708' || normBday.startsWith('1962'))) return 'case-wang';
  if (normName === '陳德榮' && (normBday === '19550315' || normBday.startsWith('1955'))) return 'case-chen';
  if (normName === '李淑芬' && (normBday === '19581120' || normBday.startsWith('1958'))) return 'case-li';

  return `case_${normName}_${normBday}`;
}

