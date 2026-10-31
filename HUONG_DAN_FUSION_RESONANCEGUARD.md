# Bắt đầu dựng ResonanceGuard bằng Autodesk Fusion

Đây là hướng dẫn mô hình bố trí cho báo cáo, chưa phải bản gia công. Không sử dụng phân công cũ. Có thể dùng ảnh chụp màn hình để hướng dẫn từng bước tiếp theo.

## 1. Dựng gì trước?

Thứ tự đề xuất: đế → ngàm và thanh → cảm biến/gá → mô hình kích thước linh kiện → hộp điện/nắp → module motor/Hall → cổng/nút/đi dây → bản vẽ chú thích.

Dựng các cụm ngoài trước để xác định không gian; hộp điện bọc cụm linh kiện đã bố trí. Không nhốt thanh vào hộp vì thanh cần khoảng trống để dao động. Chưa chốt motor gắn trên thanh hay đế thì dựng module motor rời, chưa khóa vị trí cơ khí.

## 2. Chuẩn bị bản thiết kế

1. Mở thiết kế mới trong workspace Design; lưu tên `ResonanceGuard_Layout_v01`.
2. Trong Browser, kiểm Document Settings → Units, đặt mm nếu chưa đúng.
3. Nếu phiên bản có các loại Part/Assembly/Hybrid, dùng Hybrid để dựng nhiều internal component trong một thiết kế. Nếu giao diện khác, chụp Browser và thanh công cụ để xác định cách tương ứng.
4. Mở Modify → Change Parameters, thêm các tham số dưới đây.

**Tất cả giá trị dưới chỉ dùng tập thao tác và minh họa bố trí.** Chưa xác nhận độ bền, khả năng in, vừa linh kiện hoặc phù hợp thực nghiệm. Thay bằng kích thước đo trước khi làm bản cuối.

| Tham số | Giá trị minh họa | Mục đích |
|---|---:|---|
| base_L | 360 mm | Dài đế |
| base_W | 180 mm | Rộng đế |
| base_T | 10 mm | Dày đế |
| box_L | 120 mm | Dài hộp điện |
| box_W | 80 mm | Rộng hộp điện |
| box_H | 45 mm | Cao thân hộp |
| wall_T | 3 mm | Thành/đáy hộp tập vẽ |
| lid_T | 3 mm | Dày nắp tập vẽ |

Không tự lấy kích thước PCB/motor từ các con số minh họa trên. Cần đúng biến thể linh kiện và chỗ cắm dây/cổng.

## 3. Bài đầu tiên: tạo đế

1. Kích hoạt thiết kế gốc ở đầu Browser. Dùng Assemble → New Component, tạo component `P01_De`; chọn internal (bỏ External) nếu giao diện có và thiết kế cho phép. Activate component đó.
2. Create Sketch → chọn mặt phẳng XY.
3. Chọn Rectangle → Center Rectangle. Đặt tâm tại origin, tạo hình chữ nhật và nhập kích thước `base_L` × `base_W`. Dùng Sketch Dimension nếu lúc vẽ chưa nhập đủ hai kích thước; tâm trùng origin và kích thước cố định.
4. Finish Sketch → Extrude (E), chọn miền chữ nhật, nhập `base_T`, Operation = New Body trong component đế.
5. Fit để thấy toàn bộ, lưu thiết kế. Kết quả: một tấm 360 × 180 × 10 mm, Browser có component `P01_De`, bên trong có Sketch và Body; Timeline có Sketch/Extrude.

**Điểm kiểm tra đầu tiên:** chụp ảnh có toàn bộ đế, Browser bên trái và Timeline phía dưới. Chỉ sau khi đúng mới tiếp tục ngàm/thanh. Chưa bo góc, khoan hoặc thêm vật liệu để tránh phải sửa nhiều khi đổi kích thước.

## 4. Các cụm tiếp theo

