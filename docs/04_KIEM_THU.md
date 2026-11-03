# Kiểm thử, bằng chứng và giới hạn

Cập nhật tài liệu ngày **03/11/2026** bằng đọc mã và hồ sơ; **không chạy test, build, Wokwi, backend hoặc probe broker trong lượt này**. Mã demo nằm trong [03_IOT_INTEGRATION](../ResonanceGuard_03_IOT_INTEGRATION/), hiện đã chuyển từ hai cấp thư mục sang một cấp. Đích dự án là thiết bị thật; các test/log dưới đây kiểm phần demo và không thay nghiệm thu phần cứng. Mốc Git của lượt rà soát trước là `a6990f75f0c0e6dfcc0c6d256c27b4d4b6341614`, nguồn mã từ commit `eca02be72e4992c3933a3c1cfbaa3eecbdb7c72e`. Log không nhúng hash build nên không ghép chắc từng lần chạy với firmware hiện tại.

## 1. Mã test có sẵn

Đường dẫn dưới tính từ thư mục mã bản 03. **Đã có mã test, chưa chạy trong lượt này.**

| Loại | Nguồn và phạm vi | Giới hạn |
|---|---|---|
| Native C++ | `tests/native.test.js`, `tests/motor_control.cpp`: motor/lease/dedup/boot/deadline/STOP/mất mạng, RPM và lỗi đọc MQTT | Include header logic thật; không build sketch cho ESP32; thiếu compiler sẽ skip |
| Native C custom chip | `tests/native/chip_test.c`: include motor C thật, thử vùng chết/duty/RPM/PPR/EN/quán tính | Wokwi API được stub, không phải runtime simulator |
| Unit protocol/frontend | `tests/protocol.test.js`: validator, SI/quality/range, ControlSession/ACK timeout/epoch, stale từng kênh | Không render/click React trong trình duyệt |
| Setup | `tests/setup.test.js`: sinh cấu hình khớp, giữ file hợp lệ, từ chối cấu hình không hỗ trợ | Thử cấu hình fixture; không kiểm giá trị bí mật đang chạy |
| Integration MQTT/HTTP/WS | `tests/integration.test.js`: Aedes loopback, backend thật, Node peer đóng vai ESP | Không chạy firmware hoặc MPU/TACH GPIO |
| Robustness | `tests/robustness.test.js`: retain/schema/boot/stale/reconnect, ACK muộn/trùng, START/renew/STOP, hủy command QoS1 | Clock và ACK peer synthetic, không chứng minh thời gian thực trên Wokwi |
| Smoke | `scripts/smoke-local.mjs`: backend và Vite thành tiến trình riêng, asset/proxy/HTTP/WS | Peer synthetic; không kiểm browser render/click/ESP32 |
| Public probe | `scripts/probe-public.mjs`: hai Node client QoS1, diagnostic không retain | Không kiểm gateway Wokwi/ESP32; có gửi ra broker ngoài |

Nguồn giới hạn rõ trong `tests/native.test.js:8–25`, `tests/integration.test.js:28–36,60–79`, `tests/robustness.test.js:184–248`, `scripts/smoke-local.mjs:80–114`, `scripts/probe-public.mjs:5–38`.

## 2. Kết quả lịch sử ngày 27/10/2026

Log gốc ở [evidence của bản 03](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/); không chỉnh nội dung lỗi/thành công. Hồ sơ lượt đầu ghi Windows, Asia/Bangkok; môi trường được ghi là Node 24.11.1, npm 11.6.2, GCC/G++ 13.2.0. Đây là môi trường lịch sử, không phải kết quả kiểm phiên bản đang cài hôm nay. Các phiên bản dependency lịch sử được giữ trong [biên bản](archive/2026-10-27/VALIDATION.md), không thay lockfile.

