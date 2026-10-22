import React from 'react';
import { 
  Heart, 
  Activity, 
  Pill, 
  CalendarClock, 
  Dumbbell, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Droplet, 
  Clock, 
  PlusCircle, 
  ShieldAlert
} from 'lucide-react';
import { 
  CaseProfile, 
  VitalSignRecord, 
  AppointmentRecord, 
  MedicationItem, 
  MedicationLog, 
  RehabPlanItem, 
  TabType 
} from '../types/health';
import { getGivenName } from '../utils/nameHelper';

interface HomeDashboardProps {
  caseProfile: CaseProfile;
  vitalSigns: VitalSignRecord[];
  appointments: AppointmentRecord[];
  medications: MedicationItem[];
  medLogs: MedicationLog[];
  rehabPlans: RehabPlanItem[];
  onNavigateTab: (tab: TabType) => void;
  onOpenAddVital: () => void;
  onQuickToggleMed: (logId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  caseProfile,
  vitalSigns,
  appointments,
  medications,
  medLogs,
  rehabPlans,
  onNavigateTab,
  onOpenAddVital,
  onQuickToggleMed,
}) => {
  const givenName = getGivenName(caseProfile.name);
  const latestVital = vitalSigns[0];

  // Upcoming appointments
  const upcomingAppts = appointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  const nextAppt = upcomingAppts[0];

  // Medication stats
  const totalMedsToday = medLogs.length;
  const takenMedsToday = medLogs.filter((m) => m.taken).length;
  const medPercent = totalMedsToday > 0 ? Math.round((takenMedsToday / totalMedsToday) * 100) : 100;
  const pendingMedLogs = medLogs.filter((m) => !m.taken);

  // Rehab stats
  const totalTargetSets = rehabPlans.reduce((sum, p) => sum + p.targetSets, 0);
  const totalCompletedSets = rehabPlans.reduce((sum, p) => sum + p.completedTodaySets, 0);
  const rehabPercent = totalTargetSets > 0 ? Math.round((totalCompletedSets / totalTargetSets) * 100) : 0;

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff < 0) return '已逾期';
    return `${diff} 天後`;
  };

  const getSlotLabel = (slot: string) => {
    switch (slot) {
      case 'morning': return '早晨';
      case 'noon': return '中午';
      case 'evening': return '晚間';
      case 'bedtime': return '睡前';
      default: return '常規';
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* 生命徵象 (Vital Signs Card) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs">最新生命徵象</h3>
              <p className="text-[10px] text-slate-400">
                {latestVital ? latestVital.timestamp : '尚無紀錄'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onOpenAddVital}
              className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 transition active:scale-95 border border-emerald-200/60"
              title="新增量測紀錄"
            >
              <PlusCircle className="w-3 h-3 text-emerald-600" />
              記錄
            </button>
            <button
              onClick={() => onNavigateTab('vitals')}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
            >
              看歷史
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {latestVital ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Blood Pressure & Heart Rate */}
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="flex items-center gap-1 font-semibold">
                  <Heart className="w-3 h-3 text-rose-500" /> 血壓 / 脈搏
                </span>
                {latestVital.systolicBP && ((latestVital.systolicBP > 140) || (latestVital.diastolicBP && latestVital.diastolicBP > 90)) ? (
                  <span className="px-1 py-0.2 rounded text-[9px] bg-rose-100 text-rose-700 font-bold">偏高</span>
                ) : latestVital.systolicBP && ((latestVital.systolicBP < 90) || (latestVital.diastolicBP && latestVital.diastolicBP < 60)) ? (
                  <span className="px-1 py-0.2 rounded text-[9px] bg-amber-100 text-amber-700 font-bold">偏低</span>
                ) : (
                  <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-700 font-bold">正常</span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-slate-800 tracking-tight">
                  {latestVital.systolicBP || '--'}/{latestVital.diastolicBP || '--'}
                </span>
                <span className="text-[9px] text-slate-400">mmHg</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5 flex flex-wrap items-center justify-between gap-1">
                <span>脈搏: <strong className="text-slate-700">{latestVital.heartRate || '--'} bpm</strong></span>
                {latestVital.respiratoryRate && (
                  <span>呼吸: <strong className="text-teal-700">{latestVital.respiratoryRate} bpm</strong></span>
                )}
              </div>
            </div>

            {/* Blood Sugar */}
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="flex items-center gap-1 font-semibold">
                  <Droplet className="w-3 h-3 text-blue-500" /> 血糖
                </span>
                <span className="text-[9px] text-slate-500 bg-slate-200/60 px-1 rounded">
                  {latestVital.bloodSugarTiming === 'fasting' ? '空腹' : '飯後'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-slate-800 tracking-tight">
                  {latestVital.bloodSugar || '--'}
                </span>
                <span className="text-[9px] text-slate-400">mg/dL</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                血氧: <span className="font-bold text-slate-700">{latestVital.spo2 || '--'}%</span> | 體溫: {latestVital.bodyTemperature || '--'}°C
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 bg-slate-50 rounded-xl text-xs text-slate-500">
            今日尚未量測，請點擊上方按鈕記錄
          </div>
        )}
      </div>

      {/* 回診紀錄提醒 (Next Appointment Banner) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs">近期回診叮嚀</h3>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('appointments')}
            className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-0.5"
          >
            全部 ({upcomingAppts.length})
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {nextAppt ? (
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white mb-1">
                  {getDaysUntil(nextAppt.date)} ({nextAppt.date})
                </span>
                <h4 className="font-bold text-slate-900 text-xs">
                  {nextAppt.hospital} - {nextAppt.department}
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  {nextAppt.doctor} • {nextAppt.time}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-blue-900 mt-1.5 bg-white/70 p-1.5 rounded-lg border border-blue-200/50">
              <span className="font-bold">提醒：</span>
              {nextAppt.chiefComplaint}
            </p>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-slate-500">
            近期無待辦回診預約
          </div>
        )}
      </div>

      {/* 用藥紀錄進度 (Medication Adherence) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Pill className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs">今日用藥執行</h3>
              <p className="text-[10px] text-slate-400">
                已服用 {takenMedsToday} / {totalMedsToday} 劑次 ({medPercent}%)
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('medications')}
            className="text-[11px] text-purple-700 hover:text-purple-800 font-semibold flex items-center gap-0.5"
          >
            藥品明細
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
          <div
            className="bg-purple-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${medPercent}%` }}
          />
        </div>

        {/* Pending Quick Check */}
        {pendingMedLogs.length > 0 ? (
          <div className="space-y-1">
            {pendingMedLogs.slice(0, 2).map((log) => {
              const med = medications.find((m) => m.id === log.medicationId);
              if (!med) return null;
              return (
                <div
                  key={log.id}
                  onClick={() => onQuickToggleMed(log.id)}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200/80 cursor-pointer active:scale-98 transition"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                      {getSlotLabel(log.slot)}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {med.name}
                    </span>
                  </div>
                  <button className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0">
                    打卡服藥
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            太棒了！今日藥品已全數按時服用
          </div>
        )}
      </div>

      {/* 復健計畫進度 (Rehab Progress) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs">今日復健計畫</h3>
              <p className="text-[10px] text-slate-400">
                完成 {totalCompletedSets} / {totalTargetSets} 組 ({rehabPercent}%)
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('rehab')}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-0.5"
          >
            訓練詳情
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${rehabPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {rehabPlans.slice(0, 2).map((plan) => (
            <div key={plan.id} className="p-1.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-800 truncate text-[11px]">
                {plan.title}
              </div>
              <div className="flex items-center justify-between text-[10px] mt-0.5">
                <span className="text-slate-500">{plan.completedTodaySets}/{plan.targetSets}組</span>
                <span className={`px-1 py-0.2 rounded font-bold ${
                  plan.completedTodaySets >= plan.targetSets 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {plan.completedTodaySets >= plan.targetSets ? '達標' : '進行中'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
