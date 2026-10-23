import { CaseProfile, VitalSignRecord, AppointmentRecord, MedicationItem, MedicationLog, RehabPlanItem } from '../types/health';
import { normalizeBirthday, getCanonicalCaseId } from '../utils/nameHelper';

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgoStr = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
const threeDaysAgoStr = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];

export interface CaseFullData {
  profile: CaseProfile;
  vitals: VitalSignRecord[];
  appointments: AppointmentRecord[];
  medications: MedicationItem[];
  medLogs: MedicationLog[];
  rehab: RehabPlanItem[];
}

// 1. Case: 王大明 (Requested explicitly in prompt example!)
export const caseWangDaMing: CaseFullData = {
  profile: {
    id: 'case-wang',
    name: '王大明',
    birthday: '19620708', // 1962年7月8日
    gender: 'male',
    age: 64,
    height: 172,
    weight: 71.2,
    caseNumber: 'HD-2026-0708',
    idCardLast4: '5218',
    bloodType: 'O型 Rh+',
    primaryDiagnosis: '冠狀動脈支架術後照護、第2型糖尿病、原發性高血壓',
    allergies: ['Aspirin (阿斯匹靈)'],
    primaryCaregiver: '林秀華 (配偶) / 王冠宇 (兒子)',
    contactPhone: '0933-112-233',
    hospitalEmergencyPhone: '02-8792-3311 (三軍總醫院急診室)',
    notes: '定時監測晨起空腹與晚餐後血糖；每日輕度步行30分鐘，活動時隨身攜帶硝化甘油舌下錠備用。'
  },
  vitals: [
    {
      id: 'vs-w1',
      timestamp: `${todayStr} 07:15`,
      systolicBP: 122,
      diastolicBP: 78,
      heartRate: 68,
      respiratoryRate: 16,
      bloodSugar: 104,
      bloodSugarTiming: 'fasting',
      bodyTemperature: 36.5,
      spo2: 99,
      weight: 71.2,
      notes: '晨起精神清爽，空腹血糖平穩',
      recordedBy: '本人 (大明)'
    },
    {
      id: 'vs-w2',
      timestamp: `${todayStr} 13:30`,
      systolicBP: 126,
      diastolicBP: 80,
      heartRate: 72,
      respiratoryRate: 18,
      bloodSugar: 138,
      bloodSugarTiming: 'postprandial',
      bodyTemperature: 36.6,
      spo2: 98,
      notes: '午餐糙米飯與蔬菜，餐後2小時量測正常',
      recordedBy: '配偶 (秀華)'
    },
    {
      id: 'vs-w3',
      timestamp: `${yesterdayStr} 19:30`,
      systolicBP: 128,
      diastolicBP: 82,
      heartRate: 70,
      respiratoryRate: 16,
      bloodSugar: 132,
      bloodSugarTiming: 'postprandial',
      spo2: 98,
      notes: '晚飯後散步半小時後測量',
      recordedBy: '本人 (大明)'
    },
    {
      id: 'vs-w4',
      timestamp: `${twoDaysAgoStr} 07:20`,
      systolicBP: 120,
      diastolicBP: 76,
      heartRate: 66,
      respiratoryRate: 16,
      bloodSugar: 98,
      bloodSugarTiming: 'fasting',
      bodyTemperature: 36.4,
      spo2: 98,
      notes: '早晨起床量測，精神佳',
      recordedBy: '本人 (大明)'
    },
    {
      id: 'vs-w5',
      timestamp: `${threeDaysAgoStr} 07:40`,
      systolicBP: 125,
      diastolicBP: 80,
      heartRate: 74,
      respiratoryRate: 17,
      bloodSugar: 112,
      bloodSugarTiming: 'fasting',
      bodyTemperature: 36.5,
      spo2: 99,
      notes: '空腹測量，血壓平穩',
      recordedBy: '本人 (大明)'
    }
  ],
  appointments: [
    {
      id: 'apt-w1',
      hospital: '國泰綜合醫院',
      department: '心臟內科 (本館 2F 15診)',
      doctor: '柯文心 主治醫師',
      date: '2026-10-25',
      time: '10:00',
      status: 'upcoming',
      chiefComplaint: '支架置放術後三個月超音波與運動心電圖追蹤、確認抗凝血用藥狀況',
      doctorOrders: '回診前請維持完整一週的居家血壓血壓紀錄本，需抽空腹血脂。',
      needAccompaniment: true,
      transportationNotes: '自行開車或搭捷運至信義安和站。',
      notes: '欲向醫師詢問是否可增加慢跑心肺運動強度。'
    },
    {
      id: 'apt-w2',
      hospital: '市立聯合醫院 (仁愛院區)',
      department: '新陳代謝科 (門診 3F)',
      doctor: '陳彥廷 醫師',
      date: '2026-11-12',
      time: '14:30',
      status: 'upcoming',
      chiefComplaint: '糖尿病常規拿藥與糖化血色素 HbA1c 檢驗',
      doctorOrders: '當日中午前需空腹抽血，檢查尿液微量白蛋白。',
      needAccompaniment: false,
      notes: '糖化血色素前次為 6.6%，維持穩定。'
    },
    {
      id: 'apt-w-emg1',
      hospital: '三軍總醫院 (內湖院區)',
      department: '急診醫學部',
      doctor: '急診值班醫師',
      date: '2026-10-18',
      time: '21:40',
      status: 'completed',
      visitType: 'emergency',
      chiefComplaint: '晚飯後突感胸悶胸痛、呼吸急促伴隨冷汗，服用NTG舌下錠後由家屬緊急送醫。',
      doctorOrders: '心電圖無急性ST段上升，Troponin-I心肌酵素正常，給予點滴與鎮靜觀察4小時後緩解出院。交代按時服用抗血小板藥物，並安排10/25心臟科門診追蹤。',
      needAccompaniment: true,
      transportationNotes: '119 救護車送達急診',
      notes: '離院時血壓 128/82 mmHg，精神穩定。',
      emergencyDetails: {
        transportMode: 'ambulance',
        triageLevel: '檢傷二級 (危急)',
        dischargeStatus: 'discharged',
        attendingFamily: '王冠宇 (兒子)'
      }
    }
  ],
  medications: [
    {
      id: 'med-w1',
      name: 'Brilinta 倍林達 90mg (Ticagrelor)',
      category: '抗血小板凝集劑 (支架防血栓)',
      dosage: '1 錠',
      timingSlots: ['morning', 'evening'],
      frequencyText: '每日兩次，早晚飯後',
      instructions: '保護心血管支架暢通，嚴禁自行中斷，請按時規律服用。',
      sideEffectsWarning: '輕微呼吸喘或皮下瘀青為常見現象，若嚴重出血請就診。',
      stockQuantity: 42,
      isActive: true
    },
    {
      id: 'med-w2',
      name: 'Diovan 岱芬膜衣錠 80mg (Valsartan)',
      category: '降血壓 (血管張力素阻斷劑)',
      dosage: '1 錠',
      timingSlots: ['morning'],
      frequencyText: '每日一次，早餐後',
      instructions: '保護心臟與腎臟，每日晨起量測血壓後服用。',
      sideEffectsWarning: '初次服用注意起身防暈眩。',
      stockQuantity: 28,
      isActive: true
    },
    {
      id: 'med-w3',
      name: 'Janumet 佳糖維合劑 50/500mg',
      category: '複方降血糖藥 (DPP-4 + Metformin)',
      dosage: '1 錠',
      timingSlots: ['morning', 'evening'],
      frequencyText: '每日兩次，隨餐服用',
      instructions: '飯前或隨餐服用，維持全日平穩血糖。',
      sideEffectsWarning: '少數可能引起輕微脹氣。',
      stockQuantity: 56,
      isActive: true
    },
    {
      id: 'med-w4',
      name: 'Crestor 冠脂妥 10mg (Rosuvastatin)',
      category: '降膽固醇 (Statin類)',
      dosage: '1 錠',
      timingSlots: ['bedtime'],
      frequencyText: '每日一次，睡前服用',
      instructions: '嚴格控制低密度膽固醇 LDL < 55 mg/dL。',
      sideEffectsWarning: '若肌肉劇烈無力疼痛請向醫師諮詢。',
      stockQuantity: 26,
      isActive: true
    }
  ],
  medLogs: [
    { id: 'log-w1', date: todayStr, medicationId: 'med-w1', slot: 'morning', taken: true, takenAt: '08:05' },
    { id: 'log-w2', date: todayStr, medicationId: 'med-w2', slot: 'morning', taken: true, takenAt: '08:05' },
    { id: 'log-w3', date: todayStr, medicationId: 'med-w3', slot: 'morning', taken: true, takenAt: '08:07' },
    { id: 'log-w4', date: todayStr, medicationId: 'med-w1', slot: 'evening', taken: false },
    { id: 'log-w5', date: todayStr, medicationId: 'med-w3', slot: 'evening', taken: false },
    { id: 'log-w6', date: todayStr, medicationId: 'med-w4', slot: 'bedtime', taken: false }
  ],
  rehab: [
    {
      id: 'rh-w1',
      title: '心臟復健：平地節奏性有氧快走',
      category: 'cardiopulmonary',
      targetSets: 1,
      targetRepsOrMinutes: '持續 25-30 分鐘',
      frequency: '每日一次 (傍晚為佳)',
      instructions: '暖身5分鐘，快走時維持可說話但稍微喘的速度 (心率約 105-115 bpm)，緩和5分鐘。',
      precautions: '胸悶、氣短或頭暈時需立即坐下休息並按壓脈搏。',
      completedTodaySets: 1,
      painScaleToday: 0,
      difficultyFeedback: 'moderate'
    },
    {
      id: 'rh-w2',
      title: '靠牆微深蹲與下肢耐力訓練',
      category: 'physical',
      targetSets: 3,
      targetRepsOrMinutes: '每組靜止維持 15 秒',
      frequency: '每日 2 次',
      instructions: '背貼平牆面順勢下滑，膝蓋微彎約60度，膝蓋勿超過腳尖，鍛鍊大腿股四頭肌。',
      precautions: '切勿憋氣，保持順暢腹式呼吸；膝關節若痠痛可縮小下蹲角度。',
      completedTodaySets: 2,
      painScaleToday: 1,
      difficultyFeedback: 'easy'
    },
    {
      id: 'rh-w3',
      title: '彈力帶上肢擴胸與肩背肌群強化',
      category: 'physical',
      targetSets: 3,
      targetRepsOrMinutes: '每組 12 次',
      frequency: '每日 1-2 次',
      instructions: '雙手握彈力帶於胸前緩慢向兩側拉開，肩胛骨向內收攏夾緊，維持2秒再復原。',
      precautions: '動作放慢平順，維持脊椎挺直避免聳肩。',
      completedTodaySets: 3,
      painScaleToday: 0,
      difficultyFeedback: 'easy'
    }
  ]
};

