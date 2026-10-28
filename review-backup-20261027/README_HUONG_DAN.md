# ResonanceGuard — 03_IOT_INTEGRATION

Bộ khởi đầu để học và kiểm tra **ba luồng IoT trên thiết bị Wokwi**, tiếp nối 02_MOTOR_ENCODER. Backend Express và giao diện React chạy thật trên máy; ESP32, MPU6050 và motor/encoder chạy trong Wokwi. Toàn bộ dữ liệu mang `source: synthetic` vì chưa có phép đo ngoài đời.

## 1. Kết quả bạn sẽ xây dựng

| Luồng | Đường đi | Cách thử |
|---|---|---|
| Gia tốc | MPU6050 Wokwi → ESP32 → MQTT → Express → WebSocket → React | Đổi gia tốc trong MPU6050, quan sát web |
| Tốc độ | Motor custom → xung TACH → ESP32 → MQTT → Express → React | Thay PWM trên web, quan sát RPM |
| Điều khiển | React → HTTP POST → Express → MQTT → ESP32 → PWM/EN → motor custom | Bấm START/STOP, xem ACK và RPM riêng |

Broker giống trạm chuyển thư: ESP32 và backend đều kết nối tới broker, không cần hai bên truy cập trực tiếp lẫn nhau. Website chỉ nói chuyện với backend, không tự kết nối broker.

## 2. Phạm vi của bản này

- Đọc MPU6050 qua I2C, đổi g sang m/s².
- Lấy khoảng thời gian giữa hai cạnh xung, tính RPM với PPR = 1.
- Xuất ba bản tin state/gia tốc/RPM khoảng mỗi 250 ms khi mạng đáp ứng kịp; đây không phải bộ lấy mẫu định thời 4 Hz được bảo đảm.
- Hiển thị dữ liệu gần nhất, hai đồ thị, trạng thái stale và ACK lệnh.
- Lưu các bản tin được chấp nhận vào `data/telemetry-*.jsonl`. CSV trên web chỉ xuất tối đa 240 bản tin telemetry gần nhất đang giữ trong RAM.
- Tắt đầu ra khi khởi động, mất kết nối MQTT được phát hiện, nhấn STOP cục bộ hoặc hết lease 4 giây theo đồng hồ ESP mô phỏng. Control task chạy riêng với vòng mạng.

**Chưa có:** FFT, ringdown, baseline A–B–A, mô hình thước, kết luận cộng hưởng, lưu phiên/SQLite, cloud storage, xác thực người dùng hoặc firmware được nghiệm thu cho motor thật. Gia tốc MPU6050 chưa tự thay đổi theo motor. Trục ngang đồ thị là thứ tự bản tin, không phải thời gian mẫu đều.

Đây là **giao thức demo rút gọn**. Trường `schema_version: 1` chỉ có ý nghĩa trong namespace `rg-demo/...`; payload gia tốc từng điểm khác block dữ liệu trong mục 7.4–7.5 sổ tay. Không nối trực tiếp bộ này vào topic sản phẩm `rg/rg01/` và coi như tương thích.

## 3. Chuẩn bị trên Windows

1. VS Code, Chrome hoặc Edge.
2. Node.js bản LTS hỗ trợ Node từ 22.12 trở lên. Kiểm tra trong PowerShell:

```powershell
node -v
npm -v
```

3. Kết nối Internet để tải thư viện và dùng broker thử nghiệm.
4. Giải nén ZIP vào một thư mục, ví dụ `D:\VSCode\ResonanceGuard_03_IOT_INTEGRATION`. Mở **đúng thư mục có package.json** bằng VS Code.

Broker mặc định là `test.mosquitto.org:1883`, không mã hóa và không yêu cầu tài khoản. Chỉ gửi dữ liệu mô phỏng. Topic ngẫu nhiên giúp tránh trùng nhóm, **không phải xác thực hoặc bảo mật**. Bất kỳ ai biết topic đều có thể gửi lệnh. Không dùng cấu hình này cho motor vật lý.

Wokwi Public Gateway chỉ truy cập Internet, không truy cập mạng LAN của máy bạn. Vì vậy **không đổi BROKER thành localhost/192.168.x.x** trong bước đầu. Không cần cài Mosquitto hay mở port router cho bản thử này.

## 4. Khởi tạo cấu hình chung

Trong terminal PowerShell tại thư mục gốc:

```powershell
npm install
npm run setup
```

`setup` tạo `.env` với topic riêng ngẫu nhiên và tạo `firmware/config.h` có cùng broker/topic. Nếu `.env` đã tồn tại, nó giữ lại cấu hình đó và cập nhật config.h. Sau khi chỉnh `.env`, chạy lại setup rồi chép config.h mới lên Wokwi.

Các cấu hình phải khớp:

