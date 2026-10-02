import React, { useState } from 'react';
import { History, Search, Download, Trash2, FileText } from 'lucide-react';

export default function LogsTable({ logs, onClearLogs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = "ID,Timestamp,Type,Title,Details,Level\n";
    const rows = logs.map(l => `"${l.id}","${l.timestamp}","${l.type}","${l.title.replace(/"/g, '""')}","${l.details.replace(/"/g, '""')}","${l.level}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `wavy_home_security_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'danger':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-md">SECURITY ALERT</span>;
      case 'warning':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">MOTION DETECTED</span>;
      case 'success':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">DOOR OPENED</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 rounded-md">SYSTEM INFO</span>;
    }
  };

  return (
    <div className="cream-panel p-4 md:p-6 rounded-3xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#f5ede6]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-[#292320]">
              ประวัติและบันทึกกิจกรรมความปลอดภัย (Security Audit Log)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              บันทึกการเปิด-ปิดประตูย้อนหลังพร้อมประทับเวลา (Timestamp Audit Trail)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-[#292320] hover:bg-[#1a1412] text-white rounded-xl shadow-sm transition font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>
          <button
            onClick={onClearLogs}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ล้างประวัติ
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="ค้นหาตามข้อความ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#faf5f0] border border-[#ede3da] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-rose-400"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {['ALL', 'PASSAGE', 'MOTION', 'SYSTEM'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold border shrink-0 transition ${
                filterType === type 
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                  : 'bg-[#faf5f0] text-stone-600 border-[#ede3da] hover:bg-white'
              }`}
            >
              {type === 'ALL' ? 'ทั้งหมด' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Feed View */}
      <div className="block md:hidden space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-stone-400 text-xs">
            ไม่พบประวัติบันทึกกิจกรรมความปลอดภัย
          </div>
        ) : (
          filteredLogs.map((l) => {
            const dateObj = new Date(l.timestamp);
            const timeFormatted = `${dateObj.toLocaleDateString('th-TH')} ${dateObj.toLocaleTimeString('th-TH')}`;
            return (
              <div key={l.id} className="p-3 bg-[#faf5f0] border border-[#ede3da] rounded-2xl shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-medium text-stone-400">{timeFormatted}</span>
                  {getLevelBadge(l.level)}
                </div>
                <h4 className="text-xs font-bold text-[#292320]">{l.title}</h4>
                <p className="text-[11px] text-stone-600 leading-snug">{l.details}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Audit Table View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#ede3da] bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#faf5f0] border-b border-[#ede3da] text-stone-600 font-bold uppercase tracking-wider">
              <th className="p-3">เวลา (Timestamp)</th>
              <th className="p-3">ประเภท</th>
              <th className="p-3">เหตุการณ์ (Event Title)</th>
              <th className="p-3">รายละเอียดกิจกรรม (Log Details)</th>
              <th className="p-3">ระดับความสำคัญ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-stone-400">
                  ไม่พบประวัติบันทึกกิจกรรมความปลอดภัย
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => {
                const dateObj = new Date(l.timestamp);
                const timeFormatted = `${dateObj.toLocaleDateString('th-TH')} ${dateObj.toLocaleTimeString('th-TH')}`;
                return (
                  <tr key={l.id} className="hover:bg-[#faf5f0]/60 transition">
                    <td className="p-3 font-mono text-[11px] text-stone-400 whitespace-nowrap">
                      {timeFormatted}
                    </td>
                    <td className="p-3 font-bold text-stone-700">{l.type}</td>
                    <td className="p-3 font-bold text-[#292320] whitespace-nowrap">{l.title}</td>
                    <td className="p-3 text-stone-600">{l.details}</td>
                    <td className="p-3">{getLevelBadge(l.level)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