// 2. Case: 陳德榮 (腦中風復健期)
export const caseChenDeRong: CaseFullData = {
  profile: {
    id: 'case-chen',
    name: '陳德榮',
    birthday: '19550315', // 1955年3月15日
    gender: 'male',
    age: 71,
    height: 168,
    weight: 68.4,
    caseNumber: 'HD-2026-0819',
    idCardLast4: '3829',
    bloodType: 'A型 Rh+',
    primaryDiagnosis: '缺血性腦中風恢復期 (左側偏癱)、原發性高血壓、第2型糖尿病',
    allergies: ['盤尼西林 (Penicillin)'],
    primaryCaregiver: '陳美娟 (女兒) / 林阿姨 (日間居服員)',
    contactPhone: '0912-345-678',
    hospitalEmergencyPhone: '02-2312-3456 (分機 66110 臺大總院急診)',
    notes: '日常移位需使用四腳拐杖或單人攙扶；語言表達清楚，吞嚥需細嚼慢嚥，避免嗆咳。'
  },
  vitals: [
    {
      id: 'vs-c1',
      timestamp: `${todayStr} 07:30`,
      systolicBP: 128,
      diastolicBP: 82,
      heartRate: 74,
      respiratoryRate: 16,
      bloodSugar: 108,
      bloodSugarTiming: 'fasting',
      bodyTemperature: 36.6,
      spo2: 98,
      weight: 68.4,
      notes: '起床後測量，精神狀態良好，無頭暈感',
      recordedBy: '陳美娟 (家屬)'
    },
    {
      id: 'vs-c2',
      timestamp: `${todayStr} 13:15`,
      systolicBP: 134,
      diastolicBP: 86,
      heartRate: 78,
      respiratoryRate: 17,
      bloodSugar: 142,
      bloodSugarTiming: 'postprandial',
      bodyTemperature: 36.8,
      spo2: 97,
      notes: '午餐後2小時測量，血糖控制在目標範圍內',
      recordedBy: '林阿姨 (照護員)'
    },
    {
      id: 'vs-c3',
      timestamp: `${yesterdayStr} 07:45`,
      systolicBP: 130,
      diastolicBP: 84,
      heartRate: 72,
      respiratoryRate: 16,
      bloodSugar: 102,
      bloodSugarTiming: 'fasting',
      bodyTemperature: 36.5,
      spo2: 98,
      notes: '晨間量測，血壓穩定',
      recordedBy: '陳美娟 (家屬)'
    },
    {
      id: 'vs-c4',
      timestamp: `${twoDaysAgoStr} 19:20`,
      systolicBP: 132,
      diastolicBP: 85,
      heartRate: 76,
      respiratoryRate: 17,
      bloodSugar: 136,
      bloodSugarTiming: 'postprandial',
      bodyTemperature: 36.7,
      spo2: 97,
      notes: '晚飯後量測',
      recordedBy: '林阿姨 (照護員)'
    }
  ],
  appointments: [
    {
      id: 'apt-c1',
      hospital: '臺大醫院總院',
      department: '神經內科 (門診大樓 3F 22診)',
      doctor: '張銘宏 主治醫師',
      date: '2026-10-24',
      time: '09:30',
      status: 'upcoming',
      chiefComplaint: '中風後六個月定期追蹤、評估抗血小板藥物療效與手部痙攣改善情形',
      doctorOrders: '回診當日需抽血檢驗 HbA1c 與血脂、檢視居家血壓紀錄表，請攜帶用藥明細本。',
      needAccompaniment: true,
      transportationNotes: '建議預約復康巴士 (預約單號 RC-8821)，需攜帶輪椅備用。',
      notes: '需請醫師評估是否調整降血壓藥劑量。'
    }
  ],
  medications: [
    {
      id: 'med-c1',
      name: 'Norvasc 脈優錠 5mg',
      category: '降血壓 (鈣離子阻斷劑)',
      dosage: '1 錠',
      timingSlots: ['morning'],
      frequencyText: '每日一次，晨起飯後',
      instructions: '固定早晨服用，不可咬碎，注意姿態性低血壓防跌。',
      sideEffectsWarning: '輕微腳踝水腫、臉潮紅或頭昏。',
      stockQuantity: 24,
      isActive: true
    },
    {
      id: 'med-c2',
      name: 'Plavix 保栓通 75mg',
      category: '抗血小板凝集劑',
      dosage: '1 錠',
      timingSlots: ['morning'],
      frequencyText: '每日一次，早餐後',
      instructions: '預防中風復發，請固定時間服用，不可隨意停藥。',
      sideEffectsWarning: '若有異常牙齦出血、黑便或易瘀青請立即告知醫師。',
      stockQuantity: 28,
      isActive: true
    }
  ],
  medLogs: [
    { id: 'log-c1', date: todayStr, medicationId: 'med-c1', slot: 'morning', taken: true, takenAt: '08:10' },
    { id: 'log-c2', date: todayStr, medicationId: 'med-c2', slot: 'morning', taken: true, takenAt: '08:10' }
  ],
  rehab: [
    {
      id: 'rh-c1',
      title: '患側下肢直膝抬腿與臀橋 (Bridging)',
      category: 'physical',
      targetSets: 3,
      targetRepsOrMinutes: '每組12下 (維持5秒)',
      frequency: '每日 2 次',
      instructions: '仰臥屈膝，將臀部抬起使軀幹與大腿呈一直線，感受臀大肌收縮，動作放慢維持軀幹穩定。',
      precautions: '過程請維持正常呼吸，切勿憋氣；若腰部有痠刺感應即刻降低抬升幅度。',
      completedTodaySets: 2,
      painScaleToday: 1,
      difficultyFeedback: 'moderate'
    }
  ]
};

