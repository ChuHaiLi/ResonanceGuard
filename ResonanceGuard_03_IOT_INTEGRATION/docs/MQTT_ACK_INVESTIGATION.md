# Điều tra MQTT/ACK từ proof — 27/10/2026

**Kết quả:** đã sửa lỗi đọc payload có thể mắc vòng lặp, sửa cửa sổ race của trạng thái kết nối frontend, thêm xác nhận broker cho ACK và trace theo command_id. Chưa khẳng định đã tìm ra nguyên nhân duy nhất của lượt Wokwi cũ hoặc đã chạy ổn bản firmware mới trong Wokwi.

## 1. Bằng chứng đã đọc

| Nguồn | Điều xác nhận được |
|---|---|
| `proof/resonanceguard-synthetic.csv` | 164 dòng telemetry, source synthetic; RPM lớn nhất **461.5385**. Motor custom/encoder và đường RPM đã hoạt động ít nhất một lần theo bối cảnh thử do người dùng cung cấp |
| Hai dòng CSV liền nhau có gap lớn nhất | `received_at` tăng **94660 ms**, `t_device_ms` tăng **2021 ms** (24587 → 26608). Các gap khác gồm 39135/1055 ms và 11108/241 ms. Không thể lấy khoảng nhận trên máy làm thời gian mẫu ESP |
| `proof/web.png` | WS/broker hiện đã nối, ESP/MPU/RPM STALE; boot hiển thị `80ec5d8b`; thông báo không nhận ACK cho ID bắt đầu **dd08d51a** |
| `proof/serial_log.txt` | File hiện chứa mô tả yêu cầu điều tra, **không chứa Serial gốc**. Không có đủ command_id hoặc dòng ACK/publish để ghép lịch sử cũ |
| JSONL tìm trong workspace | Hai file telemetry hiện có đều rỗng, không có ACK lịch sử để đối chiếu |

Theo mô tả của người dùng, ESP chấp nhận hai START, RUN=1/PWM=77 và OFF sau khoảng 3.3 s / 0.21 s tính từ RUN. Đây là thông tin người dùng cung cấp, chưa đối chiếu được với Serial nguyên văn. **Không suy nguyên nhân OFF chỉ từ thời lượng RUN:** lease bắt đầu lúc xử lý START/renew, không bắt đầu lại lúc đèn RUN sáng. Cần command timestamp, lease_until và reason ở đúng lần chuyển đầu ra.

CSV chỉ chứa telemetry được xuất, không có command_id/ACK/boot và không đảm bảo là toàn bộ lịch sử broker. Gap trong CSV không tự chứng minh broker hoàn toàn không nhận gói hoặc mô phỏng chạy chậm liên tục; có thể có tạm dừng, trễ mạng hoặc thiếu dữ liệu ở những tầng khác.

## 2. Lần theo ACK trong mã

| Tầng | Log mới | Ý nghĩa / nếu dừng tại đây |
|---|---|---|
| ESP nhận lệnh | `COMMAND t_ms=... action=... id=... boot=... accepted=... reason=... lease_until=... deadline=...` | Đã parse và quyết định lệnh; chưa chứng minh ACK đã gửi |
| ESP tạo ACK | `ACK QUEUED id=... seq=... t_ms=... depth=...` | ACK trong hàng đợi 8 phần tử; chưa lên mạng |
| ESP gửi | `ACK PUBLISH ... bytes=... qos=1` | Bắt đầu gửi JSON biết trước độ dài |
| Broker xác nhận ESP | `ACK BROKER_CONFIRMED id=... dt_device_ms=...` | endMessage QoS1 nhận PUBACK; **chưa chứng minh backend/frontend xử lý ACK** |
| ESP gửi lỗi | `PUBLISH FAIL ... phase=begin/write/end`, `ACK DROP ...` | Có số byte/kết quả/độ trễ, sau đó MQTT bị ngắt và motor dừng theo bảo vệ |
| Backend nhận | `TRACE ... stage=ACK_RX command_id=... boot_id=... seq=...` | Broker đã giao bản tin tới MQTT.js |
| Backend kiểm | `ACK_ACCEPT` hoặc `ACK_DROP reason=... age_ms=...` | Lý do: schema, retained, boot, command không biết/đã hủy, trùng ACK/seq, clock lùi, hoặc `ack_wall_timeout` |
| Backend → WS | `ACK_WS_SEND sent=... skipped=...`, có thể có `ACK_WS_ERROR` | Số socket được xếp gửi; chưa phải xác nhận ứng dụng React |
| Frontend nhận | Console `RG_TRACE` / `FRONT_ACK_RX` | WS đã giao cho handler trong trình duyệt |
| Frontend quyết định | `FRONT_ACK_DECISION decision=... healthy=... renew_active=...` | `start_armed` mới bật renew; ACK sớm có thể tạm `no_matching_pending_or_early_ack` rồi được thử lại sau HTTP_REGISTER |
| Frontend không tiếp tục | `FRONT_DISARM`, `FRONT_ACK_TIMEOUT`, `FRONT_HTTP_DROP_OLD_EPOCH` | Không cho ACK/HTTP cũ sau STOP, mất WS, boot mới hoặc timeout bật lại renew |

