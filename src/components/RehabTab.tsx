import React, { useState } from 'react';
import { 
  Dumbbell, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Smile, 
  Meh, 
  Frown, 
  ShieldAlert, 
  X, 
  ChevronRight,
  TrendingUp,
  Activity,
  Trash2
} from 'lucide-react';
import { RehabPlanItem } from '../types/health';

interface RehabTabProps {
  rehabPlans: RehabPlanItem[];
  onIncrementSet: (id: string) => void;
  onDecrementSet: (id: string) => void;
  onUpdatePainScale: (id: string, pain: number) => void;
  onAddRehabPlan: (item: Omit<RehabPlanItem, 'id' | 'completedTodaySets'>) => void;
  onDeleteRehabPlan: (id: string) => void;
}

export const RehabTab: React.FC<RehabTabProps> = ({
  rehabPlans,
  onIncrementSet,
  onDecrementSet,
  onUpdatePainScale,
  onAddRehabPlan,
  onDeleteRehabPlan,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RehabPlanItem['category']>('physical');
  const [targetSets, setTargetSets] = useState('3');
  const [targetRepsOrMinutes, setTargetRepsOrMinutes] = useState('每組 15 次');
  const [frequency, setFrequency] = useState('每日 2 次');
  const [instructions, setInstructions] = useState('');
  const [precautions, setPrecautions] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddRehabPlan({
      title: title.trim(),
      category,
      targetSets: Number(targetSets) || 3,
      targetRepsOrMinutes: targetRepsOrMinutes.trim() || '每組 10-15 次',
      frequency: frequency.trim() || '每日 1-2 次',
      instructions: instructions.trim() || '依治療師動作指導執行，動作慢而穩定。',
      precautions: precautions.trim() || '若有劇烈疼痛或眩暈請立即停止。',
      difficultyFeedback: 'moderate',
      painScaleToday: 0,
    });

    // Reset
    setTitle('');
    setInstructions('');
    setPrecautions('');
    setIsAddModalOpen(false);
  };

  const getCategoryMeta = (cat: RehabPlanItem['category']) => {
    switch (cat) {
      case 'physical': return { label: '物理治療 (PT)', color: 'bg-emerald-100 text-emerald-800' };
      case 'occupational': return { label: '職能治療 (OT)', color: 'bg-blue-100 text-blue-800' };
      case 'speech': return { label: '語言/吞嚥 (ST)', color: 'bg-purple-100 text-purple-800' };
      case 'cardiopulmonary': return { label: '心肺呼吸', color: 'bg-rose-100 text-rose-800' };
      default: return { label: '居家運動', color: 'bg-amber-100 text-amber-800' };
    }
  };

  const totalTargetSets = rehabPlans.reduce((sum, p) => sum + p.targetSets, 0);
  const totalCompletedSets = rehabPlans.reduce((sum, p) => sum + p.completedTodaySets, 0);
  const percent = totalTargetSets > 0 ? Math.round((totalCompletedSets / totalTargetSets) * 100) : 0;

  const filteredPlans = rehabPlans.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="p-3 space-y-3">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-amber-600" />
            復健運動計畫
          </h2>
          <p className="text-[11px] text-slate-500">每日復健組數打卡、疼痛度與動作重點</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          新增項目
        </button>
      </div>

      {/* Progress banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs text-amber-100 font-medium">今日復健完成率</div>
          <div className="text-2xl font-black mt-0.5 tracking-tight">{percent}%</div>
          <div className="text-[11px] text-amber-100 mt-1">
            已完成 {totalCompletedSets} 組 / 目標 {totalTargetSets} 組
          </div>
        </div>
        <div className="w-14 h-14 rounded-full border-4 border-amber-300/40 flex items-center justify-center font-bold text-sm bg-amber-800/40">
          {percent >= 100 ? '達標!' : `${percent}%`}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'all', label: '全部項目' },
          { id: 'physical', label: '物理(下肢/平衡)' },
          { id: 'occupational', label: '職能(手部/生活)' },
          { id: 'cardiopulmonary', label: '心肺呼吸' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
              selectedCategory === c.id
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Rehab items list */}
      <div className="space-y-3.5">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            目前無該類別訓練項目
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const meta = getCategoryMeta(plan.category);
            const isFinished = plan.completedTodaySets >= plan.targetSets;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      目標：<strong className="text-slate-800">{plan.targetSets} 組</strong> ({plan.targetRepsOrMinutes}) • {plan.frequency}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteRehabPlan(plan.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                    title="刪除訓練項目"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 space-y-1 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800">動作指引：</span>
                    {plan.instructions}
                  </div>
                  {plan.precautions && (
                    <div className="text-amber-800 flex items-start gap-1 pt-1 border-t border-slate-200/60">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{plan.precautions}</span>
                    </div>
                  )}
                </div>

                {/* Interactive Sets Stepper & Pain Scale */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Stepper */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 font-medium">今日進度:</span>
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => onDecrementSet(plan.id)}
                        disabled={plan.completedTodaySets <= 0}
                        className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="px-2 font-black text-sm text-slate-900">
                        {plan.completedTodaySets} / {plan.targetSets}
                      </span>
                      <button
                        onClick={() => onIncrementSet(plan.id)}
                        className="w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center shadow-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    {isFinished && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> 達成
                      </span>
                    )}
                  </div>

                  {/* Pain scale */}
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-[11px] text-slate-400">痛感:</span>
                    <select
                      value={plan.painScaleToday ?? 0}
                      onChange={(e) => onUpdatePainScale(plan.id, Number(e.target.value))}
                      className="text-xs bg-slate-100 font-semibold text-slate-800 border-none rounded-lg p-1 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value={0}>0分 無痛</option>
                      <option value={1}>1分 微酸</option>
                      <option value={2}>2分 輕微</option>
                      <option value={3}>3分 可耐受</option>
                      <option value={4}>4分 明顯</option>
                      <option value={5}>5分 劇痛停止</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[94vw] max-w-sm rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden mx-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-600" />
                新增復健訓練項目
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-3 overflow-y-auto overflow-x-hidden flex-1 max-w-full">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  復健動作名稱 (必填)
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：坐姿抬腿伸膝運動、彈力帶外展..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    復健分類
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="physical">物理治療 (PT)</option>
                    <option value="occupational">職能治療 (OT)</option>
                    <option value="cardiopulmonary">心肺呼吸</option>
                    <option value="speech">語言/吞嚥</option>
                    <option value="home">居家伸展</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    每日目標組數
                  </label>
                  <input
                    type="number"
                    value={targetSets}
                    onChange={(e) => setTargetSets(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    每組次數或時間
                  </label>
                  <input
                    type="text"
                    placeholder="如：每組 12 次、20 分鐘"
                    value={targetRepsOrMinutes}
                    onChange={(e) => setTargetRepsOrMinutes(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    執行頻率
                  </label>
                  <input
                    type="text"
                    placeholder="如：每日 2 次"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  動作要領與治療師指示
                </label>
                <textarea
                  rows={2}
                  placeholder="如：背打直，腳尖朝上勾起維持5秒，緩慢放下..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  安全防護與注意事項
                </label>
                <input
                  type="text"
                  placeholder="如：防跌請扶穩椅背，若心悸眩暈立即休息..."
                  value={precautions}
                  onChange={(e) => setPrecautions(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  儲存復健計畫
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
