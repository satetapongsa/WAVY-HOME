import React from 'react';
import { ShieldAlert, ShieldCheck, Home, Sliders } from 'lucide-react';

export default function SecurityControls({ systemMode, onToggleMode }) {
  return (
    <div className="enterprise-panel p-4 md:p-5 rounded-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              โหมดความปลอดภัยระบบ (Security Armed Mode)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกโหมดเฝ้าระวังสำหรับการตรวจจับวัตถุและคนผ่านประตู
            </p>
          </div>
        </div>

        {/* Enterprise Segmented Button Control */}
        <div className="p-1 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-1 w-full md:w-auto">
          <button
            onClick={() => onToggleMode('AWAY')}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              systemMode === 'AWAY'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            ไม่อยู่บ้าน (ARM AWAY)
          </button>

          <button
            onClick={() => onToggleMode('HOME')}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              systemMode === 'HOME'
                ? 'bg-emerald-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            อยู่บ้าน (DISARM)
          </button>
        </div>
      </div>
    </div>
  );
}
