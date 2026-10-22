/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TabType, 
  CaseProfile, 
  VitalSignRecord, 
  AppointmentRecord, 
  MedicationItem, 
  MedicationLog, 
  RehabPlanItem, 
  MedicationSlot 
} from './types/health';
import { 
  getStoredCaseList,
  saveStoredCaseList,
  loadCaseFullData,
  saveCaseFullData,
  caseWangDaMing
} from './data/mockData';
import {
  saveCaseToFirebase,
  loadCaseFromFirebase,
  subscribeToCaseData,
  syncProfilesToFirebase,
  subscribeToProfiles
} from './services/firebase';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { VitalSignsTab } from './components/VitalSignsTab';
import { AppointmentsTab } from './components/AppointmentsTab';
import { MedicationsTab } from './components/MedicationsTab';
import { RehabTab } from './components/RehabTab';
import { CaseProfileModal } from './components/CaseProfileModal';
import { DataSyncModal } from './components/DataSyncModal';
import { LoginScreen } from './components/LoginScreen';
import { Wifi, Battery, Signal, Check } from 'lucide-react';
import { getGivenName, calculateAge, normalizeBirthday } from './utils/nameHelper';

function serializeCaseData(
  profile: CaseProfile | null,
  vitals: VitalSignRecord[],
  appointments: AppointmentRecord[],
  medications: MedicationItem[],
  medLogs: MedicationLog[],
  rehab: RehabPlanItem[]
): string {
  if (!profile) return '';
  return JSON.stringify({
    pid: profile.id,
    pName: profile.name,
    pBday: profile.birthday,
    pAge: profile.age,
    pGender: profile.gender,
    pHeight: profile.height,
    pWeight: profile.weight,
    pBloodType: profile.bloodType,
    pDiag: profile.primaryDiagnosis,
    pAllergies: profile.allergies,
    pCaregiver: profile.primaryCaregiver,
    pPhone: profile.contactPhone,
    pNotes: profile.notes,
    vitals,
    appointments,
    medications,
    medLogs,
    rehab,
  });
}

