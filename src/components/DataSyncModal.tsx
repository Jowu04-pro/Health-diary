import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Cloud, 
  Download, 
  Upload, 
  RefreshCw, 
  X, 
  Check, 
  Copy, 
  AlertCircle, 
  Server, 
  ShieldCheck, 
  Printer, 
  TrendingUp, 
  Calendar, 
  Share2, 
  FileImage, 
  Activity, 
  Heart, 
  Droplet,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { CaseProfile, VitalSignRecord, AppointmentRecord, MedicationItem, MedicationLog, RehabPlanItem } from '../types/health';
import { getGivenName } from '../utils/nameHelper';
import { generateMonthlyReportCanvas, downloadCanvasImage, shareCanvasImage } from '../utils/chartExportHelper';
import { saveCaseToFirebase, syncProfilesToFirebase, loadCaseFromFirebase, findCaseInCloudByCredentials } from '../services/firebase';
import { getStoredCaseList } from '../data/mockData';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseProfile: CaseProfile;
  vitalSigns: VitalSignRecord[];
  appointments: AppointmentRecord[];
  medications: MedicationItem[];
  medLogs: MedicationLog[];
  rehabPlans: RehabPlanItem[];
  onImportData: (data: any) => void;
  onResetDefault: () => Promise<void> | void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  caseProfile,
  vitalSigns,
  appointments,
  medications,
  medLogs,
  rehabPlans,
  onImportData,
  onResetDefault,
}) => {
  // Tabs: report (default) | status | backup
  const [activeTab, setActiveTab] = useState<'report' | 'status' | 'backup'>('report');

  // Month & Report type state
  const currentYM = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentYM);
  const [reportType, setReportType] = useState<'bp' | 'sugar'>('bp');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Backup & Import states
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedbackMsg, setResetFeedbackMsg] = useState('');

  // Manual Cloud Sync states & handlers
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isManualPulling, setIsManualPulling] = useState(false);
  const [manualSyncMsg, setManualSyncMsg] = useState('');

  const handleManualUpload = async () => {
    setIsManualSyncing(true);
    setManualSyncMsg('');
    try {
      const fullData = {
        profile: caseProfile,
        vitals: vitalSigns,
        appointments,
        medications,
        medLogs,
        rehab: rehabPlans,
      };
      const res = await saveCaseToFirebase(caseProfile.id, fullData);
      if (res.success) {
        setManualSyncMsg('✅ 已成功將本機最新日誌上傳至 Firebase 雲端！');
      } else if (res.isQuotaExceeded) {
        setManualSyncMsg('⚠️ Firebase 雲端配額暫時耗盡，本機端紀錄完整安全保存。');
      } else {
        setManualSyncMsg(`❌ 上傳失敗：${res.error || '請檢查網路連線後再試'}`);
      }
    } catch (err: any) {
      setManualSyncMsg('❌ 上傳發生錯誤：' + (err?.message || '未知錯誤'));
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleManualPull = async () => {
    setIsManualPulling(true);
    setManualSyncMsg('');
    try {
      const remoteData = await loadCaseFromFirebase(caseProfile.id);
      if (remoteData) {
        onImportData(remoteData);
        setManualSyncMsg('✅ 已成功從 Firebase 雲端拉取最新日誌！');
      } else {
        const found = await findCaseInCloudByCredentials(caseProfile.name, caseProfile.birthday);
        if (found && found.caseData) {
          onImportData(found.caseData);
          setManualSyncMsg('✅ 已成功從雲端比對並拉取最新日誌！');
        } else {
          setManualSyncMsg('ℹ️ 雲端目前尚無更新版本或此個案之雲端紀錄。');
        }
      }
    } catch (err: any) {
      setManualSyncMsg('❌ 拉取失敗：' + (err?.message || '未知錯誤'));
    } finally {
      setIsManualPulling(false);
    }
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await onResetDefault();
      setShowResetConfirm(false);
      setResetFeedbackMsg('✅ 已成功確認清除資料，個案紀錄已全部歸零！');
    } catch (e: any) {
      console.error('Reset error:', e);
      setShowResetConfirm(false);
      setResetFeedbackMsg('⚠️ 清除資料時發生錯誤：' + (e?.message || '未知錯誤'));
    } finally {
      setIsResetting(false);
    }
  };

  // Extract available months from records
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentYM);

    vitalSigns.forEach((r) => {
      if (r.timestamp) {
        const ym = r.timestamp.slice(0, 7);
        if (ym.length === 7) monthsSet.add(ym);
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [vitalSigns, currentYM]);

  // Current month's records count
  const currentMonthRecords = useMemo(() => {
    return vitalSigns.filter((r) => r.timestamp && r.timestamp.startsWith(selectedMonth));
  }, [vitalSigns, selectedMonth]);

  // Canvas reference cache
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-generate chart preview whenever inputs change
  useEffect(() => {
    if (!isOpen) return;

    try {
      const canvas = generateMonthlyReportCanvas({
        caseProfile,
        selectedMonth,
        records: vitalSigns,
        reportType,
      });
      canvasRef.current = canvas;
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Error generating chart canvas:', err);
    }
  }, [isOpen, caseProfile, selectedMonth, reportType, vitalSigns]);

  if (!isOpen) return null;

  const givenName = getGivenName(caseProfile.name);
  const [y, m] = selectedMonth.split('-');
  const exportFilename = `${givenName}_${y}年${m}月_生命徵象折線圖報表.png`;

  // Download directly to device
  const handleDownloadReport = () => {
    if (!canvasRef.current) return;
    downloadCanvasImage(canvasRef.current, exportFilename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Share to phone / Line / Photos
  const handleShareReport = async () => {
    if (!canvasRef.current) return;
    const ok = await shareCanvasImage(canvasRef.current, exportFilename);
    if (ok) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  // Backup payload
  const exportPayload = {
    version: '2.0.0',
    caseId: caseProfile.id,
    caseName: caseProfile.name,
    exportedAt: new Date().toISOString(),
    caseProfile,
    vitalSigns,
    appointments,
    medications,
    medLogs,
    rehabPlans,
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${givenName}的健康日記_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [importSuccess, setImportSuccess] = useState(false);

  const handleExecuteImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.caseProfile && !parsed.vitalSigns) {
        throw new Error('格式不符合健康日記規範');
      }
      onImportData(parsed);
      setImportError('');
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      setImportError('JSON 語法錯誤或檔案內容無效，請確認後再試。');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-[94vw] max-w-md rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{givenName}的報表匯出與儲存</h3>
              <p className="text-[10px] text-slate-500">每月生命徵象折線圖匯出、下載與備份</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-slate-150/80 p-1 mx-3.5 mt-2.5 rounded-xl text-xs font-semibold text-slate-600 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'report' ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'hover:text-slate-900 text-slate-500'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>折線圖月報表</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer ${
              activeTab === 'status' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900 text-slate-500'
            }`}
          >
            儲存狀態
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer ${
              activeTab === 'backup' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900 text-slate-500'
            }`}
          >
            資料備份/匯入
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-3">
          {/* TAB 1: Monthly Line Chart Report Export (User's primary request) */}
          {activeTab === 'report' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Month Selection Bar */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    選擇匯出月份：
                  </label>
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                    當月記錄：{currentMonthRecords.length} 筆
                  </span>
                </div>

                {/* Available Months Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {availableMonths.map((ym) => {
                    const [yPart, mPart] = ym.split('-');
                    const isSelected = selectedMonth === ym;
                    return (
                      <button
                        key={ym}
                        type="button"
                        onClick={() => setSelectedMonth(ym)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {yPart}年{mPart}月
                        {ym === currentYM && <span className="text-[9px] opacity-80">(本月)</span>}
                      </button>
                    );
                  })}

                  {/* Custom Month Picker */}
                  <div className="inline-flex items-center">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-xl px-2 py-0.8 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Metric Type Selector */}
                <div className="pt-1 flex items-center gap-1.5 border-t border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">報表類型：</span>
                  <button
                    type="button"
                    onClick={() => setReportType('bp')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      reportType === 'bp'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Heart className="w-3 h-3 text-rose-500" />
                    血壓與脈搏折線圖
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('sugar')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      reportType === 'sugar'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Droplet className="w-3 h-3 text-blue-500" />
                    血糖變化折線圖
                  </button>
                </div>
              </div>

              {/* Chart Live Preview Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-0.5">
                  <span className="flex items-center gap-1">
                    <FileImage className="w-3.5 h-3.5 text-slate-500" />
                    折線圖報表即時預覽：
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    高解析醫療臨床版面
                  </span>
                </div>

                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs flex items-center justify-center group">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="月度生命徵象折線圖報表"
                      className="w-full h-auto object-contain block transition-transform group-hover:scale-[1.01]"
                    />
                  ) : (
                    <div className="py-16 text-xs text-slate-400">正在產生報表折線圖...</div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 text-center">
                  💡 提示：在手機上可直接點擊下方按鈕儲存，或長按圖片選擇「加入照片」保存至手機相簿。
                </p>
              </div>

              {/* Action Buttons: Download to Mobile & Share */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  儲存折線圖於手機 (下載 PNG 圖片)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleShareReport}
                    className="py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                    手機分享 / 傳送
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    列印 / 另存 PDF
                  </button>
                </div>

                {/* Success feedback toast */}
                {downloadSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>已完成下載！折線圖報表已儲存至您的手機。</span>
                  </div>
                )}

                {shareSuccess && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs font-bold text-blue-800 flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>已完成分享！</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Storage & Firebase Cloud Status */}
          {activeTab === 'status' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Google Firebase 雲端即時同步中</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                  專案 ID：<span className="font-mono font-bold">health-diary-d518c</span><br />
                  跨裝置即時串流：已連線。手機與電腦登入同一日誌時，資料會秒級自動同步！
                </p>
              </div>

              {/* Data Summary Stats */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 text-[11px]">{givenName}的日誌紀錄筆數：</div>
                <div className="grid grid-cols-2 gap-1.5 text-slate-600 text-[11px]">
                  <div>• 生命徵象: {vitalSigns.length} 筆</div>
                  <div>• 回診行程: {appointments.length} 筆</div>
                  <div>• 用藥品項: {medications.length} 項</div>
                  <div>• 復健計畫: {rehabPlans.length} 個</div>
                </div>
              </div>

              {/* Automatic Realtime Sync Info Banner */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>全自動即時雙向同步已生效</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  系統透過 Google Firebase 雲端保持即時串流。在手機、平板或電腦所做的任何新增、修改或打勾，均會在 0.5 秒內自動同步至所有已登入裝置，完全不需手動點擊上傳或下載。
                </p>
              </div>

              {/* Manual Cloud Sync Options (Fallback alongside Automatic Realtime Sync) */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  disabled={isManualSyncing}
                  onClick={handleManualUpload}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  <Upload className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isManualSyncing ? '正在上傳至 Firebase 雲端...' : '立即將本機日誌上傳至 Firebase 雲端'}</span>
                </button>

                <button
                  type="button"
                  disabled={isManualPulling}
                  onClick={handleManualPull}
                  className="w-full py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                >
                  <Download className={`w-3.5 h-3.5 ${isManualPulling ? 'animate-spin' : ''}`} />
                  <span>{isManualPulling ? '正在從雲端拉取中...' : '從雲端拉取最新日誌'}</span>
                </button>

                {manualSyncMsg && (
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold text-center animate-in fade-in">
                    {manualSyncMsg}
                  </div>
                )}
              </div>

              {/* Fast Tools */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-2.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>列印交班報告</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setResetFeedbackMsg('');
                      setShowResetConfirm(true);
                    }}
                    className="py-2.5 px-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                    <span>重置此個案</span>
                  </button>
                </div>

                {resetFeedbackMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold text-center animate-in fade-in">
                    {resetFeedbackMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Backup & JSON Export / Import */}
          {activeTab === 'backup' && (
            <div className="space-y-3">
              {/* Export */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  備份與匯出完整個案資料 (JSON 格式)
                </div>
                <p className="text-[10px] text-slate-500">
                  可將目前紀錄完整備份至手機檔案或傳送給家屬/醫師。
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    下載備份檔
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? '已複製！' : '複製內容'}
                  </button>
                </div>
              </div>

              {/* Import */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  匯入還原健康日記
                </div>
                <p className="text-[10px] text-slate-500">
                  將先前備份之 JSON 內容貼於下方，即可將日誌還原。
                </p>
                <textarea
                  rows={3}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="請在此貼上完整 JSON 備份內容..."
                  className="w-full text-[11px] p-2 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {importError && (
                  <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {importError}
                  </p>
                )}
                {importSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800">
                    ✅ 已成功匯入{givenName}的健康日記資料！
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={!importJson.trim()}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  確認還原資料
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Overlay Modal (提示框：確認清除資料) */}
      {showResetConfirm && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowResetConfirm(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-rose-200 text-center space-y-4 animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <AlertCircle className="w-7 h-7 stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                確認清除資料
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                確定要清除「{givenName}」的所有健康紀錄嗎？<br />
                此動作將會清除所有生命徵象、回診行程與用藥紀錄（筆數全部歸零），並同步更新至雲端與所有裝置。
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={isResetting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecuteReset();
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? '正在清除資料中...' : '確認清除資料'}</span>
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowResetConfirm(false);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
