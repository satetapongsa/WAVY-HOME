import React from 'react';
import { DoorOpen, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function PassageStats({ logs, doorOpenCount, systemMode }) {
  const lastLog = logs.find(l => l.type === 'PASSAGE' || l.type === 'MOTION');
  const lastTimeText = lastLog 
    ? new Date(lastLog.timestamp).toLocaleTimeString('th-TH')
    : 'ไม่มีกิจกรรม';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {/* KPI 1: System Mode */}
      <div className="cream-panel p-4 md:p-5 rounded-3xl flex items-center justify-between border-l-4 border-l-rose-500">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-rose-800/70 uppercase">สถานะความปลอดภัย</span>
          <div className="flex items-center gap-1.5 mt-1">
            <h3 className="text-base md:text-lg font-extrabold text-[#292320]">
              {systemMode === 'AWAY' ? 'เฝ้าระวังภัย (ไม่อยู่บ้าน)' : 'ปกติ (อยู่บ้าน)'}
            </h3>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block font-medium">System Armed Mode</span>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
          systemMode === 'AWAY' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          {systemMode === 'AWAY' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
      </div>

      {/* KPI 2: Total Door Openings / Actions */}
      <div className="cream-panel p-4 md:p-5 rounded-3xl flex items-center justify-between border-l-4 border-l-rose-400">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-rose-800/70 uppercase">รวมเปิด-ปิดประตูห้อง</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <h3 className="text-3xl font-black text-rose-600 font-outfit">{doorOpenCount}</h3>
            <span className="text-xs font-semibold text-rose-900/80">ครั้ง</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block font-medium">Room Access Count</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
          <DoorOpen className="w-6 h-6" />
        </div>
      </div>

      {/* KPI 3: Last Door Open Timestamp */}
      <div className="cream-panel p-4 md:p-5 rounded-3xl flex items-center justify-between border-l-4 border-l-stone-400">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">เปิด-ปิดประตู ล่าสุดเวลา</span>
          <h3 className="text-base font-bold text-[#292320] mt-1 font-mono">{lastTimeText}</h3>
          <span className="text-[10px] text-stone-400 mt-0.5 block font-medium">Last Access Timestamp</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-600 border border-stone-200 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
