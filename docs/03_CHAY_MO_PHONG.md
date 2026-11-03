# Chạy demo và chuyển sang thiết bị thật

**Đích cuối là demo thiết bị thật.** Các mục 1–6 hướng dẫn chạy bản **03_IOT_INTEGRATION**, bản Wokwi minh họa web/backend cho nhóm; mục 7 nêu thứ tự chuyển tiếp. Các lệnh dành cho người vận hành khi chủ động chạy thử; lượt biên tập tài liệu ngày 03/11/2026 không thực hiện chúng. Kết quả mong đợi không phải kết quả đã quan sát mới. Xem [phạm vi](01_TONG_QUAN.md), [cấu hình kỹ thuật](02_KIEN_TRUC.md) và [bằng chứng cũ](04_KIEM_THU.md).

## 1. Chuẩn bị và đúng thư mục

Cần Node.js hỗ trợ **từ 22.12.0** theo `package.json`, npm, trình duyệt, VS Code hoặc trình soạn thảo và kết nối mạng cho broker thử nghiệm. Không cài Arduino CLI/PlatformIO chỉ vì dùng Wokwi trình duyệt; workspace chưa khóa toolchain ESP32 cục bộ.

Từ workspace root, PowerShell:

```powershell
Set-Location '.\ResonanceGuard_03_IOT_INTEGRATION'
Test-Path .\package.json
node -v
npm.cmd -v
```

`Test-Path` phải trả True. Project hiện đã rút gọn còn một cấp; đường dẫn hai cấp trong hồ sơ archive là cấu trúc cũ. Mỗi terminal chạy lệnh npm bên dưới cần ở thư mục này. Dùng `npm.cmd` để tránh lỗi PowerShell chặn `npm.ps1`; không cần đổi chính sách toàn máy. Không dùng thư mục `review-backup-*` làm nguồn chạy hiện tại.

## 2. Cài dependency và đồng bộ cấu hình

Khi cài mới hoặc cần khôi phục dependency theo lockfile:

```powershell
npm.cmd ci
npm.cmd run setup
```

`setup.mjs` tạo `.env` khi chưa có và sinh `firmware/config.h`. Nếu `.env` đã có/hợp lệ, nó giữ nội dung file và chỉ cập nhật config.h. Khi cấu hình không được hỗ trợ, setup báo lỗi và không ghi đè config.h. Setup chỉ hỗ trợ URL `mqtt://` không tài khoản, TLS hoặc path; cổng mặc định 1883. Đây là cấu hình mô phỏng, không phải cấu hình triển khai motor vật lý. `setup.mjs:8–31`.

| Tên cấu hình backend | Vai trò/đối ứng firmware |
|---|---|
| `MQTT_URL` | URL broker; sinh `BROKER` và `BROKER_PORT` |
| `MQTT_PREFIX` | Namespace topic; sinh `PREFIX` |
| `PORT` | Cổng backend, mặc định 3000 |
| `DATA_DIR` | Thư mục JSONL, mặc định `data` |

Không chép `.env` lên Wokwi; chỉ chép config.h do setup sinh khi cần đồng bộ. Không dùng config.h trong backup. Đổi cấu hình backend mà chưa cập nhật firmware có thể làm hai phía khác broker/topic. Không công bố nội dung `.env`, config.h, credentials hoặc namespace riêng trong ảnh/log gửi nhóm. Topic ngẫu nhiên tránh trùng, không phải cơ chế xác thực. Bản demo chưa phân quyền giữa nhiều người/tab: buổi thử đầu chỉ một backend, một ESP mô phỏng và một tab điều khiển.

Firmware kết nối mạng Wi-Fi mô phỏng rồi tới broker; backend kết nối broker độc lập. Không cần ESP truy cập localhost của backend. Loại gateway đang dùng cần kiểm tra trong chính phiên Wokwi; repo chưa có cấu hình gateway riêng để xác nhận. Nếu chọn broker local/LAN, cần kiểm chứng đường truy cập từ Wokwi, không chỉ sửa địa chỉ hoặc dùng kết quả probe Node làm bằng chứng gateway.

## 3. Dựng hoặc cập nhật project Wokwi