// 3. Case: 李淑芬 (膝關節置換後)
export const caseLiShuFen: CaseFullData = {
  profile: {
    id: 'case-li',
    name: '李淑芬',
    birthday: '19581120', // 1958年11月20日
    gender: 'female',
    age: 68,
    height: 156,
    weight: 56.5,
    caseNumber: 'HD-2026-1120',
    idCardLast4: '4192',
    bloodType: 'B型 Rh+',
    primaryDiagnosis: '右側全人工膝關節置換術後 (TKR) 復健期、骨質疏鬆症',
    allergies: ['磺胺類藥物 (Sulfa drugs)'],
    primaryCaregiver: '張雅筑 (小女兒)',
    contactPhone: '0928-889-900',
    hospitalEmergencyPhone: '02-2871-2121 (台北榮總急診部)',
    notes: '室內平地練習使用單手拐，下樓梯需攙扶；傷口保持乾燥，定時冰敷消腫。'
  },
  vitals: [
    {
      id: 'vs-l1',
      timestamp: `${todayStr} 08:00`,
      systolicBP: 118,
      diastolicBP: 76,
      heartRate: 72,
      respiratoryRate: 16,
      bodyTemperature: 36.4,
      spo2: 98,
      weight: 56.5,
      notes: '右膝微腫，晨起冰敷15分鐘後量測',
      recordedBy: '本人 (淑芬)'
    }
  ],
  appointments: [
    {
      id: 'apt-l1',
      hospital: '台北榮民總醫院',
      department: '骨科門診 (中正樓 3F)',
      doctor: '周伯勳 主治醫師',
      date: '2026-10-30',
      time: '11:15',
      status: 'upcoming',
      chiefComplaint: '術後滿兩個月膝關節 X 光攝影與彎曲角度活動度評估',
      doctorOrders: '檢查前照 X 光，請穿著寬鬆易穿脫長褲。',
      needAccompaniment: true,
      notes: '目前主動彎曲可達 105 度。'
    }
  ],
  medications: [
    {
      id: 'med-l1',
      name: 'Celebrex 希樂葆膠囊 200mg',
      category: '消炎止痛 (選擇性COX-2抑制劑)',
      dosage: '1 顆',
      timingSlots: ['morning'],
      frequencyText: '每日一次，晨起飯後',
      instructions: '關節復健消炎，飯後服用保護胃壁。',
      stockQuantity: 14,
      isActive: true
    },
    {
      id: 'med-l2',
      name: 'Caltrate 挺立鈣強化錠 + D3',
      category: '骨質疏鬆營養補充',
      dosage: '1 錠',
      timingSlots: ['noon'],
      frequencyText: '每日一次，午餐後',
      instructions: '飯後配合充足飲水服用。',
      stockQuantity: 45,
      isActive: true
    }
  ],
  medLogs: [
    { id: 'log-l1', date: todayStr, medicationId: 'med-l1', slot: 'morning', taken: true, takenAt: '08:30' },
    { id: 'log-l2', date: todayStr, medicationId: 'med-l2', slot: 'noon', taken: false }
  ],
  rehab: [
    {
      id: 'rh-l1',
      title: '右膝滑板屈膝活動度訓練 (Heel Slide)',
      category: 'physical',
      targetSets: 3,
      targetRepsOrMinutes: '每組 15 次 (末端維持5秒)',
      frequency: '每日 3 次',
      instructions: '平躺或長坐姿，腳跟套毛巾緩慢向臀部滑動屈膝至緊繃感，深呼吸維持再緩慢伸直。',
      precautions: '緊繃微痠為正常，若有劇烈刀割痛感請停止。',
      completedTodaySets: 2,
      painScaleToday: 2,
      difficultyFeedback: 'moderate'
    }
  ]
};

