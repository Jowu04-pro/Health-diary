import React, { useState } from 'react';
import { 
  Plus, 
  Activity, 
  Heart, 
  Droplet, 
  Thermometer, 
  Wind, 
  Scale, 
  Trash2, 
  X, 
  AlertCircle, 
  Check, 
  Calendar,
  Clock,
  Filter,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { VitalSignRecord } from '../types/health';
import { VitalSignsChart } from './VitalSignsChart';

interface VitalSignsTabProps {
  vitalSigns: VitalSignRecord[];
  onAddVital: (vital: Omit<VitalSignRecord, 'id'>) => void;
  onDeleteVital: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onOpenExportReport?: () => void;
}

export const VitalSignsTab: React.FC<VitalSignsTabProps> = ({
  vitalSigns,
  onAddVital,
  onDeleteVital,
  isAddModalOpen,
  setIsAddModalOpen,
  onOpenExportReport,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'bp' | 'sugar'>('all');
  const [isRefOpen, setIsRefOpen] = useState(false);

  // Form states
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const [recordDate, setRecordDate] = useState(dateStr);
  const [recordTime, setRecordTime] = useState(timeStr);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [sugarTiming, setSugarTiming] = useState<'fasting' | 'postprandial' | 'random' | 'bedtime'>('fasting');
  const [bodyTemp, setBodyTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [recordedBy, setRecordedBy] = useState('家屬');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVital({
      timestamp: `${recordDate} ${recordTime}`,
      systolicBP: systolic ? Number(systolic) : undefined,
      diastolicBP: diastolic ? Number(diastolic) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      bloodSugarTiming: bloodSugar ? sugarTiming : undefined,
      bodyTemperature: bodyTemp ? Number(bodyTemp) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      weight: weight ? Number(weight) : undefined,
      notes: notes.trim() || undefined,
      recordedBy: recordedBy.trim() || undefined,
    });

    // Reset optional fields
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setRespiratoryRate('');
    setBloodSugar('');
    setBodyTemp('');
    setSpo2('');
    setWeight('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  // 血壓正常範圍: 收縮壓 90-140 mmHg ； 舒張壓 60-90 mmHg
  const getBPCategory = (sys?: number, dia?: number) => {
    if (!sys && !dia) return null;
    const isHigh = (sys && sys > 140) || (dia && dia > 90);
    const isLow = (sys && sys < 90) || (dia && dia < 60);
    if (isHigh) return { label: '血壓偏高', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (isLow) return { label: '血壓偏低', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: '血壓正常', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  // 血糖正常範圍: 空腹 70-140 mg/dL ； 飯後 < 200 mg/dL
  const getSugarCategory = (sugar?: number, timing?: string) => {
    if (!sugar) return null;
    if (sugar < 70) {
      return { label: '低血糖警訊', color: 'bg-rose-600 text-white animate-pulse' };
    }
    if (timing === 'fasting') {
      if (sugar > 140) return { label: '空腹偏高', color: 'bg-rose-100 text-rose-700' };
      return { label: '空腹正常', color: 'bg-emerald-100 text-emerald-700' };
    } else {
      if (sugar >= 200) return { label: '飯後偏高', color: 'bg-rose-100 text-rose-700' };
      return { label: '飯後正常', color: 'bg-emerald-100 text-emerald-700' };
    }
  };

  const filteredRecords = vitalSigns.filter((record) => {
    if (filterType === 'bp') return record.systolicBP || record.diastolicBP || record.heartRate;
    if (filterType === 'sugar') return record.bloodSugar !== undefined && record.bloodSugar !== null;
    return true;
  });

  // Reference Table JSX for reuse
  const renderNormalReferenceBox = () => (
    <div className="bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-slate-50/60 border border-emerald-100/70 rounded-2xl p-3 text-xs text-slate-600 shadow-2xs space-y-2">
      <div className="flex items-center gap-1.5 font-bold text-slate-700">
        <div className="w-5 h-5 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
          <Activity className="w-3.5 h-3.5" />
        </div>
        <span>生命徵象正常數值參考</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="bg-white/80 rounded-xl px-2.5 py-1.5 border border-slate-150/70 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-normal">體溫</span>
          <span className="font-semibold text-slate-800">36 - 37.5 ℃</span>
        </div>
        <div className="bg-white/80 rounded-xl px-2.5 py-1.5 border border-slate-150/70 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-normal">脈搏</span>
          <span className="font-semibold text-slate-800">60 - 100 bpm</span>
        </div>
        <div className="bg-white/80 rounded-xl px-2.5 py-1.5 border border-slate-150/70 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-normal">呼吸</span>
          <span className="font-semibold text-slate-800">12 - 20 bpm</span>
        </div>
        <div className="bg-white/80 rounded-xl px-2.5 py-1.5 border border-slate-150/70 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-normal">血氧</span>
          <span className="font-semibold text-slate-800">SpO2 ≥ 95%</span>
        </div>

        <div className="col-span-2 bg-white/80 rounded-xl px-2.5 py-1.5 border border-slate-150/70 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-normal shrink-0">血壓</span>
          <span className="font-semibold text-slate-800 text-right">
            收縮壓 90-140 mmHg ； 舒張壓 60-90 mmHg
          </span>
        </div>

        <div className="col-span-2 bg-white/80 rounded-xl px-2.5 py-1.5 border border-slate-150/70 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-normal shrink-0">血糖</span>
          <span className="font-semibold text-slate-800 text-right">
            空腹 70-140 mg/dL ； 飯後 &lt; 200 mg/dL
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 space-y-3">
      {/* Title & Add Actions */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-500" />
            生命徵象
          </h2>
          <p className="text-[11px] text-slate-500">記錄體溫、脈搏、呼吸、血壓、血氧及血糖</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenExportReport && (
            <button
              type="button"
              onClick={onOpenExportReport}
              className="flex items-center gap-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-2 py-1.5 rounded-xl shadow-2xs active:scale-95 transition cursor-pointer whitespace-nowrap"
              title="匯出月度生命徵象折線圖報表並儲存於手機"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>匯出月報</span>
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            新增量測
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-150/80 p-1 rounded-xl text-xs font-semibold text-slate-600 gap-1">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
            filterType === 'all' 
              ? 'bg-white text-emerald-800 font-bold shadow-xs' 
              : 'hover:text-slate-900 text-slate-500 hover:bg-white/50'
          }`}
        >
          <span>全部紀錄 ({vitalSigns.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType('bp')}
          className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            filterType === 'bp' 
              ? 'bg-white text-rose-700 font-bold shadow-xs ring-1 ring-rose-200' 
              : 'hover:text-slate-900 text-slate-500 hover:bg-white/50'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>血壓脈搏</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType('sugar')}
          className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            filterType === 'sugar' 
              ? 'bg-white text-blue-700 font-bold shadow-xs ring-1 ring-blue-200' 
              : 'hover:text-slate-900 text-slate-500 hover:bg-white/50'
          }`}
        >
          <Droplet className="w-3.5 h-3.5 text-blue-500" />
          <span>血糖記錄</span>
        </button>
      </div>

      {/* BP Line Chart View */}
      {filterType === 'bp' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          <VitalSignsChart
            type="bp"
            records={vitalSigns}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />

          {/* Collapsible reference bar */}
          <div>
            <button
              type="button"
              onClick={() => setIsRefOpen(!isRefOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/70 hover:bg-slate-100 rounded-xl text-[11px] font-semibold text-slate-600 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                生命徵象正常數值參考
              </span>
              {isRefOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {isRefOpen && (
              <div className="mt-2 animate-in fade-in duration-150">
                {renderNormalReferenceBox()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
            <span>血壓與脈搏記錄列表 ({filteredRecords.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">依量測時間倒序排列</span>
          </div>
        </div>
      )}

      {/* Sugar Line Chart View */}
      {filterType === 'sugar' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          <VitalSignsChart
            type="sugar"
            records={vitalSigns}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />

          {/* Collapsible reference bar */}
          <div>
            <button
              type="button"
              onClick={() => setIsRefOpen(!isRefOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/70 hover:bg-slate-100 rounded-xl text-[11px] font-semibold text-slate-600 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                生命徵象正常數值參考
              </span>
              {isRefOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {isRefOpen && (
              <div className="mt-2 animate-in fade-in duration-150">
                {renderNormalReferenceBox()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
            <span>血糖記錄列表 ({filteredRecords.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">依量測時間倒序排列</span>
          </div>
        </div>
      )}

      {/* All Records View */}
      {filterType === 'all' && (
        <div className="space-y-2.5">
          {/* Medical Target Reference Reference Box */}
          {renderNormalReferenceBox()}

          {/* Quick Chart Entry Banner */}
          <div className="bg-gradient-to-r from-emerald-50/60 to-blue-50/60 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>查看量測趨勢折線圖：</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setFilterType('bp')}
                className="text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <Heart className="w-3 h-3 text-rose-500" />
                血壓脈搏圖
              </button>
              <button
                type="button"
                onClick={() => setFilterType('sugar')}
                className="text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <Droplet className="w-3 h-3 text-blue-500" />
                血糖圖
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
            <span>所有量測記錄明細 ({filteredRecords.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">依時間倒序排列</span>
          </div>
        </div>
      )}

      {/* List of records */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            目前無符合條件的量測紀錄，點擊右上角新增
          </div>
        ) : (
          filteredRecords.map((item) => {
            const bpStatus = getBPCategory(item.systolicBP, item.diastolicBP);
            const sugarStatus = getSugarCategory(item.bloodSugar, item.bloodSugarTiming);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs relative hover:border-slate-300 transition"
              >
                {/* Header row */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.timestamp}</span>
                    {item.recordedBy && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">
                        {item.recordedBy}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteVital(item.id)}
                    className="text-slate-300 hover:text-rose-500 transition p-1"
                    title="刪除此筆記錄"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary metrics grid */}
                <div className="grid grid-cols-2 gap-2 pt-2.5">
                  {/* BP */}
                  {(item.systolicBP || item.diastolicBP) && (
                    <div className="bg-rose-50/50 rounded-xl p-2 border border-rose-100">
                      <div className="flex items-center justify-between text-[11px] text-rose-800">
                        <span className="flex items-center gap-1 font-semibold">
                          <Heart className="w-3.5 h-3.5 text-rose-500" /> 血壓
                        </span>
                        {bpStatus && (
                          <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${bpStatus.color}`}>
                            {bpStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1">
                        {item.systolicBP} / {item.diastolicBP}{' '}
                        <span className="text-[10px] font-normal text-slate-500">mmHg</span>
                      </div>
                      {item.heartRate && (
                        <div className="text-[11px] text-slate-600 mt-0.5 flex items-center justify-between">
                          <span>
                            脈搏: <span className="font-bold text-slate-800">{item.heartRate}</span> bpm
                          </span>
                          {item.heartRate > 100 ? (
                            <span className="text-[9px] text-rose-600 font-bold ml-1">(偏快)</span>
                          ) : item.heartRate < 60 ? (
                            <span className="text-[9px] text-amber-600 font-bold ml-1">(偏緩)</span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blood Sugar */}
                  {item.bloodSugar && (
                    <div className="bg-blue-50/50 rounded-xl p-2 border border-blue-100">
                      <div className="flex items-center justify-between text-[11px] text-blue-800">
                        <span className="flex items-center gap-1 font-semibold">
                          <Droplet className="w-3.5 h-3.5 text-blue-500" /> 血糖
                        </span>
                        {sugarStatus && (
                          <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${sugarStatus.color}`}>
                            {sugarStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1">
                        {item.bloodSugar}{' '}
                        <span className="text-[10px] font-normal text-slate-500">mg/dL</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        狀態: {item.bloodSugarTiming === 'fasting' ? '早晨空腹' : item.bloodSugarTiming === 'postprandial' ? '飯後2小時' : item.bloodSugarTiming === 'bedtime' ? '睡前' : '隨機量測'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Secondary metrics (呼吸, 體溫, 血氧, 體重) */}
                {(item.respiratoryRate || item.bodyTemperature || item.spo2 || item.weight) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    {item.respiratoryRate && (
                      <span className="flex items-center gap-1 bg-teal-50/70 text-teal-800 px-2 py-0.5 rounded-lg border border-teal-100">
                        <Wind className="w-3.5 h-3.5 text-teal-600" />
                        呼吸: <strong className="text-slate-800">{item.respiratoryRate} bpm</strong>
                        {item.respiratoryRate > 20 ? (
                          <span className="text-[9px] text-rose-600 font-bold ml-0.5">(偏快)</span>
                        ) : item.respiratoryRate < 12 ? (
                          <span className="text-[9px] text-amber-600 font-bold ml-0.5">(偏慢)</span>
                        ) : null}
                      </span>
                    )}
                    {item.spo2 && (
                      <span className="flex items-center gap-1 bg-cyan-50/70 text-cyan-800 px-2 py-0.5 rounded-lg border border-cyan-100">
                        <Activity className="w-3.5 h-3.5 text-cyan-600" />
                        血氧: <strong className="text-slate-800">{item.spo2}%</strong>
                        {item.spo2 < 95 && (
                          <span className="text-[9px] text-rose-600 font-bold ml-0.5">(偏低)</span>
                        )}
                      </span>
                    )}
                    {item.bodyTemperature && (
                      <span className="flex items-center gap-1 bg-amber-50/70 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-100">
                        <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                        體溫: <strong className="text-slate-800">{item.bodyTemperature}°C</strong>
                        {item.bodyTemperature > 37.5 ? (
                          <span className="text-[9px] text-rose-600 font-bold ml-0.5">(偏高)</span>
                        ) : item.bodyTemperature < 36.0 ? (
                          <span className="text-[9px] text-amber-600 font-bold ml-0.5">(偏低)</span>
                        ) : null}
                      </span>
                    )}
                    {item.weight && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                        <Scale className="w-3.5 h-3.5 text-indigo-600" />
                        體重: <strong className="text-slate-800">{item.weight} kg</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span className="font-semibold text-slate-700">狀況備忘：</span>
                    {item.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[94vw] max-w-sm rounded-3xl max-h-[88vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden mx-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                新增生命徵象量測
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto overflow-x-hidden flex-1 max-w-full">
              {/* Date & Time - 永遠上下排序，縮短寬度，不超出手機螢幕 */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    量測日期
                  </label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full max-w-[190px] sm:max-w-[210px] text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none min-h-[38px] text-slate-800 font-medium box-border block"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    量測時間
                  </label>
                  <input
                    type="time"
                    required
                    value={recordTime}
                    onChange={(e) => setRecordTime(e.target.value)}
                    className="w-full max-w-[140px] sm:max-w-[160px] text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none min-h-[38px] text-slate-800 font-medium box-border block"
                  />
                </div>
              </div>

              {/* BP & Pulse */}
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-rose-500" />
                    血壓與脈搏 (mmHg / bpm)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">收縮壓 (高壓)</span>
                    <input
                      type="number"
                      placeholder="如 120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">舒張壓 (低壓)</span>
                    <input
                      type="number"
                      placeholder="如 80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">脈搏心率</span>
                    <input
                      type="number"
                      placeholder="如 75"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Respiratory Rate & SpO2 */}
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 space-y-2">
                <div className="text-xs font-bold text-teal-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Wind className="w-4 h-4 text-teal-600" />
                    呼吸速率與血氧
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">呼吸速率 (bpm / 次/分)</span>
                    <input
                      type="number"
                      placeholder="如 16 (標準 12-20)"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">血氧 SpO2 (%)</span>
                    <input
                      type="number"
                      placeholder="如 98 (≥95%)"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Blood Sugar */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    血糖數值 (mg/dL)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">數值</span>
                    <input
                      type="number"
                      placeholder="如 105"
                      value={bloodSugar}
                      onChange={(e) => setBloodSugar(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">時段類型</span>
                    <select
                      value={sugarTiming}
                      onChange={(e) => setSugarTiming(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="fasting">早晨空腹 (標準 70-140)</option>
                      <option value="postprandial">飯後 2 小時 (標準 &lt; 200)</option>
                      <option value="random">隨機量測</option>
                      <option value="bedtime">睡前</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Temp & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    體溫 (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 36.5"
                    value={bodyTemp}
                    onChange={(e) => setBodyTemp(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    體重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 68.2"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes & Recorded by */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  特別症狀或備註
                </label>
                <input
                  type="text"
                  placeholder="如：微感頭昏、運動後測量、食慾佳..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  記錄人員
                </label>
                <input
                  type="text"
                  placeholder="如：女兒美娟、林居服員..."
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  儲存量測紀錄
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
