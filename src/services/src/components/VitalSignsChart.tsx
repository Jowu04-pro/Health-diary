import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Droplet, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Calendar,
  Info
} from 'lucide-react';
import { VitalSignRecord } from '../types/health';

interface VitalSignsChartProps {
  type: 'bp' | 'sugar';
  records: VitalSignRecord[];
  onOpenAddModal?: () => void;
}

export const VitalSignsChart: React.FC<VitalSignsChartProps> = ({
  type,
  records,
  onOpenAddModal
}) => {
  // Sort records chronologically (oldest to newest for left-to-right chart progression)
  const validRecords = useMemo(() => {
    return [...records]
      .filter((r) => {
        if (type === 'bp') {
          return r.systolicBP !== undefined || r.diastolicBP !== undefined || r.heartRate !== undefined;
        }
        return r.bloodSugar !== undefined && r.bloodSugar !== null;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [records, type]);

  // Selected point index for interactive inspection
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Default active record is the most recent one
  const activeRecord = useMemo(() => {
    if (validRecords.length === 0) return null;
    if (selectedIdx !== null && validRecords[selectedIdx]) {
      return validRecords[selectedIdx];
    }
    return validRecords[validRecords.length - 1];
  }, [validRecords, selectedIdx]);

  // SVG dimensions
  const svgWidth = 340;
  const svgHeight = 190;
  const padLeft = 40;
  const padRight = 24;
  const padTop = 26;
  const padBottom = 32;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Compute Scales
  const { minY, maxY, yTicks } = useMemo(() => {
    if (type === 'bp') {
      let min = 50;
      let max = 160;
      validRecords.forEach((r) => {
        if (r.systolicBP && r.systolicBP > max - 15) max = Math.ceil((r.systolicBP + 20) / 20) * 20;
        if (r.diastolicBP && r.diastolicBP < min + 10) min = Math.max(30, Math.floor((r.diastolicBP - 15) / 10) * 10);
        if (r.heartRate && r.heartRate < min + 10) min = Math.max(30, Math.floor((r.heartRate - 15) / 10) * 10);
      });
      return {
        minY: min,
        maxY: max,
        yTicks: [60, 90, 120, 140, max > 160 ? max : 160].filter((v) => v >= min && v <= max)
      };
    } else {
      let min = 60;
      let max = 220;
      validRecords.forEach((r) => {
        if (r.bloodSugar && r.bloodSugar > max - 20) max = Math.ceil((r.bloodSugar + 25) / 20) * 20;
        if (r.bloodSugar && r.bloodSugar < min + 10) min = Math.max(40, Math.floor((r.bloodSugar - 15) / 10) * 10);
      });
      return {
        minY: min,
        maxY: max,
        yTicks: [70, 100, 140, 200].filter((v) => v >= min && v <= max)
      };
    }
  }, [validRecords, type]);

  // Coordinate conversion helper
  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padTop + chartH - ((clamped - minY) / (maxY - minY)) * chartH;
  };

  const getX = (idx: number, count: number) => {
    if (count <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (count - 1)) * chartW;
  };

  // Format short timestamp for X axis
  const formatShortDate = (timestamp: string) => {
    const parts = timestamp.split(' ');
    const datePart = parts[0]?.split('-').slice(1).join('/') || '';
    const timePart = parts[1] || '';
    return `${datePart} ${timePart}`;
  };

  // Build path strings for polylines
  const pointsData = useMemo(() => {
    const count = validRecords.length;
    return validRecords.map((r, i) => {
      const x = getX(i, count);
      return {
        x,
        r,
        sysY: r.systolicBP ? getY(r.systolicBP) : null,
        diaY: r.diastolicBP ? getY(r.diastolicBP) : null,
        pulseY: r.heartRate ? getY(r.heartRate) : null,
        sugarY: r.bloodSugar ? getY(r.bloodSugar) : null,
      };
    });
  }, [validRecords, minY, maxY, chartW, chartH]);

  const makePath = (getYVal: (p: typeof pointsData[0]) => number | null) => {
    const pts = pointsData.filter((p) => getYVal(p) !== null);
    if (pts.length === 0) return '';
    return pts.reduce((acc, curr, idx) => {
      const y = getYVal(curr)!;
      return idx === 0 ? `M ${curr.x} ${y}` : `${acc} L ${curr.x} ${y}`;
    }, '');
  };

  const systolicPath = useMemo(() => makePath((p) => p.sysY), [pointsData]);
  const diastolicPath = useMemo(() => makePath((p) => p.diaY), [pointsData]);
  const pulsePath = useMemo(() => makePath((p) => p.pulseY), [pointsData]);
  const sugarPath = useMemo(() => makePath((p) => p.sugarY), [pointsData]);

  // Sugar area gradient fill path
  const sugarAreaPath = useMemo(() => {
    const pts = pointsData.filter((p) => p.sugarY !== null);
    if (pts.length === 0) return '';
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    const bottomY = padTop + chartH;
    const linePart = pts.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.sugarY}` : `${acc} L ${curr.x} ${curr.sugarY}`;
    }, '');
    return `${linePart} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pointsData, padTop, chartH]);

  // Quick stats calculation
  const stats = useMemo(() => {
    if (validRecords.length === 0) return null;
    const latest = validRecords[validRecords.length - 1];

    if (type === 'bp') {
      const sysList = validRecords.map((r) => r.systolicBP).filter(Boolean) as number[];
      const diaList = validRecords.map((r) => r.diastolicBP).filter(Boolean) as number[];
      const hrList = validRecords.map((r) => r.heartRate).filter(Boolean) as number[];

      const avgSys = sysList.length ? Math.round(sysList.reduce((a, b) => a + b, 0) / sysList.length) : null;
      const avgDia = diaList.length ? Math.round(diaList.reduce((a, b) => a + b, 0) / diaList.length) : null;
      const avgHr = hrList.length ? Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length) : null;

      const isNormal = latest.systolicBP && latest.systolicBP >= 90 && latest.systolicBP <= 140 &&
                       latest.diastolicBP && latest.diastolicBP >= 60 && latest.diastolicBP <= 90;

      return {
        latestSys: latest.systolicBP,
        latestDia: latest.diastolicBP,
        latestHr: latest.heartRate,
        avgSys,
        avgDia,
        avgHr,
        isNormal,
        count: validRecords.length
      };
    } else {
      const sugars = validRecords.map((r) => r.bloodSugar).filter(Boolean) as number[];
      const avgSugar = sugars.length ? Math.round(sugars.reduce((a, b) => a + b, 0) / sugars.length) : null;
      const latestSugar = latest.bloodSugar;
      const timing = latest.bloodSugarTiming;

      const isNormal = timing === 'fasting'
        ? latestSugar && latestSugar >= 70 && latestSugar <= 140
        : latestSugar && latestSugar < 200;

      return {
        latestSugar,
        avgSugar,
        timing,
        isNormal,
        count: validRecords.length
      };
    }
  }, [validRecords, type]);

  if (validRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-700">
            {type === 'bp' ? '尚無血壓與心率量測紀錄' : '尚無血糖量測紀錄'}
          </h3>
          <p className="text-xs text-slate-500">
            點擊「新增量測」輸入數值後，系統將自動繪製即時折線趨勢圖
          </p>
        </div>
        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            立即記錄第一筆數據
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition">
      {/* Chart Header */}
      <div className="p-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${
            type === 'bp' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {type === 'bp' ? <Heart className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-800">
                {type === 'bp' ? '血壓與脈搏變化趨勢' : '血糖變化趨勢'}
              </h3>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md">
                折線圖
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              共記錄 {validRecords.length} 筆量測數據（點擊點位可看詳情）
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {stats && (
          <div className="text-right">
            {type === 'bp' ? (
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.8 rounded-lg ${
                stats.isNormal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' : 'bg-amber-50 text-amber-700 border border-amber-200/70'
              }`}>
                {stats.isNormal ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                {stats.latestSys && stats.latestDia ? `${stats.latestSys}/${stats.latestDia}` : '--'}
                <span className="text-[9px] font-normal">mmHg</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.8 rounded-lg ${
                stats.isNormal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' : 'bg-amber-50 text-amber-700 border border-amber-200/70'
              }`}>
                {stats.isNormal ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                {stats.latestSugar ?? '--'}
                <span className="text-[9px] font-normal">mg/dL</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend & Target Range Bar */}
      <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between text-[11px] gap-2">
        {type === 'bp' ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100 inline-block" />
              <span className="text-slate-600 font-medium">收縮壓 (高壓)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-100 inline-block" />
              <span className="text-slate-600 font-medium">舒張壓 (低壓)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-100 inline-block" />
              <span className="text-slate-600 font-medium">脈搏心率</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100 inline-block" />
              <span className="text-slate-600 font-medium">血糖數值</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> 空腹 (70-140)
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> 飯後 (&lt;200)
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-400 font-medium">
          {type === 'bp' ? '正常: 90-140 / 60-90' : '目標: 空腹<140 / 飯後<200'}
        </div>
      </div>

      {/* SVG Interactive Line Chart Canvas */}
      <div className="relative p-2 flex justify-center bg-white select-none">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full max-w-[360px] h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Reference zones (Light background shading) */}
          {type === 'bp' ? (
            <>
              {/* Normal Systolic Band (90 - 140) */}
              <rect
                x={padLeft}
                y={getY(140)}
                width={chartW}
                height={Math.max(0, getY(90) - getY(140))}
                fill="#f43f5e"
                fillOpacity="0.04"
              />
              {/* Normal Diastolic Band (60 - 90) */}
              <rect
                x={padLeft}
                y={getY(90)}
                width={chartW}
                height={Math.max(0, getY(60) - getY(90))}
                fill="#ea580c"
                fillOpacity="0.04"
              />
            </>
          ) : (
            <>
              {/* Normal Fasting Target Band (70 - 140) */}
              <rect
                x={padLeft}
                y={getY(140)}
                width={chartW}
                height={Math.max(0, getY(70) - getY(140))}
                fill="#10b981"
                fillOpacity="0.05"
              />
            </>
          )}

          {/* Y Axis Gridlines and Labels */}
          {yTicks.map((val) => {
            const y = getY(val);
            const isWarning = (type === 'bp' && (val === 140 || val === 90)) || (type === 'sugar' && (val === 200 || val === 140));
            return (
              <g key={`ytick-${val}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke={isWarning ? '#fca5a5' : '#e2e8f0'}
                  strokeDasharray={isWarning ? '3 3' : '2 2'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill={isWarning ? '#ef4444' : '#94a3b8'}
                  fontWeight={isWarning ? '600' : 'normal'}
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Sugar Area Fill (Under line) */}
          {type === 'sugar' && sugarAreaPath && (
            <path d={sugarAreaPath} fill="url(#sugarGradient)" />
          )}

          {/* Plot Lines */}
          {type === 'bp' ? (
            <>
              {/* Systolic Line */}
              {systolicPath && (
                <path
                  d={systolicPath}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#shadowFilter)"
                />
              )}
              {/* Diastolic Line */}
              {diastolicPath && (
                <path
                  d={diastolicPath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#shadowFilter)"
                />
              )}
              {/* Heart Rate Line */}
              {pulsePath && (
                <path
                  d={pulsePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          ) : (
            /* Sugar Line */
            sugarPath && (
              <path
                d={sugarPath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#shadowFilter)"
              />
            )
          )}

          {/* Vertical Guides and Click Hit Areas for Points */}
          {pointsData.map((pt, idx) => {
            const isSelected = selectedIdx === idx || (selectedIdx === null && idx === pointsData.length - 1);
            return (
              <g key={`pt-group-${idx}`} className="cursor-pointer" onClick={() => setSelectedIdx(idx)}>
                {/* Vertical hover/active guide line */}
                {isSelected && (
                  <line
                    x1={pt.x}
                    y1={padTop}
                    x2={pt.x}
                    y2={padTop + chartH}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* X Axis Labels (bottom) */}
                <text
                  x={pt.x}
                  y={padTop + chartH + 15}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill={isSelected ? '#1e293b' : '#64748b'}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {formatShortDate(pt.r.timestamp)}
                </text>

                {/* Blood Pressure Dots */}
                {type === 'bp' && (
                  <>
                    {/* Systolic Dot */}
                    {pt.sysY !== null && (
                      <g>
                        <circle
                          cx={pt.x}
                          cy={pt.sysY}
                          r={isSelected ? 6 : 4}
                          fill="#ffffff"
                          stroke="#e11d48"
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all"
                        />
                        {/* Value label on top of point */}
                        <text
                          x={pt.x}
                          y={pt.sysY - 7}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#be123c"
                        >
                          {pt.r.systolicBP}
                        </text>
                      </g>
                    )}

                    {/* Diastolic Dot */}
                    {pt.diaY !== null && (
                      <g>
                        <circle
                          cx={pt.x}
                          cy={pt.diaY}
                          r={isSelected ? 5.5 : 3.8}
                          fill="#ffffff"
                          stroke="#f97316"
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all"
                        />
                        <text
                          x={pt.x}
                          y={pt.diaY + 12}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="600"
                          fill="#c2410c"
                        >
                          {pt.r.diastolicBP}
                        </text>
                      </g>
                    )}

                    {/* Pulse Dot */}
                    {pt.pulseY !== null && (
                      <circle
                        cx={pt.x}
                        cy={pt.pulseY}
                        r={isSelected ? 4.5 : 3}
                        fill="#059669"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}
                  </>
                )}

                {/* Blood Sugar Dot */}
                {type === 'sugar' && pt.sugarY !== null && (
                  <g>
                    <circle
                      cx={pt.x}
                      cy={pt.sugarY}
                      r={isSelected ? 6 : 4.5}
                      fill={pt.r.bloodSugarTiming === 'fasting' ? '#2563eb' : '#9333ea'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-all"
                    />
                    <text
                      x={pt.x}
                      y={pt.sugarY - 8}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill={pt.r.bloodSugarTiming === 'fasting' ? '#1d4ed8' : '#7e22ce'}
                    >
                      {pt.r.bloodSugar}
                    </text>
                  </g>
                )}

                {/* Transparent wider tap target */}
                <rect
                  x={pt.x - 18}
                  y={padTop}
                  width="36"
                  height={chartH + 20}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Point Detail Card */}
      {activeRecord && (
        <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeRecord.timestamp}</span>
              {activeRecord.recordedBy && (
                <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded-md font-normal">
                  {activeRecord.recordedBy}
                </span>
              )}
            </div>
            {activeRecord.notes && (
              <p className="text-[11px] text-slate-500 italic">
                備註：{activeRecord.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {type === 'bp' ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">血壓</div>
                  <div className="text-xs font-black text-rose-600">
                    {activeRecord.systolicBP || '--'}/{activeRecord.diastolicBP || '--'} <span className="text-[9px] font-normal text-slate-500">mmHg</span>
                  </div>
                </div>
                {activeRecord.heartRate && (
                  <div className="text-right pl-2 border-l border-slate-200">
                    <div className="text-[10px] text-slate-400">脈搏</div>
                    <div className="text-xs font-black text-emerald-600">
                      {activeRecord.heartRate} <span className="text-[9px] font-normal text-slate-500">bpm</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-right">
                <div className="text-[10px] text-slate-400">
                  {activeRecord.bloodSugarTiming === 'fasting' ? '早晨空腹' : 
                   activeRecord.bloodSugarTiming === 'postprandial' ? '飯後 2 小時' : '量測血糖'}
                </div>
                <div className="text-sm font-black text-blue-600">
                  {activeRecord.bloodSugar} <span className="text-[10px] font-normal text-slate-500">mg/dL</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Insights row */}
      {stats && (
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          {type === 'bp' ? (
            <>
              <div>
                平均收縮壓：<strong className="text-slate-700">{stats.avgSys ?? '--'} mmHg</strong>
              </div>
              <div>
                平均舒張壓：<strong className="text-slate-700">{stats.avgDia ?? '--'} mmHg</strong>
              </div>
              {stats.avgHr && (
                <div>
                  平均脈搏：<strong className="text-slate-700">{stats.avgHr} bpm</strong>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                平均血糖值：<strong className="text-slate-700">{stats.avgSugar ?? '--'} mg/dL</strong>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Info className="w-3 h-3 text-slate-400" />
                <span>空腹標準 70-140 / 飯後&lt;200</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
