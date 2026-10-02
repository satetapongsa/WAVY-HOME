import React, { useState, useEffect, useRef } from 'react';
import SensorDoorVisualizer from './components/SensorDoorVisualizer';
import LogsTable from './components/LogsTable';
import SecurityControls from './components/SecurityControls';
import PassageStats from './components/PassageStats';
import { ShieldCheck, Bell, Wifi, WifiOff, LayoutDashboard, Radio, History, Sliders, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [sensors, setSensors] = useState([
    { id: 1, name: 'Sensor Head 1', active: false },
    { id: 2, name: 'Sensor Head 2', active: false },
    { id: 3, name: 'Sensor Head 3', active: false },
    { id: 4, name: 'Sensor Head 4', active: false },
    { id: 5, name: 'Sensor Head 5', active: false }
  ]);
  const [systemMode, setSystemMode] = useState('AWAY');
  const [doorOpenCount, setDoorOpenCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [bannerAlert, setBannerAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('th-TH'));

  const wsRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('th-TH'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const connectWS = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname || 'localhost';
      const wsUrl = `${wsProtocol}//${wsHost}:5000`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'INIT_STATE') {
            setSystemMode(data.mode);
            if (typeof data.doorOpenCount === 'number') setDoorOpenCount(data.doorOpenCount);
            if (data.sensors) setSensors(data.sensors);
            if (data.logs) setLogs(data.logs);
          } else if (data.type === 'SENSOR_UPDATE') {
            setSensors(data.sensors);
            if (typeof data.doorOpenCount === 'number') setDoorOpenCount(data.doorOpenCount);
          } else if (data.type === 'NEW_LOG') {
            setLogs(prev => [data.log, ...prev.slice(0, 199)]);
            if (data.log.level === 'danger' || (data.log.level === 'warning' && systemMode === 'AWAY')) {
              setBannerAlert(data.log.details);
              setTimeout(() => setBannerAlert(null), 5000);
            }
          } else if (data.type === 'MODE_CHANGE') {
            setSystemMode(data.mode);
          }
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [systemMode]);

  const handleToggleMode = async (mode) => {
    try {
      await fetch('/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      setSystemMode(mode);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/clear-logs', { method: 'POST' });
      const data = await res.json();
      setLogs([]);
      setDoorOpenCount(data.doorOpenCount || 0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-8">
      {/* WACY Security Access Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-extrabold tracking-tight text-slate-900">
                  WACY Security Access
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                  ESP32 IoT v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                ระบบเฝ้าระวังประตู 5 เซนเซอร์ระดับองค์กร
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-mono font-bold text-slate-800">{currentTime}</span>
              <span className="text-[10px] text-slate-400">Live Gateway Time</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}>
              {isConnected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600" />}
              <span>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {/* Banner Alert Toast */}
        {bannerAlert && (
          <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs md:text-sm text-rose-950">แจ้งเตือนกิจกรรมผ่านประตู</h4>
                <p className="text-xs text-rose-800">{bannerAlert}</p>
              </div>
            </div>
            <button 
              onClick={() => setBannerAlert(null)}
              className="text-xs bg-white hover:bg-rose-100 px-3 py-1 rounded-xl text-rose-800 border border-rose-300 font-medium shrink-0"
            >
              รับทราบ
            </button>
          </div>
        )}

        {/* Desktop Tab Navigation Bar */}
        <div className="hidden md:flex items-center gap-1 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 max-w-fit">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'DASHBOARD'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            ภาพรวมแดชบอร์ด
          </button>

          <button
            onClick={() => setActiveTab('SENSORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'SENSORS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            ผังเซนเซอร์ 5 จุด
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'LOGS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            ประวัติความปลอดภัย
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'SETTINGS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            โหมดเฝ้าระวัง
          </button>
        </div>

        {/* Tab Selection Content */}
        <div className="space-y-4">
          {(activeTab === 'DASHBOARD' || activeTab === 'ALL') && (
            <>
              <PassageStats logs={logs} doorOpenCount={doorOpenCount} systemMode={systemMode} />
              <SecurityControls 
                systemMode={systemMode}
                onToggleMode={handleToggleMode}
              />
              <SensorDoorVisualizer 
                sensors={sensors}
                systemMode={systemMode}
              />
              <LogsTable logs={logs} onClearLogs={handleClearLogs} />
            </>
          )}

          {activeTab === 'SENSORS' && (
            <SensorDoorVisualizer 
              sensors={sensors}
              systemMode={systemMode}
            />
          )}

          {activeTab === 'LOGS' && (
            <LogsTable logs={logs} onClearLogs={handleClearLogs} />
          )}

          {activeTab === 'SETTINGS' && (
            <SecurityControls 
              systemMode={systemMode}
              onToggleMode={handleToggleMode}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 enterprise-nav-dock px-3 py-2 md:hidden">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto text-center">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'DASHBOARD'
                ? 'text-slate-900 bg-slate-100 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">แดชบอร์ด</span>
          </button>

          <button
            onClick={() => setActiveTab('SENSORS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'SENSORS'
                ? 'text-slate-900 bg-slate-100 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">ผังเซนเซอร์</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'LOGS'
                ? 'text-slate-900 bg-slate-100 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">ประวัติ</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'SETTINGS'
                ? 'text-slate-900 bg-slate-100 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">เฝ้าระวัง</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
