import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { CaseProfile } from '../types/health';
import { CaseFullData } from '../data/mockData';
import { normalizeBirthday } from '../utils/nameHelper';

// 您的 Firebase 設定金鑰
export const firebaseConfig = {
  apiKey: "AIzaSyDMdEvcx54uVS7wd_cyBfb2HcKd50a3-fY",
  authDomain: "health-diary-d518c.firebaseapp.com",
  projectId: "health-diary-d518c",
  storageBucket: "health-diary-d518c.firebasestorage.app",
  messagingSenderId: "598847832093",
  appId: "1:598847832093:web:fc9817cc2c9b9f296a86f4",
  measurementId: "G-MLH66HCPK2"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const COLLECTION_NAME = 'health_cases';
const REGISTRY_DOC_ID = '__case_registry__';

export async function syncProfilesToFirebase(profiles: CaseProfile[]): Promise<void> {
  try {
    const regRef = doc(db, COLLECTION_NAME, REGISTRY_DOC_ID);
    await setDoc(regRef, {
      profiles,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firebase syncProfilesToFirebase warning:', err);
  }
}

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

export function subscribeToProfiles(callback: (profiles: CaseProfile[]) => void): Unsubscribe {
  const regRef = doc(db, COLLECTION_NAME, REGISTRY_DOC_ID);
  return onSnapshot(regRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.profiles)) callback(data.profiles);
    }
  }, (err) => console.warn(err));
}

export async function saveCaseToFirebase(caseId: string, fullData: CaseFullData): Promise<void> {
  try {
    const caseRef = doc(db, COLLECTION_NAME, caseId);
    await setDoc(caseRef, { ...fullData, lastSyncedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn(err);
  }
}

export async function loadCaseFromFirebase(caseId: string): Promise<CaseFullData | null> {
  try {
    const caseRef = doc(db, COLLECTION_NAME, caseId);
    const snap = await getDoc(caseRef);
    if (snap.exists()) return snap.data() as CaseFullData;
  } catch (err) {
    console.warn(err);
  }
  return null;
}

export function subscribeToCaseData(caseId: string, onUpdate: (data: CaseFullData) => void): Unsubscribe {
  const caseRef = doc(db, COLLECTION_NAME, caseId);
  return onSnapshot(caseRef, (snap) => {
    if (snap.exists()) onUpdate(snap.data() as CaseFullData);
  }, (err) => console.warn(err));
}

export async function findCaseInCloudByCredentials(
  name: string,
  birthday: string
): Promise<{ profile: CaseProfile; caseData: CaseFullData } | null> {
  const normName = (name || '').trim();
  const normBday = normalizeBirthday(birthday);

  try {
    const remoteProfiles = await fetchProfilesFromFirebase();
    if (remoteProfiles) {
      const match = remoteProfiles.find(
        (p) => p.name.trim() === normName && normalizeBirthday(p.birthday) === normBday
      );
      if (match) {
        const fullData = await loadCaseFromFirebase(match.id);
        if (fullData) return { profile: match, caseData: fullData };
      }
    }

    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    for (const docSnap of snap.docs) {
      if (docSnap.id === REGISTRY_DOC_ID) continue;
      const data = docSnap.data() as Partial<CaseFullData>;
      if (data && data.profile) {
        if (
          data.profile.name.trim() === normName &&
          normalizeBirthday(data.profile.birthday) === normBday
        ) {
          return { profile: data.profile, caseData: data as CaseFullData };
        }
      }
    }
  } catch (err) {
    console.warn(err);
  }
  return null;
}