| Component | Cách dựng dự kiến | Cần xác nhận trước khi chốt |
|---|---|---|
| P02_Ngam | Hai má kẹp và vị trí vít; thanh bị kẹp ở một đầu | Kích thước/vật liệu thanh, bề rộng kẹp, độ chắc của ngàm |
| P03_Thanh | Sketch chữ nhật → Extrude chiều dày; thể hiện chiều dài tổng và đoạn tự do | Kích thước thật, chiều uốn, chiều dài hữu hiệu, khoảng trống dao động |
| P04_MPU_Ga | Khối PCB đơn giản, lỗ bắt/gá, mũi tên trục nếu cần | Đúng board MPU, vị trí đo, tải gắn thêm, dây không căng |
| P05_HopDien | Khối hộp → Shell bỏ mặt trên, hướng Inside, dày wall_T | Linh kiện đã bố trí, chỗ cắm USB, đầu nối và lối đi dây |
| P06_Nap | Component riêng, sketch theo thân → Extrude lid_T | Cơ cấu vít/trụ đỡ, độ hở, tháo lắp; không mặc định nắp đặt chồng là đã lắp được |
| P07_ESP32 | Khối theo kích thước PCB thực, thêm cổng USB dạng đơn giản | Biến thể board, lỗ gá, chiều cao chân/cổng và khoảng rút cáp |
| P08_Driver | Khối PCB/terminal và gá | Driver thực dùng, mức công suất, thông gió nếu cần |
| P09_Motor_Ga | Cylinder/khối theo motor, trục và gá thành component riêng | Motor/gá/kích lệch tâm thực, vị trí truyền lực và che chắn |
| P10_Hall_Ga | Khối cảm biến và gá chỉnh vị trí | Khoảng cách nam châm/cảm biến theo thiết bị và kiểm thử thực tế |
| P11_CheChan | Vỏ che phần quay và khoảng hở | Đường bao quay, tiếp cận bảo trì, cách bắt chắc vào cụm cố định |
| P12_Nguon_DauNoi | Khối nguồn/đầu nối, công tắc và nút theo thiết kế chọn | Adapter ngoài hay nguồn trong, đường cấp điện, vị trí thao tác STOP |

Mỗi bộ phận riêng tạo component trước rồi dựng hình bên trong. Không đặt mọi Body vào một component duy nhất. Khối điện tử chỉ cần thể hiện kích thước và vị trí lắp, chưa cần vẽ từng linh kiện SMD.

## 5. Khi mô hình đã đủ cụm

- Kiểm kích thước, va chạm, khoảng rút cáp, đường đi dây và khoảng dao động. Tách vùng mạch điều khiển khỏi phần chuyển động theo bố trí thực tế.
- Lỗ gá/cổng phải theo thiết bị đã đo; không chọn kích thước chỉ dựa vào phối cảnh đẹp.
- Hộp mở nắp hoặc Section Analysis để thấy cấu trúc trong. Khi cần hình tách cụm, giữ phiên bản lắp đúng và tạo bản thể hiện riêng.
- Xuất góc phối cảnh, mặt trước/trên/bên, mở nắp/mặt cắt. Chú thích mã Pxx và lập bảng mã–tên–chức năng; có kích thước tổng và vị trí quan trọng. Chú thích có thể đặt trên bản Drawing hoặc thêm vào ảnh trong report miễn rõ và đúng mô hình.
- Lưu file Fusion gốc chỉnh sửa được; ảnh trong report phải khớp phiên bản đó. Không dùng ảnh sản phẩm có sẵn thay thiết kế.

## 6. Tài liệu chính thức đã đối chiếu

- Autodesk – New Component: https://help.autodesk.com/view/fusion360/ENU/?contextId=ASM-NEW-COMPONENT
- Autodesk – Change Parameters: https://help.autodesk.com/view/fusion360/ENU/?contextId=SLD-MODIFY-CHANGE-PARAMETERS
- Autodesk – Shell: https://help.autodesk.com/view/fusion360/ENU/?contextId=MODEL-SHELL-CMD

Menu có thể khác theo phiên bản; lấy ảnh giao diện người dùng làm căn cứ trước khi chỉ từng nút.
