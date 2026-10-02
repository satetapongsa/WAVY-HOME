import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// System state
let systemMode = 'AWAY'; // 'AWAY' (ไม่อยู่บ้าน), 'HOME' (อยู่บ้าน)
let doorOpenCount = 0;   // นับจำนวนครั้งการเปิดประตู/วัตถุผ่าน

const sensorState = [
  { id: 1, name: 'Sensor 1 (นอกประตู)', active: false, lastTriggered: null },
  { id: 2, name: 'Sensor 2 (ขอบประตูนอก)', active: false, lastTriggered: null },
  { id: 3, name: 'Sensor 3 (ธรณีประตู)', active: false, lastTriggered: null },
  { id: 4, name: 'Sensor 4 (ขอบประตูใน)', active: false, lastTriggered: null },
  { id: 5, name: 'Sensor 5 (ในห้อง)', active: false, lastTriggered: null }
];

let eventLogs = [
  {
    id: 'init-1',
    timestamp: new Date().toISOString(),
    type: 'SYSTEM',
    title: 'เริ่มระบบตรวจจับประตู 5 เซนเซอร์',
    details: 'เซนเซอร์พร้อมตรวจจับการเปิดประตู/วัตถุผ่านเข้า-ออก',
    level: 'info'
  }
];

const server = createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const jsonStr = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonStr);
    }
  });
}

function recordLog(type, title, details, level = 'info', sensorId = null) {
  const logItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    type,
    title,
    details,
    level,
    sensorId
  };
  eventLogs.unshift(logItem);
  if (eventLogs.length > 200) eventLogs.pop();

  broadcast({ type: 'NEW_LOG', log: logItem });
  return logItem;
}

app.get('/api/status', (req, res) => {
  res.json({
    mode: systemMode,
    doorOpenCount,
    sensors: sensorState,
    totalLogs: eventLogs.length
  });
});

app.get('/api/logs', (req, res) => {
  res.json(eventLogs);
});

app.post('/api/mode', (req, res) => {
  const { mode } = req.body;
  if (mode) systemMode = mode;

  recordLog(
    'SYSTEM_MODE',
    `เปลี่ยนโหมดเป็น: ${systemMode === 'AWAY' ? 'ไม่อยู่บ้าน (เฝ้าระวัง)' : 'อยู่บ้าน (ปกติ)'}`,
    `สถานะระบบพร้อมใช้งาน`,
    'info'
  );

  broadcast({
    type: 'MODE_CHANGE',
    mode: systemMode
  });

  res.json({ success: true, mode: systemMode });
});

app.post('/api/clear-logs', (req, res) => {
  eventLogs = [];
  doorOpenCount = 0;
  recordLog('SYSTEM', 'ล้างประวัติกิจกรรมเรียบร้อย', 'ประวัติการตรวจจับถูกรีเซ็ต', 'info');
  res.json({ success: true, doorOpenCount });
});

app.post('/api/sensor-event', (req, res) => {
  const { type, sensor_id, sensor_name, state } = req.body;

  if ((type === 'sensor_state' || !type) && sensor_id >= 1 && sensor_id <= 5) {
    const sIndex = sensor_id - 1;
    const isTriggered = Number(state) === 1;

    sensorState[sIndex].active = isTriggered;

    if (isTriggered) {
      sensorState[sIndex].lastTriggered = new Date().toISOString();
      doorOpenCount++;

      let locationText = 'บริเวณประตู';
      if (sensor_id === 1 || sensor_id === 2) locationText = 'ด้านนอกประตู (กำลังจะเข้า)';
      else if (sensor_id === 3) locationText = 'ตรงธรณีประตู (เปิดประตู)';
      else if (sensor_id === 4 || sensor_id === 5) locationText = 'ด้านในห้อง (เข้าห้องแล้ว)';

      const level = systemMode === 'AWAY' ? 'danger' : 'success';
      const title = `ตรวจพบการเปิดประตู/วัตถุผ่าน (${sensor_name || sensorState[sIndex].name})`;
      const details = systemMode === 'AWAY'
        ? `แจ้งเตือน! มีวัตถุเคลื่อนที่ผ่าน ${locationText} ขณะไม่อยู่บ้าน (รวมเปิดประตูทั้งหมด ${doorOpenCount} ครั้ง)`
        : `มีการผ่านเข้า-ออกที่ ${locationText} (รวมเปิดประตูทั้งหมด ${doorOpenCount} ครั้ง)`;

      recordLog('PASSAGE', title, details, level, sensor_id);
    }

    broadcast({
      type: 'SENSOR_UPDATE',
      sensors: sensorState,
      doorOpenCount,
      triggeredSensorId: isTriggered ? sensor_id : null
    });
  } else if (type === 'passage_detected') {
    doorOpenCount++;
    const dirText = req.body.direction === 'ENTRY' ? 'ผ่านเข้าห้อง (ENTRY)' : 'ผ่านออกจากห้อง (EXIT)';
    const level = systemMode === 'AWAY' ? 'danger' : 'success';
    
    recordLog(
      'PASSAGE',
      `ตรวจพบคน${dirText}`,
      `มีวัตถุ/คนผ่านประตู: ${dirText} (รวมเปิดประตูทั้งหมด ${doorOpenCount} ครั้ง)`,
      level
    );

    broadcast({
      type: 'PASSAGE_ALERT',
      doorOpenCount,
      message: `ตรวจพบคน${dirText}`
    });
  }

  res.json({ status: 'ok', doorOpenCount });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    mode: systemMode,
    doorOpenCount,
    sensors: sensorState,
    logs: eventLogs.slice(0, 50)
  }));
});

server.listen(PORT, () => {
  console.log(`[Door Security Server] running on http://localhost:${PORT}`);
});
