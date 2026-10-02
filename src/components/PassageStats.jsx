import React from 'react';
import { DoorOpen, Clock, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';

export default function PassageStats({ logs, doorOpenCount, systemMode }) {
  const lastLog = logs.find(l => l.type === 'PASSAGE' || l.type === 'MOTION');
  const lastTimeText = lastLog 
    ? new Date(lastLog.timestamp).toLocaleTimeString('th-TH')
    : 'ไม่มีกิจกรรม';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* KPI 1: System Mode */}
      <div className="enterprise-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-slate-900">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">สถานะความปลอดภัย</span>
          <div className="flex items-center gap-1.5 mt-1">
            <h3 className="text-lg font-bold text-slate-900">
              {systemMode === 'AWAY' ? 'เฝ้าระวังภัย (ไม่อยู่บ้าน)' : 'ปกติ (อยู่บ้าน)'}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Security Mode: {systemMode}</span>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          systemMode === 'AWAY' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          {systemMode === 'AWAY' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
      </div>

      {/* KPI 2: Total Door Openings / Actions */}
      <div className="enterprise-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-600">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">รวมเปิด-ปิดประตูห้อง</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <h3 className="text-3xl font-extrabold text-slate-900">{doorOpenCount}</h3>
            <span className="text-xs font-semibold text-slate-600">ครั้ง</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Room Access Count</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
          <DoorOpen className="w-6 h-6" />
        </div>
      </div>

      {/* KPI 3: Last Door Open Timestamp */}
      <div className="enterprise-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-slate-700">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">เปิด-ปิดประตู ล่าสุดเวลา</span>
          <h3 className="text-base font-bold text-slate-900 mt-1 font-mono">{lastTimeText}</h3>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Last Access Timestamp</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
