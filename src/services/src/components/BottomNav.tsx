import React from 'react';
import { LayoutDashboard, Activity, CalendarCheck, Pill, Dumbbell } from 'lucide-react';
import { TabType } from '../types/health';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingMedCount: number;
  upcomingApptCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  pendingMedCount,
  upcomingApptCount,
}) => {
  const tabs = [
    {
      id: 'overview' as TabType,
      label: '今日總覽',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      id: 'vitals' as TabType,
      label: '生命徵象',
      icon: Activity,
      badge: 0,
    },
    {
      id: 'appointments' as TabType,
      label: '回診紀錄',
      icon: CalendarCheck,
      badge: upcomingApptCount,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'medications' as TabType,
      label: '用藥紀錄',
      icon: Pill,
      badge: pendingMedCount,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'rehab' as TabType,
      label: '復健計畫',
      icon: Dumbbell,
      badge: 0,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] pb-safe shrink-0">
      <div className="grid grid-cols-5 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center relative py-0.5 transition-all ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'scale-110 text-emerald-600 stroke-[2.4]' : 'stroke-[1.7]'
                  }`}
                />
                {tab.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-0.5 rounded-full text-[9px] text-white flex items-center justify-center font-bold ${
                      tab.badgeColor || 'bg-rose-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                {tab.label}
              </span>

              {isActive && (
                <div className="absolute bottom-0.5 w-5 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
