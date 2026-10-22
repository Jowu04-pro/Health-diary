export type TabType = 'overview' | 'vitals' | 'appointments' | 'medications' | 'rehab';

export interface CaseProfile {
  id: string;
  name: string; // 姓名 (帳號)
  birthday: string; // 生日 (密碼, YYYY-MM-DD 或 YYYYMMDD)
  gender: 'male' | 'female' | 'other';
  age: number;
  height?: number; // 身高 (cm)
  weight?: number; // 體重 (kg)
  caseNumber?: string; // 個案編號
  idCardLast4?: string;
  bloodType: string;
  primaryDiagnosis: string; // 主要診斷
  allergies: string[]; // 過敏史
  primaryCaregiver: string; // 主要照顧者
  contactPhone: string; // 緊急聯絡電話
  hospitalEmergencyPhone?: string;
  notes?: string;
}

export interface VitalSignRecord {
  id: string;
  timestamp: string; // ISO string or YYYY-MM-DD HH:mm
  systolicBP?: number; // 收縮壓 (mmHg)
  diastolicBP?: number; // 舒張壓 (mmHg)
  heartRate?: number; // 脈搏心率 (bpm)
  respiratoryRate?: number; // 呼吸速率 (次/分 或 bpm)
  bloodSugar?: number; // 血糖 (mg/dL)
  bloodSugarTiming?: 'fasting' | 'postprandial' | 'random' | 'bedtime'; // 空腹、飯後2小時、隨機、睡前
  bodyTemperature?: number; // 體溫 (°C)
  spo2?: number; // 血氧飽和度 (%)
  weight?: number; // 體重 (kg)
  notes?: string;
  recordedBy?: string;
}

export interface AppointmentRecord {
  id: string;
  hospital: string; // 院所 (e.g. 臺大醫院)
  department: string; // 科別 (e.g. 心臟內科、急診醫學部)
  doctor: string; // 醫師姓名 (或急診值班醫師)
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'upcoming' | 'completed' | 'rescheduled'; // 狀態
  visitType?: 'regular' | 'emergency'; // 就診類型：常規門診 vs 緊急就醫/急診
  chiefComplaint: string; // 本次回診主訴 / 緊急送醫症狀
  doctorOrders: string; // 醫師囑咐 / 急診處置與診斷
  nextAppointmentDate?: string; // 下次回診日期
  needAccompaniment?: boolean; // 是否需家屬陪同
  transportationNotes?: string; // 交通或就醫注意事項 (如：119救護車、復康巴士)
  notes?: string;
  emergencyDetails?: {
    transportMode?: 'ambulance' | 'car' | 'taxi' | 'other'; // 到院方式
    triageLevel?: string; // 檢傷分類 (如: 檢傷二級、檢傷三級)
    dischargeStatus?: 'discharged' | 'observing' | 'admitted'; // 離院出院返家 / 留院觀察 / 轉收住院
    attendingFamily?: string; // 陪同家屬
  };
}

export type MedicationSlot = 'morning' | 'noon' | 'evening' | 'bedtime' | 'prn'; // 晨、中、晚、睡前、需要時

export interface MedicationItem {
  id: string;
  name: string; // 藥品名稱 (e.g. 脈優 Norvasc 5mg)
  category: string; // 藥物類別 (e.g. 降血壓藥)
  dosage: string; // 每次劑量 (e.g. 1錠)
  timingSlots: MedicationSlot[]; // 服用時段
  frequencyText: string; // 頻率說明 (e.g. 每日一次 早上飯後)
  instructions: string; // 服用指示 (飯前/飯後)
  sideEffectsWarning?: string; // 注意事項/副作用警示
  stockQuantity?: number; // 剩餘藥量 (顆)
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  date: string; // YYYY-MM-DD
  medicationId: string;
  slot: MedicationSlot;
  taken: boolean;
  takenAt?: string; // HH:mm
}

export interface RehabPlanItem {
  id: string;
  title: string; // 復健項目 (e.g. 站立平衡訓練、下肢肌力伸展)
  category: 'physical' | 'occupational' | 'speech' | 'cardiopulmonary' | 'home'; // 物理/職能/語言/心肺/居家
  targetSets: number; // 目標組數
  targetRepsOrMinutes: string; // 次數或時間 (e.g. 15次/組 或 20分鐘)
  frequency: string; // 執行頻率 (e.g. 每日2次)
  instructions: string; // 動作重點與治療師提示
  precautions: string; // 安全注意事項
  videoOrImageUrl?: string;
  completedTodaySets: number; // 今日已完成組數
  painScaleToday?: number; // 0-10 疼痛指數
  difficultyFeedback?: 'easy' | 'moderate' | 'hard';
}

export interface DailySummary {
  date: string;
  moodNote?: string;
  waterIntakeMl?: number;
  sleepHours?: number;
}
