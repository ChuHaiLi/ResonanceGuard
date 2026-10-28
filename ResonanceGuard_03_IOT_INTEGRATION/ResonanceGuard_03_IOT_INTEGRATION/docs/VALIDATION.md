# Biên bản kiểm chứng 03_IOT_INTEGRATION

> **Biên bản lượt đầu, giữ làm lịch sử.** Sau lượt này, người dùng đã chạy Wokwi và cung cấp proof có RPM nhưng lỗi ACK/reconnect. Mã hiện tại đã có bản vá ACK QoS1, header thứ 9 mqtt_support.h và 13 test. Xem [điều tra MQTT/ACK mới nhất](MQTT_ACK_INVESTIGATION.md); các phát biểu QoS0/8 file/10 test dưới đây chỉ mô tả lượt đầu.

Ngày thực hiện: **27/10/2026**, Windows, múi giờ Asia/Bangkok.

**Trạng thái:** đã sửa mã, cài dependencies, đồng bộ cấu hình và kiểm thử phần mềm trên máy. **Chưa nghiệm thu phiên bản 3 toàn hệ thống**, vì chưa compile/chạy ESP32 và custom chip trong Wokwi. Không có dữ liệu phần cứng thật.

## 1. Dự án và phạm vi đã xác định

- Workspace: `VLCNTT_24C11_Do_An`.
- Thư mục chạy: `ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION` tính từ workspace.
- Đã đọc README, package/lockfile, setup, firmware, backend, frontend và test cũ; đối chiếu sổ tay ở các phần phạm vi, wiring, hợp đồng MQTT, MVP và ma trận kiểm thử; đọc PDF quy định 4 trang.
- Không tìm thấy AGENTS.md trong workspace hoặc các thư mục cha đã kiểm. `git status` ở workspace và dự án đều báo không phải Git repository. Không tạo repo, commit hay push.
- Lưu bản gốc các file hiện có trước sửa tại `review-backup-20261027/` ở workspace. Không sửa sổ tay hoặc PDF.
- Ban đầu chưa có `.env` và `node_modules/`. Chạy setup sinh topic ngẫu nhiên; khi broker mặc định Mosquitto timeout, chỉ đổi URL của cấu hình vừa sinh sang HiveMQ rồi chạy lại setup. Không thay topic. Không in nội dung `.env` vào báo cáo.

PDF cho phép giả lập; sổ tay là kế hoạch sản phẩm dài hạn và có nhiều tiêu chí đo thật. `03_IOT_INTEGRATION` không phải MVP 3 trong sổ tay. Các khác biệt có chủ đích: namespace `rg-demo`, payload từng điểm, duty tối đa 0.8, lease 4 giây, MQTT không tài khoản cho mô phỏng, GPIO27 dùng RUN và GPIO19 dùng STOP. Chưa triển khai FFT, ringdown, baseline A–B–A, cơ học thước, cloud hoặc kết luận cộng hưởng.

MPU6050 không bị motor kích bằng mô hình cơ học. Thay đổi MPU thủ công chỉ chứng minh giao tiếp/đường truyền. Chu kỳ gửi khoảng 250 ms có thể bị mạng làm chậm, không phải bộ lấy mẫu định thời đủ dùng cho phân tích rung.

## 2. Những lỗi đã sửa