// Default initial case map
export const initialCaseRegistry: Record<string, CaseFullData> = {
  'case-wang': caseWangDaMing,
  'case-chen': caseChenDeRong,
  'case-li': caseLiShuFen,
};

// Storage keys
const STORAGE_PREFIX = 'case_diary_v2_';

export function getStoredCaseList(): CaseProfile[] {
  let list: CaseProfile[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'registered_profiles');
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading profiles from storage:', e);
  }

  if (!list || list.length === 0) {
    list = [caseWangDaMing.profile, caseChenDeRong.profile, caseLiShuFen.profile];
  }

  // Cross-reference each profile with its saved case data in `data_${profile.id}`
  // to ensure any edited fields (height, weight, bloodType, allergies, etc.) are always the latest
  return list.map((p) => {
    let resolved = { ...p };
    try {
      const canonicalId = getCanonicalCaseId(p.name, p.birthday);
      resolved.id = canonicalId;
      const caseDataRaw =
        localStorage.getItem(STORAGE_PREFIX + `data_${canonicalId}`) ||
        localStorage.getItem(STORAGE_PREFIX + `data_${p.id}`);
      if (caseDataRaw) {
        const parsed = JSON.parse(caseDataRaw);
        if (parsed && parsed.profile) {
          resolved = { ...resolved, ...parsed.profile, id: canonicalId };
        }
      }
    } catch (_) {}
    return resolved;
  });
}