| Backend | ESP32 |
|---|---|
| `.env`: MQTT_URL | `config.h`: BROKER và BROKER_PORT |
| `.env`: MQTT_PREFIX | `config.h`: PREFIX |

Một người chạy backend, một project Wokwi, một tab điều khiển web trong buổi thử đầu. Bản demo chưa giải quyết quyền điều khiển giữa nhiều tab/người dùng.

## 5. Dựng mạch Wokwi

1. Mở https://wokwi.com/projects/new/esp32 . Có thể lưu thành một project mới để giữ nguyên bản 2.
2. Thay tab `sketch.ino` bằng `firmware/sketch.ino`.
3. Tạo/thay `config.h` bằng file **đã sinh sau setup**.
4. Trong vùng sơ đồ, nhấn nút thêm linh kiện, chọn **Custom Chip**, đặt tên **rg-motor**, ngôn ngữ C. Wokwi sẽ tạo `rg-motor.chip.c` và `rg-motor.chip.json`.
5. Thay nội dung hai file đó bằng hai file cùng tên trong `firmware/`.
6. Thay `diagram.json` bằng `firmware/diagram.json` sau khi tạo chip. Sơ đồ đã sửa các chân GPIO sang `D21`, `D22`, `D25`… theo board ESP32 DevKit V1.
7. Tạo/thay `libraries.txt` bằng `firmware/libraries.txt`. Nếu chưa có tab này, dùng Library Manager thêm ArduinoMqttClient và ArduinoJson rồi sửa nội dung libraries.txt. Bộ này dùng API ArduinoJson 7.

Trước khi chạy, project Wokwi cần đúng sáu file:

| File | Vai trò |
|---|---|
| sketch.ino | Chương trình ESP32 |
| config.h | Broker và topic riêng của bạn |
| diagram.json | Board, cảm biến, nút, đèn và dây |
| libraries.txt | Thư viện MQTT/JSON |
| rg-motor.chip.c | Mô hình motor và bộ phát xung |
| rg-motor.chip.json | Định nghĩa chân custom chip |

**Thay đổi so với bản 2:** START và PWM do website điều khiển. Nút xanh và thanh trượt trên mạch vẫn có hình nhưng không được chương trình sử dụng. Nút đỏ STOP vẫn hoạt động cục bộ. LED xanh biểu diễn đầu ra RUN; LED vàng biểu diễn PWM. Chưa có driver TB6612FNG điện học trong mô hình này.

## 6. Chạy backend và website

Terminal thứ nhất, tại thư mục gốc:

```powershell
npm run dev
```

Bạn cần thấy backend mở ở port 3000 và sau đó có dòng `MQTT connected`. Giữ terminal này chạy.

Mở terminal thứ hai, cũng tại thư mục gốc:

```powershell
npm run web
```

Mở http://localhost:5173 . Vite chuyển tiếp `/api` và `/ws` về backend nên không cần bật CORS cho cách chạy này.

Sau đó nhấn **Start Simulation** trong Wokwi. Serial dự kiến có `IMU configuration OK`, rồi `MQTT connected`. Đây là log mong đợi, chưa phải bằng chứng bộ firmware đã chạy thành công trong Wokwi.

Trên web, kiểm tra lần lượt:

1. WebSocket đã nối.
2. Broker đã nối.
3. ESP đang gửi và boot_id có giá trị.
4. Gia tốc gần `0 / 0 / 9.81 m/s²` ở mặc định.
5. RPM có thể là `—` trước khi có hai xung hợp lệ. Dấu `—` là không có số đo hợp lệ, khác với đo được 0 RPM.

Nếu muốn chạy từ bản build thay cho Vite:

```powershell
npm run build
npm run dev
```

Rồi mở http://localhost:3000 . Không cần terminal `npm run web` trong cách này. Với bước đầu nên giữ cách hai terminal để dễ đọc lỗi frontend/backend.

## 7. Thử đủ ba luồng

### A. Thử MPU6050 → website

Trong Wokwi, chọn MPU6050 và thay đổi gia tốc X/Y/Z. Quan sát các số và đồ thị web thay đổi. Trọng lực mặc định đã chiếm khoảng 9.81 m/s² ở Z; số đó không có nghĩa thước đang rung mạnh. Điều chỉnh tay này chỉ kiểm tra giao tiếp và đường truyền, không phải thí nghiệm dao động.

### B. Thử website → motor → encoder → website

