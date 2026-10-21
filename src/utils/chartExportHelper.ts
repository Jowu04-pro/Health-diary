import { CaseProfile, VitalSignRecord } from '../types/health';

export interface ChartExportOptions {
  caseProfile: CaseProfile;
  selectedMonth: string; // YYYY-MM
  records: VitalSignRecord[];
  reportType: 'bp' | 'sugar' | 'all';
}

/**
 * Generate a high-resolution clinical line chart report image (PNG) on an HTML5 Canvas
 */
export function generateMonthlyReportCanvas(options: ChartExportOptions): HTMLCanvasElement {
  const { caseProfile, selectedMonth, records, reportType } = options;

  // Filter records for the selected month and sort chronologically
  const monthRecords = records
    .filter((r) => r.timestamp && r.timestamp.startsWith(selectedMonth))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Setup Canvas with HD Resolution (1200 x 820)
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 820;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Background
  ctx.fillStyle = '#f8fafc'; // slate-50
  ctx.fillRect(0, 0, width, height);

  // 2. White Card Container
  const margin = 28;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(margin, margin, cardW, cardH, 20);
  ctx.fill();
  ctx.restore();

  // Border of card
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. Top Banner
  const bannerH = 88;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(margin, margin, cardW, bannerH, [20, 20, 0, 0]);
  ctx.clip();
  const grad = ctx.createLinearGradient(margin, margin, margin + cardW, margin);
  grad.addColorStop(0, '#065f46'); // emerald-800
  grad.addColorStop(1, '#047857'); // emerald-700
  ctx.fillStyle = grad;
  ctx.fillRect(margin, margin, cardW, bannerH);
  ctx.restore();

  // Banner Content
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('個案生命徵象月度折線圖統計報表', margin + 28, margin + 40);

  const [yStr, mStr] = selectedMonth.split('-');
  const monthDisplay = `${yStr} 年 ${mStr} 月份`;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#a7f3d0'; // emerald-200
  ctx.fillText(`📅 統計區間：${monthDisplay}`, margin + 28, margin + 68);

  // Right side export time badge
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
  ctx.fillText(`匯出時間：${nowStr}`, margin + cardW - 28, margin + 42);
  ctx.fillStyle = '#d1fae5';
  ctx.fillText('照護單位：居家健康守護紀錄本', margin + cardW - 28, margin + 66);
  ctx.textAlign = 'left';

  // 4. Patient Info Box (Y: 130 ~ 195)
  const infoY = margin + bannerH + 16;
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect(margin + 20, infoY, cardW - 40, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
  const nameText = `個案姓名：${caseProfile.name} (${caseProfile.gender === 'female' ? '女' : '男'}, ${caseProfile.age} 歲)`;
  ctx.fillText(nameText, margin + 35, infoY + 34);

  ctx.fillStyle = '#475569';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
  const diagText = `主要診斷：${caseProfile.primaryDiagnosis || '無特殊主要診斷'}`;
  ctx.fillText(diagText, margin + 340, infoY + 34);

  ctx.textAlign = 'right';
  const totalRecText = `當月有效量測：${monthRecords.length} 筆`;
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(totalRecText, margin + cardW - 35, infoY + 34);
  ctx.textAlign = 'left';

  // 5. Summary Metric Cards (Y: 200 ~ 265)
  const statsY = infoY + 70;
  const sysList = monthRecords.map((r) => r.systolicBP).filter(Boolean) as number[];
  const diaList = monthRecords.map((r) => r.diastolicBP).filter(Boolean) as number[];
  const hrList = monthRecords.map((r) => r.heartRate).filter(Boolean) as number[];
  const sugarList = monthRecords.map((r) => r.bloodSugar).filter(Boolean) as number[];

  const avgSys = sysList.length ? Math.round(sysList.reduce((a, b) => a + b, 0) / sysList.length) : '--';
  const maxSys = sysList.length ? Math.max(...sysList) : '--';
  const avgDia = diaList.length ? Math.round(diaList.reduce((a, b) => a + b, 0) / diaList.length) : '--';
  const avgHr = hrList.length ? Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length) : '--';
  const avgSugar = sugarList.length ? Math.round(sugarList.reduce((a, b) => a + b, 0) / sugarList.length) : '--';

  const statBoxes = [
    { label: '平均血壓 (高/低壓)', val: `${avgSys} / ${avgDia} mmHg`, color: '#e11d48', bg: '#fff1f2' },
    { label: '最高收縮壓', val: `${maxSys} mmHg`, color: '#c026d3', bg: '#fdf4ff' },
    { label: '平均脈搏心率', val: `${avgHr} bpm`, color: '#059669', bg: '#f0fdf4' },
    { label: '平均血糖值', val: `${avgSugar} mg/dL`, color: '#2563eb', bg: '#eff6ff' },
  ];

  const statBoxW = (cardW - 40 - 3 * 16) / 4;
  statBoxes.forEach((s, idx) => {
    const bx = margin + 20 + idx * (statBoxW + 16);
    ctx.fillStyle = s.bg;
    ctx.beginPath();
    ctx.roundRect(bx, statsY, statBoxW, 58, 12);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11.5px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(s.label, bx + 14, statsY + 22);

    ctx.fillStyle = s.color;
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(s.val, bx + 14, statsY + 47);
  });

  // 6. Chart Area (Y: 290 ~ 680)
  const chartAreaX = margin + 30;
  const chartAreaY = statsY + 76;
  const chartAreaW = cardW - 60;
  const chartAreaH = 340;

  // Chart Background Box
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(chartAreaX, chartAreaY, chartAreaW, chartAreaH, 14);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chart Title & Legend Bar
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
  const chartTitle = reportType === 'sugar' ? '【血糖變化趨勢圖 (mg/dL)】' : '【血壓與心率綜合折線圖 (mmHg / bpm)】';
  ctx.fillText(chartTitle, chartAreaX + 18, chartAreaY + 28);

  // Legend
  ctx.textAlign = 'right';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
  if (reportType === 'sugar') {
    ctx.fillStyle = '#2563eb';
    ctx.fillText('● 血糖數值', chartAreaX + chartAreaW - 140, chartAreaY + 28);
    ctx.fillStyle = '#059669';
    ctx.fillText('— 正常範圍 (70-140 mg/dL)', chartAreaX + chartAreaW - 18, chartAreaY + 28);
  } else {
    ctx.fillStyle = '#e11d48';
    ctx.fillText('● 收縮壓 (高壓)', chartAreaX + chartAreaW - 280, chartAreaY + 28);
    ctx.fillStyle = '#ea580c';
    ctx.fillText('● 舒張壓 (低壓)', chartAreaX + chartAreaW - 160, chartAreaY + 28);
    ctx.fillStyle = '#059669';
    ctx.fillText('● 脈搏心率', chartAreaX + chartAreaW - 70, chartAreaY + 28);
  }
  ctx.textAlign = 'left';

  // SVG Chart Plotting on Canvas
  const plotLeft = chartAreaX + 56;
  const plotRight = chartAreaX + chartAreaW - 26;
  const plotTop = chartAreaY + 50;
  const plotBottom = chartAreaY + chartAreaH - 46;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  // Y Scale
  const minY = reportType === 'sugar' ? 50 : 50;
  const maxY = reportType === 'sugar' ? 220 : 180;

  const getYCoord = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return plotBottom - ((clamped - minY) / (maxY - minY)) * plotH;
  };

  // Normal Range Target Zone Background
  if (reportType !== 'sugar') {
    // Systolic 90 ~ 140
    ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
    ctx.fillRect(plotLeft, getYCoord(140), plotW, getYCoord(90) - getYCoord(140));
    // Diastolic 60 ~ 90
    ctx.fillStyle = 'rgba(234, 88, 12, 0.05)';
    ctx.fillRect(plotLeft, getYCoord(90), plotW, getYCoord(60) - getYCoord(90));
  } else {
    // Sugar 70 ~ 140
    ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.fillRect(plotLeft, getYCoord(140), plotW, getYCoord(70) - getYCoord(140));
  }

  // Draw Horizontal Gridlines & Y-labels
  const gridYTicks = reportType === 'sugar' ? [70, 100, 140, 180, 200] : [60, 80, 100, 120, 140, 160];
  gridYTicks.forEach((tick) => {
    const py = getYCoord(tick);
    ctx.beginPath();
    ctx.strokeStyle = (tick === 140 || tick === 90 || tick === 200) ? '#fca5a5' : '#e2e8f0';
    ctx.setLineDash((tick === 140 || tick === 90 || tick === 200) ? [4, 4] : [2, 2]);
    ctx.lineWidth = 1;
    ctx.moveTo(plotLeft, py);
    ctx.lineTo(plotRight, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Y Label text
    ctx.fillStyle = (tick === 140 || tick === 90 || tick === 200) ? '#ef4444' : '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${tick}`, plotLeft - 8, py + 4);
  });
  ctx.textAlign = 'left';

  // Draw Data Points and Lines
  if (monthRecords.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`此月份 (${monthDisplay}) 尚無量測記錄`, chartAreaX + chartAreaW / 2, chartAreaY + chartAreaH / 2);
    ctx.textAlign = 'left';
  } else {
    const ptCount = monthRecords.length;
    const getXCoord = (idx: number) => {
      if (ptCount === 1) return plotLeft + plotW / 2;
      return plotLeft + (idx / (ptCount - 1)) * plotW;
    };

    // Helper to draw connecting line
    const drawSeries = (getVal: (r: VitalSignRecord) => number | undefined, color: string, isDashed = false) => {
      const validPts = monthRecords
        .map((r, i) => ({ x: getXCoord(i), y: getVal(r), val: getVal(r), r }))
        .filter((p) => p.y !== undefined) as { x: number; y: number; val: number; r: VitalSignRecord }[];

      if (validPts.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (isDashed) ctx.setLineDash([5, 3]);
      else ctx.setLineDash([]);

      validPts.forEach((p, i) => {
        const py = getYCoord(p.y);
        if (i === 0) ctx.moveTo(p.x, py);
        else ctx.lineTo(p.x, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Point Circles & Value Labels
      validPts.forEach((p) => {
        const py = getYCoord(p.y);
        ctx.beginPath();
        ctx.arc(p.x, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Numerical label
        ctx.fillStyle = color;
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.val}`, p.x, py - 9);
      });
      ctx.textAlign = 'left';
    };

    if (reportType === 'sugar') {
      drawSeries((r) => r.bloodSugar, '#2563eb');
    } else {
      drawSeries((r) => r.systolicBP, '#e11d48');
      drawSeries((r) => r.diastolicBP, '#ea580c');
      drawSeries((r) => r.heartRate, '#059669', true);
    }

    // X Axis Dates
    monthRecords.forEach((r, idx) => {
      const px = getXCoord(idx);
      const timeParts = r.timestamp.split(' ');
      const datePart = timeParts[0]?.split('-').slice(1).join('/') || '';
      const timePart = timeParts[1] || '';

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(datePart, px, plotBottom + 18);
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(timePart, px, plotBottom + 32);
    });
    ctx.textAlign = 'left';
  }

  // 7. Footer Medical Recommendation Note (Y: 730 ~ 780)
  const footerY = chartAreaY + chartAreaH + 16;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(margin + 20, footerY, cardW - 40, 48, 10);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('📋 醫師門診參考叮嚀：本月數值已完成統計與波形化，建議定期回診時出示此折線圖供主治醫師評估用藥療效與血壓血糖控制穩定度。', margin + 35, footerY + 28);

  return canvas;
}

/**
 * Trigger browser download of image directly to device
 */
export function downloadCanvasImage(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Share via mobile native share sheet if supported
 */
export async function shareCanvasImage(canvas: HTMLCanvasElement, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: filename,
            text: '個案生命徵象月度折線圖統計報表',
            files: [file]
          });
          resolve(true);
        } catch {
          resolve(false);
        }
      } else {
        // Fallback to direct download
        downloadCanvasImage(canvas, filename);
        resolve(true);
      }
    }, 'image/png');
  });
}
