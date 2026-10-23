import React, { useState } from 'react';
import { HeartPulse, User, Calendar, ShieldCheck, UserPlus, Info, CloudCheck, Loader2 } from 'lucide-react';
import { CaseProfile } from '../types/health';
import { normalizeBirthday } from '../utils/nameHelper';
import { findCaseInCloudByCredentials, loadCaseFromFirebase } from '../services/firebase';
import { CaseFullData, saveCaseFullData, saveStoredCaseList } from '../data/mockData';

interface LoginScreenProps {
  onLoginSuccess: (caseProfile: CaseProfile) => void;
  onRegisterNewCase: (name: string, birthday: string) => void;
  availableProfiles: CaseProfile[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onRegisterNewCase,
  availableProfiles,
}) => {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showNewCasePrompt, setShowNewCasePrompt] = useState(false);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setShowNewCasePrompt(false);

    const trimmedName = name.trim();
    const cleanBday = normalizeBirthday(birthday);

    if (!trimmedName) {
      setErrorMessage('請輸入姓名');
      return;
    }
    if (!cleanBday || cleanBday.length < 4) {
      setErrorMessage('請輸入有效生日（如 19620708）');
      return;
    }

    // 1. Check local profiles list first
    const foundLocal = availableProfiles.find(
      (p) => p.name.trim() === trimmedName && normalizeBirthday(p.birthday) === cleanBday
    );

    setIsSearchingCloud(true);
    try {
      if (foundLocal) {
        // Attempt to fetch latest case document from Cloud Firestore for cross-device synchronization
        const remoteData = await loadCaseFromFirebase(foundLocal.id);
        if (remoteData) {
          saveCaseFullData(foundLocal.id, remoteData);
          setIsSearchingCloud(false);
          onLoginSuccess(remoteData.profile || foundLocal);
          return;
        }

        // If direct fetch returns null, try fuzzy credentials search in Firestore
        const cloudResult = await findCaseInCloudByCredentials(trimmedName, cleanBday);
        if (cloudResult) {
          saveCaseFullData(cloudResult.profile.id, cloudResult.caseData);
          setIsSearchingCloud(false);
          onLoginSuccess(cloudResult.profile);
          return;
        }

        // If offline or not in cloud, proceed with local profile
        setIsSearchingCloud(false);
        onLoginSuccess(foundLocal);
        return;
      }

      // 2. If not found locally in availableProfiles, query Cloud Firestore for cross-device sync!
      const cloudResult = await findCaseInCloudByCredentials(trimmedName, cleanBday);
      if (cloudResult) {
        // Save to local storage for caching
        saveCaseFullData(cloudResult.profile.id, cloudResult.caseData);
        const updatedList = [...availableProfiles.filter((p) => p.id !== cloudResult.profile.id), cloudResult.profile];
        saveStoredCaseList(updatedList);
        setIsSearchingCloud(false);
        onLoginSuccess(cloudResult.profile);
        return;
      }
    } catch (err) {
      console.warn('Cloud search error during login:', err);
    }
    setIsSearchingCloud(false);

    // If local was found but network failed, still permit login with local profile
    if (foundLocal) {
      onLoginSuccess(foundLocal);
      return;
    }

    setErrorMessage(`本機與雲端未找到「${trimmedName}」的歷史紀錄。`);
    setShowNewCasePrompt(true);
  };

  const handleCreateNew = () => {
    if (!name.trim() || !birthday.trim()) return;
    onRegisterNewCase(name.trim(), birthday.trim());
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto flex flex-col justify-center p-5 bg-gradient-to-b from-emerald-700 via-teal-800 to-slate-900 text-white space-y-4 overscroll-contain">
      {/* Top Branding */}
      <div className="text-center shrink-0">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg mb-2">
          <HeartPulse className="w-8 h-8 text-emerald-300" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          健康日誌
        </h1>
      </div>

      {/* Login Card (Only keeping the red-boxed section as requested) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 text-slate-800 shadow-xl border border-white/40 shrink-0">
        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          身分驗證
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Account: Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              帳號：姓名
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="例如：王大明"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Password: Birthday */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              密碼：出生年月日
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="西元 8 碼，例如：19620708"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none font-medium"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              密碼規則：西元年4碼+月2碼+日2碼 (如 1962年7月8日 請填 19620708)
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* If not found, provide 1-tap create */}
          {showNewCasePrompt && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>此裝置尚未建立「{name}」的紀錄</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                若您是首次在此電腦/瀏覽器開啟，請點擊下方按鈕直接建立並登入：
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                建立新日誌並登入
              </button>
              <p className="text-[10px] text-slate-500 pt-0.5 leading-normal">
                💡 欲同步手機上的歷史資料，可登入後透過右上角「☁️ 雲端圖示」匯入手機的備份檔。
              </p>
            </div>
          )}

          {/* Requirement 3: 登入按鈕向右符號刪掉，僅保留「登入」兩字 */}
          <button
            type="submit"
            disabled={isSearchingCloud}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            {isSearchingCloud ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>雲端同步比對中...</span>
              </>
            ) : (
              '登入'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