| File/phần | Thay đổi và lý do |
|---|---|
| `setup.mjs`, `.env.example`, `.gitignore` | Dùng parser .env của Node để giữ cấu hình có dấu nháy/chú thích; kiểm URL/prefix/port trước khi ghi firmware; từ chối cấu hình auth/TLS chưa được firmware hỗ trợ; không lộ giá trị URL lỗi; bỏ config sinh tự động khỏi Git |
| `server/protocol.js` | Kiểm JSON object/envelope, source synthetic, uint32 device time, OFF/PWM, đơn vị/range/quality MPU và RPM; null không được hiểu là 0 |
| `server/app.js` | ACK phải khớp lệnh đang chờ và boot; telemetry phải thuộc boot hiện tại; đổi boot xóa lịch sử cũ; kiểm seq/device clock; stale theo từng stream; bỏ QoS1 đang chờ khi mất MQTT; cần state mới sau reconnect; kiểm Origin cho HTTP và WS |
| `web/src/control.js`, `main.jsx` | Chỉ START ACK mới được bật renew; STOP/mất WS/boot mới vô hiệu HTTP/ACK cũ; từ chối/timeout ACK thì ngừng renew; HTTP timeout; snapshot kết nối lại không tự chạy motor |
| `web/src/freshness.js`, `main.jsx` | Gia tốc/RPM có age riêng, ẩn số cũ bằng `—` và ghi STALE; state cũ không hiện như RUN/OFF hiện tại; đồ thị được ghi rõ là lịch sử |
| `firmware/motor_control.h`, `sketch.ino` | Kiểm lease trước renew, khắc phục renew sát hạn có thể giữ motor chạy; chống lặp không gia hạn lease; boot/STOP/mất MQTT OFF; kiểm numeric JSON đúng kiểu; giới hạn hàng đợi ACK; dừng khi gửi MQTT thiếu byte/lỗi; kiểm PWM/control task khởi tạo |
| `firmware/rpm_reader.h`, `sketch.ino` | Khóa dữ liệu tach giữa ISR/task bằng mux; hai cạnh mới có RPM; timeout và cạnh đầu sau khoảng nghỉ không tái dùng chu kỳ cũ; xử lý micros wrap; state báo PWM đã lượng tử 8 bit |
| Firmware I2C/log | Đọc lại cấu hình ±4g trước dùng 8192 LSB/g; đổi sang m/s²; log BOOT/command_id/boot/OUTPUT. Log chạy ngoài control task để không chặn dừng; timestamp OUTPUT ghi ở lúc thay đổi đầu ra |
| `firmware/libraries.txt`, custom chip C | Khóa ArduinoMqttClient 0.1.8 và ArduinoJson 7.4.2; chuẩn hóa Allman; giữ mô hình motor hiện có |
| Tests/scripts/tài liệu | Thêm test hồi quy thực, smoke local, probe public, log bằng chứng và hướng dẫn đúng thư mục Windows |

Không thay dependencies hoặc công nghệ của dự án; không thay nội dung lockfile. Không cài bộ công cụ ESP32 lớn, đổi chính sách bảo mật Windows, mở router, push hoặc triển khai công khai.

## 3. Môi trường và bằng chứng đã chạy

Node **24.11.1**, npm **11.6.2**, GCC/G++ **13.2.0**. Yêu cầu package: Node >=22.12.0.

Theo lockfile đã cài: Express 5.3.0, MQTT.js 5.16.1, React/React DOM 19.3.1, ws 8.22.0, Vite 7.3.7, Aedes 0.51.3. `npm ci` ban đầu thất bại trong sandbox; lần chạy có quyền bổ sung đã cài 149 packages. Không nâng npm chỉ vì thông báo có bản mới.