| Bằng chứng | Kết quả được lưu | Chỉ được kết luận |
|---|---|---|
| [tests.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/tests.txt) | Lượt đầu 10 test, không fail/skip | Các kiểm tra local của lượt đó đạt |
| [mqtt-ack-tests.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/mqtt-ack-tests.txt) | 13 test; có native, protocol, MQTT/HTTP/WS | Không thay bằng chứng firmware chạy Wokwi |
| [mqtt-ack-final.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/mqtt-ack-final.txt) | 13 pass/build exit0; smoke exit1 do cổng 3000 đang dùng; sketch chưa compile/chạy lại trong Wokwi ở đợt điều tra | Không dùng smoke cũ làm kết quả bản vá |
| [smoke-local.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/smoke-local.txt) | Lượt smoke trước đạt asset/proxy/command/ACK fixture | Không có browser click, ESP hoặc Wokwi |
| [build.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/build.txt), [mqtt-ack-build.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/mqtt-ack-build.txt) | Build frontend cũ thành công, tên asset khác nhau giữa lượt | Không chứng minh runtime của bản hiện tại |
| [public-hivemq.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/public-hivemq.txt), [backend-public.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/backend-public.txt) | Hai Node client và một probe backend từng kết nối; START bị từ chối khi chưa có state ESP | Không chứng minh gateway hoặc firmware |
| [public-broker.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/public-broker.txt), [public-mosquitto.txt](../ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/public-mosquitto.txt) | CONNACK timeout của các lượt khác | Không được bỏ lỗi hoặc gán kết quả đó cho trạng thái mạng hôm nay |

Chuỗi 15 command/12 renew trong test robustness dùng clock điều khiển và peer synthetic; không phải chạy Wokwi 15 giây thời gian thực. Lượt đầu ghi công cụ Computer Use không thao tác Wokwi thành công; đó là giới hạn của lượt kiểm thử cũ, không chứng minh không có project Wokwi của nhóm.

### Bằng chứng do người dùng thu và JSONL cũ

**Thư mục `proof/` không còn trong workspace hiện tại.** Các nhận xét sau được giữ từ hồ sơ rà soát trước, không phải đối chiếu lại tệp gốc trong lượt cập nhật/push này. Không dùng chúng làm minh chứng mới hoặc tạo lại ảnh/log thay thế.

- `proof/resonanceguard-synthetic.csv` từng được ghi nhận có dữ liệu từ 27/10/2026 20:28:25 +07:00 và RPM tới 461,5385; gap lớn 94.660 ms trên máy nhưng 2.021 ms theo ESP. Không suy fs từ thời gian nhận MQTT.
- `proof/web.png` từng ghi WS/broker đã nối nhưng ESP/MPU/RPM STALE, thông báo thiếu ACK; không phải ảnh nghiệm thu ổn định.
- `proof/serial_log.txt` được xác định là mô tả yêu cầu điều tra, **không phải Serial nguyên văn**; chưa đủ xác định nguyên nhân OFF.
- Rà soát trước ghi nhận `data/telemetry-1793111871788.jsonl` có 124 event trong khoảng 21:48:53–21:55:25 ngày 27/10: 42 state, 41 gia tốc, 41 RPM, không có ACK/state RUN. Đây là tệp sinh khi chạy, không thuộc bản Git được chia sẻ; số liệu này không phải kết quả đọc lại trong lượt cập nhật tài liệu hiện tại.

Không dùng nhận xét lịch sử “JSONL đều rỗng” hoặc việc có JSONL mới hơn làm kết luận toàn tuyến command/ACK đã đạt. Khi cần nghiệm thu phải thu lại log đúng phiên bản và điều kiện chạy.

<a id="chan-doan-ack"></a>
## 3. Chẩn đoán ACK theo một command ID

| Tầng | Trace | Ý nghĩa |
|---|---|---|
| ESP nhận/quyết định | `COMMAND` với id, boot, t_ms, deadline, lease_until, accepted/reason | Chưa chứng minh ACK lên mạng |
| ESP xếp/gửi | `ACK QUEUED` → `ACK PUBLISH` → `ACK BROKER_CONFIRMED` | PUBACK chỉ xác nhận broker nhận ACK ứng dụng |
| ESP lỗi | `PUBLISH FAIL`, `ACK DROP`, `MQTT DOWN detail=...` | Xác định pha lỗi; queue full hoặc lỗi mạng dẫn tới dừng theo logic |
| Backend nhận/kiểm | `ACK_RX` → `ACK_ACCEPT` hoặc `ACK_DROP` | Có thể loại do schema/retain/boot/ID, duplicate/seq/clock hoặc quá 5 giây theo máy |
| Backend → browser | `ACK_WS_SEND`, có thể `ACK_WS_ERROR` | Đã xếp gửi tới socket, chưa phải React xử lý |
| Frontend | `FRONT_HTTP_REGISTER`, `FRONT_ACK_RX`, `FRONT_ACK_DECISION` | `start_armed` mới bật renew; ACK sớm có thể được xét lại sau HTTP_REGISTER |
| Ngừng điều khiển | `FRONT_DISARM`, `FRONT_ACK_TIMEOUT`, `FRONT_HTTP_DROP_OLD_EPOCH` | Không cho HTTP/ACK cũ bật renew lại |

