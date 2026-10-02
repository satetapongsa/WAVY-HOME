import React from 'react';
import { Radio, ShieldAlert, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SensorDoorVisualizer({ sensors, systemMode }) {
  const activeCount = sensors.filter(s => s.active).length;

  return (
    <div className="cream-panel p-4 md:p-6 rounded-3xl shadow-sm relative">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f5ede6]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <Radio className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-[#292320]">
              ผังสถานะเซนเซอร์ 5 หัว (5-Sensor Real-Time Monitor)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              ระบบนับการเปิด-ปิดประตูเมื่อมีเซนเซอร์จับพร้อมกันตั้งแต่ 3 หัวขึ้นไป
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
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
      <div className="p-4 md:p-6 bg-[#faf5f0] rounded-2xl border border-[#ede3da] flex flex-col items-center">
        {/* Active sensors counter indicator */}
        <div className="w-full flex justify-between items-center text-xs font-bold text-stone-600 mb-3 px-1">
          <span className="text-stone-700 flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> เซนเซอร์ที่กำลังจับสัญญาณอยู่: {activeCount} / 5 หัว
          </span>
          <span className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
            activeCount >= 3 
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm animate-pulse' 
              : 'bg-stone-100 text-stone-600 border-stone-200'
          }`}>
            {activeCount >= 3 ? 'เปิด-ปิดประตู 1 ครั้ง (TRIGGERED)' : 'รอสัญญาณ (READY)'}
          </span>
        </div>

        {/* 5 Sensors Grid Track */}
        <div className="w-full grid grid-cols-5 gap-2 md:gap-3">
          {sensors.map((s) => {
            const isTriggered = s.active;
            return (
              <div 
                key={s.id}
                className={`flex flex-col items-center justify-between p-3 md:p-4 rounded-2xl border transition-all duration-200 ${
                  isTriggered 
                    ? 'bg-rose-50 border-rose-500 shadow-md scale-105 z-10' 
                    : 'bg-white border-[#ece4dc] hover:border-rose-300'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-extrabold text-stone-400">
                    S0{s.id}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isTriggered ? 'bg-rose-600 animate-ping' : 'bg-emerald-500'}`} />
                </div>

                {/* Identical Sensor Icon for all 5 sensors */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center my-1.5 transition-all ${
                  isTriggered 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-300' 
                    : 'bg-[#f7f2ed] text-stone-600 border border-[#eee4dc]'
                }`}>
                  <Radio className={`w-5 h-5 md:w-6 md:h-6 ${isTriggered ? 'animate-pulse' : ''}`} />
                </div>

                <div className="text-center my-1">
                  <h4 className="text-xs font-bold text-[#292320] line-clamp-1">
                    {s.name}
                  </h4>
                  <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold mt-1.5 ${
                    isTriggered 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }`}>
                    {isTriggered ? 'ACTIVE' : 'READY'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="w-full mt-4 pt-3 border-t border-[#ede3da] flex items-center justify-between text-xs text-stone-500 px-1">
          <span className="flex items-center gap-1.5 font-medium text-stone-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            เงื่อนไขการบันทึก: จับสัญญาณพร้อมกันตั้งแต่ 3 หรือ 4 หรือ 5 หัว = บันทึกเปิด-ปิดประตู 1 ครั้ง
          </span>
        </div>
      </div>
    </div>
  );
}