export default function App() {
  // Mobile casing frame mode toggle (Defaults to true on larger screens, false on smaller)
  const [isFramed, setIsFramed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 640;
    }
    return true;
  });

  // Available case profiles list
  const [profiles, setProfiles] = useState<CaseProfile[]>(() => getStoredCaseList());

  // Current logged in case profile (null means show login screen)
  const [activeProfile, setActiveProfile] = useState<CaseProfile | null>(() => {
    // Check if there is a previously logged in case session
    try {
      const savedCaseId = localStorage.getItem('case_diary_active_id');
      if (savedCaseId) {
        const found = getStoredCaseList().find((p) => p.id === savedCaseId);
        if (found) return found;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileEditDirectly, setIsProfileEditDirectly] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isAddVitalOpen, setIsAddVitalOpen] = useState(false);

  // Save success confirmation dialog window
  const [showSaveSuccessDialog, setShowSaveSuccessDialog] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('個人檔案資料已成功儲存！');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSaveSuccessDialog) {
      timer = setTimeout(() => {
        setShowSaveSuccessDialog(false);
      }, 1600);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSaveSuccessDialog]);

  // Cloud Sync Status ('synced' | 'syncing' | 'offline')
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Anti-loop sync tracking refs
  const lastCloudHashRef = useRef<string>('');
  const isIncomingRemoteUpdateRef = useRef<boolean>(false);
  const cloudDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProfilesStrRef = useRef<string>('');

  // Realtime subscription to Firebase case registry list
  useEffect(() => {
    const unsub = subscribeToProfiles((remoteProfiles) => {
      if (remoteProfiles && remoteProfiles.length > 0) {
        const str = JSON.stringify(remoteProfiles);
        if (str === lastProfilesStrRef.current) return;
        lastProfilesStrRef.current = str;

        setProfiles((prev) => {
          const merged = [...prev];
          let changed = false;
          remoteProfiles.forEach((rp) => {
            const idx = merged.findIndex((p) => p.id === rp.id);
            if (idx >= 0) {
              if (JSON.stringify(merged[idx]) !== JSON.stringify(rp)) {
                merged[idx] = { ...merged[idx], ...rp };
                changed = true;
              }
            } else {
              merged.push(rp);
              changed = true;
            }
          });
          if (!changed) return prev;
          saveStoredCaseList(merged);
          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  // Health data state for currently logged-in case
  const [vitalSigns, setVitalSigns] = useState<VitalSignRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLog[]>([]);
  const [rehabPlans, setRehabPlans] = useState<RehabPlanItem[]>([]);

  // When activeProfile changes, load its independent diary data from localStorage
  useEffect(() => {
    if (activeProfile) {
      localStorage.setItem('case_diary_active_id', activeProfile.id);
      const caseData = loadCaseFullData(activeProfile.id);

      const vitals = caseData.vitals || [];
      const appts = caseData.appointments || [];
      const meds = caseData.medications || [];
      const logs = caseData.medLogs || [];
      const rehab = caseData.rehab || [];

      setVitalSigns(vitals);
      setAppointments(appts);
      setMedications(meds);
      setMedLogs(logs);
      setRehabPlans(rehab);
      setCurrentTab('overview');

      // Seed current local state hash to avoid pushing identical state on initial load
      lastCloudHashRef.current = serializeCaseData(
        activeProfile,
        vitals,
        appts,
        meds,
        logs,
        rehab
      );
    } else {
      localStorage.removeItem('case_diary_active_id');
      lastCloudHashRef.current = '';
    }
  }, [activeProfile?.id]);

  // Realtime listener for active case from Cloud Firestore (cross-device sync)
  useEffect(() => {
    if (!activeProfile?.id) return;
    const unsub = subscribeToCaseData(activeProfile.id, (remoteData) => {
      if (!remoteData) return;

      const remoteHash = serializeCaseData(
        remoteData.profile || null,
        remoteData.vitals || [],
        remoteData.appointments || [],
        remoteData.medications || [],
        remoteData.medLogs || [],
        remoteData.rehab || []
      );

      // Do nothing if incoming data matches what we already have or just sent
      if (remoteHash === lastCloudHashRef.current) {
        return;
      }

      // Mark that we are applying remote updates to suppress pushing back to Firestore
      isIncomingRemoteUpdateRef.current = true;
      lastCloudHashRef.current = remoteHash;

      if (remoteData.vitals) {
        setVitalSigns((prev) => (JSON.stringify(prev) === JSON.stringify(remoteData.vitals) ? prev : remoteData.vitals));
      }
      if (remoteData.appointments) {
        setAppointments((prev) => (JSON.stringify(prev) === JSON.stringify(remoteData.appointments) ? prev : remoteData.appointments));
      }
      if (remoteData.medications) {
        setMedications((prev) => (JSON.stringify(prev) === JSON.stringify(remoteData.medications) ? prev : remoteData.medications));
      }
      if (remoteData.medLogs) {
        setMedLogs((prev) => (JSON.stringify(prev) === JSON.stringify(remoteData.medLogs) ? prev : remoteData.medLogs));
      }
      if (remoteData.rehab) {
        setRehabPlans((prev) => (JSON.stringify(prev) === JSON.stringify(remoteData.rehab) ? prev : remoteData.rehab));
      }
      if (remoteData.profile) {
        const accAge = calculateAge(remoteData.profile.birthday, remoteData.profile.age);
        const nextProfile = { ...remoteData.profile, age: accAge };
        setActiveProfile((prev) => {
          if (!prev) return nextProfile;
          if (JSON.stringify(prev) === JSON.stringify(nextProfile)) return prev;
          return nextProfile;
        });
      }

      // Cache to localStorage
      saveCaseFullData(activeProfile.id, {
        profile: remoteData.profile || activeProfile,
        vitals: remoteData.vitals || [],
        appointments: remoteData.appointments || [],
        medications: remoteData.medications || [],
        medLogs: remoteData.medLogs || [],
        rehab: remoteData.rehab || [],
      });
      setCloudSyncStatus('synced');
    });
    return () => unsub();
  }, [activeProfile?.id]);

  // Persist current case data whenever any field updates (debounced and loop-protected)
  useEffect(() => {
    if (!activeProfile) return;

    const currentHash = serializeCaseData(
      activeProfile,
      vitalSigns,
      appointments,
      medications,
      medLogs,
      rehabPlans
    );

    const fullData = {
      profile: activeProfile,
      vitals: vitalSigns,
      appointments,
      medications,
      medLogs,
      rehab: rehabPlans,
    };

    // Always keep localStorage updated synchronously
    saveCaseFullData(activeProfile.id, fullData);

    // If this update was triggered by receiving data from Firestore, DO NOT push it back!
    if (isIncomingRemoteUpdateRef.current) {
      isIncomingRemoteUpdateRef.current = false;
      return;
    }

    // If local state is identical to cloud state, no network write is needed
    if (currentHash === lastCloudHashRef.current) {
      return;
    }

    // Debounce cloud write (1500ms) to prevent quota flooding
    if (cloudDebounceTimerRef.current) {
      clearTimeout(cloudDebounceTimerRef.current);
    }

    setCloudSyncStatus('syncing');
    cloudDebounceTimerRef.current = setTimeout(async () => {
      try {
        lastCloudHashRef.current = currentHash;
        await saveCaseToFirebase(activeProfile.id, fullData);
        setCloudSyncStatus('synced');
      } catch (err: any) {
        console.warn('Auto sync warning:', err?.message || err);
        setCloudSyncStatus('synced');
      }
    }, 1500);

    return () => {
      if (cloudDebounceTimerRef.current) {
        clearTimeout(cloudDebounceTimerRef.current);
      }
    };
  }, [activeProfile, vitalSigns, appointments, medications, medLogs, rehabPlans]);

  // Login handler
  const handleLoginSuccess = (profile: CaseProfile) => {
    // Read freshest profile from storage for this case
    const caseData = loadCaseFullData(profile.id);
    const freshest = caseData.profile || profile;
    const accurateAge = calculateAge(freshest.birthday, freshest.age);
    const finalProfile: CaseProfile = { ...freshest, age: accurateAge };
    setActiveProfile(finalProfile);
  };

  // Register new case
  const handleRegisterNewCase = (name: string, birthday: string) => {
    const normName = (name || '').trim().replace(/[\/\s#?\[\]]/g, '_');
    const normBday = normalizeBirthday(birthday);
    const newCaseId = `case_${normName}_${normBday}`;
    const accurateAge = calculateAge(birthday, 0);
    const newProfile: CaseProfile = {
      id: newCaseId,
      name,
      birthday,
      gender: 'other',
      age: accurateAge,
      height: 168,
      weight: 65,
      caseNumber: `HD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      bloodType: 'O型',
      primaryDiagnosis: '自主健康管理與定期追蹤',
      allergies: [],
      primaryCaregiver: '主要照顧家屬',
      contactPhone: '0900-000-000',
      notes: '個人專屬健康日誌。'
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveStoredCaseList(updatedProfiles);

    const initialData = {
      profile: newProfile,
      vitals: [],
      appointments: [],
      medications: [],
      medLogs: [],
      rehab: [],
    };

    // Initial empty template for new case
    saveCaseFullData(newCaseId, initialData);

    // Sync new case to Firebase Cloud Firestore
    syncProfilesToFirebase(updatedProfiles);
    saveCaseToFirebase(newCaseId, initialData);

    setActiveProfile(newProfile);
  };

  // Save edited profile handler
  const handleSaveProfile = (updated: CaseProfile) => {
    const accurateAge = calculateAge(updated.birthday, updated.age);
    const finalProfile: CaseProfile = { ...updated, age: accurateAge };

    // 1. Update activeProfile in state
    setActiveProfile(finalProfile);

    // 2. Update profiles list in state AND save to localStorage
    const exists = profiles.some((p) => p.id === finalProfile.id);
    const nextList = exists
      ? profiles.map((p) => (p.id === finalProfile.id ? finalProfile : p))
      : [...profiles, finalProfile];
    setProfiles(nextList);
    saveStoredCaseList(nextList);

    // 3. Persist complete case data into localStorage and Cloud Firestore
    const fullData = {
      profile: finalProfile,
      vitals: vitalSigns,
      appointments,
      medications,
      medLogs,
      rehab: rehabPlans,
    };
    saveCaseFullData(finalProfile.id, fullData);
    syncProfilesToFirebase(nextList);
    saveCaseToFirebase(finalProfile.id, fullData);

    // 4. Close the edit profile modal
    setIsProfileOpen(false);

    // 5. Open the dedicated Save Complete dialog window on top of the original usage screen
    setSaveSuccessMessage('個人檔案資料已成功儲存！');
    setShowSaveSuccessDialog(true);
  };

  // Logout handler
  const handleLogout = () => {
    if (activeProfile) {
      saveCaseFullData(activeProfile.id, {
        profile: activeProfile,
        vitals: vitalSigns,
        appointments,
        medications,
        medLogs,
        rehab: rehabPlans,
      });
    }
    setProfiles(getStoredCaseList());
    setActiveProfile(null);
  };

  // Vitals actions
  const handleAddVital = (newVital: Omit<VitalSignRecord, 'id'>) => {
    const record: VitalSignRecord = {
      ...newVital,
      id: `vs-${Date.now()}`,
    };
    setVitalSigns([record, ...vitalSigns]);
  };

  const handleDeleteVital = (id: string) => {
    setVitalSigns(vitalSigns.filter((v) => v.id !== id));
  };

  // Appointments actions
  const handleAddAppointment = (newAppt: Omit<AppointmentRecord, 'id'>) => {
    const record: AppointmentRecord = {
      ...newAppt,
      id: `apt-${Date.now()}`,
    };
    setAppointments([record, ...appointments]);
  };

  const handleUpdateApptStatus = (id: string, status: 'upcoming' | 'completed' | 'rescheduled') => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter((a) => a.id !== id));
  };

  // Medication actions
  const handleToggleMedLog = (logId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMedLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          const nextState = !log.taken;
          return {
            ...log,
            taken: nextState,
            takenAt: nextState ? timeStr : undefined,
          };
        }
        return log;
      })
    );
  };

  const handleAddMedication = (item: Omit<MedicationItem, 'id' | 'isActive'>) => {
    const newId = `med-${Date.now()}`;
    const newMed: MedicationItem = {
      ...item,
      id: newId,
      isActive: true,
    };
    setMedications([...medications, newMed]);

    const todayStr = new Date().toISOString().split('T')[0];
    const newLogs: MedicationLog[] = item.timingSlots.map((slot) => ({
      id: `log-${Date.now()}-${slot}`,
      date: todayStr,
      medicationId: newId,
      slot: slot as MedicationSlot,
      taken: false,
    }));
    setMedLogs([...medLogs, ...newLogs]);
  };

  const handleDeleteMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
    setMedLogs(medLogs.filter((l) => l.medicationId !== id));
  };

  // Rehab actions
  const handleIncrementRehabSet = (id: string) => {
    setRehabPlans(
      rehabPlans.map((p) => {
        if (p.id === id) {
          return { ...p, completedTodaySets: p.completedTodaySets + 1 };
        }
        return p;
      })
    );
  };

  const handleDecrementRehabSet = (id: string) => {
    setRehabPlans(
      rehabPlans.map((p) => {
        if (p.id === id && p.completedTodaySets > 0) {
          return { ...p, completedTodaySets: p.completedTodaySets - 1 };
        }
        return p;
      })
    );
  };

  const handleUpdatePainScale = (id: string, pain: number) => {
    setRehabPlans(
      rehabPlans.map((p) => (p.id === id ? { ...p, painScaleToday: pain } : p))
    );
  };

  const handleAddRehabPlan = (item: Omit<RehabPlanItem, 'id' | 'completedTodaySets'>) => {
    const record: RehabPlanItem = {
      ...item,
      id: `rh-${Date.now()}`,
      completedTodaySets: 0,
    };
    setRehabPlans([...rehabPlans, record]);
  };

  const handleDeleteRehabPlan = (id: string) => {
    setRehabPlans(rehabPlans.filter((p) => p.id !== id));
  };

  // Import & Reset Data for current case
  const handleImportData = (data: any) => {
    if (data.caseProfile && activeProfile) {
      setActiveProfile(data.caseProfile);
      setProfiles((prev) => prev.map((p) => (p.id === data.caseProfile.id ? data.caseProfile : p)));
    }
    if (data.vitalSigns) setVitalSigns(data.vitalSigns);
    if (data.appointments) setAppointments(data.appointments);
    if (data.medications) setMedications(data.medications);
    if (data.medLogs) setMedLogs(data.medLogs);
    if (data.rehabPlans) setRehabPlans(data.rehabPlans);
  };

  const handleResetDefault = () => {
    if (!activeProfile) return;
    const initialData = loadCaseFullData(activeProfile.id);
    setVitalSigns(initialData.vitals);
    setAppointments(initialData.appointments);
    setMedications(initialData.medications);
    setMedLogs(initialData.medLogs);
    setRehabPlans(initialData.rehab);
  };

  // Pending counts for badges
  const pendingMedCount = medLogs.filter((l) => !l.taken).length;
  const upcomingApptCount = appointments.filter((a) => a.status === 'upcoming').length;

  return (
    <div className={`min-h-screen bg-slate-900 flex items-center justify-center ${isFramed ? 'p-2 sm:p-4' : 'p-0'}`}>
      {/* 
        6-inch Smartphone Screen Container:
        Dimensions: 390px width × 780px height (max 92vh).
        Matches real standard 6.0"-6.1" phones (e.g. iPhone 13/14/15/16, Pixel 7/8).
      */}
      <div
        className={`w-full ${!activeProfile ? 'bg-slate-900' : 'bg-slate-100'} flex flex-col overflow-hidden transition-all duration-300 relative ${
          isFramed
            ? 'max-w-[390px] h-[812px] max-h-[92vh] rounded-[38px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-[8px] border-slate-800 ring-1 ring-white/10'
            : 'max-w-none h-screen min-h-[100dvh] rounded-none border-0'
        }`}
      >
        {/* Realistic Mobile Status Bar in 6-inch phone simulation */}
        {isFramed && (
          <div className="bg-emerald-700 text-white px-6 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold select-none shrink-0">
            <span>
              {new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            {/* Dynamic camera notch simulation */}
            <div className="w-16 h-3.5 bg-slate-900 rounded-full" />
            <div className="flex items-center space-x-1 text-white/90">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* If Not Logged In, Render Dedicated Login Screen */}
        {!activeProfile ? (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col bg-slate-900">
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onRegisterNewCase={handleRegisterNewCase}
              availableProfiles={profiles}
            />
          </div>
        ) : (
          /* Main Diary View for the Logged In Case */
          <>
            {/* App Top Header */}
            <Header
              caseProfile={activeProfile}
              cloudSyncStatus={cloudSyncStatus}
              onOpenProfile={() => {
                setIsProfileEditDirectly(false);
                setIsProfileOpen(true);
              }}
              onOpenEditProfile={() => {
                setIsProfileEditDirectly(true);
                setIsProfileOpen(true);
              }}
              onOpenSync={() => setIsSyncOpen(true)}
              onLogout={handleLogout}
            />

            {/* Scrollable Viewport Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 pb-2">
              {currentTab === 'overview' && (
                <HomeDashboard
                  caseProfile={activeProfile}
                  vitalSigns={vitalSigns}
                  appointments={appointments}
                  medications={medications}
                  medLogs={medLogs}
                  rehabPlans={rehabPlans}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  onOpenAddVital={() => {
                    setCurrentTab('vitals');
                    setIsAddVitalOpen(true);
                  }}
                  onQuickToggleMed={handleToggleMedLog}
                />
              )}

              {currentTab === 'vitals' && (
                <VitalSignsTab
                  vitalSigns={vitalSigns}
                  onAddVital={handleAddVital}
                  onDeleteVital={handleDeleteVital}
                  isAddModalOpen={isAddVitalOpen}
                  setIsAddModalOpen={setIsAddVitalOpen}
                  onOpenExportReport={() => setIsSyncOpen(true)}
                />
              )}

              {currentTab === 'appointments' && (
                <AppointmentsTab
                  appointments={appointments}
                  onAddAppointment={handleAddAppointment}
                  onUpdateStatus={handleUpdateApptStatus}
                  onDeleteAppointment={handleDeleteAppointment}
                  caseProfile={activeProfile}
                />
              )}

              {currentTab === 'medications' && (
                <MedicationsTab
                  medications={medications}
                  medLogs={medLogs}
                  onToggleMedLog={handleToggleMedLog}
                  onAddMedication={handleAddMedication}
                  onDeleteMedication={handleDeleteMedication}
                />
              )}

              {currentTab === 'rehab' && (
                <RehabTab
                  rehabPlans={rehabPlans}
                  onIncrementSet={handleIncrementRehabSet}
                  onDecrementSet={handleDecrementRehabSet}
                  onUpdatePainScale={handleUpdatePainScale}
                  onAddRehabPlan={handleAddRehabPlan}
                  onDeleteRehabPlan={handleDeleteRehabPlan}
                />
              )}
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav
              currentTab={currentTab}
              onChangeTab={setCurrentTab}
              pendingMedCount={pendingMedCount}
              upcomingApptCount={upcomingApptCount}
            />

            {/* Case Profile Modal */}
            <CaseProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              caseProfile={activeProfile}
              initialEditMode={isProfileEditDirectly}
              onSaveProfile={handleSaveProfile}
            />

            {/* Data Sync & Export Modal */}
            <DataSyncModal
              isOpen={isSyncOpen}
              onClose={() => setIsSyncOpen(false)}
              caseProfile={activeProfile}
              vitalSigns={vitalSigns}
              appointments={appointments}
              medications={medications}
              medLogs={medLogs}
              rehabPlans={rehabPlans}
              onImportData={handleImportData}
              onResetDefault={handleResetDefault}
            />

            {/* 儲存完畢確認視窗 (Save Complete Dialog) - 保留紅框內容 */}
            {showSaveSuccessDialog && (
              <div 
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={() => setShowSaveSuccessDialog(false)}
              >
                <div 
                  className="bg-white rounded-3xl p-6 max-w-[260px] w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-3 animate-in zoom-in-95 duration-200 cursor-pointer"
                  onClick={() => setShowSaveSuccessDialog(false)}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner ring-8 ring-emerald-50">
                    <Check className="w-9 h-9 stroke-[3]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">儲存完畢</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {saveSuccessMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Mobile bottom home indicator bar in frame mode */}
        {isFramed && (
          <div className={`${!activeProfile ? 'bg-slate-900' : 'bg-white'} py-1 flex justify-center items-center shrink-0 transition-colors`}>
            <div className={`w-24 h-1 ${!activeProfile ? 'bg-slate-700' : 'bg-slate-300'} rounded-full`} />
          </div>
        )}
      </div>
    </div>
  );
}