Vị trí code: `firmware/sketch.ino:69–86,155,210–241,309–337`; `server/app.js:158–209,254–275,321–340`; `web/src/main.jsx:70–83,107–129,185–217`.

Tại thư mục bản 03, người vận hành có thể tra log local bằng full ID đã thu:

```powershell
$commandId = 'FULL-COMMAND-ID'
Select-String -Path .\data\diagnostics-*.jsonl -SimpleMatch -Pattern $commandId
Invoke-RestMethod "http://127.0.0.1:3000/api/commands/$commandId" | ConvertTo-Json -Depth 8
```

API chỉ giữ 100 command trong RAM; sau restart dùng JSONL. Console bật Preserve log và lọc `RG_TRACE`. Không ghép lịch sử bằng vài ký tự đầu ID hoặc tự dựng lại Serial còn thiếu.

Đợt sửa 27/10 xác định từ code lỗi vòng đọc `available()>0/read()==-1`, cửa sổ race health trước React render và thiếu trace; chưa chứng minh đó là nguyên nhân duy nhất của lượt Wokwi cũ. Keepalive khi simulator chậm, gateway/mạng, client ID trùng và STOP khác vẫn là giả thuyết cần log đúng lượt. Không tăng timeout hoặc bỏ boot/deadline/dedup để che lỗi. Các đồng hồ/giới hạn được mô tả tại [kiến trúc](02_KIEN_TRUC.md).

## 4. Các điều chưa được xác nhận

| Chức năng | Có code | Bằng chứng còn thiếu |
|---|---|---|
| Gia tốc/RPM | Có telemetry và TACH/RPM | Thử động đầu vào và kiểm full pipeline của đúng firmware hiện tại |
| START/STOP/duty/ACK | Có command, state, ACK và frontend | Chuỗi ACK/renew ổn định, GPIO và các tình huống dừng trong Wokwi hiện tại |
| Lease/reconnect | Có logic native và mạng/UI | Mốc renew/OFF theo clock ESP, reconnect/reset không tự chạy trên simulator |
| STOP độc lập | Chỉ có STOP GPIO | Đường cắt VM/công suất và phản hồi phần cứng; không thể nghiệm thu bằng unit test |
| FFT/ringdown/sweep/baseline | Chưa tìm thấy pipeline trong firmware/server/web/tests/scripts | Bộ lấy mẫu phù hợp, thuật toán, dữ liệu và kiểm chứng riêng |
| Lưu phiên/SQLite | JSONL/CSV có; quản lý phiên/SQLite chưa thấy | Run/config ID, cấu hình/kết quả, mở lại phiên hoặc DB thực thi |
| Cộng hưởng/thử phần cứng | CAD và mô hình điện/tốc độ đơn giản | Cơ cấu truyền lực, dữ liệu gia tốc thật, điều kiện/lặp/đối chứng |

Phạm vi tìm mã: `firmware/`, `server/`, `web/src/`, `tests/`, `scripts/`, manifest dependency của bản 03; không lấy mô tả kế hoạch làm bằng chứng thực thi. Chưa thấy Python/NumPy được gọi thực sự. Không kết luận vượt ra ngoài phạm vi đã tìm.