`COMMAND_BROKER_PUBACK` của backend là broker xác nhận **gói command**, khác `ACK_BROKER_CONFIRMED` của ESP là broker xác nhận **gói ACK ứng dụng**, và cả hai khác `ACK_ACCEPT` của backend.

Backend lưu trace vào `data/diagnostics-*.jsonl`, tách khỏi telemetry. Website hiển thị đầy đủ ID lệnh thủ công gần nhất, có link xem `/api/commands/<full-id>`; bộ nhớ API giữ tối đa 100 lệnh. Sau restart backend phải xem file JSONL cũ.

PowerShell tại thư mục có package.json, thay chuỗi ID bằng ID thật từ web/Serial:

```powershell
$commandId = 'FULL-COMMAND-ID'
Select-String -Path .\data\diagnostics-*.jsonl -SimpleMatch -Pattern $commandId
Invoke-RestMethod "http://127.0.0.1:3000/api/commands/$commandId" | ConvertTo-Json -Depth 8
```

Trong DevTools Console, bật Preserve log và lọc `RG_TRACE` hoặc command_id. Không dùng chỉ 8 ký tự trên ảnh cũ để khẳng định đã ghép đúng UUID.

## 3. Phát hiện và sửa đổi

### Lỗi xác định từ mã, chưa chứng minh là nguyên nhân của lượt cũ

1. **Vòng đọc có thể không kết thúc:** ArduinoMqttClient 0.1.8 trả `available()` theo số byte payload còn phải đọc. Nếu TCP/read lỗi, `read()` có thể trả -1 mà độ dài còn lại không giảm. Vòng `while (mqtt.available())` cũ không kiểm -1 nên có thể mắc mãi trong callback. `mqtt_support.h` giờ trả lỗi ngay, dừng kết nối/motor và ghi `command_read_failed_or_truncated`. Native test giữ available()>0/read()==-1 xác nhận chỉ đọc một lần rồi thoát.
2. **Health frontend cập nhật theo render:** ref cũ được cập nhật khi App render, còn ACK xử lý ngay trong WS callback. State mới và ACK có thể đến trước lần render kế tiếp, khiến ACK hợp lệ dùng health cũ và không bật renew. `ConnectionHealth` giờ cập nhật đồng bộ tại callback snapshot/state/open/close. Test kiểm state mới ngay trước ACK, không cần chờ render.
3. **Thiếu quan sát:** log cũ không có publish ACK, lý do backend loại hay lý do OFF. Đã thêm chuỗi log ở mục 2; không hồi dựng log không có trong proof.

### Cải thiện giao nhận và kết nối

- ACK đổi **QoS0 → QoS1**, non-retained; telemetry vẫn QoS0, command QoS1. Broker PUBACK có nghĩa rõ trong log. Timeout MQTT vẫn **1000 ms theo ESP**, keepalive vẫn **10000 ms**, deadline command vẫn state_device_time +3000 ms, lease vẫn **4000 ms theo ESP**, ACK/HTTP timeout vẫn **5000 ms theo máy**. Không tăng timeout hoặc bỏ boot/deadline/dedup để che lỗi.
- Connect ESP chỉ ghi `MQTT connected` sau khi **subscribe/SUBACK thành công**. Có log attempt/client_id/granted QoS/lỗi subscribe. Gửi thiếu byte hoặc endMessage thất bại vẫn fail closed.
- Backend quản lý subscribe rõ ràng sau mỗi connect, đợi đủ SUBACK trước nhận lệnh; tắt cơ chế tự resubscribe trùng của MQTT.js vì ứng dụng đã tự subscribe. Test reconnect đã kiểm trạng thái sẵn sàng, không nhầm TCP/MQTT connect với đã nhận topic ACK.
- ESP dùng client ID có hash namespace + boot nonce 64 bit và in ID mỗi lần connect; backend giữ UUID riêng. Giảm nguy cơ đụng giữa các project. **Chưa có bằng chứng client ID cũ thực sự trùng.** Hai bản sao cùng project/config vẫn phải đối chiếu log và chỉ chạy một mô phỏng thiết bị rg01.
- Có log PINGREQ, số byte ping ghi được, lần nhận TCP gần nhất theo ESP, lỗi begin/write/end, poll chậm/mất kết nối. MQTT 3.1.1 không cung cấp mã nguyên nhân khi broker đóng socket; `poll_disconnected_no_mqtt3_reason_code` không được diễn giải thành một nguyên nhân cụ thể chưa biết.
- ACK mới kèm `command_t_device_ms` và `lease_until_device_ms`; backend kiểm đúng kiểu uint32 và ghi vào ACK_RX. Có thể đối chiếu clock ESP của lúc xử lý lệnh/lúc tạo ACK với tuổi lệnh trên máy. Chỉ là metadata, không thay điều kiện chấp nhận lệnh.
- State thêm `stop_reason`, `last_command_id`. OUTPUT ghi reason và command_id tương ứng đầu ra đã áp dụng; logger nằm ngoài control task. Nếu nhiều chuyển trạng thái xảy ra trong lúc vòng mạng bận, `skipped` cho biết đã bỏ qua bao nhiêu revision; không giả vờ đó là log mọi cạnh GPIO.

