import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Plus, 
  MapPin, 
  User, 
  FileText, 
  Clock, 
  Car, 
  CheckCircle, 
  Trash2, 
  X, 
  AlertCircle,
  HelpCircle,
  Siren,
  Phone,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Activity
} from 'lucide-react';
import { AppointmentRecord, CaseProfile } from '../types/health';

interface AppointmentsTabProps {
  appointments: AppointmentRecord[];
  onAddAppointment: (appointment: Omit<AppointmentRecord, 'id'>) => void;
  onUpdateStatus: (id: string, status: 'upcoming' | 'completed' | 'rescheduled') => void;
  onDeleteAppointment: (id: string) => void;
  caseProfile?: CaseProfile | null;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  onAddAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  caseProfile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'completed' | 'emergency' | 'all'>('upcoming');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalVisitType, setModalVisitType] = useState<'regular' | 'emergency'>('regular');

  // Form states
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(timeStr);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [doctorOrders, setDoctorOrders] = useState('');
  const [needAccompaniment, setNeedAccompaniment] = useState(true);
  const [transportationNotes, setTransportationNotes] = useState('');
  const [notes, setNotes] = useState('');

  // Emergency-specific form states
  const [transportMode, setTransportMode] = useState<'ambulance' | 'car' | 'taxi' | 'other'>('ambulance');
  const [triageLevel, setTriageLevel] = useState('檢傷二級 (危急)');
  const [dischargeStatus, setDischargeStatus] = useState<'discharged' | 'observing' | 'admitted'>('discharged');
  const [attendingFamily, setAttendingFamily] = useState(caseProfile?.primaryCaregiver || '家屬');

  const openModal = (type: 'regular' | 'emergency') => {
    setModalVisitType(type);
    if (type === 'emergency') {
      // Suggest case's preferred emergency room if available
      let emergencyHosp = '三軍總醫院 (急診部)';
      if (caseProfile?.hospitalEmergencyPhone) {
        const match = caseProfile.hospitalEmergencyPhone.match(/\((.*?)\)/);
        if (match && match[1]) {
          emergencyHosp = match[1];
        }
      }
      setHospital(emergencyHosp);
      setDepartment('急診醫學部');
      setDoctor('急診值班/主治醫師');
      setDate(todayStr);
      setTime(timeStr);
      setChiefComplaint('');
      setDoctorOrders('');
      setTransportationNotes('119 救護車送達急診');
      setTransportMode('ambulance');
      setDischargeStatus('discharged');
      setAttendingFamily(caseProfile?.primaryCaregiver || '家屬');
    } else {
      setHospital('');
      setDepartment('');
      setDoctor('');
      setDate(todayStr);
      setTime('09:30');
      setChiefComplaint('');
      setDoctorOrders('');
      setTransportationNotes('');
      setNeedAccompaniment(true);
    }
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital || !date) return;

    if (modalVisitType === 'emergency') {
      onAddAppointment({
        hospital,
        department: department || '急診醫學部',
        doctor: doctor || '急診主治醫師',
        date,
        time,
        status: dischargeStatus === 'observing' ? 'upcoming' : 'completed',
        visitType: 'emergency',
        chiefComplaint: chiefComplaint.trim() || '急診緊急就醫症狀',
        doctorOrders: doctorOrders.trim() || '急診處置完成，交代返家休養與門診追蹤',
        needAccompaniment: true,
        transportationNotes: transportationNotes || (transportMode === 'ambulance' ? '119 救護車送達' : '自行開車'),
        notes: notes.trim() || undefined,
        emergencyDetails: {
          transportMode,
          triageLevel,
          dischargeStatus,
          attendingFamily: attendingFamily.trim() || undefined,
        }
      });
    } else {
      onAddAppointment({
        hospital,
        department: department || '門診',
        doctor: doctor || '主治醫師',
        date,
        time,
        status: 'upcoming',
        visitType: 'regular',
        chiefComplaint: chiefComplaint.trim(),
        doctorOrders: doctorOrders.trim(),
        needAccompaniment,
        transportationNotes: transportationNotes.trim(),
        notes: notes.trim(),
      });
    }

    setIsAddModalOpen(false);
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { text: '今天就診', color: 'bg-rose-500 text-white animate-pulse' };
    if (diff === 1) return { text: '明天回診', color: 'bg-amber-500 text-white' };
    if (diff < 0) return { text: `已過 ${Math.abs(diff)} 天`, color: 'bg-slate-400 text-white' };
    return { text: `還有 ${diff} 天`, color: 'bg-blue-600 text-white' };
  };

  // Counts
  const upcomingCount = appointments.filter((a) => a.status === 'upcoming' && a.visitType !== 'emergency').length;
  const completedCount = appointments.filter((a) => a.status === 'completed' && a.visitType !== 'emergency').length;
  const emergencyCount = appointments.filter((a) => a.visitType === 'emergency').length;

  const filteredAppointments = appointments.filter((item) => {
    if (activeSubTab === 'upcoming') return item.status === 'upcoming' && item.visitType !== 'emergency';
    if (activeSubTab === 'completed') return item.status === 'completed' && item.visitType !== 'emergency';
    if (activeSubTab === 'emergency') return item.visitType === 'emergency';
    return true;
  }).sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());

  return (
    <div className="p-3 space-y-3">
      {/* Title & Add Actions */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            回診就醫紀錄
          </h2>
          <p className="text-[11px] text-slate-500">掌握院所門診排程、檢查與急診醫囑</p>
        </div>

        {/* Dual Actions: Regular vs Emergency */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => openModal('regular')}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            新增回診
          </button>
          <button
            type="button"
            onClick={() => openModal('emergency')}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition cursor-pointer ring-2 ring-rose-200/80 animate-in fade-in whitespace-nowrap"
          >
            <Siren className="w-3.5 h-3.5 animate-pulse shrink-0" />
            緊急就醫
          </button>
        </div>
      </div>

      {/* Emergency Assistance & Quick Notice Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-red-50/50 to-amber-50/40 border border-rose-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Siren className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs font-black text-rose-950 whitespace-nowrap">緊急醫療與急診專區</span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-md whitespace-nowrap shrink-0">
                  突發送醫通報
                </span>
              </div>
              <p className="text-[10px] text-rose-800/80 truncate">
                遇突發狀況可即刻記錄送醫處置，完整追蹤急診離院醫囑
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal('emergency')}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition shrink-0 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            登記
          </button>
        </div>

        {/* Emergency Contact Quick Access */}
        {caseProfile?.hospitalEmergencyPhone && (
          <div className="flex items-center justify-between bg-white/85 rounded-xl px-2.5 py-1.5 border border-rose-100 text-[11px]">
            <span className="text-slate-600 flex items-center gap-1 whitespace-nowrap">
              <Phone className="w-3 h-3 text-rose-600 shrink-0" />
              急診直通電話：
            </span>
            <span className="font-bold text-rose-700 whitespace-nowrap">
              {caseProfile.hospitalEmergencyPhone}
            </span>
          </div>
        )}
      </div>

      {/* Sub Tabs - strictly single line without wrapping */}
      <div className="flex bg-slate-150/80 p-1 rounded-xl text-xs font-semibold text-slate-600 gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex-1 py-1.5 px-1 text-center rounded-lg transition cursor-pointer whitespace-nowrap text-[11px] ${
            activeSubTab === 'upcoming' 
              ? 'bg-white text-blue-700 font-bold shadow-xs' 
              : 'hover:text-slate-900 text-slate-500'
          }`}
        >
          待就診 ({upcomingCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('completed')}
          className={`flex-1 py-1.5 px-1 text-center rounded-lg transition cursor-pointer whitespace-nowrap text-[11px] ${
            activeSubTab === 'completed' 
              ? 'bg-white text-blue-700 font-bold shadow-xs' 
              : 'hover:text-slate-900 text-slate-500'
          }`}
        >
          歷史就診 ({completedCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('emergency')}
          className={`flex-1 py-1.5 px-1 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap text-[11px] ${
            activeSubTab === 'emergency' 
              ? 'bg-white text-rose-700 font-bold shadow-xs ring-1 ring-rose-200' 
              : 'hover:text-slate-900 text-slate-500'
          }`}
        >
          <Siren className="w-3 h-3 text-rose-500 shrink-0" />
          <span className="whitespace-nowrap">緊急就醫 ({emergencyCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`flex-1 py-1.5 px-1 text-center rounded-lg transition cursor-pointer whitespace-nowrap text-[11px] ${
            activeSubTab === 'all' 
              ? 'bg-white text-slate-800 font-bold shadow-xs' 
              : 'hover:text-slate-900 text-slate-500'
          }`}
        >
          全部 ({appointments.length})
        </button>
      </div>

      {/* List of Appointments & Emergency Records */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 space-y-2">
            <div>
              {activeSubTab === 'emergency' ? '目前無緊急就醫紀錄' : '目前無此項就醫行程'}
            </div>
            {activeSubTab === 'emergency' ? (
              <button
                type="button"
                onClick={() => openModal('emergency')}
                className="inline-flex items-center gap-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                登記一筆緊急就醫紀錄
              </button>
            ) : (
              <p className="text-[11px] text-slate-400">點擊右上角新增門診或緊急就醫</p>
            )}
          </div>
        ) : (
          filteredAppointments.map((item) => {
            const isEmergency = item.visitType === 'emergency';
            const isUpcoming = item.status === 'upcoming';
            const countdown = isUpcoming && !isEmergency ? getDaysUntil(item.date) : null;

            // Emergency Card Layout
            if (isEmergency) {
              const emg = item.emergencyDetails;
              const dischargeText = 
                emg?.dischargeStatus === 'admitted' ? '轉收住院中' :
                emg?.dischargeStatus === 'observing' ? '留院觀察中' : '處置穩定已返家';
              const dischargeBadgeColor = 
                emg?.dischargeStatus === 'admitted' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                emg?.dischargeStatus === 'observing' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs ring-1 ring-rose-100/80 space-y-3 relative overflow-hidden"
                >
                  {/* Top Emergency Status Bar */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-rose-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs">
                        <Siren className="w-3 h-3" />
                        緊急急診就醫
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${dischargeBadgeColor}`}>
                        {dischargeText}
                      </span>
                      {emg?.triageLevel && (
                        <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-md font-semibold">
                          {emg.triageLevel}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.date} {item.time}</span>
                    </div>
                  </div>

                  {/* Hospital & Department */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.hospital}
                      </span>
                      <span className="text-xs text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md font-semibold border border-rose-100">
                        {item.department}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.doctor}
                      </span>
                      {item.transportationNotes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                            <Car className="w-3.5 h-3.5 text-rose-500" />
                            {item.transportationNotes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Emergency Symptoms / Reason */}
                  {item.chiefComplaint && (
                    <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs text-rose-950">
                      <div className="font-bold text-rose-900 text-[11px] mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        突發症狀 / 送醫原因：
                      </div>
                      <div className="leading-relaxed font-medium">{item.chiefComplaint}</div>
                    </div>
                  )}

                  {/* Treatment & Diagnosis */}
                  {item.doctorOrders && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs text-slate-800">
                      <div className="font-bold text-slate-700 text-[11px] mb-0.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        急診處置、檢驗與後續叮嚀：
                      </div>
                      <div className="leading-relaxed">{item.doctorOrders}</div>
                    </div>
                  )}

                  {/* Attending family & Notes */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="font-medium text-slate-600">
                        陪同家屬：{emg?.attendingFamily || '家屬'}
                      </span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic">{item.notes}</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAppointment(item.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 transition cursor-pointer"
                      title="刪除緊急就醫紀錄"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // Regular Outpatient Card Layout
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition ${
                  isUpcoming ? 'border-blue-200 shadow-xs' : 'border-slate-200 opacity-90'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.hospital}
                      </span>
                      <span className="text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                        {item.department}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.doctor}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.date} {item.time}
                      </span>
                    </div>
                  </div>

                  {countdown && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${countdown.color}`}>
                      {countdown.text}
                    </span>
                  )}

                  {!isUpcoming && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                      已完成就診
                    </span>
                  )}
                </div>

                {/* Chief Complaint */}
                {item.chiefComplaint && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <div className="font-bold text-slate-800 text-[11px] mb-0.5 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      就醫目的 / 症狀主訴：
                    </div>
                    <div className="leading-relaxed">{item.chiefComplaint}</div>
                  </div>
                )}

                {/* Doctor Orders */}
                {item.doctorOrders && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950">
                    <div className="font-bold text-amber-900 text-[11px] mb-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      醫師交代醫囑與檢驗：
                    </div>
                    <div className="leading-relaxed">{item.doctorOrders}</div>
                  </div>
                )}

                {/* Transportation & Family Tags */}
                {(item.needAccompaniment || item.transportationNotes) && (
                  <div className="mt-2.5 flex items-center flex-wrap gap-1.5 text-[11px]">
                    {item.needAccompaniment && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                        需家屬陪同
                      </span>
                    )}
                    {item.transportationNotes && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-500" />
                        {item.transportationNotes}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions bottom */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status === 'upcoming' ? (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'completed')}
                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        標記已就診
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'upcoming')}
                        className="text-xs font-medium text-slate-600 hover:text-slate-800 px-2 py-1 cursor-pointer"
                      >
                        改為待就診
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteAppointment(item.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition cursor-pointer"
                    title="刪除回診紀錄"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Outpatient / Emergency Visit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl max-h-[88vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              modalVisitType === 'emergency' ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${
                  modalVisitType === 'emergency' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {modalVisitType === 'emergency' ? <Siren className="w-4 h-4 animate-pulse" /> : <CalendarCheck className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {modalVisitType === 'emergency' ? '登記緊急急診就醫紀錄' : '新增門診回診行程'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {modalVisitType === 'emergency' ? '記錄突發送醫、急診處置與觀察狀況' : '掌握院所定期排程與就醫叮嚀'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher in Modal */}
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex gap-1">
              <button
                type="button"
                onClick={() => setModalVisitType('regular')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                  modalVisitType === 'regular'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                預約門診
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalVisitType('emergency');
                  setDepartment('急診醫學部');
                  setTransportationNotes('119 救護車送達急診');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                  modalVisitType === 'emergency'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-100/50'
                }`}
              >
                <Siren className="w-3.5 h-3.5" />
                🚨 緊急就醫
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Emergency Alert Prompt if in Emergency mode */}
              {modalVisitType === 'emergency' && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>緊急狀況提示：</strong>若患者目前有劇烈胸痛、呼吸困難、意識不清或中風徵兆，請立即撥打 <strong>119</strong> 叫救護車！
                  </div>
                </div>
              )}

              {/* Hospital */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {modalVisitType === 'emergency' ? '急診醫療院所 (必填)' : '醫療院所 (必填)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalVisitType === 'emergency' ? '如：三軍總醫院急診室、臺大醫院急診部' : '如：臺大醫院總院、榮總、國泰醫院...'}
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Department & Doctor */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {modalVisitType === 'emergency' ? '急診部門' : '科別診區 (必填)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如：急診醫學部、心臟科"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {modalVisitType === 'emergency' ? '急診主治/值班醫師' : '主治醫師姓名'}
                  </label>
                  <input
                    type="text"
                    placeholder={modalVisitType === 'emergency' ? '如：急診值班醫師' : '如：張醫師'}
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date & Time - Responsive single column on mobile to prevent overlapping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {modalVisitType === 'emergency' ? '送醫日期 (必填)' : '回診日期 (必填)'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none min-h-[40px] text-slate-800 font-medium"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {modalVisitType === 'emergency' ? '到院時間' : '看診時間'}
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none min-h-[40px] text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Emergency Transport Mode & Discharge Status */}
              {modalVisitType === 'emergency' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      到院交通方式
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setTransportMode('ambulance');
                          setTransportationNotes('119 救護車送達急診');
                        }}
                        className={`p-2 rounded-xl border text-center transition font-semibold cursor-pointer ${
                          transportMode === 'ambulance' ? 'bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        🚑 119 救護車
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTransportMode('car');
                          setTransportationNotes('家屬自行開車');
                        }}
                        className={`p-2 rounded-xl border text-center transition font-semibold cursor-pointer ${
                          transportMode === 'car' ? 'bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        🚗 家屬自行開車
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      急診離院處置狀況
                    </label>
                    <select
                      value={dischargeStatus}
                      onChange={(e) => setDischargeStatus(e.target.value as any)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="discharged">🟢 處置穩定已出院返家</option>
                      <option value="observing">🟡 急診留院觀察中</option>
                      <option value="admitted">🔴 情況危急，已安排轉收住院</option>
                    </select>
                  </div>
                </>
              )}

              {/* Chief Complaint / Symptoms */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {modalVisitType === 'emergency' ? '急診送醫原因 / 突發症狀 (必填)' : '就診目的 / 主訴症狀'}
                </label>
                <textarea
                  rows={2}
                  required={modalVisitType === 'emergency'}
                  placeholder={modalVisitType === 'emergency' ? '請詳述突發症狀，如：晚間突發劇烈胸痛冒冷汗、血壓飆高至 190/110、呼吸急促 SpO2 掉至 88%...' : '如：定期拿慢性病處方、評估手指復健、近期頭暈檢查...'}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Doctor orders / Emergency treatment */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {modalVisitType === 'emergency' ? '急診處置、檢查與離院交代' : '醫師叮嚀 / 抽血檢查備忘'}
                </label>
                <textarea
                  rows={2}
                  placeholder={modalVisitType === 'emergency' ? '如：心電圖無異常，心肌酵素正常，給予點滴緩解。交代按時服藥，安排本週五心臟科回診追蹤...' : '如：前一晚午夜12點後空腹、需攜帶血壓記錄本...'}
                  value={doctorOrders}
                  onChange={(e) => setDoctorOrders(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Attending Family / Notes */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    陪同家屬
                  </label>
                  <input
                    type="text"
                    placeholder="如：配偶、長子"
                    value={attendingFamily}
                    onChange={(e) => setAttendingFamily(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {modalVisitType === 'emergency' ? '後續門診排程備註' : '交通接送備註'}
                  </label>
                  <input
                    type="text"
                    placeholder={modalVisitType === 'emergency' ? '如：預約 10/25 回診' : '如：預約復康巴士'}
                    value={transportationNotes}
                    onChange={(e) => setTransportationNotes(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Regular Accompaniment Checkbox */}
              {modalVisitType === 'regular' && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="needAccompaniment"
                    checked={needAccompaniment}
                    onChange={(e) => setNeedAccompaniment(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="needAccompaniment" className="text-xs text-slate-700 font-medium">
                    需要家屬或居服員陪同看診
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalVisitType === 'emergency'
                      ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-300'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {modalVisitType === 'emergency' ? (
                    <>
                      <Siren className="w-4 h-4" />
                      確認登記緊急就醫紀錄
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      儲存門診回診行程
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
