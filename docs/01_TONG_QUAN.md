# Tổng quan và thiết kế

Phạm vi đối chiếu ngày **03/11/2026**: mã demo `03_IOT_INTEGRATION`, tài liệu CAD/báo cáo local và hồ sơ kiểm thử lưu từ ngày 27/10. **Đích cuối là thiết bị thật**; bản Wokwi chỉ minh họa cho nhóm xem luồng web/backend. Đây không phải biên bản chạy thử mới. Đọc tiếp [kiến trúc](02_KIEN_TRUC.md), [cách chạy](03_CHAY_MO_PHONG.md) và [kiểm thử](04_KIEM_THU.md).

## 1. Mục tiêu và ba luồng

Mục tiêu của đồ án là đo độ rung của vật khi chịu lực tác động tuần hoàn từ bên ngoài để xác định liệu vật có xuất hiện cộng hưởng khi tần số kích thích gần một tần số riêng của vật hay không, từ đó đưa ra cảnh báo hỗ trợ an toàn, hướng tới ứng dụng giám sát cầu, cầu vượt và máy móc trong nhà máy.

ResonanceGuard hướng tới bộ thí nghiệm thật về rung của thanh công xôn: đo gia tốc tại thanh, đo tốc độ quay motor và điều khiển motor qua giao diện. Phần phân tích cần được xây dựng/kiểm chứng để đáp ứng mục tiêu cộng hưởng và cảnh báo. Mã hiện có mới là nền demo các đường dữ liệu và lệnh IoT; chưa có bản firmware phần cứng được nghiệm thu.

Ba luồng của thiết bị thật dự kiến là **MPU6050 → Website**, **Hall/encoder → RPM → Website** và **Website → driver → motor** qua ESP32/MQTT/backend. Hall/encoder là thiết bị đo riêng với motor. Website/backend hiện có được tái sử dụng sau khi cập nhật hợp đồng dữ liệu và kiểm thử trên thiết bị; không cần giữ Wokwi trong buổi demo thật.

| Luồng trong bản 03 | Đường thực thi | Giới hạn kết luận |
|---|---|---|
| Gia tốc | MPU6050 Wokwi → I²C → ESP32 → MQTT → backend → WebSocket → React | Chứng minh truyền/hiển thị dữ liệu mô phỏng khi có log; chưa phải đo đáp ứng thanh |
| RPM | Motor custom → TACH → ngắt ESP32 → RPM → MQTT → backend → web | Tốc độ của mô hình motor, chưa nghiệm thu Hall thật |
| Điều khiển | Web → HTTP → backend → MQTT → ESP32 → PWM/EN → motor custom | Phải đối chiếu HTTP, ACK ứng dụng, state và RPM riêng |

Nơi thực thi: `firmware/sketch.ino:169–199,246–339,463–525`, `server/app.js:107,158–277,295–342`, `web/src/main.jsx:86–116,142–203` trong [thư mục demo bản 03](../ResonanceGuard_03_IOT_INTEGRATION/).

## 2. Ba mức trạng thái

| Mức | Nội dung | Không được suy ra |
|---|---|---|
| Thiết kế dự kiến | Phần cứng thực, truyền lực motor–thanh, sampler đều, FFT, ringdown, sweep, baseline, lưu phiên/SQLite | Đã có trong chương trình hoặc đã chế tạo |
| Có trong code | Telemetry từng điểm, TACH/RPM, START/STOP/duty, ACK, lease, JSONL/CSV | Đã chạy đúng trên Wokwi hoặc phần cứng |
| Có bằng chứng chạy | Log test local và CSV/ảnh cũ, với ngày và điều kiện cụ thể | Toàn hệ thống hiện tại đạt hoặc đã quan sát cộng hưởng |

`03_IOT_INTEGRATION` là tên nguyên mẫu phần mềm; không đồng nghĩa mốc MVP 3 trong sổ tay. Không dùng số test PASS thay bằng chứng firmware chạy trên Wokwi. Bảng trạng thái chi tiết ở [kiểm thử](04_KIEM_THU.md).

## 3. Những khái niệm dùng khi thuyết trình

- **Gia tốc** là số đo chuyển động theo từng trục; trọng lực mặc định gần 1 g ở một trục không có nghĩa thanh đang rung. Giá trị chuẩn 1 g = 9,80665 m/s² cũng là hệ số firmware dùng để chuyển đơn vị.
- **Duty PWM** là tỷ lệ thời gian mức bật trong một chu kỳ; khác với tần số PWM. Bản 03 phát PWM 1.000 Hz, điều khiển duty tối đa 80%. Duty không phải số đo RPM và không bảo đảm tốc độ cố định khi tải đổi.
- **Tần số quay** bằng RPM/60. Chỉ khi cơ cấu tạo một chu kỳ lực chính mỗi vòng mới liên hệ trực tiếp giá trị đó với tần số kích thích chính.
- **FFT** phân tích một đoạn tín hiệu theo tần số. Một đỉnh khi motor chạy có thể là đáp ứng ở tần số cưỡng bức hoặc bội tần; không tự xác nhận tần số riêng hoặc cộng hưởng.
- **Tần số lấy mẫu và nhịp gửi MQTT khác nhau.** Nhánh code gửi khoảng 250 ms hiện đọc một bộ ax/ay/az; không phải sampler 200 Hz. Không nội suy telemetry thưa rồi gọi là dữ liệu đo 200 Hz.