export function saveStoredCaseList(profiles: CaseProfile[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'registered_profiles', JSON.stringify(profiles));
  } catch (e) {
    console.warn('Error saving profiles to storage:', e);
  }
}

export function createEmptyCaseData(caseId: string, profile?: Partial<CaseProfile>): CaseFullData {
  return {
    profile: {
      id: caseId,
      name: profile?.name || '健康個案',
      birthday: profile?.birthday || '1970-01-01',
      gender: profile?.gender || 'other',
      age: profile?.age || 50,
      height: profile?.height || 165,
      weight: profile?.weight || 60,
      caseNumber: profile?.caseNumber || `HD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      bloodType: profile?.bloodType || 'O型',
      primaryDiagnosis: profile?.primaryDiagnosis || '日常健康追蹤',
      allergies: profile?.allergies || [],
      primaryCaregiver: profile?.primaryCaregiver || '主要照顧家屬',
      contactPhone: profile?.contactPhone || '0900-000-000',
      notes: profile?.notes || '個人健康日誌紀錄。'
    },
    vitals: [],
    appointments: [],
    medications: [],
    medLogs: [],
    rehab: []
  };
}

export function loadCaseFullData(caseId: string): CaseFullData {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + `data_${caseId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (parsed.profile && parsed.profile.id && parsed.profile.id !== caseId) {
          console.warn(`[Sync Guard] Mismatched profile ID in cache for ${caseId}, repairing profile.`);
          parsed.profile.id = caseId;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error reading case data for ${caseId}:`, e);
  }

  // Fallback to initial registry only if specifically defined in seed list
  if (initialCaseRegistry[caseId]) {
    return initialCaseRegistry[caseId];
  }

  // If known in registered profiles, create clean empty case structure with their profile info
  const storedProfiles = getStoredCaseList();
  const existingProfile = storedProfiles.find((p) => p.id === caseId);
  if (existingProfile) {
    return createEmptyCaseData(caseId, existingProfile);
  }

  // Return Wang Da-Ming ONLY if specifically requested
  if (caseId === caseWangDaMing.profile.id || caseId === 'case-wang') {
    return caseWangDaMing;
  }

  // Never return Wang Da-Ming for custom / newly registered users!
  return createEmptyCaseData(caseId);
}

export function saveCaseFullData(caseId: string, data: CaseFullData): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + `data_${caseId}`, JSON.stringify(data));

    // Also synchronously update registered_profiles in localStorage so login & list are 100% in sync
    const raw = localStorage.getItem(STORAGE_PREFIX + 'registered_profiles');
    let list: CaseProfile[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (_) {}
    }
    if (!list || list.length === 0) {
      list = [caseWangDaMing.profile, caseChenDeRong.profile, caseLiShuFen.profile];
    }
    const idx = list.findIndex((p) => p.id === caseId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data.profile, id: caseId };
    } else if (data.profile) {
      list.push({ ...data.profile, id: caseId });
    }
    localStorage.setItem(STORAGE_PREFIX + 'registered_profiles', JSON.stringify(list));
  } catch (e) {
    console.warn(`Error saving case data for ${caseId}:`, e);
  }
}

export function findCaseByCredentials(name: string, birthdayInput: string): CaseProfile | null {
  const normInputName = (name || '').trim();
  const normInputBday = normalizeBirthday(birthdayInput);
  const profiles = getStoredCaseList();

  const matched = profiles.find((p) => {
    const matchName = p.name.trim() === normInputName;
    const matchBday = normalizeBirthday(p.birthday) === normInputBday;
    return matchName && matchBday;
  });

  return matched || null;
}
