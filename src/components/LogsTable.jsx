import React, { useState } from 'react';
import { History, Search, Download, Trash2, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

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
    link.setAttribute("download", `security_audit_log_${new Date().toISOString().slice(0,10)}.csv`);
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
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">PASSAGE ENTRY</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-md">SYSTEM INFO</span>;
    }
  };

  return (
    <div className="enterprise-panel p-4 md:p-6 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900">
              ประวัติและบันทึกกิจกรรมความปลอดภัย (Security Audit Log)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกการเข้า-ออกย้อนหลังพร้อมประทับเวลา (Timestamp Audit Trail)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition font-medium"
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
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามข้อความ / ตำแหน่งเซนเซอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {['ALL', 'PASSAGE', 'MOTION', 'SYSTEM'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium border shrink-0 transition ${
                filterType === type 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
          <div className="p-6 text-center text-slate-400 text-xs">
            ไม่พบประวัติบันทึกกิจกรรมความปลอดภัย
          </div>
        ) : (
          filteredLogs.map((l) => {
            const dateObj = new Date(l.timestamp);
            const timeFormatted = `${dateObj.toLocaleDateString('th-TH')} ${dateObj.toLocaleTimeString('th-TH')}`;
            return (
              <div key={l.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-medium text-slate-500">{timeFormatted}</span>
                  {getLevelBadge(l.level)}
                </div>
                <h4 className="text-xs font-bold text-slate-900">{l.title}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">{l.details}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Audit Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="p-3">เวลา (Timestamp)</th>
              <th className="p-3">ประเภท</th>
              <th className="p-3">เหตุการณ์ (Event Title)</th>
              <th className="p-3">รายละเอียดกิจกรรม (Log Details)</th>
              <th className="p-3">ระดับความสำคัญ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  ไม่พบประวัติบันทึกกิจกรรมความปลอดภัย
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => {
                const dateObj = new Date(l.timestamp);
                const timeFormatted = `${dateObj.toLocaleDateString('th-TH')} ${dateObj.toLocaleTimeString('th-TH')}`;
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {timeFormatted}
                    </td>
                    <td className="p-3 font-bold text-slate-700">{l.type}</td>
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{l.title}</td>
                    <td className="p-3 text-slate-600">{l.details}</td>
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
