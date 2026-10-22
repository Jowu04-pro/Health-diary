import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { saveCaseToFirebase, syncProfilesToFirebase } from '../services/firebase';
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
  onResetDefault: () => void;
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
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [manualSyncMsg, setManualSyncMsg] = useState('');

  const handleManualCloudSync = async () => {
    setIsManualSyncing(true);
    setManualSyncMsg('');
    try {
      const allProfiles = getStoredCaseList();
      await syncProfilesToFirebase(allProfiles);
      const fullData = {
        profile: caseProfile,
        vitals: vitalSigns,
        appointments,
        medications,
        medLogs,
        rehab: rehabPlans,
      };
      const ok = await saveCaseToFirebase(caseProfile.id, fullData);
      if (ok) {
        setManualSyncMsg('✅ 已成功上傳！已同步至 Firebase 雲端資料庫（Firestore）。');
      } else {
        setManualSyncMsg('❌ 上傳時發生錯誤，請檢查網路連線或規則設定。');
      }
    } catch (err: any) {
      setManualSyncMsg('❌ 上傳失敗：' + (err?.message || '未知錯誤'));
    } finally {
      setIsManualSyncing(false);
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

  const handleExecuteImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.caseProfile && !parsed.vitalSigns) {
        throw new Error('格式不符合健康日記規範');
      }
      onImportData(parsed);
      setImportError('');
      alert(`已成功匯入${givenName}的健康日記資料！`);
      onClose();
    } catch (e: any) {
      setImportError('JSON 語法錯誤或檔案內容無效，請確認後再試。');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
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

              {/* Manual Cloud Push Button */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  disabled={isManualSyncing}
                  onClick={handleManualCloudSync}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Cloud className="w-4 h-4" />
                  <span>{isManualSyncing ? '正在同步至 Firebase 雲端...' : '立即將本機日誌上傳至 Firebase 雲端'}</span>
                </button>

                {manualSyncMsg && (
                  <div className={`p-2 rounded-xl text-xs font-semibold leading-relaxed ${
                    manualSyncMsg.startsWith('✅') 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {manualSyncMsg}
                  </div>
                )}
              </div>

              {/* Fast Tools */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  列印交班報告
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`確定要還原「${givenName}」的預設示範資料嗎？`)) {
                      onResetDefault();
                      alert('已重置為初始示範資料');
                      onClose();
                    }
                  }}
                  className="py-2 px-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                  重置此個案
                </button>
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
    </div>
  );
};
