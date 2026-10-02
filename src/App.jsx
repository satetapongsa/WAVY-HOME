import React, { useState, useEffect, useRef } from 'react';
import SensorDoorVisualizer from './components/SensorDoorVisualizer';
import LogsTable from './components/LogsTable';
import SecurityControls from './components/SecurityControls';
import PassageStats from './components/PassageStats';
import { Waves, Bell, WifiOff, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [sensors, setSensors] = useState([
    { id: 1, name: 'Sensor Head OUT 1', active: false },
    { id: 2, name: 'Sensor Head OUT 2', active: false },
    { id: 3, name: 'Sensor Head OUT 3', active: false },
    { id: 4, name: 'Sensor Head OUT 4', active: false },
    { id: 5, name: 'Sensor Head OUT 5', active: false }
  ]);
  const [systemMode, setSystemMode] = useState('AWAY');
  const [doorOpenCount, setDoorOpenCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [bannerAlert, setBannerAlert] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('th-TH'));

  const wsRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('th-TH'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatusAndLogs = async () => {
    try {
      const [resStatus, resLogs] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/logs')
      ]);

      if (resStatus.ok) {
        const dataStatus = await resStatus.json();
        setIsConnected(true);
        if (dataStatus.mode) setSystemMode(dataStatus.mode);
        if (typeof dataStatus.doorOpenCount === 'number') setDoorOpenCount(dataStatus.doorOpenCount);
        if (dataStatus.sensors) setSensors(dataStatus.sensors);
      }

      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setLogs(dataLogs);
      }
    } catch (e) {
      console.warn('Polling error:', e);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();
    const pollInterval = setInterval(fetchStatusAndLogs, 1500);

    const connectWS = () => {
      try {
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
      } catch (e) {}
    };

    connectWS();

    return () => {
      clearInterval(pollInterval);
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
      fetchStatusAndLogs();
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
      fetchStatusAndLogs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-8">
      {/* WAVY Home Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-extrabold tracking-tight text-slate-900">
                  WAVY Home
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                  ESP32 Security
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                ระบบเฝ้าระวังและตรวจจับการเปิด-ปิดประตูห้อง
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

      {/* Main Single Page Dashboard */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {/* Banner Alert Toast */}
        {bannerAlert && (
          <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs md:text-sm text-rose-950">แจ้งเตือนกิจกรรมเปิด-ปิดประตูห้อง</h4>
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

        {/* 1. Key Performance Indicators (Stats Cards) */}
        <PassageStats 
          logs={logs} 
          doorOpenCount={doorOpenCount} 
          systemMode={systemMode} 
        />

        {/* 2. Security Armed Mode Control Panel */}
        <SecurityControls 
          systemMode={systemMode}
          onToggleMode={handleToggleMode}
        />

        {/* 3. Live 5-Sensor Head Map Status */}
        <SensorDoorVisualizer 
          sensors={sensors}
          systemMode={systemMode}
        />

        {/* 4. Real-time Security Audit Trail Log Table */}
        <LogsTable 
          logs={logs} 
          onClearLogs={handleClearLogs} 
        />
      </main>
    </div>
  );
}
