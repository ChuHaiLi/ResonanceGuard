# ResonanceGuard 03_IOT_INTEGRATION

Đây là đúng thư mục chạy npm: có `package.json`, `firmware/`, `server/`, `web/`, `tests/`, `setup.mjs`.

Đọc [hướng dẫn đầy đủ ở workspace](../../README_HUONG_DAN.md), [điều tra MQTT/ACK mới nhất](docs/MQTT_ACK_INVESTIGATION.md) và [biên bản lượt đầu](docs/VALIDATION.md).

Dependencies đã cài theo lockfile. Nếu cài lại từ đầu, chạy `npm.cmd ci` trước. PowerShell tại thư mục này:

```powershell
npm.cmd run setup
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Mở http://localhost:3000 để dùng React đã build. Hoặc mở terminal thứ hai tại cùng thư mục, chạy `npm.cmd run web`, mở http://localhost:5173.

Kiểm tra mạng phần mềm riêng: `npm.cmd run smoke:local` (cần cổng 3000/5173 trống) và `npm.cmd run probe:public`.

Chỉ dữ liệu `source: synthetic`. MPU6050 chưa liên kết cơ học với motor. Các điểm gửi khoảng 250 ms không phải bộ mẫu để phân tích dao động. Người dùng đã có RPM từ Wokwi, nhưng ACK chưa ổn định. Bản vá mới đạt 13/13 test/build và cần chạy lại Wokwi: thay `sketch.ino`, `motor_control.h`, thêm `mqtt_support.h`, restart backend/reload cứng web. Không đổi config hoặc timeout. Không dùng broker công cộng để điều khiển motor vật lý.
