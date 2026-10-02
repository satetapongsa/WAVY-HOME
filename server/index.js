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
    title: 'เริ่มระบบตรวจจับชุดเซนเซอร์ 5 หัว',
    details: 'ระบบพร้อมตรวจจับการผ่านเข้า-ออก/เปิดห้องทันทีที่เซนเซอร์หัวใดหัวหนึ่งตรวจจับได้',
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

// Event Handler - เซนเซอร์หัวใดหัวหนึ่งจับได้ ก็นับเป็นเปิดห้อง/ผ่าน 1 ครั้งทันทีพร้อมบันทึกเวลา
app.post('/api/sensor-event', (req, res) => {
  const { type, sensor_id, sensor_name, state } = req.body;

  if ((type === 'sensor_state' || !type) && sensor_id >= 1 && sensor_id <= 5) {
    const sIndex = sensor_id - 1;
    const isTriggered = Number(state) === 1;

    sensorState[sIndex].active = isTriggered;

    if (isTriggered) {
      sensorState[sIndex].lastTriggered = new Date().toISOString();
      doorOpenCount++; // เพิ่มจำนวนนับการเปิดห้อง/ผ่าน 1 ครั้ง

      const level = systemMode === 'AWAY' ? 'danger' : 'success';
      const title = `ตรวจพบการเปิดห้อง/ผ่านประตู (${sensor_name || sensorState[sIndex].name})`;
      const details = systemMode === 'AWAY'
        ? `แจ้งเตือน! ตรวจพบวัตถุ/คนผ่านที่ ${sensor_name || sensorState[sIndex].name} ขณะไม่อยู่บ้าน (เปิดห้องสะสม ${doorOpenCount} ครั้ง)`
        : `ตรวจพบวัตถุ/คนผ่านที่ ${sensor_name || sensorState[sIndex].name} (เปิดห้องสะสม ${doorOpenCount} ครั้ง)`;

      recordLog('PASSAGE', title, details, level, sensor_id);
    }

    broadcast({
      type: 'SENSOR_UPDATE',
      sensors: sensorState,
      doorOpenCount,
      triggeredSensorId: isTriggered ? sensor_id : null
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
  console.log(`[WACY Security Server] running on http://localhost:${PORT}`);
});
