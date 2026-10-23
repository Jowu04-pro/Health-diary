import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  onSnapshot, 
  collection, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { CaseProfile, VitalSignRecord, AppointmentRecord, MedicationItem, MedicationLog, RehabPlanItem } from '../types/health';
import { CaseFullData, caseWangDaMing, caseChenDeRong, caseLiShuFen } from '../data/mockData';
import { normalizeBirthday, getCanonicalCaseId } from '../utils/nameHelper';

// Firebase configuration from user's Firebase console
export const firebaseConfig = {
  apiKey: "AIzaSyDMdEvcx54uVS7wd_cyBfb2HcKd50a3-fY",
  authDomain: "health-diary-d518c.firebaseapp.com",
  projectId: "health-diary-d518c",
  storageBucket: "health-diary-d518c.firebasestorage.app",
  messagingSenderId: "598847832093",
  appId: "1:598847832093:web:fc9817cc2c9b9f296a86f4",
  measurementId: "G-MLH66HCPK2"
};

// Initialize Firebase App with ignoreUndefinedProperties to prevent setDoc serialization errors
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});

const COLLECTION_NAME = 'health_cases';
const REGISTRY_DOC_ID = 'case_registry';

function cleanData<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (_) {
    return obj;
  }
}

export interface CloudSyncResult {
  success: boolean;
  error?: string;
  isQuotaExceeded?: boolean;
}

/**
 * Sync Case registry list to Firebase
 */
export async function syncProfilesToFirebase(profiles: CaseProfile[]): Promise<CloudSyncResult> {
  try {
    const regRef = doc(db, COLLECTION_NAME, REGISTRY_DOC_ID);
    await setDoc(regRef, {
      profiles: cleanData(profiles),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firebase] Successfully synced profiles registry to Firestore!');
    return { success: true };
  } catch (err: any) {
    const isQuota = err?.code === 'resource-exhausted' || err?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.warn('[Firebase] Firestore 雲端配額暫時耗盡 (syncProfilesToFirebase)');
    } else {
      console.error('Firebase syncProfilesToFirebase error:', err);
    }
    return { success: false, error: err?.message, isQuotaExceeded: isQuota };
  }
}

/**
 * Fetch Case registry list from Firebase
 */
export async function fetchProfilesFromFirebase(): Promise<CaseProfile[] | null> {
  try {
    const regRef = doc(db, COLLECTION_NAME, REGISTRY_DOC_ID);
    const snap = await getDoc(regRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        return data.profiles;
      }
    }
  } catch (err) {
    console.warn('Firebase fetchProfilesFromFirebase warning:', err);
  }
  return null;
}

/**
 * Subscribe to realtime Case registry updates
 */
export function subscribeToProfiles(
  callback: (profiles: CaseProfile[]) => void
): Unsubscribe {
  const regRef = doc(db, COLLECTION_NAME, REGISTRY_DOC_ID);
  return onSnapshot(
    regRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.profiles)) {
          callback(data.profiles);
        }
      }
    },
    (error) => {
      console.warn('Firebase subscribeToProfiles warning:', error);
    }
  );
}

/**
 * Save full case diary data to Cloud Firestore
 */
export async function saveCaseToFirebase(caseId: string, fullData: CaseFullData): Promise<CloudSyncResult> {
  try {
    const cleaned = cleanData(fullData);
    const canonicalId = (fullData.profile?.name && fullData.profile?.birthday)
      ? getCanonicalCaseId(fullData.profile.name, fullData.profile.birthday)
      : caseId;

    // 1. Always write to the canonical document ID
    const canonicalRef = doc(db, COLLECTION_NAME, canonicalId);
    await setDoc(canonicalRef, {
      ...cleaned,
      lastSyncedAt: new Date().toISOString()
    }, { merge: true });

    // 2. If caller passed a legacy or different ID (e.g. timestamp ID), mirror it as well
    if (caseId !== canonicalId) {
      try {
        const caseRef = doc(db, COLLECTION_NAME, caseId);
        await setDoc(caseRef, {
          ...cleaned,
          lastSyncedAt: new Date().toISOString()
        }, { merge: true });
      } catch (_) {}
    }

    console.log(`[Firebase] Successfully saved case to canonical ${canonicalId} in Firestore!`);
    return { success: true };
  } catch (err: any) {
    const isQuota = err?.code === 'resource-exhausted' || err?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.warn(`[Firebase] Firestore 雲端配額暫時耗盡 (${caseId})，本機端紀錄完整安全保存。`);
    } else {
      console.error(`[Firebase] saveCaseToFirebase error for ${caseId}:`, err);
    }
    return { success: false, error: err?.message, isQuotaExceeded: isQuota };
  }
}

/**
 * Load full case diary data from Cloud Firestore
 */
export async function loadCaseFromFirebase(caseId: string): Promise<CaseFullData | null> {
  try {
    const caseRef = doc(db, COLLECTION_NAME, caseId);
    const snap = await getDoc(caseRef);
    if (snap.exists()) {
      return snap.data() as CaseFullData;
    }
    return null;
  } catch (err) {
    console.warn(`Firebase loadCaseFromFirebase warning for ${caseId}:`, err);
  }
  return null;
}