### Lý do OUTPUT OFF

`local_stop`, `lease_expired`, `mqtt_lost`, `command_stop`, `ack_queue_full`, hoặc trạng thái đầu `boot`. Khi motor đã OFF, lần kiểm MQTT tiếp theo không ghi đè nguyên nhân dừng đầu tiên. Mất MQTT có thêm `MQTT DOWN detail=...` để biết từ read, publish, subscribe, poll hay kiểm kết nối.

### Những giả thuyết còn cần log mới

- **Keepalive theo thời gian broker khi Wokwi chậm/tạm dừng:** MQTT 3.1.1 yêu cầu broker đóng kết nối khi không nhận control packet trong 1.5 lần keepalive. Với giá trị hiện tại 10 s là khoảng 15 s theo broker. Nếu phía ESP không chạy/gửi kịp theo thời gian thực, broker có thể đóng dù lease 4 s của đồng hồ ESP chưa hết. Nhưng gap telemetry CSV **không chứng minh** trong khoảng đó broker không nhận packet; cần PING/transport/ACK trace mới. Không đổi keepalive thành 0 hoặc tăng để tránh phát hiện mất điều khiển.
- **Gateway/broker/network làm mất TCP hoặc write/publish lỗi:** phù hợp hiện tượng reconnect nhưng chưa đủ log để phân biệt. Public Gateway được Wokwi mô tả có tốc độ/độ ổn định thấp hơn Private Gateway; đây là đặc tính dịch vụ, không phải chứng minh nguyên nhân của lượt này.
- **ACK đã tới backend nhưng bị loại quá 5 s, hoặc bị hủy khi backend mất MQTT:** mã cũ có những nhánh đó. Test tái hiện đúng gap 94660 ms/2021 ms cho thấy ACK muộn bị từ chối; chưa chứng minh ACK cũ dd08d51a đi qua nhánh đó.
- **Client ID trùng, STOP cục bộ hoặc STOP khác:** chưa có log để xác nhận hay loại trừ. Dòng `MQTT connected` lặp lại chỉ xác nhận nhiều lần kết nối, không cho biết ai đóng kết nối.

