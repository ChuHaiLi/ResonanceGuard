# ResonanceGuard — 03_IOT_INTEGRATION

Bộ mô phỏng tích hợp để kiểm tra **ba luồng IoT trên thiết bị Wokwi**, tiếp nối 02_MOTOR_ENCODER. Backend Express và giao diện React chạy trên máy; ESP32, MPU6050 và motor/encoder được thiết kế chạy trong Wokwi. Toàn bộ dữ liệu mang `source: synthetic` vì chưa có phép đo ngoài đời.

**Cập nhật điều tra ACK, 27/10/2026:** người dùng đã chạy Wokwi, CSV có RPM tới 461.5385 nhưng ACK/reconnect chưa ổn định. Bản vá hiện có **13/13 test đạt và build đạt**, chưa chạy lại firmware mới trong Wokwi. Đọc [điều tra MQTT/ACK và cách cập nhật 3 file](ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/docs/MQTT_ACK_INVESTIGATION.md); [biên bản lượt đầu](ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/docs/VALIDATION.md) được giữ để đối chiếu lịch sử.

**Đúng thư mục chạy npm:** từ workspace đang mở, đi xuống hai cấp:

```powershell
Set-Location -LiteralPath 'C:\Users\PC\OneDrive\Desktop\Visual Studio Code\HCMUS\VLCNTT\VLCNTT_24C11_Do_An'
Set-Location '.\ResonanceGuard_03_IOT_INTEGRATION\ResonanceGuard_03_IOT_INTEGRATION'
Test-Path .\package.json
```

Kết quả cuối phải là `True`; thư mục này có `firmware/`, `server/`, `web/`, `tests/`, `setup.mjs`. Workspace và thư mục dự án hiện không có Git repository hoặc AGENTS.md. Bản gốc trước sửa nằm trong `review-backup-20261027/` ở workspace.

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
- Stale riêng từng kênh state/gia tốc/RPM sau 4 giây theo đồng hồ máy tính; khi WebSocket/broker mất, các số hiện tại chuyển `—`. Đồ thị giữ lịch sử và ghi rõ đó là lịch sử.
- Lưu các bản tin được chấp nhận vào `data/telemetry-*.jsonl`. CSV trên web chỉ xuất tối đa 240 bản tin telemetry gần nhất đang giữ trong RAM.
- Tắt đầu ra khi khởi động, mất kết nối MQTT được phát hiện, nhấn STOP cục bộ hoặc hết lease 4 giây theo đồng hồ ESP mô phỏng. Control task chạy riêng với vòng mạng.

**Chưa có:** FFT, ringdown, baseline A–B–A, mô hình thước, kết luận cộng hưởng, lưu phiên/SQLite, cloud storage, xác thực người dùng hoặc firmware được nghiệm thu cho motor thật. Gia tốc MPU6050 chưa tự thay đổi theo motor. Trục ngang đồ thị là thứ tự bản tin, không phải thời gian mẫu đều.

Đây là **giao thức demo rút gọn**. Trường `schema_version: 1` chỉ có ý nghĩa trong namespace `rg-demo/...`; payload gia tốc từng điểm khác block dữ liệu trong mục 7.4–7.5 sổ tay. Không nối trực tiếp bộ này vào topic sản phẩm `rg/rg01/` và coi như tương thích.

Tên phiên bản `03_IOT_INTEGRATION` **khác mốc MVP 3 của sổ tay**. Sổ tay hướng đến đo thật, baseline, cơ học và bảo vệ phần cứng với lease đề xuất 2 giây; bản này chỉ tích hợp mô phỏng, lease 4 giây, không có driver điện học hay watchdog phần cứng. GPIO27 là đèn RUN và GPIO19 là STOP của bản 3; không dùng bảng chân INT/AIN2 của mô hình phần cứng dài hạn để đấu vào sơ đồ này. PDF môn học cho phép giả lập; việc chấm chức năng vẫn cần nhóm chứng minh trực tiếp ba luồng và giải thích đúng phạm vi.

## 3. Chuẩn bị trên Windows

1. VS Code, Chrome hoặc Edge.
2. Node.js bản LTS hỗ trợ Node từ 22.12 trở lên. Kiểm tra trong PowerShell:

```powershell
node -v
npm.cmd -v
```

3. Kết nối Internet để tải thư viện và dùng broker thử nghiệm.
4. Giải nén ZIP vào một thư mục, ví dụ `D:\VSCode\ResonanceGuard_03_IOT_INTEGRATION`. Mở **đúng thư mục có package.json** bằng VS Code.

Broker mặc định mới là `broker.hivemq.com:1883`, không mã hóa và không yêu cầu tài khoản. Ngày 27/10, hai client Node đã pub/sub thành công qua broker này; `test.mosquitto.org:1883` bị timeout CONNACK trong lượt thử. `.env` chưa tồn tại trước khi làm việc nên cấu hình vừa tạo được đổi sang HiveMQ; topic riêng được giữ nguyên. Setup vẫn giữ nguyên `.env` hợp lệ ở những lần sau.

Chỉ gửi dữ liệu mô phỏng. Topic ngẫu nhiên giúp tránh trùng nhóm, **không phải xác thực hoặc bảo mật**. Bất kỳ ai biết topic đều có thể gửi lệnh. Không dùng cấu hình broker công cộng này cho motor vật lý.

Wokwi Public Gateway chỉ truy cập Internet, không truy cập mạng LAN của máy bạn. Vì vậy **không đổi BROKER thành localhost/192.168.x.x** trong bước đầu. Không cần cài Mosquitto hay mở port router cho bản thử này.

## 4. Khởi tạo cấu hình chung

Trong terminal PowerShell tại **thư mục dự án có package.json**:

```powershell
npm.cmd ci
npm.cmd run setup
```

`setup` tạo `.env` với topic riêng ngẫu nhiên và tạo `firmware/config.h` có cùng broker/topic. Nếu `.env` đã tồn tại và hợp lệ, nó giữ nguyên cả nội dung file (kể cả chú thích/dấu nháy), chỉ cập nhật config.h. Setup từ chối URL có tài khoản, TLS hoặc path vì firmware demo chưa triển khai những cấu hình đó; khi từ chối, nó không ghi đè config.h. Sau khi chỉnh `.env`, chạy lại setup rồi chép config.h mới lên Wokwi. `.env`, `firmware/config.h`, `data/`, `dist/`, `node_modules/` được liệt kê trong `.gitignore` của dự án để không đưa vào Git khi tạo repo. Không chép `.env` lên Wokwi.

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
   Tạo thêm ba tab `motor_control.h`, `rpm_reader.h`, `mqtt_support.h`, chép đúng ba file cùng tên từ `firmware/`.
4. Trong vùng sơ đồ, nhấn nút thêm linh kiện, chọn **Custom Chip**, đặt tên **rg-motor**, ngôn ngữ C. Wokwi sẽ tạo `rg-motor.chip.c` và `rg-motor.chip.json`.
5. Thay nội dung hai file đó bằng hai file cùng tên trong `firmware/`.
6. Thay `diagram.json` bằng `firmware/diagram.json` sau khi tạo chip. Sơ đồ đã sửa các chân GPIO sang `D21`, `D22`, `D25`… theo board ESP32 DevKit V1.
7. Tạo/thay `libraries.txt` bằng `firmware/libraries.txt`. Nếu chưa có tab này, dùng Library Manager thêm ArduinoMqttClient và ArduinoJson rồi sửa nội dung libraries.txt. Đã khóa `ArduinoMqttClient@0.1.8` và `ArduinoJson@7.4.2`. Firmware có nhánh LEDC cho Arduino-ESP32 2.x và 3.x; đây là kiểm tra API theo mã nguồn chính thức, chưa phải kết quả compile Wokwi.

Trước khi chạy, project Wokwi cần đúng chín file:

| File | Vai trò |
|---|---|
| sketch.ino | Chương trình ESP32 |
| config.h | Broker và topic riêng của bạn |
| motor_control.h | Logic lệnh, lease, STOP và chống lặp dùng chung với test C++ |
| rpm_reader.h | Đếm cạnh, chu kỳ, timeout và RPM dùng chung với test C++ |
| mqtt_support.h | Đọc payload có giới hạn, thoát khi read lỗi; hash namespace cho client ID |
| diagram.json | Board, cảm biến, nút, đèn và dây |
| libraries.txt | Thư viện MQTT/JSON |
| rg-motor.chip.c | Mô hình motor và bộ phát xung |
| rg-motor.chip.json | Định nghĩa chân custom chip |

