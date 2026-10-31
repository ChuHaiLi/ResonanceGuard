# Ngữ cảnh ResonanceGuard để tiếp tục hướng dẫn Fusion trong ChatGPT/Codex

Cập nhật theo yêu cầu ngày 31/10/2026. Đọc file này trước khi hướng dẫn. Đây là bản bàn giao cho cuộc trò chuyện mới, không phải bản phân công hay xác nhận sản phẩm đã hoàn thành.

## Yêu cầu hiện tại của người dùng

- Phân công nhóm đã thay đổi. **Không dùng các file Markdown phân công cũ**, không lấy tên người, tỷ lệ, vai trò hoặc mốc 6 ngày từ đó làm ràng buộc hiện tại. Chưa có phân công mới được xác nhận.
- Ưu tiên hướng dẫn người mới tự dựng thiết bị bằng Autodesk Fusion (Fusion 360), từng bước nhỏ qua ảnh chụp màn hình.
- Mỗi lượt hướng dẫn khoảng 3–5 thao tác; nói rõ chọn gì, lệnh gì, nhập gì và kết quả mong đợi. Đọc ảnh giao diện thực tế để điều chỉnh; không đoán vị trí nút khi chưa nhìn thấy.
- Khi có code, dùng Allman brace style nếu ngôn ngữ cho phép.
- Chưa được tự nhận các kích thước CAD minh họa là kích thước thật, tự chọn model linh kiện cuối, hay khẳng định motor đã truyền lực vào thanh theo một cách nhóm chưa chốt.

## Sản phẩm và ba luồng

ResonanceGuard là mô hình học tập giám sát rung của thanh công xôn, đo tốc độ motor và điều khiển motor qua IoT. Thanh công xôn có một đầu ngàm, một đầu tự do. MPU6050 gắn trên thanh để đo gia tốc. Cảm biến Hall và nam châm là phương án đo tốc độ dự kiến trong tài liệu ý tưởng; mô phỏng hiện có dùng xung TACH từ custom motor.

1. MPU6050 → I²C → ESP32 → MQTT qua broker → backend → WebSocket → frontend.
2. Hall/xung tốc độ → GPIO/ngắt ESP32 → tính RPM → MQTT/broker → backend → frontend.
3. Frontend → HTTP API/backend → MQTT/broker → ESP32 → GPIO/PWM → driver/motor. Có phản hồi ACK/state và RPM đo độc lập.

Backend Express, frontend React. WiFi là kết nối mạng; MQTT là giao thức ứng dụng; JSON là định dạng payload. PWM là lệnh điều khiển, không phải số đo RPM. ACK chấp nhận lệnh không đồng nghĩa rotor đã quay/dừng.

## Thiết kế cơ khí cần thể hiện

- Đế đỡ và ngàm kẹp thanh.
- Thanh công xôn với chiều dài hữu hiệu tính từ mép ngàm đến đầu tự do.
- MPU6050, gá cảm biến và dây đủ chùng để không vô tình ghìm thanh.
- Cụm motor, gá motor, cảm biến tốc độ/marker hoặc nam châm, che phần quay theo cấu hình nhóm chốt.
- Hộp điện: thân, nắp, trụ đỡ PCB, ESP32, driver, đầu nối/nguồn, lối đi dây, USB, nút STOP/công tắc theo thiết kế thực tế.
- Motor gắn trên thanh và motor đặt trên đế là hai phương án vật lý khác nhau. **Chưa khóa vị trí hay cơ chế truyền lực trong bản bàn giao này**; có thể dựng module motor tách rời trước, chưa cắt lỗ gá cố định vào thanh/đế.
- Laptop/web là phần bên ngoài; không cần giả vẽ laptop thành linh kiện nằm trong hộp thiết bị.