| Kiểm tra | Kết quả thực tế | Bằng chứng |
|---|---|---|
| `npm.cmd ci --no-audit --no-fund` | Thành công, đúng lockfile | Dependency hiện có; phiên bản ở trên |
| `npm.cmd run setup` | Thành công; đọc lại cấu hình xác nhận broker/port/topic khớp, không in giá trị | Test setup + kiểm cấu hình thực tế |
| `npm.cmd test` | **10 pass, 0 fail, 0 skip**, khoảng 9.54 giây | [tests.txt](evidence/tests.txt) |
| `npm.cmd run build` | Thành công; React/Vite production assets | [build.txt](evidence/build.txt) |
| `npm.cmd run smoke:local` | Thành công; server/index.js + Vite chạy ở tiến trình riêng, HTTP/assets/proxy WS, MQTT telemetry, START/PWM/renew/STOP và peer ACK | [smoke-local.txt](evidence/smoke-local.txt) |
| Broker Mosquitto ban đầu | Không nhận CONNACK trong timeout; chưa xác định lỗi broker hay mạng | [public-mosquitto.txt](evidence/public-mosquitto.txt) |
| `npm.cmd run probe:public` với HiveMQ | Thành công; hai client Node pub/sub QoS1, non-retained, synthetic trên topic chẩn đoán ngẫu nhiên; không gửi motor command | [public-hivemq.txt](evidence/public-hivemq.txt) |
| Backend thật với `.env` hiện tại | Nối HiveMQ; HTTP 200 phục vụ React; WS snapshot có broker_connected; START trả 409 vì chưa có state ESP; không phát lệnh motor ra public broker | [backend-public.txt](evidence/backend-public.txt) |

Các tiến trình thử đã được dừng sau kiểm tra. Không để backend/Vite của lượt thử chiếm port cho lần chạy của người dùng.

### Bộ 10 test đã kiểm gì

1. MQTT thật qua Aedes → backend → HTTP/WS; lệnh HTTP → MQTT → ACK; seq/source sai bị loại; JSONL chỉ ghi bản tin synthetic được chấp nhận.
2. **Native C++ dùng đúng header firmware:** boot OFF, START, PWM, STOP sai boot vẫn tắt, lệnh trùng không gia hạn, deadline hết hạn/quá xa, sai boot, duty/lease sai, STOP giữ, renew khi OFF, renew đúng lúc hết lease, mất mạng/phục hồi, millis wrap. Cùng test kiểm RPM: hai cạnh, PPR=1, 600 RPM, timeout, khởi động lại và micros wrap.
3. **Native C include đúng custom chip source với Wokwi API giả:** vùng chết, PWM 30%/60%, RPM đích, số cạnh mỗi giây theo PPR=1, EN OFF, coast-down, steady HIGH/LOW.
4. Schema loại null/array, sai đơn vị/quality/range, sai source, OFF mà duty khác 0; null RPM khác 0.
5. Logic điều khiển frontend: HTTP/ACK cũ sau STOP/disconnect không bật renew; renew ACK khi OFF không arm; từ chối/stale/ACK timeout giữ inactive.
6. Freshness frontend độc lập theo stream và boot; số RPM cũ không trở thành phép đo mới khi MPU còn gửi.
7. Retained replay, JSON lỗi/quá lớn, ACK sai boot, stale state/RPM, MPU mới khi RPM cũ, boot mới xóa lịch sử, boot cũ không thay state, MQTT offline/reconnect cần state mới.
8. HTTP JSON lỗi trả 400; WebSocket Origin ngoài danh sách trả 403.
9. Broker cố tình giữ PUBACK: ngắt MQTT và nối lại không phát lại START QoS1 cũ.
10. Setup tạo config khớp, giữ nguyên .env hợp lệ có nháy/comment; cấu hình không hỗ trợ bị từ chối mà không ghi đè và không in mật khẩu ví dụ.

**Giới hạn bằng chứng:** test Node dùng peer giả; test native C/C++ không chạy Arduino-ESP32, Wire, LEDC, FreeRTOS hay runtime Wokwi. Smoke kiểm HTTP/WS/assets, không render/click React trong trình duyệt. Không dùng các kết quả này để đánh dấu đã chạy đủ ba luồng thiết bị trong Wokwi.

## 4. Đã đối chiếu tĩnh

