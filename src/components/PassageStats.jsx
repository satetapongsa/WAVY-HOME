import React from 'react';
import { DoorOpen, LogIn, LogOut, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function PassageStats({ logs, doorOpenCount, systemMode }) {
  const lastPassageLog = logs.find(l => l.type === 'PASSAGE' || l.type === 'MOTION');
  const lastTimeText = lastPassageLog 
    ? new Date(lastPassageLog.timestamp).toLocaleTimeString('th-TH')
    : 'ไม่มีข้อมูลกิกจรรม';

  const entryPassages = logs.filter(l => l.details && (l.details.includes('ด้านนอก') || l.details.includes('ENTRY'))).length;
  const exitPassages = logs.filter(l => l.details && (l.details.includes('ด้านใน') || l.details.includes('EXIT'))).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* KPI 1: System Armed Status */}
      <div className="enterprise-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-slate-900">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">สถานะความปลอดภัย</span>
          <div className="flex items-center gap-1.5 mt-1">
            <h3 className="text-lg font-bold text-slate-900">
              {systemMode === 'AWAY' ? 'เฝ้าระวังภัย' : 'ปกติ (อยู่บ้าน)'}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Mode: {systemMode}</span>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          systemMode === 'AWAY' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          {systemMode === 'AWAY' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
      </div>

      {/* KPI 2: Total Door Open Events */}
      <div className="enterprise-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-600">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">รวมผ่านเข้า-ออกประตู</span>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-2xl font-bold text-slate-900">{doorOpenCount}</h3>
            <span className="text-xs font-normal text-slate-500">ครั้ง</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Access Events Count</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
          <DoorOpen className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 3: Entry vs Exit Split */}
      <div className="enterprise-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-indigo-600">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">สถิติ ทิศทางเข้า / ออก</span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5" /> เข้า {entryPassages}
            </span>
            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> ออก {exitPassages}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Direction Stats</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
          <LogIn className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 4: Last Timestamp */}
      <div className="enterprise-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-slate-700">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">เปิดผ่านประตูล่าสุด</span>
          <h3 className="text-base font-bold text-slate-900 mt-1 font-mono">{lastTimeText}</h3>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Last Sensor Activity</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