Mục tiêu bản vẽ: thấy rõ hình ngoài và bên trong, kích thước quan trọng, vị trí/vai trò các bộ phận. Nên có phối cảnh, trước/trên/bên, mở nắp hoặc mặt cắt và hình tách cụm. Dùng mã P01… và bảng mã–tên–chức năng. Không dùng ảnh sản phẩm có sẵn thay bản thiết kế nhóm.

## Hiện trạng và giới hạn

Theo README đọc ngày 31/10/2026, bản 03 là mô phỏng Wokwi kết hợp backend/frontend; dữ liệu được ghi synthetic. README mô tả điều khiển, RPM, gia tốc, log/CSV và lỗi ACK cần kiểm chứng lại. Không chạy lại test hoặc mô phỏng trong lượt tạo bản bàn giao này.

README nêu chưa có FFT/ringdown/baseline/lưu phiên đầy đủ/cloud/xác thực và chưa nghiệm thu motor thật. Tài liệu ý tưởng/sổ tay có các phần đó ở mức thiết kế; không gọi tất cả là đã triển khai. Tần số lấy mẫu 200 Hz là mục tiêu minh họa cần xác minh, không suy từ bản tin gửi khoảng 250 ms. Đỉnh FFT khi motor chạy không tự là tần số riêng hay bằng chứng hư hỏng.

## File để đọc khi có quyền truy cập thư mục

Workspace hiện tại: `D:\VSCode\HCMUS\VLCNTT\ResonanceGuard`.

- `ToiHieu.md`: ý tưởng và diễn giải ba luồng; có chỗ đơn giản hóa vật lý, phải đối chiếu sổ tay.
- `RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md`: sổ tay thiết kế dài hạn, cơ sở vật lý, BOM và phương án điện/cơ; không phải xác nhận nhóm đã làm xong.
- `README_HUONG_DAN.md`: phạm vi mô phỏng và giới hạn; một số đường dẫn cũ có thể lỗi thời.
- `ResonanceGuard_03_IOT_INTEGRATION/`: theo kiểm kê hiện tại có `firmware/sketch.ino`, `firmware/diagram.json`, `server/app.js`, `web/src/main.jsx`. Kiểm lại file thực tế trước khi dựa vào hướng dẫn đường dẫn cũ.
- `TCTA_QUY ĐỊNH ĐỒ ÁN CUỐI KỲ.pdf`: quy định môn học, mỗi người một luồng hoàn chỉnh, các thiết bị I/O giữa luồng khác nhau, tích hợp cùng project, hiểu bài khi vấn đáp. PDF cho phép vẽ phác thảo bằng nhiều hình thức; Fusion là công cụ nhóm muốn dùng, không phải bắt buộc riêng của PDF.
- `VLCNTT.pdf`: report khóa trước để tham khảo bố cục, không sao chép và không lấy nội dung làm đặc tả ResonanceGuard. Người dùng lưu ý report đó bị trừ điểm về phân công/tỷ lệ và flow chưa chi tiết.
- **Bỏ qua mọi file phân công cũ khi xác định yêu cầu hiện tại.**

Nếu chat mới không đọc được thư mục máy, người dùng đính kèm file này và PDF quy định; thêm ToiHieu/sổ tay khi cần đào sâu. Không khẳng định đã đọc file chỉ vì tên file xuất hiện ở đây.

## Cách bắt đầu phiên hướng dẫn mới

Đọc ảnh giao diện Autodesk Fusion hiện tại. Kiểm người dùng đang có thiết kế hay mới mở app, loại thiết kế (Part/Assembly/Hybrid nếu giao diện có), đơn vị mm và cây Browser/Timeline. Ưu tiên dùng component riêng cho từng bộ phận. Kích thước thật của thanh, motor, PCB, nguồn và phương án gá chưa biết thì hỏi khi tới bước cần chúng; vẫn có thể tập tạo đế bằng kích thước minh họa trước.

Tài liệu từng bước đầu tiên: `HUONG_DAN_FUSION_RESONANCEGUARD.md` trong cùng thư mục.