Khi có lần chạy mới, ghi ngày/múi giờ, commit và thay đổi chưa commit, phiên bản firmware đã nạp, core/toolchain nếu có, nguồn dữ liệu, điều kiện mạng/mô phỏng và thao tác; giữ log thô, cả lỗi. Dùng ba bộ minh chứng ở [hướng dẫn demo](03_CHAY_MO_PHONG.md#minh-chung). Không gọi test local PASS là cả Wokwi–MQTT–Web hoặc thí nghiệm cộng hưởng PASS.

<a id="ho-so-lich-su"></a>
## 5. Hồ sơ lịch sử và nguồn tham khảo

| Hồ sơ | Vai trò và lưu ý |
|---|---|
| [VALIDATION 27/10](archive/2026-10-27/VALIDATION.md) | Biên bản lượt đầu; giữ số 10 test, ACK QoS0 và tám file như lịch sử, không dùng làm hướng dẫn hiện tại |
| [Điều tra MQTT/ACK 27/10](archive/2026-10-27/MQTT_ACK_INVESTIGATION.md) | Giữ nguồn proof, phân tích, giả thuyết và kết quả bản vá; nhận xét JSONL phản ánh thời điểm đọc hồ sơ |
| [Kế hoạch báo cáo cũ nhận từ remote](archive/2026-10-29/PHAN_CONG_REPORT_TRIET_HAI_THANH_6_NGAY.md) | Giữ nguyên từ commit ngày 29/10 để bảo toàn lịch sử; không áp dụng tên người, tỷ lệ, vai trò hoặc mốc sáu ngày cho kế hoạch hiện tại |
| [Ngữ cảnh Fusion 31/10](archive/2026-10-31/CONTEXT_FUSION_CHATGPT.md) | Bàn giao cuộc trò chuyện cũ, có đường dẫn máy và trạng thái cũ; không phải phân công |
| [Bài dựng Fusion](archive/2026-10-31/HUONG_DAN_FUSION_RESONANCEGUARD.md) | Tham số tập vẽ và nguồn Autodesk, bảng Pxx dự kiến; bảng Pxx hiện dùng nằm trong gói báo cáo |
| Snapshot rà soát 03/11 trong gói báo cáo local | Tệp `tai_lieu/KetQua_KiemTra_Codex_CLI_2026-11-03.md` thuộc gói `ResonanceGuard_Muc_4_1_4_2_DayDu/`, không đưa lên GitHub; đường dẫn/số dòng và git status là thời điểm rà soát trước khi tổ chức tài liệu |

Trong snapshot 03/11, các dẫn chiếu cũ `P/docs/VALIDATION.md` và `P/docs/MQTT_ACK_INVESTIGATION.md` nay tra tại hai hồ sơ archive 27/10 ở trên. Không coi trạng thái Git/JSONL hoặc kế hoạch nêu trong snapshot là hiện trạng được chạy kiểm chứng lại. Prompt trong gói báo cáo là hồ sơ vòng rà soát đã hoàn thành, không cần gửi lại chỉ để xác nhận lần nữa.

[Sổ tay gốc](../RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md), [ToiHieu](../ToiHieu.md), [sơ đồ lý thuyết](../ResonanceGuard_So_do_Cong_huong_PWM.md) và PDF quy định được giữ nguyên. Ba tài liệu chỉ được sổ tay dẫn tên — `LY_THUYET_RESONANCE_GUARD.md`, `BAI_TOAN_THUC_TE_VA_UNG_DUNG.md`, `RESONANCE_GUARD_TECHNICAL_REVIEW.md` — chưa tìm thấy trong workspace; các liên kết thiếu đó thuộc nguồn gốc chưa sửa, không được hiểu là tài liệu đã đọc.

Phân công/kế hoạch cũ không còn phù hợp theo nhóm; không dùng các vai trò, tỷ lệ hoặc lịch trong hồ sơ cũ làm ràng buộc hiện tại. Chờ bản mới do nhóm cung cấp.

## 6. Nghiệm thu đích thiết bị thật

Giữ ba luồng dự kiến với thiết bị riêng: MPU6050→Web, Hall/encoder→RPM→Web, Web→driver/motor. Chứng minh nguồn dữ liệu thật và đồng bộ firmware/backend/UI; không đổi nhãn synthetic thành đo thật khi chưa có phép đo.

Các mốc cần có: raw/timing cảm biến và đo rung tự do lặp lại; sơ đồ/linh kiện/bảng chân được chốt; Hall/PPR/RPM; kiểm đầu ra, STOP công suất, lease và phục hồi; sau đó phân tích/cảnh báo trên dữ liệu có cấu hình và chất lượng rõ ràng. Điều kiện triển khai xem [mục chuyển sang thiết bị thật](03_CHAY_MO_PHONG.md#thiet-bi-that).

Tiêu chí cảnh báo phải được định nghĩa và kiểm tra riêng. Một cảnh báo stale/ACK, một đỉnh FFT hoặc RPM gần tần số tham chiếu không tự chứng minh cộng hưởng hay mất an toàn. Cloud/tài khoản/Wi-Fi provisioning và các mục nâng cao là phần bổ sung sau khi nền đo/điều khiển thật hoạt động; chưa được ghi là đã có code hoặc đã đạt điểm.
