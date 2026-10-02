# 🚪 ระบบตรวจจับการเปิด-ปิดประตูและเฝ้าระวังด้วย Arduino 5 เซนเซอร์ & React Web Dashboard

ระบบตรวจจับการเคลื่อนไหวและการผ่านเข้า-ออกจากประตูด้วยเซนเซอร์ 5 ตัว (IR Obstacle / PIR sensors) เชื่อมต่อกับบอร์ด Arduino และส่งข้อมูลแบบ Real-time เข้าสู่ React Web Application Dashboard

---

## 📌 1. การต่อสายเซนเซอร์ 5 ตัวกับบอร์ด Arduino (Pin Mapping)

| เซนเซอร์ | ตำแหน่งการวาง | Arduino Pin | หมายเหตุ |
| :--- | :--- | :--- | :--- |
| **Sensor 1** | นอกประตู (Outside Door) | **D2** | ตรวจจับคนที่เดินเข้าหาประตู |
| **Sensor 2** | ขอบประตูด้านนอก (Outer Frame) | **D3** | ตรวจจับการผ่านขอบประตูนอก |
| **Sensor 3** | ธรณีประตู / บานประตู (Threshold) | **D4** | ตรวจจับการเปิดประตู / ตัวคนตรงประตู |
| **Sensor 4** | ขอบประตูด้านใน (Inner Frame) | **D5** | ตรวจจับการผ่านขอบประตูใน |
| **Sensor 5** | ในห้อง (Inside Room) | **D6** | ตรวจจับคนที่เดินเข้าถึงในห้อง |

> **หมายเหตุ:** 
> - เซนเซอร์ IR Obstacle โดยทั่วไปส่งสัญญาณ `LOW` เมื่อตรวจพบวัตถุ
> - เซนเซอร์ PIR Motion ส่งสัญญาณ `HIGH` เมื่อตรวจพบวัตถุ
> - สามารถปรับค่า `SENSOR_TRIGGER_STATE` ในไฟล์ [sketch_oct2a.ino](file:///c:/Users/w/Documents/Arduino/sketch_oct2a/sketch_oct2a.ino) ได้

---

## 🚀 2. การสั่งงานระบบ (Web Dashboard & Server)

### 2.1 รันระบบ Express Server & React Dashboard
เปิด Terminal ในโฟลเดอร์นี้และใช้คำสั่ง:

```bash
# รัน Express Backend Server (Port 5000)
npm run server

# ในอีกหน้าจอ Terminal: รัน React Web App Dashboard (Port 3000)
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 📡 3. วิธีส่งข้อมูลจาก Arduino / ESP32 เข้าสู่ Web Dashboard

### วิธีที่ 1: ผ่าน Serial JSON (Arduino UNO/NANO)
บอร์ด Arduino ส่ง JSON ความเร็ว `115200 Baud` ทาง Serial port:
```json
{"type":"sensor_state","sensor_id":1,"sensor_name":"Outside Door","state":1,"uptime_ms":12500}
```

### วิธีที่ 2: ผ่าน HTTP POST (ESP32 / WiFi Shield)
หากใช้ ESP32 หรือ NodeMCU สามารถยิง HTTP POST ไปที่ Web Server ได้โดยตรง:
`POST http://<SERVER_IP>:5000/api/sensor-event`
```json
{
  "type": "sensor_state",
  "sensor_id": 1,
  "sensor_name": "Sensor 1 (นอกประตู)",
  "state": 1
}
```

สำหรับการตรวจจับทิศทาง (ENTRY / EXIT):
```json
{
  "type": "passage_detected",
  "direction": "ENTRY"
}
```

---

## 🛡️ 4. ฟีเจอร์ของ Web Dashboard
1. **Real-time 5-Sensor Map:** แสดงผลสถานะเซนเซอร์ 5 ตัวพร้อมเอฟเฟกต์ไฟกะพริบและเสียงเตือน
2. **Security Mode (ไม่อยู่บ้าน / อยู่บ้าน):** เมื่อเปิดโหมด "ไม่อยู่บ้าน" (AWAY) ระบบจะส่งสัญญาณเตือนภัยฉุกเฉินและบันทึกประวัติทันทีที่มีการเคลื่อนไหว
3. **Direction Detection:** สรุปการเดินเข้าห้อง (ENTRY) หรือเดินออกจากห้อง (EXIT) พร้อมประทับตราเวลา (Timestamp)
4. **Interactive Simulator:** มีปุ่มทดสอบจำลองเซนเซอร์และการเดินผ่าน เพื่อทดสอบระบบได้โดยไม่ต้องต่อสายจริง
5. **Activity Logs & Export:** ดูประวัติกิจกรรมย้อนหลัง ค้นหาข้อมูล และส่งออกเป็นไฟล์ CSV ได้ทันที