Nguồn đã đối chiếu: [ArduinoMqttClient 0.1.8](https://github.com/arduino-libraries/ArduinoMqttClient/blob/0.1.8/src/MqttClient.cpp) cho available/read/endMessage/subscribe/poll; [MQTT 3.1.1 §3.1.2.10](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html) cho keepalive; [Wokwi Gateway](https://docs.wokwi.com/guides/esp32-wifi); [WiFiClient 2.0.17](https://github.com/espressif/arduino-esp32/blob/2.0.17/libraries/WiFi/src/WiFiClient.h) và [NetworkClient 3.3.2](https://github.com/espressif/arduino-esp32/blob/3.3.2/libraries/Network/src/NetworkClient.h) cho wrapper read/write.

## 4. Kiểm thử bản vá

- **npm.cmd test: 13/13 pass, 0 fail, 0 skip.** Bao gồm test cũ, đọc payload lỗi, OFF reason, state→ACK trước render, late ACK/duplicate ACK, trace nhận/loại/WS, SUBACK sau reconnect, STOP/boot/deadline/dedup/lease và hủy command QoS1 cũ.
- Test chuỗi **15 lệnh**: START, 6 renew, set_duty, 6 renew, STOP qua MQTT Aedes/HTTP/WS thật, ACK QoS1; mọi ACK ghép đúng ID, frontend giữ active qua renew và OFF sau STOP; không có ACK_DROP. Peer ESP là synthetic; clock test tiến 15 s, **không phải bài chạy 15 s thời gian thực hoặc Wokwi**.
- **npm.cmd run build: pass.** React build thành công; không xác nhận browser render/click của bản mới.
- `npm.cmd run smoke:local` chưa chạy được trong lượt này: **EADDRINUSE port 3000** đang được dùng. Không dừng tiến trình của người dùng. Các test tích hợp dùng cổng riêng vẫn chạy đủ; smoke lượt trước được ghi riêng, không tính là kết quả của bản vá này.
- Native test dùng đúng `motor_control.h`, `mqtt_support.h`, `rpm_reader.h`; custom chip C dùng API stub. **Chưa compile/chạy sketch ESP32, QoS1 ArduinoMqttClient hoặc wrapper WiFiClient mới trong Wokwi.**

Xem [log test](evidence/mqtt-ack-tests.txt), [log build](evidence/mqtt-ack-build.txt) và [kết quả xác nhận cuối](evidence/mqtt-ack-final.txt). Các log bằng chứng dùng fixture synthetic, không phải log Wokwi của người dùng.

## 5. Cập nhật và thử lại

**Chỉ cần thay/thêm 3 file trên project Wokwi hiện có:**

1. Thay `sketch.ino` bằng `firmware/sketch.ino` mới.
2. Thay `motor_control.h` bằng `firmware/motor_control.h` mới.
3. Tạo tab **mqtt_support.h**, chép `firmware/mqtt_support.h` mới.

Giữ `config.h`, `rpm_reader.h`, diagram, libraries và hai file chip hiện tại nếu chưa tự thay đổi. Không cần đổi broker/topic hay chạy setup để áp dụng bản vá này. Tổng project hiện có 9 file.

Dừng mô phỏng trong lúc cập nhật. Dừng backend cũ bằng Ctrl+C tại terminal của bạn rồi chạy từ workspace:

```powershell
Set-Location '.\ResonanceGuard_03_IOT_INTEGRATION\ResonanceGuard_03_IOT_INTEGRATION'
npm.cmd run build
npm.cmd run dev
```

Reload cứng website http://localhost:3000, mở DevTools Console/Preserve log. Không chỉ reload web trong khi Node cũ vẫn chạy, vì module backend không tự nạp lại. Dependencies không đổi, không cần npm ci lại.

- [ ] Chỉ một Wokwi cùng namespace đang chạy; giữ tab mô phỏng hoạt động, ghi tốc độ mô phỏng nếu Wokwi hiển thị.
- [ ] Serial có BOOT/client_id, CONNECT, SUBACK thành công. Backend có MQTT_SUBACK ready=true. Web có state mới trước START.
- [ ] START 30%, lưu **full command_id**. Thấy COMMAND → ACK QUEUED → ACK PUBLISH → ACK BROKER_CONFIRMED; backend ACK_RX → ACK_ACCEPT → ACK_WS_SEND; Console FRONT_ACK_RX → start_armed.
- [ ] Theo dõi ít nhất 12 renew liên tiếp được ACK đúng ID, không chỉ START được chấp nhận; RUN/PWM giữ, RPM có quality hợp lệ. Nếu có OFF, lấy reason + lease_until + COMMAND t_ms, không suy từ khoảng sáng LED.
- [ ] STOP web: OUTPUT reason=command_stop, RUN/PWM OFF/0; STOP đỏ khi đang RUN: reason=local_stop; sau thả vẫn OFF.
- [ ] Đóng web/tắt backend/thử mất MQTT: OFF với reason đúng, không tự chạy sau phục hồi. Không chạy lại chỉ vì có ACK cũ hoặc state snapshot cũ.

Lưu Serial **nguyên văn từ BOOT**, terminal backend TRACE, `data/diagnostics-*.jsonl`, `data/telemetry-*.jsonl`, Console RG_TRACE và CSV. Nếu ACK còn lỗi, chỉ cần một full ID cùng các file này để biết tầng dừng; không gửi `.env` hoặc thông tin đăng nhập.

Không mở rộng FFT/baseline; tất cả dữ liệu mô phỏng vẫn synthetic. Bản vá cải thiện đường START/ACK/renew và khả năng chẩn đoán, chưa bảo đảm một kết nối bị tạm dừng hàng chục giây có thể giữ RUN khi các bảo vệ vẫn có hiệu lực.