**Thay đổi so với bản 2:** START và PWM do website điều khiển. Nút xanh và thanh trượt trên mạch vẫn có hình nhưng không được chương trình sử dụng. Nút đỏ STOP vẫn hoạt động cục bộ. LED xanh biểu diễn đầu ra RUN; LED vàng biểu diễn PWM. Chưa có driver TB6612FNG điện học trong mô hình này.

## 6. Chạy backend và website

Terminal thứ nhất, tại thư mục dự án có package.json:

```powershell
npm.cmd run dev
```

Bạn cần thấy backend mở ở port 3000 và sau đó có dòng `MQTT connected`. Giữ terminal này chạy.

Mở terminal thứ hai, cũng tại thư mục dự án có package.json:

```powershell
npm.cmd run web
```

Mở http://localhost:5173 . Vite chuyển tiếp `/api` và `/ws` về backend nên không cần bật CORS cho cách chạy này.

Sau đó nhấn **Start Simulation** trong Wokwi. Serial dự kiến có `IMU configuration OK`, `MQTT SUBACK result=1`, rồi `MQTT connected`. Bản cũ đã có bằng chứng người dùng chạy tới RPM; các log mới và việc chạy ổn bản vá ACK hiện tại vẫn cần xác nhận lại.

Trên web, kiểm tra lần lượt:

1. WebSocket đã nối.
2. Broker đã nối.
3. ESP đang gửi và boot_id có giá trị.
4. Gia tốc gần `0 / 0 / 9.81 m/s²` ở mặc định.
5. RPM có thể là `—` trước khi có hai xung hợp lệ. Dấu `—` là không có số đo hợp lệ, khác với đo được 0 RPM.

Nếu muốn chạy từ bản build thay cho Vite:

```powershell
npm.cmd run build
npm.cmd run dev
```

Rồi mở http://localhost:3000 . Không cần terminal `npm.cmd run web` trong cách này. Với bước đầu nên giữ cách hai terminal để dễ đọc lỗi frontend/backend.

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

Motor custom có vùng PWM thấp chưa quay (khoảng 6%), tốc độ đích tối đa 1800 RPM trong mô hình và độ trễ quán tính giả định. Với giới hạn web 80%, chưa đạt 1800 RPM. PWM được lượng tử thành 8 bit nên phần trăm áp dụng có thể lệch nhẹ giá trị yêu cầu. RPM cần hai cạnh liên tiếp, PPR=1; sau 2 giây không có cạnh thì `rpm=null`, không phải 0. Với timeout này, tốc độ rất thấp khoảng 30 RPM trở xuống không được coi là số đo hợp lệ. Sau khoảng nghỉ dài, cạnh đầu tiên chưa đủ để hiển thị RPM mới. Các thông số này chưa được hiệu chuẩn bằng motor thật.

### C. Thử dừng cục bộ và mất điều khiển

1. START từ web, rồi bấm giữ nút đỏ STOP trong Wokwi. Đầu ra phải tắt; lệnh start khi đang giữ STOP bị từ chối.
2. Sau khi thả STOP, phải bấm START mới để chạy lại. Renew không được tự khởi động motor đang OFF.
3. START lần nữa, đóng tab web. Sau khi không nhận lệnh renew trong 4 giây **theo thời gian ESP mô phỏng**, đầu ra phải OFF. Wokwi có thể chạy chậm hơn thời gian thực, nên 4 giây này không nhất thiết bằng 4 giây đồng hồ ngoài đời.
4. Mở lại web: motor vẫn OFF cho đến khi START mới.
5. Thử dừng backend hoặc ngắt mạng và quan sát lease tương tự. Đọc state stale trên web nếu không có dữ liệu mới quá 4 giây thời gian máy tính.
6. Thử mất WebSocket riêng: đóng kết nối `/ws` bằng DevTools hoặc ngắt frontend; renew phải ngừng. Sau khi kết nối phục hồi, motor vẫn OFF và cần START mới. Không chỉ làm mới trang rồi kết luận đã kiểm thử mất mạng.