Chưa tìm thấy link project Wokwi đã lưu trong tài liệu workspace. Có thể [tạo project ESP32 mới](https://wokwi.com/projects/new/esp32); đây là link tạo mới, không phải link demo của nhóm.

1. Thay `sketch.ino` và thêm `config.h`, `motor_control.h`, `rpm_reader.h`, `mqtt_support.h` từ thư mục `firmware/` của bản 03.
2. Tạo Custom Chip tên **rg-motor**, ngôn ngữ C; thay cả source C và JSON bằng file cùng tên trong firmware.
3. Thay `diagram.json` sau khi chip tồn tại. Giữ đúng board DevKit v1 với tên chân `D21`, `D22`…
4. Thay `libraries.txt` bằng bản đã khóa ArduinoMqttClient 0.1.8 và ArduinoJson 7.4.2.

Project hiện cần **chín file**, khác sáu/tám file trong hướng dẫn lịch sử:

| File | Vai trò |
|---|---|
| `sketch.ino` | Firmware ESP32 |
| `config.h` | Cấu hình riêng do setup sinh |
| `motor_control.h` | Logic command/STOP/lease/dedup |
| `rpm_reader.h` | Chu kỳ TACH, PPR và timeout |
| `mqtt_support.h` | Đọc MQTT có giới hạn/thoát khi lỗi, hash namespace |
| `diagram.json` | Linh kiện và kết nối |
| `libraries.txt` | Thư viện và phiên bản |
| `rg-motor.chip.c` | Mô hình motor/TACH |
| `rg-motor.chip.json` | Định nghĩa custom chip |

Nếu đang dùng project trước bản vá ACK ngày 27/10 và các file khác vẫn khớp: thay `sketch.ino`, `motor_control.h`, thêm `mqtt_support.h`; không cần đổi cấu hình để áp dụng bản vá. Nếu không chắc phiên bản, đối chiếu đủ chín file, không đoán theo tên project. Firmware có nhánh LEDC cho core 2.x/3.x; chưa có kết quả compile Wokwi hiện tại để gọi là đã tương thích thực nghiệm.

START xanh/biến trở trong sơ đồ không điều khiển chương trình hiện tại; START/duty từ web. STOP đỏ GPIO19 vẫn được code đọc. RUN xanh là trạng thái logic, LED vàng biểu diễn PWM; motor không phải driver TB6612 điện học.

## 4. Chạy backend và website

Terminal thứ nhất, tại thư mục có package.json:

```powershell
npm.cmd run dev
```

Terminal thứ hai, cùng thư mục:

```powershell
npm.cmd run web
```

Mở [Dashboard dev](http://localhost:5173). Backend mặc định nghe 127.0.0.1:3000; Vite proxy `/api` và `/ws`. Sau đó chủ động Start Simulation trong Wokwi. Log mong đợi: BOOT/outputs OFF, IMU configuration OK, MQTT CONNECT/SUBACK thành công; backend có `MQTT_SUBACK ready=true`. Đây là tiêu chí cần quan sát, không phải log mới đã thu.

Cách dùng bản build thay Vite:

```powershell
npm.cmd run build
npm.cmd run dev
```

Mở [Dashboard build](http://localhost:3000), không cần chạy Vite trong cách này. Khi cập nhật mã backend, dừng đúng terminal Node của mình rồi khởi động lại; reload web không nạp lại module Node. Sau cập nhật frontend build, reload cứng trình duyệt. Không tự dừng tiến trình khác để chiếm cổng.

Trước START, kiểm WebSocket/broker/subscription, state mới và boot ID. MPU mặc định có thể gần 0/0/9,81 m/s². RPM chưa có hai cạnh hợp lệ hiện `—`; đó là thiếu số đo hợp lệ, không phải đo được 0 RPM.

<a id="minh-chung"></a>
## 5. Ba bộ minh chứng cho demo/báo cáo

### A. Gia tốc

Giữ motor OFF, đổi gia tốc X/Y/Z của MPU6050 trong Wokwi. Quan sát số và đồ thị web; xuất CSV và giữ JSONL chứa `source`, `quality`, boot/seq, thời gian thiết bị và thời gian nhận server. Đối chiếu giá trị đầu vào mô phỏng với m/s² trên web. Trọng lực không phải rung; thay MPU thủ công chỉ kiểm đường đọc/truyền/hiển thị.

### B. Command, ACK và RPM

1. Đặt PWM 30%, START; lưu full command ID. Phân biệt HTTP 202, ACK ứng dụng accepted và state/RPM.
2. Giữ chạy qua ít nhất 12 renew liên tiếp, đối chiếu ID/ACK; đổi 60% và áp dụng PWM, theo dõi RPM từ TACH.
3. STOP web; ghi `reason=command_stop`, RUN/PWM OFF/0 và RPM còn lại khi rotor ảo giảm tốc.
4. START mới, giữ STOP đỏ riêng; ghi `local_stop`, START bị từ chối khi giữ; thả nút không tự chạy lại.

Các bước trên là **kịch bản cần thử**, chưa được đánh dấu đạt. PWM áp dụng có lượng tử 8 bit; motor có vùng chết khoảng 6%, giới hạn mô hình 1800 RPM ở duty100%, trong khi UI chỉ cho 80%. Không đòi RPM bằng duty nhân một hằng số. Sau mất xung 2 giây, RPM chuyển null/`—`; tốc độ rất thấp khoảng 30 RPM trở xuống không được xác nhận bởi cấu hình timeout/PPR này.

### C. Lease, kết nối và reset

START rồi đóng tab điều khiển, giữ Wokwi/backend chạy. Ghi renew cuối, `lease_until_device_ms`, mốc OUTPUT OFF và `reason=lease_expired` theo **đồng hồ ESP mô phỏng**. Mở lại web phải vẫn OFF và cần START mới. Thử riêng mất WebSocket, tắt backend, mất Wi-Fi/MQTT rồi phục hồi/reset; thu lý do OFF, boot và stale, không coi reload đơn thuần là đã thử mất mạng.

Lease là 4 giây theo ESP kể từ command hợp lệ, không từ lúc LED RUN sáng. Stale/HTTP/ACK timeout theo máy là đồng hồ khác. Serial có thể in muộn; dùng timestamp OUTPUT, không chỉ thời điểm dòng xuất hiện. Mô phỏng chậm/tạm dừng có thể làm hai thang thời gian lệch lớn.

## 6. Khi gặp lỗi

| Hiện tượng | Kiểm tra |
|---|---|
| ENOENT package.json | Đi vào `ResonanceGuard_03_IOT_INTEGRATION/`, đúng thư mục có package.json |
| Thiếu module / cấu hình | Cài theo lockfile; chạy setup khi cần tạo/đồng bộ cấu hình, không ghi đè tùy tiện cấu hình của người khác |
| Cổng đang dùng | Dừng đúng tiến trình dev của mình; smoke cần 3000/5173 trống |
| Web có broker nhưng ESP stale | Kiểm Serial CONNECT/SUBACK, boot và cấu hình hai phía; broker connected không đồng nghĩa có dữ liệu mới |
| IMU FAILED/null | Đối chiếu diagram D21/D22, thanh ghi cấu hình và quality; không thay null bằng 0 |
| Unknown part chip-rg-motor | Tạo chip trước diagram, chép đủ C/JSON |
| ArduinoJson/LEDC lỗi compile | Kiểm libraries.txt và lưu toàn bộ compile log/core version; không chỉ chụp dòng cuối |
| START expired | Đối chiếu state mới, deadline và hai đồng hồ; không bỏ kiểm boot/deadline để giữ RUN |
| ACK nhưng chưa có RPM | Cần hai cạnh, duty trên vùng chết, TACH→D26; ACK chưa chứng minh quay |
| Gia tốc phẳng khi motor chạy | Motor và MPU chưa có liên kết cơ học trong mô hình |
| ACK timeout/reconnect | Thu trace theo một full ID bằng hướng dẫn [chẩn đoán ACK](04_KIEM_THU.md#chan-doan-ack) |

Các lệnh tự kiểm đã có: `npm.cmd test`, `npm.cmd run build`, `npm.cmd run smoke:local`, `npm.cmd run probe:public`. Probe gửi dữ liệu diagnostic tới broker bên ngoài; chỉ chạy khi chủ động kiểm mạng, không coi đó là thử ESP/Wokwi. Smoke dùng peer synthetic và cổng loopback, không kiểm browser click hoặc firmware. Lượt dọn tài liệu này không chạy các lệnh đó.

Nguồn tra cứu từng được dùng trong hướng dẫn gốc: [Wokwi Wi-Fi/gateway](https://docs.wokwi.com/guides/esp32-wifi), [custom chip](https://docs.wokwi.com/chips-api/getting-started), [GPIO chip API](https://docs.wokwi.com/chips-api/gpio), [timer API](https://docs.wokwi.com/chips-api/time), [thư viện](https://docs.wokwi.com/guides/libraries), [MPU6050](https://docs.wokwi.com/parts/wokwi-mpu6050), [board DevKit v1](https://github.com/wokwi/wokwi-elements/blob/main/src/esp32-devkit-v1-element.ts), [LEDC](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html), [ArduinoMqttClient 0.1.8](https://github.com/arduino-libraries/ArduinoMqttClient/blob/0.1.8/src/MqttClient.cpp), [MQTT.js](https://github.com/mqttjs/MQTT.js), [broker HiveMQ thử nghiệm](https://www.hivemq.com/mqtt/public-mqtt-broker/), [broker Mosquitto thử nghiệm](https://test.mosquitto.org/). Đây là danh mục nguồn, không phải xác nhận dịch vụ còn truy cập được trong lượt này.

<a id="thiet-bi-that"></a>
## 7. Chuyển sang demo thiết bị thật

Giữ website/backend làm nền, thay phía Wokwi bằng thiết bị thật theo từng mốc. Chưa có hướng dẫn nạp/chạy motor thật đã được nghiệm thu trong repo này; `firmware/sketch.ino:12` vẫn ghi chỉ dùng mô phỏng.

| Mốc | Công việc | Bằng chứng cần đạt |
|---|---|---|
| 1. Bộ đo tối thiểu | Kiểm kê ESP32, MPU6050, cáp/dây, thanh và ngàm; xác minh biến thể module và nguồn logic | Đọc được dữ liệu cảm biến thật, đúng đơn vị/nguồn |
| 2. Đường mẫu và rung tự do | Xây sampler có thời gian/sequence, thu raw và kéo–thả nhỏ trong cấu hình lặp lại | Biết nhịp lấy mẫu, chất lượng và vùng tần số dao động; chưa gọi là cộng hưởng |
| 3. Cơ khí và công suất | Chốt motor/Hall/driver/nguồn theo dải cần khảo sát, gá/che, truyền lực, STOP và bảng chân | Sơ đồ/linh kiện cụ thể và các phép kiểm phần cứng; CAD cập nhật theo chúng |
| 4. Tích hợp web/backend | Đồng bộ hợp đồng MQTT, nguồn dữ liệu và cấu hình; kiểm ba luồng MPU→Web, Hall/RPM→Web, Web→motor | Log thiết bị thật, command/ACK/state/RPM và thử dừng/phục hồi |
| 5. Phân tích/cảnh báo | Đo lại cấu hình đã gắn motor/gá, xây phân tích và thử đáp ứng qua nhiều nấc | Kết quả có phiên/cấu hình/quality, điều kiện cảnh báo và dữ liệu đối chiếu |

Khi dùng thiết bị thật, không còn gateway Wokwi trong kiến trúc; broker phải truy cập được từ ESP32 và backend. Cấu hình broker/thông tin đăng nhập, bảng chân công suất và nhãn nguồn phải được xử lý đồng bộ, không chỉ thay dòng chữ trên UI. Web hiện chưa có FFT/cảnh báo cộng hưởng nên tái sử dụng giao diện không đồng nghĩa mục tiêu đó đã hoàn thành.

Wokwi có thể giữ để minh họa hoặc kiểm tra hồi quy giao tiếp; không bắt buộc chạy lại Wokwi trước mọi bước phần cứng. Gói CAD/báo cáo local không phát hành cùng repo; tài liệu chính ghi các giới hạn để người đọc GitHub không hiểu rằng linh kiện đã được mua hoặc thiết bị đã chế tạo.
