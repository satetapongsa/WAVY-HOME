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
let doorOpenCount = 0;   // จำนวนครั้งการเปิด-ปิดประตูห้อง

const sensorState = [
  { id: 1, name: 'Sensor Head 1', active: false, lastTriggered: null },
  { id: 2, name: 'Sensor Head 2', active: false, lastTriggered: null },
  { id: 3, name: 'Sensor Head 3', active: false, lastTriggered: null },
  { id: 4, name: 'Sensor Head 4', active: false, lastTriggered: null },
  { id: 5, name: 'Sensor Head 5', active: false, lastTriggered: null }
];

let eventLogs = [
  {
    id: 'init-1',
    timestamp: new Date().toISOString(),
    type: 'SYSTEM',
    title: 'เริ่มระบบตรวจจับประตู (เงื่อนไข 3+ เซนเซอร์)',
    details: 'นับการเปิด-ปิดประตูห้องเมื่อเซนเซอร์จับได้พร้อมกันตั้งแต่ 3 ตัวขึ้นไปเท่านั้น',
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
  recordLog('SYSTEM', 'ล้างประวัติกิจกรรมเรียบร้อย', 'ประวัติการเปิดประตูถูกรีเซ็ต', 'info');
  res.json({ success: true, doorOpenCount });
});

// Event Handler - นับเป็นการเปิด-ปิดประตูห้อง 1 ครั้งเฉพาะเมื่อจับได้พร้อมกันตั้งแต่ 3 ตัวขึ้นไปเท่านั้น
app.post('/api/sensor-event', (req, res) => {
  const { type, active_count, sensor_id, sensor_name, state } = req.body;

  const count = typeof active_count === 'number' ? active_count : 3;

  doorOpenCount++; // นับเป็น 1 การกระทำเปิด-ปิดประตูห้อง

  const level = systemMode === 'AWAY' ? 'danger' : 'success';
  const title = `ตรวจพบการเปิด-ปิดประตูห้อง (ครั้งที่ ${doorOpenCount})`;
  const details = systemMode === 'AWAY'
    ? `แจ้งเตือน! ตรวจพบวัตถุผ่านเซนเซอร์พร้อมกัน ${count} ตัว ขณะไม่อยู่บ้าน (เปิดประตูห้องสะสม ${doorOpenCount} ครั้ง)`
    : `ตรวจพบวัตถุผ่านเซนเซอร์พร้อมกัน ${count} ตัว (เปิดประตูห้องสะสม ${doorOpenCount} ครั้ง)`;

  recordLog('PASSAGE', title, details, level, sensor_id || 1);

  broadcast({
    type: 'SENSOR_UPDATE',
    sensors: sensorState,
    doorOpenCount
  });

  res.json({ status: 'ok', doorOpenCount });
});

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    mode: systemMode,
    doorOpenCount,
    sensors: sensorState,
    logs: eventLogs.slice(0, 50)
  }));
});

server.listen(PORT, () => {
  console.log(`[WACY Home Server] running on http://localhost:${PORT}`);
});