Serial có `BOOT ... client_id=...`, `COMMAND t_ms=... action=... id=... accepted=... lease_until=...` và `OUTPUT t_ms=... RUN=... PWM=.../255 reason=... command_id=...`. Reason OFF phân biệt `local_stop`, `lease_expired`, `mqtt_lost`, `command_stop`, `ack_queue_full`. Dùng `OUTPUT` để quan sát đầu ra khi backend đã tắt; dòng này vẫn chưa chứng minh rotor đã dừng vì mô hình có quán tính. Thời điểm OUTPUT được ghi tại control task; việc in log do vòng mạng đảm nhận nên có thể hiện muộn, không chặn đường dừng. Lease tính từ lúc xử lý START/renew, không từ lúc LED RUN sáng.

Theo một full command_id, kiểm `ACK QUEUED → ACK PUBLISH → ACK BROKER_CONFIRMED` trong Serial; `ACK_RX → ACK_ACCEPT/ACK_DROP → ACK_WS_SEND` trong terminal/backend `data/diagnostics-*.jsonl`; `FRONT_ACK_RX → FRONT_ACK_DECISION` trong Console trình duyệt. Web có link full ID tới `/api/commands/<id>`. `ACK_DROP reason=ack_wall_timeout` nghĩa ACK đã tới backend nhưng muộn quá 5 giây theo máy; không đồng nghĩa ESP chưa tạo ACK. Xem [cách đọc trace](ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/docs/MQTT_ACK_INVESTIGATION.md).

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

Tất cả có schema_version=1, device_id=rg01, source=synthetic. Telemetry dùng QoS0, **ACK và command dùng QoS1**, tất cả không retained. ACK mới có thêm command_t_device_ms/lease_until_device_ms, state có stop_reason/last_command_id. Đây là giao thức demo rút gọn, khác cấu hình block dữ liệu/LWT/state-retained của sản phẩm dự kiến.

Backend bỏ JSON lỗi/null/array, bản tin quá lớn, sai source/schema/unit/quality/range, retained do broker phát lại lúc subscribe, seq trùng/thấp và clock lùi cho cùng loại/boot. Telemetry/ACK phải khớp boot đã nhận từ state; đổi boot sẽ xóa lịch sử hiển thị cũ và vô hiệu các lệnh đang chờ. Backend chỉ giữ snapshot mới nhất, chưa có bộ reorder/gap phục vụ phân tích. Trên broker MQTT 3, cờ retained trong lần phát trực tiếp không luôn cho biết bên gửi đã lưu retained; mọi publisher của demo phải tuân thủ `retain=false`.

Lệnh giữ thời hạn ngắn, gắn boot hiện tại, bộ nhớ chống lặp hữu hạn 32 ID trên ESP. Lệnh STOP được phép tắt kể cả boot không khớp hoặc deadline đã qua. Lệnh số sai kiểu, hết hạn, sai boot, renew khi OFF hoặc START khi giữ STOP bị từ chối. Duplicate không thực thi và không gia hạn lease. Motor đã hết lease không thể được renew để chạy lại. Backend hủy lệnh QoS1 chưa được broker xác nhận khi ngắt MQTT, yêu cầu state mới sau reconnect. Firmware dùng clean session, boot OFF và luôn cần START mới sau khi đã dừng.

ACK QoS1 có broker PUBACK và vẫn có thể lỗi/timeout; PUBACK không chứng minh backend/React đã nhận. Giao diện ngừng renew khi mất WS/broker, stale, nhận từ chối hoặc quá 5 giây chưa có ACK hợp lệ; HTTP cũng có timeout 5 giây. ACK hoặc HTTP cũ đến sau STOP/mất kết nối không được bật lại renew. Health được cập nhật ngay trong WS callback, tránh đọc trạng thái từ render trước. HTTP 202 chỉ xác nhận backend đã tiếp nhận để gửi MQTT, không xác nhận broker/ESP hay rotor đã chạy. ACK nói chương trình xử lý lệnh, state báo đầu ra đã ghi, RPM là phép tính từ cạnh encoder mô phỏng.

