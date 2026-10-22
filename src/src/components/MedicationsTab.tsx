import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Package, 
  X, 
  Info,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { MedicationItem, MedicationLog, MedicationSlot } from '../types/health';

interface MedicationsTabProps {
  medications: MedicationItem[];
  medLogs: MedicationLog[];
  onToggleMedLog: (logId: string) => void;
  onAddMedication: (item: Omit<MedicationItem, 'id' | 'isActive'>) => void;
  onDeleteMedication: (id: string) => void;
}

export const MedicationsTab: React.FC<MedicationsTabProps> = ({
  medications,
  medLogs,
  onToggleMedLog,
  onAddMedication,
  onDeleteMedication,
}) => {
  const [subView, setSubView] = useState<'today' | 'catalog'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [dosage, setDosage] = useState('1 錠');
  const [timingSlots, setTimingSlots] = useState<MedicationSlot[]>(['morning']);
  const [frequencyText, setFrequencyText] = useState('每日一次');
  const [instructions, setInstructions] = useState('飯後服用');
  const [sideEffectsWarning, setSideEffectsWarning] = useState('');
  const [stockQuantity, setStockQuantity] = useState('30');

  const handleSlotToggle = (slot: MedicationSlot) => {
    if (timingSlots.includes(slot)) {
      if (timingSlots.length > 1) {
        setTimingSlots(timingSlots.filter((s) => s !== slot));
      }
    } else {
      setTimingSlots([...timingSlots, slot]);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddMedication({
      name: name.trim(),
      category: category.trim() || '常規藥物',
      dosage: dosage.trim() || '1 錠',
      timingSlots,
      frequencyText: frequencyText.trim() || '依醫囑',
      instructions: instructions.trim() || '飯後服用',
      sideEffectsWarning: sideEffectsWarning.trim() || undefined,
      stockQuantity: stockQuantity ? Number(stockQuantity) : 30,
    });

    // Reset
    setName('');
    setCategory('');
    setDosage('1 錠');
    setTimingSlots(['morning']);
    setSideEffectsWarning('');
    setIsAddModalOpen(false);
  };

  const slotsList: { id: MedicationSlot; label: string; time: string; color: string }[] = [
    { id: 'morning', label: '早晨時段', time: '08:00', color: 'bg-amber-500' },
    { id: 'noon', label: '中午時段', time: '12:30', color: 'bg-orange-500' },
    { id: 'evening', label: '晚間時段', time: '18:30', color: 'bg-indigo-500' },
    { id: 'bedtime', label: '睡前時段', time: '21:30', color: 'bg-purple-600' },
  ];

  const totalLogs = medLogs.length;
  const takenLogs = medLogs.filter((l) => l.taken).length;
  const adherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  return (
    <div className="p-3 space-y-3">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-purple-600" />
            用藥照護紀錄
          </h2>
          <p className="text-[11px] text-slate-500">時段用藥打卡與藥物安全清單</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          新增藥品
        </button>
      </div>

      {/* Switch Views */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
        <button
          onClick={() => setSubView('today')}
          className={`flex-1 py-1.5 text-center rounded-lg transition ${
            subView === 'today' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          今日服藥打卡 ({takenLogs}/{totalLogs})
        </button>
        <button
          onClick={() => setSubView('catalog')}
          className={`flex-1 py-1.5 text-center rounded-lg transition ${
            subView === 'catalog' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          處方藥品明細 ({medications.length}項)
        </button>
      </div>

      {subView === 'today' ? (
        <div className="space-y-4">
          {/* Adherence Card */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-3.5 text-white shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-200">今日用藥遵囑率</div>
              <div className="text-2xl font-black mt-0.5 tracking-tight">{adherence}%</div>
              <div className="text-[11px] text-purple-200 mt-1">
                已按時服用 {takenLogs} 劑次，剩餘 {totalLogs - takenLogs} 劑次
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-purple-400/40 flex items-center justify-center font-bold text-sm bg-purple-900/40">
              {takenLogs}/{totalLogs}
            </div>
          </div>

          {/* Slots List */}
          {slotsList.map((slot) => {
            const slotLogs = medLogs.filter((l) => l.slot === slot.id);
            if (slotLogs.length === 0) return null;

            const isAllSlotTaken = slotLogs.every((l) => l.taken);

            return (
              <div key={slot.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${slot.color}`} />
                    <span className="font-bold text-slate-800 text-sm">{slot.label}</span>
                    <span className="text-[11px] text-slate-400">約 {slot.time}</span>
                  </div>
                  {isAllSlotTaken ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      已全部服用
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      待服用
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {slotLogs.map((log) => {
                    const med = medications.find((m) => m.id === log.medicationId);
                    if (!med) return null;

                    return (
                      <div
                        key={log.id}
                        onClick={() => onToggleMedLog(log.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          log.taken
                            ? 'bg-slate-50 border-slate-200 opacity-75'
                            : 'bg-purple-50/40 border-purple-200 shadow-xs hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {log.taken ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-purple-400 shrink-0" />
                          )}
                          <div>
                            <div className={`text-xs font-bold ${log.taken ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {med.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              每次 {med.dosage} • {med.instructions}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {log.taken ? (
                            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {log.takenAt || '已服'}
                            </div>
                          ) : (
                            <button className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-bold shadow-xs hover:bg-purple-700 transition">
                              點擊打卡
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Catalog View */
        <div className="space-y-3">
          {medications.map((med) => (
            <div key={med.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-50 text-purple-700">
                    {med.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{med.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    劑量: <strong className="text-slate-800">{med.dosage}</strong> | {med.frequencyText}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteMedication(med.id)}
                  className="text-slate-300 hover:text-rose-500 p-1"
                  title="刪除此藥品"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2.5 p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
                <div>
                  <span className="font-bold text-slate-700">服用指示：</span>
                  {med.instructions}
                </div>
                {med.sideEffectsWarning && (
                  <div className="text-amber-800 flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{med.sideEffectsWarning}</span>
                  </div>
                )}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  目前剩餘庫存: <strong className="text-slate-700">{med.stockQuantity || '--'}</strong> 顆
                </span>
                <span className="text-purple-700 font-semibold">
                  時段: {med.timingSlots.map((s) => (s === 'morning' ? '早' : s === 'noon' ? '中' : s === 'evening' ? '晚' : '睡前')).join('/')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Medication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5">
          <div className="bg-white w-full max-w-sm rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-600" />
                新增處方藥品
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  藥品名稱 (原廠/學名) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：脈優 Norvasc 5mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    藥物分類 / 療效
                  </label>
                  <input
                    type="text"
                    placeholder="如：降血壓、抗凝血"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    每次劑量
                  </label>
                  <input
                    type="text"
                    placeholder="如：1 錠、半顆"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Timing slots multi selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  服用時段 (可複選)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'morning' as MedicationSlot, label: '早晨' },
                    { id: 'noon' as MedicationSlot, label: '中午' },
                    { id: 'evening' as MedicationSlot, label: '晚間' },
                    { id: 'bedtime' as MedicationSlot, label: '睡前' },
                  ].map((s) => {
                    const isSelected = timingSlots.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => handleSlotToggle(s.id)}
                        className={`py-1.5 text-xs rounded-lg font-bold border transition ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  服藥指示
                </label>
                <input
                  type="text"
                  placeholder="如：隨餐或飯後立即服用、注意姿勢改變防暈"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    頻率描述
                  </label>
                  <input
                    type="text"
                    placeholder="如：每日一次"
                    value={frequencyText}
                    onChange={(e) => setFrequencyText(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    剩餘顆數 (庫存)
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  副作用或注意事項警示
                </label>
                <input
                  type="text"
                  placeholder="如：若有黑便或牙齦異常出血請立即停藥就醫"
                  value={sideEffectsWarning}
                  onChange={(e) => setSideEffectsWarning(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  儲存並列入今日時段清單
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