Nguồn gốc: [sổ tay §2](../RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md), [ý tưởng và ví dụ FFT](../ToiHieu.md), [giải thích PWM/RPM](../ResonanceGuard_So_do_Cong_huong_PWM.md). Các file gốc được giữ nguyên. Ví dụ 200 Hz/200 mẫu trong nguồn chỉ cho khoảng bin cơ bản 1 Hz; giá trị 14,5 Hz là ví dụ diễn giải, không phải số đo của project.

### Phương pháp thực nghiệm dự kiến

Khi đã có phần cứng, đường lấy mẫu và dữ liệu đủ chất lượng:

1. Motor dừng, kéo–thả nhỏ để thu dao động tự do; kiểm chất lượng và đo lặp trước khi gọi một đỉnh là mode ứng viên.
2. Sau khi chốt cơ cấu truyền lực, quét nhiều nấc RPM ở hai phía vùng quan tâm, chờ ổn định và ghép RPM với cửa sổ gia tốc tương ứng.
3. Xử lý phù hợp với mô hình kích thích: lực lệch tâm thay đổi theo tốc độ, nên không lấy điểm gia tốc lớn nhất làm bằng chứng cộng hưởng.
4. Khi so sánh cấu hình, thực hiện A–B–A với điều kiện tương đương. Baseline/ngưỡng đánh giá phải được cố định trước tập kiểm mới; sai khác không tự chứng minh hư hỏng.

Đây là phương pháp đề xuất từ sổ tay §9 và sơ đồ lý thuyết, **chưa có pipeline hoặc kết quả thực nghiệm tương ứng trong bản 03**.

## 4. CAD và hình dáng của mô hình

Nguồn chính cho mục 4.1 là gói local `ResonanceGuard_Muc_4_1_4_2_DayDu/resonanceguard_chuong4/`, gồm bản thảo, ảnh phối cảnh/các mặt nhìn, SVG chú thích, mặt cắt, tháo rời và PDF tổng thể. **Gói này không nằm trong bản GitHub được chia sẻ.** CAD thể hiện bố trí đế, ngàm/thanh, cảm biến/gá, hộp điện và module motor có che chắn; không chứng minh thiết bị đã chế tạo hoặc kết cấu đủ bền. Số lượng component trong CAD không phải bảng mua vật tư đã chốt.

Các điểm phải giữ khi biên tập:

- **P17 là đĩa tốc độ**, P18 là dấu chuẩn nam châm; không tự đổi tên thành khối lệch tâm.
- P11/P12 là hình bao ESP32/driver; các trụ thuộc P13 dùng bắt nắp, không tự gọi là gá PCB.
- P29/P30 là tuyến dây minh họa, chưa mô tả từng lõi hoặc đường công suất.
- Đế 360 × 180 × 10 mm, mặt bằng hộp 120 × 80 mm và thân hộp cao 45 mm là kích thước CAD minh họa, không thay kích thước linh kiện thật.
- Chưa có cơ cấu motor truyền lực vào thanh được chốt và kiểm chứng. Motor đặt trên đế gần thanh chưa chứng minh kích thích thanh.

Đối chiếu nhãn và bảng Pxx trong bản thảo cùng `images/*ChuThich.svg`; không lấy bảng Pxx dự kiến trong hướng dẫn Fusion cũ thay bảng của mô hình đã xuất.

### Tiếp tục dựng hoặc chỉnh Fusion

Ưu tiên component riêng cho mỗi bộ phận, đơn vị mm và tham số kích thước; xác nhận Browser/Timeline thực tế trước khi chỉ thao tác. Với người mới, hướng dẫn khoảng 3–5 thao tác mỗi lượt, dựa trên ảnh giao diện. Đo đúng biến thể PCB, motor, cổng và khoảng rút dây trước khi chốt lỗ/gá; không lấy kích thước tập vẽ làm bản chế tạo.

Các bước tập dựng đế, tham số mẫu và nguồn Autodesk được giữ trong [hướng dẫn Fusion lịch sử](archive/2026-10-31/HUONG_DAN_FUSION_RESONANCEGUARD.md). Khi xuất báo cáo, giữ cả thiết kế Fusion chỉnh sửa được nếu có, ảnh gốc, SVG chú thích và PDF; không tự suy rằng workspace đã có file Fusion gốc chỉ vì đã có ảnh.

## 5. Phạm vi tài liệu gốc và công việc tiếp theo

[Sổ tay dài hạn](../RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md) giữ nguyên lý thuyết, BOM/giá tham khảo, phương án điện/cơ, lộ trình thực nghiệm và câu hỏi bảo vệ tại thời điểm biên soạn. Giá, model linh kiện, phân công và lịch trong đó không được coi là quyết định hiện tại. Không phục hồi hoặc dùng bản phân công/kế hoạch cũ; chờ nhóm cung cấp bản mới.

Ưu tiên hiện tại: kiểm kê bộ đo ESP32/MPU6050/thanh/ngàm; xây đường lấy mẫu đều và thu rung thật; đo dao động tự do lặp lại trước khi chọn motor/cơ cấu kích thích. Sau đó chốt Hall, driver, nguồn, gá/che, sơ đồ điện và STOP; cập nhật CAD theo linh kiện đã chọn. Khi lắp thêm motor/gá cần đo lại đáp ứng của cấu hình mới.

Tiếp theo tái sử dụng web/backend để hoàn thiện ba luồng thật, phân tích/cảnh báo và các mục nâng cao. Wokwi là lựa chọn kiểm tra hồi quy giao tiếp, không phải điều kiện để được chuyển sang demo thật. Chưa tuyên bố đã phát hiện cộng hưởng hoặc đã cảnh báo an toàn trên cầu/máy móc thật. Điều kiện và bằng chứng cần thu ở [kiểm thử và giới hạn](04_KIEM_THU.md).