Giữ nguyên lease 4000 ms và deadline theo ESP, ACK 5000 ms theo máy, MQTT timeout 1000 ms/keepalive 10000 ms theo ESP. Nếu Wokwi tạm dừng hoặc chạy quá chậm so với đồng hồ máy/broker, các giới hạn này có thể hết ở những thời điểm rất khác nhau. Không tăng timeout hoặc bỏ bảo vệ để giữ RUN qua một khoảng mất điều khiển dài; đọc TIMING_GAP và log nguyên nhân trước.

| API | Chức năng |
|---|---|
| GET /api/state | Snapshot broker/state/history/ACK |
| GET /api/commands/:id | Trace tối đa 100 lệnh gần nhất; sau restart xem diagnostics JSONL |
| POST /api/motor | action=start/stop/renew/set_duty, duty tỷ lệ 0–0.8 |
| WebSocket /ws | Sự kiện snapshot/state/telemetry/ack |

Backend chỉ bind 127.0.0.1. Port mặc định 3000, web 5173. Nếu đổi port backend, sửa cả proxy trong `web/vite.config.js`; kiểm tra Origin trong backend hiện giới hạn port 3000/5173. Giai đoạn đầu giữ mặc định.

## 9. Lỗi thường gặp

| Hiện tượng | Kiểm tra |
|---|---|
| npm không được nhận diện | Cài Node LTS, mở lại terminal/VS Code |
| PowerShell chặn npm.ps1 | Thử dùng npm.cmd thay cho npm; không cần thay chính sách toàn máy |
| ENOENT package.json | Terminal đang sai thư mục; mở đúng folder gốc đã giải nén |
| Thiếu .env | Chạy npm.cmd run setup |
| Cannot find module | Chạy npm.cmd ci tại folder có package.json |
| Port already in use | Tắt tiến trình dev cũ ở đúng terminal, không chạy hai backend |
| Web nối broker nhưng ESP stale | Kiểm tra MQTT connected trong Serial, config.h có đúng topic .env không |
| IMU configuration FAILED / null | Kiểm tra đang dùng diagram.json của bản 3 với esp:D21, esp:D22 |
| Unknown part chip-rg-motor | Tạo Custom Chip rg-motor và chép cả hai file chip trước |
| ArduinoJson API lỗi | Kiểm tra libraries.txt dùng bản 7 theo file cung cấp |
| MQTT connect thất bại | Chạy npm.cmd run probe:public; kiểm tra Internet/port 1883/broker. Không suy rằng Node kết nối được thì Wokwi Gateway cũng đã nối được |
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

Môi trường đã dùng: Node 24.11.1, npm 11.6.2; dependency đúng lockfile: Express 5.3.0, MQTT.js 5.16.1, React/React DOM 19.3.1, ws 8.22.0, Vite 7.3.7, Aedes 0.51.3. GCC/G++ 13.2.0 có sẵn; không cài Arduino CLI, PlatformIO hoặc bộ ESP32 lớn.

| Phần | Bằng chứng / giới hạn |
|---|---|
| npm ci và setup | Đã chạy; giữ topic riêng, firmware/backend cùng broker/topic; có test bảo toàn cấu hình và che giá trị lỗi |
| Node/React và MQTT local | **13/13 test đạt, không skip**; thêm read lỗi không mắc vòng lặp, OFF reason, ACK trước render, ACK muộn 94660/2021 ms, SUBACK sau reconnect và chuỗi 15 lệnh/12 renew qua MQTT/WS thật với peer synthetic |
| Logic firmware | Cùng `motor_control.h`/`rpm_reader.h` được G++ biên dịch và chạy native; không phải firmware ESP32 |
| Custom chip | GCC chạy model với API stub; proof của người dùng có RPM tới 461.5385 từ Wokwi. Chưa nghiệm thu đủ dải và mọi tình huống dừng trong simulator |
| Backend và frontend thực tế | Smoke tiến trình riêng đạt ở lượt đầu. Lượt điều tra ACK hiện vướng port 3000 đang dùng nên không tính smoke cũ là bằng chứng bản mới; test tích hợp cổng riêng và build bản mới vẫn đạt |
| Broker công cộng | Lượt đầu HiveMQ đạt pub/sub và backend thật; proof sau đó cho thấy dữ liệu Wokwi đã lên web ít nhất một lần nhưng reconnect/ACK chưa ổn. Chưa xác định nguyên nhân reconnect từ log cũ |
| Chưa xác nhận | Compile/chạy firmware bản vá ACK mới, render/click UI mới, START→ACK→renew ổn định và mọi tình huống dừng/mất mạng trong Wokwi; chưa nghiệm thu motor vật lý |

