# ResonanceGuard

Điểm vào của workspace, cập nhật ngày **03/11/2026**. **Đích của đồ án là demo thiết bị thật**: đo rung của thanh, đo RPM, điều khiển motor và phát triển phân tích/cảnh báo. Hướng ứng dụng dài hạn là giám sát cầu, cầu vượt và máy móc; chưa có bằng chứng triển khai trên các đối tượng đó.

`ResonanceGuard_03_IOT_INTEGRATION/` là **bản demo Wokwi cho các thành viên xem luồng web/backend**, không phải sản phẩm cuối. Website React và backend Express có thể tái sử dụng cho thiết bị thật sau khi điều chỉnh firmware, cấu hình, giao thức/nguồn dữ liệu và kiểm thử tích hợp. Lượt cập nhật tài liệu này không chạy chương trình, test hoặc kết nối broker/thiết bị.

## Đọc theo thứ tự

| Thứ tự | Tài liệu | Đọc để làm gì |
|---|---|---|
| 1 | [Tổng quan và thiết kế](docs/01_TONG_QUAN.md) | Hiểu mục tiêu, ba luồng, CAD và những điều chưa chứng minh |
| 2 | [Kiến trúc và giao thức](docs/02_KIEN_TRUC.md) | Tra GPIO, nguồn dữ liệu, MQTT/API, ACK, lease và lưu trữ đúng code |
| 3 | [Chạy demo và chuyển sang thiết bị thật](docs/03_CHAY_MO_PHONG.md) | Chạy bản Wokwi hiện có và theo dõi các bước tái sử dụng web/backend |
| 4 | [Kiểm thử và giới hạn](docs/04_KIEM_THU.md) | Phân biệt test local/Wokwi/phần cứng, đọc hồ sơ cũ và chẩn đoán ACK |

## Trạng thái cần nhớ

- **Có code:** đọc MPU6050 mô phỏng, truyền từng điểm gia tốc, RPM từ TACH, START/STOP/duty, ACK ứng dụng, lease, JSONL và xuất CSV.
- **Bằng chứng cũ ngày 27/10/2026:** log test local còn được giữ. Hồ sơ lịch sử mô tả dữ liệu gia tốc/RPM và ảnh web STALE/thiếu ACK; thư mục `proof/` đã được loại khỏi workspace hiện tại nên không đối chiếu lại trực tiếp các tệp đó trong lượt này. Chưa có đủ bằng chứng xác nhận bản firmware hiện tại chạy ổn định toàn tuyến hoặc thiết bị thật đã hoạt động.
- **Chưa tìm thấy triển khai:** sampler đều 200 Hz/block gia tốc, FFT, ringdown, quét tốc độ tự động, baseline A–B–A, quản lý phiên đầy đủ và SQLite.
- CAD là **minh họa bố trí**. Motor ảo và MPU6050 chưa liên kết bằng mô hình cơ học; STOP GPIO chưa phải công tắc cắt nguồn công suất độc lập.

Các kết luận và vị trí code được dẫn trong [kiến trúc](docs/02_KIEN_TRUC.md) và [kiểm thử](docs/04_KIEM_THU.md). Phân công/kế hoạch cũ không còn được dùng; chưa có bản mới được nhóm xác nhận.

## Tìm đúng thư mục

```text
README.md                         Điểm vào duy nhất của tài liệu dự án
docs/01_... đến 04_...             Bốn tài liệu chính
docs/archive/                     Review và ghi chú lịch sử
ResonanceGuard_03_IOT_INTEGRATION/
  package.json                    Thư mục chạy npm, hiện chỉ còn một cấp
  firmware/ server/ web/ tests/    Mã demo bản 03
  docs/evidence/                  Log kiểm thử cũ, giữ nguyên
  data/                           JSONL sinh khi chạy, không đưa lên Git
```

Hai thư mục `review-backup-*` còn giữ **mã nguồn lịch sử**, không phải bản để chạy demo hiện tại. Không lấy cấu hình hoặc bảng chân từ đó ghép vào bản 03.

## Báo cáo và nguồn gốc

- Gói báo cáo/CAD `ResonanceGuard_Muc_4_1_4_2_DayDu/resonanceguard_chuong4/` được giữ **local và không đưa lên GitHub** theo yêu cầu. Gói gồm bản thảo 4.1–4.2.2, ảnh/SVG/PDF và snapshot rà soát; giữ nguyên cấu trúc khi chia sẻ riêng. Repo này không đính kèm gói, nên không đặt liên kết yêu cầu người đọc GitHub phải có nó.
- [PDF quy định môn học](<TCTA_QUY ĐỊNH ĐỒ ÁN CUỐI KỲ.pdf>): tài liệu gốc, không biên tập.
- [Báo cáo tham khảo VLCNTT](VLCNTT.pdf): báo cáo của nhóm khác, **chỉ tham khảo cấu trúc/bố cục khi viết report**. Theo lưu ý của nhóm, tài liệu có nhiều lỗi; không dùng nội dung kỹ thuật, luồng, bảng phân công/tỷ lệ hoặc cách tính điểm trong đó làm mẫu đúng hay căn cứ cho ResonanceGuard. Yêu cầu môn học lấy từ PDF quy định của giảng viên.
- [Sổ tay thiết kế dài hạn](RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md): lý thuyết, BOM, phương án phần cứng và thực nghiệm; **không phải trạng thái triển khai hoặc phân công hiện tại**.
- [Giải thích ý tưởng ban đầu](ToiHieu.md) và [sơ đồ cộng hưởng/PWM](ResonanceGuard_So_do_Cong_huong_PWM.md): nguồn tham khảo gốc; các chức năng mô tả theo mục tiêu phải đối chiếu tài liệu chính trước khi đưa vào báo cáo.
- [Danh mục hồ sơ lịch sử](docs/04_KIEM_THU.md#ho-so-lich-su) giải thích ngày, điều kiện và phạm vi của từng nguồn. Các tên đường dẫn trong snapshot cũ là tên tại thời điểm ghi nhận.

Không chia sẻ `.env`, `config.h`, token hoặc mật khẩu trong báo cáo/ảnh minh chứng. Hướng dẫn chỉ dùng tên biến và vai trò cấu hình.

## Ưu tiên triển khai thiết bị thật

1. Kiểm kê/mua hoặc mượn bộ đo tối thiểu: ESP32, MPU6050, thanh, ngàm, dây và cáp USB; xác minh đúng biến thể linh kiện trước khi đấu nối.
2. Thu dữ liệu rung thật có thời gian lấy mẫu rõ ràng; đo dao động tự do lặp lại để xác định vùng tần số quan tâm.
3. Chốt motor, Hall/encoder, driver, nguồn, cơ cấu truyền lực, gá/che và đường STOP theo phần cứng thực tế; cập nhật CAD theo linh kiện.
4. Hoàn thiện ba luồng thật: MPU6050 → Web; Hall/RPM → Web; Web → driver/motor. Bổ sung phân tích/cảnh báo và các mục nâng cao sau khi nền đo/điều khiển được kiểm chứng.

Đây là trình tự dự kiến, không phải kết quả đã hoàn thành. Không cần đổi luồng Hall/RPM sang cảm biến nhiệt chỉ để phục vụ demo Wokwi.