/**
 * Realtime listener for active case diary data
 */
export function subscribeToCaseData(
  caseId: string,
  onUpdate: (data: CaseFullData) => void
): Unsubscribe {
  const caseRef = doc(db, COLLECTION_NAME, caseId);
  return onSnapshot(
    caseRef,
    (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data() as CaseFullData;
        onUpdate(remoteData);
      }
    },
    (err) => {
      console.warn(`Firebase subscribeToCaseData warning for ${caseId}:`, err);
    }
  );
}

/**
 * Find a case from Cloud Firestore across all devices by name and birthday
 */
export async function findCaseInCloudByCredentials(
  name: string,
  birthday: string
): Promise<{ profile: CaseProfile; caseData: CaseFullData } | null> {
  const normName = (name || '').trim();
  const normBday = normalizeBirthday(birthday);
  const directCaseId = getCanonicalCaseId(normName, normBday);

  try {
    // 0. The direct canonical document ID is the authoritative source
    const directDoc = await loadCaseFromFirebase(directCaseId);
    if (directDoc && directDoc.profile) {
      return { profile: directDoc.profile, caseData: directDoc };
    }

    // 1. If not found at canonical ID, scan for legacy or alias docs
    const candidates: Array<{ profile: CaseProfile; caseData: CaseFullData; score: number }> = [];

    const evaluateCandidate = (docData: any, docId?: string) => {
      if (!docData || !docData.profile) return;
      const p = docData.profile;
      if (p.name?.trim() === normName && normalizeBirthday(p.birthday) === normBday) {
        const vitalsCount = Array.isArray(docData.vitals) ? docData.vitals.length : 0;
        const apptsCount = Array.isArray(docData.appointments) ? docData.appointments.length : 0;
        const medsCount = Array.isArray(docData.medications) ? docData.medications.length : 0;
        const rehabCount = Array.isArray(docData.rehab) ? docData.rehab.length : 0;
        const score = vitalsCount * 10 + apptsCount * 5 + medsCount * 3 + rehabCount * 2;
        candidates.push({
          profile: p,
          caseData: docData as CaseFullData,
          score
        });
      }
    };

    // Try registry list
    const remoteProfiles = await fetchProfilesFromFirebase();
    if (remoteProfiles) {
      const matching = remoteProfiles.filter(
        (p) => p.name.trim() === normName && normalizeBirthday(p.birthday) === normBday
      );
      for (const p of matching) {
        const full = await loadCaseFromFirebase(p.id);
        if (full) evaluateCandidate(full, p.id);
      }
    }

    // Scan collection documents to catch any custom or legacy timestamp IDs
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    for (const docSnap of snap.docs) {
      if (docSnap.id === REGISTRY_DOC_ID) continue;
      const data = docSnap.data();
      evaluateCandidate(data, docSnap.id);
    }

    if (candidates.length > 0) {
      // Sort descending by data score
      candidates.sort((a, b) => b.score - a.score);
      return { profile: candidates[0].profile, caseData: candidates[0].caseData };
    }
  } catch (err) {
    console.warn('Firebase findCaseInCloudByCredentials warning:', err);
  }

  return null;
}

/**
 * Completely resets a case's health records in Cloud Firestore,
 * ensuring all records are cleared and duplicate legacy documents are purged.
 */
export async function resetCaseInFirebase(profile: CaseProfile): Promise<CloudSyncResult> {
  try {
    const canonicalId = getCanonicalCaseId(profile.name, profile.birthday);
    const normName = profile.name.trim();
    const normBday = normalizeBirthday(profile.birthday);

    const emptyData: CaseFullData = {
      profile: { ...profile, id: canonicalId },
      vitals: [],
      appointments: [],
      medications: [],
      medLogs: [],
      rehab: []
    };

    // 1. Overwrite canonical document completely with empty record arrays
    const canonicalRef = doc(db, COLLECTION_NAME, canonicalId);
    await setDoc(canonicalRef, {
      ...emptyData,
      lastSyncedAt: new Date().toISOString()
    });

    // 2. Also check and clean up any legacy/duplicate documents for this same person
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const d of snap.docs) {
        if (d.id === REGISTRY_DOC_ID || d.id === canonicalId) continue;
        const data = d.data();
        if (data.profile?.name?.trim() === normName && normalizeBirthday(data.profile?.birthday) === normBday) {
          console.log(`[Firebase Reset] Purging duplicate document ${d.id}`);
          await deleteDoc(doc(db, COLLECTION_NAME, d.id));
        }
      }
    } catch (e) {
      console.warn('Error purging duplicate Firestore docs during reset:', e);
    }

    console.log(`[Firebase Reset] Successfully reset ${canonicalId} in Cloud Firestore.`);
    return { success: true };
  } catch (err: any) {
    console.error('Firebase resetCaseInFirebase error:', err);
    return { success: false, error: err?.message };
  }
}