Lượt đầu công cụ Computer Use tự dừng vì không xác định chắc URL Chrome. Lượt điều tra ACK đọc proof do người dùng cung cấp và sửa/test mã; không điều khiển Wokwi hoặc chạy lại firmware mới. Mục 5–7 vẫn cần kiểm chứng bản vá, không đánh dấu nghiệm thu chỉ từ test Node/native. Project Wokwi đã có từ lượt trước chỉ cần thay sketch.ino, motor_control.h và thêm mqtt_support.h; restart Node rồi reload cứng web.

Lệnh tự kiểm từ đúng thư mục dự án:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run smoke:local
npm.cmd run probe:public
```

`smoke:local` cần hai port 3000/5173 đang trống; script không thay `.env`, chỉ bind loopback và tự đóng tiến trình thử. Dừng các terminal dev của bạn trước khi chạy smoke. Các test MQTT cần hệ điều hành cho phép TCP loopback; môi trường sandbox ban đầu chặn EACCES, nên lượt kiểm chứng đã chạy bằng quyền bổ sung được xét duyệt, không thay chính sách bảo mật Windows.

Log/kết quả hiện tại ở [MQTT_ACK_INVESTIGATION.md](ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/docs/MQTT_ACK_INVESTIGATION.md) và `docs/evidence/mqtt-ack-*`; VALIDATION.md giữ biên bản lượt đầu. Khi gặp lỗi Wokwi, cung cấp: toàn bộ compile log nếu có; Serial nguyên văn từ BOOT, một full command_id, terminal TRACE/diagnostics JSONL và Console RG_TRACE. File proof/serial_log.txt hiện là mô tả yêu cầu, cần log Serial thật để kết luận lượt cũ. Không gửi `.env` hoặc thông tin đăng nhập. Dữ liệu synthetic không dùng làm bằng chứng dao động/cộng hưởng.

Tài liệu chính thức đã đối chiếu:

- https://docs.wokwi.com/guides/esp32-wifi — Wi-Fi/gateway/local host.
- https://docs.wokwi.com/chips-api/getting-started — tạo custom chip.
- https://docs.wokwi.com/guides/libraries — libraries.txt và phiên bản.
- https://docs.wokwi.com/parts/wokwi-mpu6050 — gia tốc cấu hình theo g, 1g = 9.80665 m/s².
- https://github.com/wokwi/wokwi-elements/blob/main/src/esp32-devkit-v1-element.ts — tên chân D21/D22/D25/D26/D33 của board trên sơ đồ.
- https://docs.wokwi.com/chips-api/gpio và https://docs.wokwi.com/chips-api/time — pin/timer/get_sim_nanos.
- https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html — LEDC 3.x theo pin; nhánh 2.x dùng channel.
- https://www.hivemq.com/mqtt/public-mqtt-broker/ — broker công cộng dùng thử.
- https://test.mosquitto.org/ — broker thử nghiệm, port và giới hạn sử dụng.
- https://github.com/arduino-libraries/ArduinoMqttClient/blob/master/src/MqttClient.h — beginMessage biết trước kích thước, timeout và retained.
- https://github.com/mqttjs/MQTT.js — MQTT client Node.

Sổ tay đối chiếu thực tế trong workspace: `RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md`, SHA-256 `71b1cfb942eb3dc689b2bb3fae8ee180b25691ca3b656d56f8bdb3cd35ebdc26`. PDF quy định: `TCTA_QUY ĐỊNH ĐỒ ÁN CUỐI KỲ.pdf`, 4 trang; không sửa hai tài liệu gốc.