| Đường nối | Kết quả đọc mã/sơ đồ, chưa đo runtime |
|---|---|
| MPU6050 | GPIO21/D21 → SDA; GPIO22/D22 → SCL; 3V3/GND; địa chỉ mặc định 0x68; wake 0x6B; ACCEL_CONFIG 0x1C=0x08; burst 6 byte từ 0x3B; int16 có dấu /8192 ×9.80665 |
| Motor | GPIO25/D25 → PWM 1000 Hz, 8 bit; GPIO33/D33 → EN; GPIO27/D27 → LED RUN; TACH → GPIO26/D26, cạnh lên, PPR=1 |
| STOP | GPIO19/D19 input pull-up, nút nối GND; nút xanh/GPIO18 và pot/GPIO34 còn trong hình nhưng không dùng |
| Custom chip | Pin PWM/EN/TACH/GND khớp diagram/chip JSON; timer 1000 microsecond, get_sim_nanos dùng nanosecond; có vùng chết và quán tính giả định, không có mô hình TB6612 điện học |
| MQTT | Cùng namespace do setup sinh; telemetry/ACK QoS0, command QoS1, non-retained; JSON biết trước độ dài, tránh buffer 256 byte của thư viện |

Đối chiếu nguồn chính thức: [tên chân board](https://github.com/wokwi/wokwi-elements/blob/main/src/esp32-devkit-v1-element.ts), [MPU6050 Wokwi](https://docs.wokwi.com/parts/wokwi-mpu6050), [GPIO API](https://docs.wokwi.com/chips-api/gpio), [time API](https://docs.wokwi.com/chips-api/time), [LEDC](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html), [Wire 2.0.17](https://github.com/espressif/arduino-esp32/blob/2.0.17/libraries/Wire/src/Wire.h), [Wire 3.3.2](https://github.com/espressif/arduino-esp32/blob/3.3.2/libraries/Wire/src/Wire.h), [ArduinoMqttClient API](https://github.com/arduino-libraries/ArduinoMqttClient/blob/master/src/MqttClient.h), [ArduinoJson is](https://arduinojson.org/v7/api/jsonvariant/is/), [MQTT.js removeOutgoingMessage](https://github.com/mqttjs/MQTT.js#removeoutgoingmessagemid).

Đây là xác minh tài liệu/API; không thay cho compile với phiên bản core thực tế của Wokwi. Máy không có Arduino CLI/PlatformIO/Wokwi CLI phù hợp trong PATH hoặc bộ board ESP32 đã phát hiện; không cài thêm toolchain lớn.

## 5. Chưa kiểm và phần người dùng cần thực hiện

Công cụ Computer Use đã tự dừng khi không thể xác định URL hiện tại của Chrome đủ chắc chắn để áp dụng chính sách truy cập. Chưa có thao tác Wokwi thành công; không tiếp tục điều khiển UI sau thông báo đó.

Từ **workspace hiện tại**:

```powershell
Set-Location '.\ResonanceGuard_03_IOT_INTEGRATION\ResonanceGuard_03_IOT_INTEGRATION'
npm.cmd run setup
npm.cmd run build
npm.cmd run dev
```

Mở http://localhost:3000. Nếu dùng Vite, terminal thứ hai cùng thư mục chạy `npm.cmd run web`, mở http://localhost:5173. Dependencies đã cài; chỉ chạy lại `npm.cmd ci` khi cần cài mới. Dừng dev trước `npm.cmd run smoke:local` để trống 3000/5173.

Tạo project [ESP32 Wokwi](https://wokwi.com/projects/new/esp32), chép sketch/config/hai header trước; tạo Custom Chip tên **rg-motor**, ngôn ngữ C, rồi thay source/JSON chip; cuối cùng thay diagram và libraries. **Đủ 8 file từ firmware:**

`sketch.ino`, `config.h`, `motor_control.h`, `rpm_reader.h`, `rg-motor.chip.c`, `rg-motor.chip.json`, `diagram.json`, `libraries.txt`.

Không chép .env lên Wokwi. Không dùng config.h trong backup; chép bản vừa sinh. Xem hướng dẫn chi tiết [README mục 5–7](../../../README_HUONG_DAN.md).

Kết quả mong đợi sau Start Simulation: compile thành công; Serial báo BOOT/outputs OFF, IMU configuration OK, MQTT connected; website nhận boot/state và gia tốc mặc định gần 0/0/9.81 m/s². Đây là kết quả **chưa được quan sát trong lượt kiểm thử này**.

### Checklist nghiệm thu Wokwi còn chờ

- [ ] Đổi X/Y/Z trên MPU; số SI và đồ thị web đổi, quality đúng, source synthetic.
- [ ] START từ web ở 30%; phân biệt HTTP 202, ACK command_id, OUTPUT RUN/PWM và RPM sau hai cạnh; đổi 60% làm RPM thay đổi.
- [ ] STOP web: đầu ra OFF/0; rotor có thể coast-down; RPM hết xung thành null/`—` sau timeout.
- [ ] Giữ STOP đỏ: đầu ra OFF, START bị từ chối; thả nút không tự chạy, renew khi OFF bị từ chối.
- [ ] START rồi đóng web/mất WS: sau tối đa lease 4 giây theo clock ESP kể từ renew cuối, đầu ra OFF; mở/nối lại vẫn OFF.
- [ ] START rồi tắt backend; thử riêng mất Wi-Fi/MQTT: OFF khi phát hiện hoặc hết lease; Serial có OUTPUT; website đánh STALE, không giữ số cũ như mới.
- [ ] Phục hồi từng kết nối và reset ESP: không tự chạy; cần START mới, boot mới không nhận lệnh cũ.
- [ ] Khi cần xác nhận parser/network firmware: gửi lệnh duplicate/expired/wrong boot/numeric sai trong project mô phỏng; so ACK và OUTPUT với test native; không thử bằng phần cứng thật.

Nếu bị lỗi, lưu **toàn bộ compile log**, Serial từ BOOT tới COMMAND/OUTPUT, command_id/boot_id, HTTP status/response, snapshot `/api/state`, lỗi Console/Network WS và CSV/JSONL synthetic. Không gửi .env, token hoặc mật khẩu. Ghi thời điểm giả lập của renew cuối và OUTPUT OFF; không suy từ thời gian nhận Serial ngoài đời nếu simulator chạy chậm.

## 6. Giới hạn còn lại

- Chưa kiểm render/click website, compile/chạy ESP32, đường Wokwi Gateway, I2C/PWM/encoder/STOP/lease thực trong simulator; chưa xác nhận ba luồng end-to-end.
- Broker công cộng không có xác thực/ACL/TLS cho demo. Topic ngẫu nhiên không phải khóa bảo mật. Không chuyển cấu hình này sang điều khiển motor vật lý.
- Chỉ một tab/người điều khiển; không có phân quyền hoặc phiên điều khiển nhiều người. Bộ nhớ chống lặp hữu hạn 32 ID, deadline ngắn; không phải hệ điều khiển sản xuất.
- ACK QoS0 có thể mất, dẫn đến frontend ngừng renew; cần START mới sau khi đã OFF. State là đầu ra đã ghi qua API, không phải phản hồi điện/công suất vật lý; RPM không đảm bảo rotor vật lý đã dừng.
- Timeout tach 2 giây với PPR=1 không xác nhận tốc độ rất thấp khoảng 30 RPM trở xuống. Null khác 0.
- Stale dựa thời gian nhận trên máy; không phải chứng nhận tuổi mẫu theo thời gian vật lý. Không có reorder/gap hoặc lấy mẫu định thời phục vụ phân tích.
- JSONL local có giới hạn bộ đệm; không bảo đảm lưu vô hạn khi đĩa lỗi/chậm; CSV chỉ chứa tối đa 240 telemetry trong RAM. Không có phát lại phiên sau restart.
- Bản 3 không có mô hình cơ học, FFT, ringdown, baseline hoặc kết luận cộng hưởng. Hoàn thiện mô phỏng IoT không đồng nghĩa đạt MVP phần cứng hoặc điểm đồ án.
