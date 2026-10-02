import React from 'react';
import { DoorOpen, Radio, ShieldAlert, ShieldCheck, CheckCircle2, LogOut, LogIn } from 'lucide-react';

export default function SensorDoorVisualizer({ sensors, systemMode }) {
  return (
    <div className="enterprise-panel p-4 md:p-6 rounded-2xl shadow-sm relative">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <Radio className="w-4 h-4 text-slate-800" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900">
              ผังการติดตั้งเซนเซอร์ 5 จุด (Door Sensor Map)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงสถานะการตรวจจับ real-time จากเซนเซอร์ทั้ง 5 ตัว
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${
            systemMode === 'AWAY' 
              ? 'bg-rose-50 text-rose-700 border-rose-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {systemMode === 'AWAY' ? <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
            {systemMode === 'AWAY' ? 'ARMED (AWAY)' : 'DISARMED (HOME)'}
          </span>
        </div>
      </div>

      {/* Corridor Diagram Container */}
      <div className="p-4 md:p-6 bg-slate-50/80 rounded-xl border border-slate-200/90 flex flex-col items-center">
        {/* Zone Labels */}
        <div className="w-full flex justify-between text-xs font-semibold text-slate-600 mb-3 px-1">
          <span className="text-sky-700 flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
            <LogOut className="w-3.5 h-3.5" /> บริเวณนอกห้อง (Outside)
          </span>
          <span className="text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            <LogIn className="w-3.5 h-3.5" /> บริเวณในห้อง (Inside)
          </span>
        </div>

        {/* 5 Sensors Grid Track with identical Sensor Icon (Radio) */}
        <div className="w-full grid grid-cols-5 gap-2 md:gap-3">
          {sensors.map((s) => {
            const isTriggered = s.active;
            return (
              <div 
                key={s.id}
                className={`flex flex-col items-center justify-between p-3 md:p-4 rounded-xl border transition-all duration-200 ${
                  isTriggered 
                    ? 'bg-rose-50 border-rose-500 shadow-md scale-105 z-10' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    S0{s.id}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isTriggered ? 'bg-rose-600 animate-ping' : 'bg-emerald-500'}`} />
                </div>

                {/* Identical Sensor Icon for all 5 sensors */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center my-1.5 transition-all ${
                  isTriggered 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  <Radio className={`w-5 h-5 md:w-6 md:h-6 ${isTriggered ? 'animate-pulse' : ''}`} />
                </div>

                <div className="text-center my-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {s.name.split(' ')[0]}
                  </h4>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-mono font-bold mt-1.5 ${
                    isTriggered 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isTriggered ? 'ACTIVE' : 'READY'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="w-full mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ตรวจจับสัญญาณเรียลไทม์: S1, S2 (นอก) | S3 (ประตู) | S4, S5 (ใน)
          </span>
        </div>
      </div>
    </div>
  );
}
