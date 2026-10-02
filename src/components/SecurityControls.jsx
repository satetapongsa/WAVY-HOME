import React from 'react';
import { ShieldAlert, ShieldCheck, Home, Sliders } from 'lucide-react';

export default function SecurityControls({ systemMode, onToggleMode }) {
  return (
    <div className="cream-panel p-4 md:p-5 rounded-3xl shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-bold text-[#292320] flex items-center gap-1.5">
              โหมดความปลอดภัยระบบ (Security Armed Mode)
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              เลือกโหมดเฝ้าระวังเมื่อไม่อยู่บ้าน เพื่อรับการแจ้งเตือนทันที
            </p>
          </div>
        </div>

        {/* Soft Pink Segmented Control */}
        <div className="p-1 bg-[#f7f2ed] rounded-2xl border border-[#ece4dc] flex items-center gap-1 w-full md:w-auto">
          <button
            onClick={() => onToggleMode('AWAY')}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              systemMode === 'AWAY'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            ไม่อยู่บ้าน (ARM AWAY)
          </button>

          <button
            onClick={() => onToggleMode('HOME')}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              systemMode === 'HOME'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
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
