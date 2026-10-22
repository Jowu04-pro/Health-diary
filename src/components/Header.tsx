import React from 'react';
import { PhoneCall, Cloud, LogOut, Edit3, Calendar } from 'lucide-react';
import { CaseProfile } from '../types/health';
import { getGivenName, calculateAge } from '../utils/nameHelper';

interface HeaderProps {
  caseProfile: CaseProfile;
  onOpenProfile: () => void;
  onOpenEditProfile?: () => void;
  onOpenSync: () => void;
  onLogout: () => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  caseProfile,
  onOpenProfile,
  onOpenEditProfile,
  onOpenSync,
  onLogout,
  cloudSyncStatus = 'synced',
}) => {
  const givenName = getGivenName(caseProfile.name);
  const accurateAge = calculateAge(caseProfile.birthday, caseProfile.age);

  // Format basic attributes
  const genderLabel = caseProfile.gender === 'male' ? '男' : caseProfile.gender === 'female' ? '女' : '其他';
  const heightText = caseProfile.height ? `${caseProfile.height} CM` : '-- CM';
  const weightText = caseProfile.weight ? `${caseProfile.weight} KG` : '-- KG';
  const bloodTypeText = caseProfile.bloodType || '未登錄';
  const hasAllergy = Boolean(caseProfile.allergies && caseProfile.allergies.length > 0);
  const allergiesText = hasAllergy ? caseProfile.allergies.join('、') : '無過敏';

  // Format date: e.g. 10月19日 週一
  const todayDateStr = new Date().toLocaleDateString('zh-TW', { 
    month: 'numeric', 
    day: 'numeric', 
    weekday: 'short' 
  });

  return (
    <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-md select-none shrink-0">
      {/* Top action bar: Patient identity, Date, and Top utilities */}
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        <div 
          onClick={onOpenProfile}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition active:scale-98"
          title="點擊編輯個人檔案"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-white text-sm shadow-inner shrink-0">
            {caseProfile.name.slice(0, 1)}
          </div>
          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-wide text-white">
                {givenName}的健康日誌
              </span>
              <span className="text-[10px] bg-emerald-800/90 px-1.5 py-0.5 rounded text-emerald-100 font-semibold">
                {accurateAge}歲
              </span>
            </div>
            {/* Integrated Date */}
            <div className="text-[11px] text-emerald-200 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>{todayDateStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Sync / Data modal with Firebase status badge */}
          <button
            onClick={onOpenSync}
            className="relative p-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-800 text-emerald-100 hover:text-white transition text-xs cursor-pointer flex items-center justify-center"
            title={
              cloudSyncStatus === 'syncing'
                ? 'Firebase 雲端同步更新中...'
                : 'Firebase 雲端已連線同步（點擊匯出月度圖表/備份）'
            }
          >
            <Cloud className="w-3.5 h-3.5" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-emerald-700 ${
                cloudSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-300'
              }`}
            />
          </button>

          {/* Emergency Call Quick Contact */}
          <a
            href={`tel:${caseProfile.contactPhone.replace(/-/g, '')}`}
            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
            title={`緊急聯絡：${caseProfile.primaryCaregiver} (${caseProfile.contactPhone})`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
          </a>

          {/* Logout / Switch Case */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-white transition text-xs"
            title="登出 / 切換個案日誌"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 各基本資料獨立方框呈現 (身高、體重、性別、血型、過敏史) + 編輯個人檔案按鈕 */}
      <div className="bg-emerald-800/95 px-3 py-2 border-t border-emerald-600/50 space-y-1.5">
        {/* Row 1: 身高、體重、性別獨立方框 + 右側編輯按鈕 */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {/* 身高方框 */}
            <div 
              onClick={onOpenEditProfile || onOpenProfile}
              className="bg-emerald-900/90 border border-emerald-600/60 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-emerald-900 transition shadow-2xs active:scale-97"
              title="點擊修改身高"
            >
              <span className="text-[10px] text-emerald-300 font-medium">身高</span>
              <span className="text-[11px] font-bold text-white tracking-tight">{heightText}</span>
            </div>

            {/* 體重方框 */}
            <div 
              onClick={onOpenEditProfile || onOpenProfile}
              className="bg-emerald-900/90 border border-emerald-600/60 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-emerald-900 transition shadow-2xs active:scale-97"
              title="點擊修改體重"
            >
              <span className="text-[10px] text-emerald-300 font-medium">體重</span>
              <span className="text-[11px] font-bold text-white tracking-tight">{weightText}</span>
            </div>

            {/* 性別方框 */}
            <div 
              onClick={onOpenEditProfile || onOpenProfile}
              className="bg-emerald-900/90 border border-emerald-600/60 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-emerald-900 transition shadow-2xs active:scale-97"
              title="點擊修改性別"
            >
              <span className="text-[10px] text-emerald-300 font-medium">性別</span>
              <span className="text-[11px] font-bold text-white tracking-tight">{genderLabel}</span>
            </div>
          </div>

          {/* 編輯個人檔案按鈕 */}
          <button 
            onClick={onOpenEditProfile || onOpenProfile}
            className="text-[10px] text-emerald-100 bg-emerald-900/90 hover:bg-emerald-950 px-2 py-1 rounded-lg border border-emerald-500/70 shrink-0 flex items-center gap-1 font-semibold transition active:scale-95 shadow-xs"
            title="點擊編輯個人檔案"
          >
            <Edit3 className="w-3 h-3 text-emerald-300" />
            編輯個人檔案
          </button>
        </div>

        {/* Row 2: 血型、過敏史獨立方框 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 血型方框 */}
          <div 
            onClick={onOpenEditProfile || onOpenProfile}
            className="bg-emerald-900/90 border border-emerald-600/60 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-emerald-900 transition shadow-2xs active:scale-97"
            title="點擊修改血型"
          >
            <span className="text-[10px] text-emerald-300 font-medium">血型</span>
            <span className="text-[11px] font-bold text-white tracking-tight">{bloodTypeText}</span>
          </div>

          {/* 過敏史方框 */}
          <div 
            onClick={onOpenEditProfile || onOpenProfile}
            className={`border rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-97 flex-1 truncate ${
              hasAllergy
                ? 'bg-rose-950/70 border-rose-500/70 text-rose-100 hover:bg-rose-950'
                : 'bg-emerald-900/90 border-emerald-600/60 text-emerald-100 hover:bg-emerald-900'
            }`}
            title="點擊修改過敏史"
          >
            <span className={`text-[10px] font-medium shrink-0 ${hasAllergy ? 'text-rose-300 font-bold' : 'text-emerald-300'}`}>
              過敏史
            </span>
            <span className={`text-[11px] font-bold truncate ${hasAllergy ? 'text-rose-100' : 'text-white'}`}>
              {allergiesText}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