1. Đặt PWM web 30%, bấm START.
2. Đọc dòng “đã gửi … chờ ESP ACK”, sau đó “ESP chấp nhận …”.
3. Quan sát state RUN/PWM áp dụng và RPM sau khi có xung.
4. Tăng lên 60% rồi bấm Áp dụng PWM. Khi đang chạy, heartbeat cũng gửi giá trị PWM mới ở lần renew tiếp theo.
5. Xem RPM tăng theo mô hình, không đòi RPM bằng PWM × một hằng số chính xác.
6. Bấm STOP, xem RUN/PWM về OFF/0; RPM có thể còn một lúc do mô hình quán tính và phép đo theo chu kỳ, sau timeout chuyển `—`.

Motor custom có vùng PWM thấp chưa quay (khoảng 6%), tốc độ đích tối đa 1800 RPM trong mô hình và độ trễ quán tính giả định. Với giới hạn web 80%, chưa đạt 1800 RPM. Các thông số này chưa được hiệu chuẩn bằng motor thật.

### C. Thử dừng cục bộ và mất điều khiển

1. START từ web, rồi bấm giữ nút đỏ STOP trong Wokwi. Đầu ra phải tắt; lệnh start khi đang giữ STOP bị từ chối.
2. Sau khi thả STOP, phải bấm START mới để chạy lại. Renew không được tự khởi động motor đang OFF.
3. START lần nữa, đóng tab web. Sau khi không nhận lệnh renew trong 4 giây **theo thời gian ESP mô phỏng**, đầu ra phải OFF. Wokwi có thể chạy chậm hơn thời gian thực, nên 4 giây này không nhất thiết bằng 4 giây đồng hồ ngoài đời.
4. Mở lại web: motor vẫn OFF cho đến khi START mới.
5. Thử dừng backend hoặc ngắt mạng và quan sát lease tương tự. Đọc state stale trên web nếu không có dữ liệu mới quá 4 giây thời gian máy tính.

Đây là các bước kiểm tra phải thực hiện trong Wokwi, chưa được bộ kiểm thử Node thay thế. Nếu START/STOP/lease không đúng, dừng mô phỏng và kiểm log trước khi làm tiếp.

### D. Ghi minh chứng

Xuất CSV, xem `data/*.jsonl` ở máy và ghi lại command_id/boot_id trong log. HTTP 202 chỉ nói backend đã gửi yêu cầu, ACK chỉ nói chương trình đã xử lý, RPM phản ánh xung của motor mô phỏng. Ba thông tin này trả lời ba câu hỏi khác nhau.

## 8. Hợp đồng demo

Prefix thực tế do setup sinh, ví dụ `rg-demo/<random>/rg01`. Không ghi đè bằng prefix của nhóm khác.

| Suffix topic | Bên gửi | Dữ liệu chính |
|---|---|---|
| state | ESP | boot_id, seq, t_device_ms, running, duty 0–0.8 |
| telemetry/vibration | ESP | ax, ay, az, unit=m/s2, quality |
| telemetry/rpm | ESP | rpm hoặc null, ppr=1, pulses, quality |
| cmd/motor | Backend | command_id, boot_id, action, duty, lease_ms, deadline theo clock ESP |
| ack | ESP | command_id, accepted, reason, running |

Tất cả có schema_version=1, device_id=rg01, source=synthetic. Telemetry/ACK dùng QoS 0, command dùng QoS 1; tất cả không retained. Đây là lựa chọn rút gọn cho demo mạng, khác cấu hình QoS 1/LWT/state-retained của sản phẩm dự kiến.

Backend bỏ bản tin quá lớn, sai source/schema, retained, seq trùng hoặc thấp hơn seq đã nhận cho cùng loại và boot. Backend chỉ giữ snapshot mới nhất, chưa có bộ reorder/gap phục vụ phân tích. Lệnh giữ thời hạn ngắn, gắn boot hiện tại, bộ nhớ chống lặp hữu hạn 32 ID trên ESP. Lệnh STOP được phép tắt kể cả boot không khớp. ACK gửi QoS 0 có thể mất; giao diện sẽ không coi HTTP thành công là ACK.

| API | Chức năng |
|---|---|
| GET /api/state | Snapshot broker/state/history/ACK |
| POST /api/motor | action=start/stop/renew/set_duty, duty tỷ lệ 0–0.8 |
| WebSocket /ws | Sự kiện snapshot/state/telemetry/ack |

Backend chỉ bind 127.0.0.1. Port mặc định 3000, web 5173. Nếu đổi port backend, sửa cả proxy trong `web/vite.config.js`; kiểm tra Origin trong backend hiện giới hạn port 3000/5173. Giai đoạn đầu giữ mặc định.

## 9. Lỗi thường gặp

