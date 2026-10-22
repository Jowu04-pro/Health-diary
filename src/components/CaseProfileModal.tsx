import React, { useState, useEffect } from 'react';
import { User, Phone, X, ShieldAlert, FileText, PhoneCall, Calendar, Ruler, Scale, Check } from 'lucide-react';
import { CaseProfile } from '../types/health';
import { getGivenName, calculateAge } from '../utils/nameHelper';

interface CaseProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseProfile: CaseProfile;
  onSaveProfile: (profile: CaseProfile) => void;
  initialEditMode?: boolean;
}

export const CaseProfileModal: React.FC<CaseProfileModalProps> = ({
  isOpen,
  onClose,
  caseProfile,
  onSaveProfile,
  initialEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [formData, setFormData] = useState<CaseProfile>(caseProfile);
  const [allergyInput, setAllergyInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const computedAge = calculateAge(caseProfile.birthday, caseProfile.age);
      const validBloodTypes = ['A型', 'B型', 'O型', 'AB型'];
      let normalizedBlood = caseProfile.bloodType;
      if (!validBloodTypes.includes(normalizedBlood)) {
        if (normalizedBlood?.includes('AB')) normalizedBlood = 'AB型';
        else if (normalizedBlood?.includes('A')) normalizedBlood = 'A型';
        else if (normalizedBlood?.includes('B')) normalizedBlood = 'B型';
        else normalizedBlood = 'O型';
      }

      setFormData({ ...caseProfile, age: computedAge, bloodType: normalizedBlood });
      setIsEditing(initialEditMode);
    }
  }, [isOpen, initialEditMode, caseProfile]);

  if (!isOpen) return null;

  const givenName = getGivenName(caseProfile.name);

  const accurateAge = calculateAge(caseProfile.birthday, caseProfile.age);

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()],
      });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index),
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const computedAge = calculateAge(formData.birthday, formData.age);
    const updated = { ...formData, age: computedAge };
    onSaveProfile(updated);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white w-[94vw] max-w-sm rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{givenName}的個人檔案</h3>
              <p className="text-[10px] text-slate-500">基本資料、身體數值與緊急聯絡人</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-3">

          {!isEditing ? (
            <div className="space-y-3">
              {/* Profile Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">
                      {caseProfile.name}
                    </h4>
                    {/* Basic info row: 性別、年齡、血型、身高、體重 */}
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 flex-wrap">
                      <span className="font-semibold text-slate-800">{caseProfile.gender === 'male' ? '男性' : caseProfile.gender === 'female' ? '女性' : '其他'}</span>
                      <span>•</span>
                      <span>{accurateAge} 歲</span>
                      <span>•</span>
                      <span className="text-slate-800 font-bold">{caseProfile.bloodType}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-emerald-900 font-semibold bg-white/70 px-2 py-1 rounded-lg border border-emerald-100">
                      <span className="flex items-center gap-0.5">
                        <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                        身高: {caseProfile.height ? `${caseProfile.height} cm` : '未登記'}
                      </span>
                      <span>|</span>
                      <span className="flex items-center gap-0.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-600" />
                        體重: {caseProfile.weight ? `${caseProfile.weight} kg` : '未登記'}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      生日 (登入密碼)：<span className="font-mono text-slate-700 font-bold">{caseProfile.birthday}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-xs"
                  >
                    編輯檔案
                  </button>
                </div>
              </div>

              {/* Allergies */}
              <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-1">
                <div className="text-[10px] font-bold text-rose-800 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-600" /> 過敏史紀錄
                </div>
                {caseProfile.allergies && caseProfile.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {caseProfile.allergies.map((alg, idx) => (
                      <span key={idx} className="text-[11px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md font-medium border border-rose-200">
                        {alg}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-rose-600">無過敏紀錄</div>
                )}
              </div>

              {/* Caregiver & Emergency Contacts */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-600" /> 主要照顧者與緊急電話
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px]">照顧者</div>
                    <div className="font-bold text-slate-800">{caseProfile.primaryCaregiver}</div>
                  </div>
                  <a
                    href={`tel:${caseProfile.contactPhone.replace(/-/g, '')}`}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    <PhoneCall className="w-3 h-3" />
                    {caseProfile.contactPhone}
                  </a>
                </div>

                {caseProfile.hospitalEmergencyPhone && (
                  <div className="pt-1.5 border-t border-slate-200 text-xs">
                    <div className="text-slate-500 text-[10px]">醫療院所專線</div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-0.5">
                      {caseProfile.hospitalEmergencyPhone}
                    </div>
                  </div>
                )}
              </div>

              {/* Caregiver Notes */}
              {caseProfile.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <div className="text-[10px] font-bold text-slate-700 mb-0.5">照護日常叮嚀：</div>
                  <div className="leading-relaxed text-[11px]">{caseProfile.notes}</div>
                </div>
              )}
            </div>
          ) : (
            /* Editing form */
            <form onSubmit={handleSave} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">姓名 (帳號)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">生日 (密碼)</label>
                  <input
                    type="text"
                    required
                    placeholder="如 19680520"
                    value={formData.birthday}
                    onChange={(e) => {
                      const newBday = e.target.value;
                      const newAge = calculateAge(newBday, formData.age);
                      setFormData({ ...formData, birthday: newBday, age: newAge });
                    }}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">性別</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl"
                  >
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">年齡 (自動計算)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">血型</label>
                  <select
                    value={formData.bloodType || 'O型'}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl bg-white font-medium focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="A型">A型</option>
                    <option value="B型">B型</option>
                    <option value="O型">O型</option>
                    <option value="AB型">AB型</option>
                  </select>
                </div>
              </div>

              {/* Height and Weight Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">身高 (cm)</label>
                  <input
                    type="number"
                    placeholder="如 172"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">體重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="如 68.5"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">過敏史 (點擊可移除)</label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {formData.allergies && formData.allergies.map((alg, i) => (
                    <span
                      key={i}
                      onClick={() => handleRemoveAllergy(i)}
                      className="text-[11px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded cursor-pointer hover:bg-rose-200"
                    >
                      {alg} ✕
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="新增過敏藥物或食物"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    className="flex-1 text-xs p-1.5 border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    className="px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                  >
                    加
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">照顧者</label>
                  <input
                    type="text"
                    value={formData.primaryCaregiver}
                    onChange={(e) => setFormData({ ...formData, primaryCaregiver: e.target.value })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">聯絡電話</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">照護日常備忘</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (initialEditMode) onClose();
                    else setIsEditing(false);
                  }}
                  className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl transition shadow-xs cursor-pointer"
                >
                  確認儲存
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