| Hiện tượng | Kiểm tra |
|---|---|
| npm không được nhận diện | Cài Node LTS, mở lại terminal/VS Code |
| PowerShell chặn npm.ps1 | Thử dùng npm.cmd thay cho npm; không cần thay chính sách toàn máy |
| ENOENT package.json | Terminal đang sai thư mục; mở đúng folder gốc đã giải nén |
| Thiếu .env | Chạy npm run setup |
| Cannot find module | Chạy npm install tại folder gốc |
| Port already in use | Tắt tiến trình dev cũ ở đúng terminal, không chạy hai backend |
| Web nối broker nhưng ESP stale | Kiểm tra MQTT connected trong Serial, config.h có đúng topic .env không |
| IMU configuration FAILED / null | Kiểm tra đang dùng diagram.json của bản 3 với esp:D21, esp:D22 |
| Unknown part chip-rg-motor | Tạo Custom Chip rg-motor và chép cả hai file chip trước |
| ArduinoJson API lỗi | Kiểm tra libraries.txt dùng bản 7 theo file cung cấp |
| MQTT connect thất bại | Kiểm tra Internet, port 1883 có bị mạng chặn, broker có đang hoạt động; thử mạng khác trước |
| Gia tốc không đổi khi motor quay | Bình thường: mô hình motor không kích thích MPU6050; chỉnh MPU thủ công để thử luồng |
| START bị expired | State/đường mạng quá chậm; xem t_device_ms, chờ state mới và thử lại; không xóa kiểm deadline |
| START được ACK nhưng chưa có RPM | Chờ hai xung, tăng duty trên vùng chết, kiểm motor:TACH → esp:D26 |
| Đóng web mà không dừng | Theo thời gian ESP; kiểm controlTask/lease và log, chưa dùng phần cứng |

## 10. Chuyển sang hệ thống dự kiến trong sổ tay

Sau khi kiểm tra đủ ba luồng ở đây:

1. Đưa broker về Mosquitto riêng có tài khoản/ACL. Với Wokwi trình duyệt cần Private Gateway có quyền truy cập tương ứng, dùng `host.wokwi.internal` để tới máy chủ local; hoặc dùng ESP32 thật trên LAN. Không mở cổng router 1883 để chữa lỗi Public Gateway.
2. Bổ sung thông tin đăng nhập/TLS tương ứng trong firmware và backend; bộ setup hiện chỉ hỗ trợ broker mqtt:// không tài khoản cho mô phỏng. Không coi sửa địa chỉ là đã hoàn tất chuyển bảo mật.
3. Thay nguồn đo bằng MPU6050 thật, lấy mẫu theo thời gian thiết bị, block 20–40 mẫu sau kiểm đủ byte/queue/gap như sổ tay. Thiết kế run_id/config_id và schema sản phẩm riêng trước khi nối các module.
4. Làm ringdown khi motor dừng, bổ sung Python/NumPy, raw/RMS/FFT, chất lượng, lưu phiên; không FFT trên các điểm 250 ms của demo này.
5. Nghiệm thu phần nguồn/driver/STOP/lease/watchdog/giới hạn với phần cứng rồi mới cho motor thật chạy. Giữ encoder custom như bộ test, không xem nó là cảm biến RPM thật.
6. Sau cùng mới khảo sát đáp ứng cưỡng bức và baseline. Hoàn thành phiên bản 3 mô phỏng chưa đồng nghĩa đạt MVP 1/2/3 bằng phần cứng.

## 11. Đã kiểm tra và còn phải kiểm tra

Đã cài dependency, khóa phiên bản thực tế bằng package-lock.json, build frontend và chạy kiểm thử tự động với broker MQTT cục bộ Aedes. Kiểm thử đi qua MQTT thật trong tiến trình test, backend, HTTP, WebSocket, command và ACK; có kiểm dữ liệu sai, trùng seq và Origin.

**Chưa biên dịch/chạy firmware ESP32 trong Wokwi, chưa kiểm chứng custom motor trong Wokwi, chưa thử end-to-end qua broker công cộng, chưa nghiệm thu phần cứng.** Các bước mục 7 là checklist thực hành để xác nhận những phần này.

Lệnh tự kiểm phần Node/React:

```powershell
npm test
npm run build
```

Tài liệu chính thức đã đối chiếu:

- https://docs.wokwi.com/guides/esp32-wifi — Wi-Fi/gateway/local host.
- https://docs.wokwi.com/chips-api/getting-started — tạo custom chip.
- https://docs.wokwi.com/guides/libraries — libraries.txt và phiên bản.
- https://test.mosquitto.org/ — broker thử nghiệm, port và giới hạn sử dụng.
- https://github.com/arduino-libraries/ArduinoMqttClient/blob/master/src/MqttClient.h — beginMessage biết trước kích thước, timeout và retained.
- https://github.com/mqttjs/MQTT.js — MQTT client Node.

Sổ tay đối chiếu: RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE(4).md, SHA-256 `71b1cfb942eb3dc689b2bb3fae8ee180b25691ca3b656d56f8bdb3cd35ebdc26`.
