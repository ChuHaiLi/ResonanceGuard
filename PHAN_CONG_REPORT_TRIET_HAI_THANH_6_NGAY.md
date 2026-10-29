# PHÂN CÔNG NỘI DUNG REPORT – TRIẾT, HẢI, THÀNH

**Dự án:** ResonanceGuard. **Thời gian:** 6 ngày tương đối, tính từ ngày nhóm bắt đầu.  
**Phạm vi:** chuẩn bị nội dung report PDF, PPTX, mô phỏng minh họa, bản thiết kế Fusion 360 và luyện vấn đáp. Không đồng nghĩa hoàn thành chế tạo sản phẩm trong 6 ngày.  
**Bản phân công đề xuất:** giữ nguyên ba phần nhóm đang giao; dùng thay phần phân công chuẩn bị report trong kế hoạch 6 ngày trước. Nhóm điền họ tên đầy đủ, MSSV, mã nhóm, ngày lịch và chỉ định nhóm trưởng trước khi nộp.

## 1. Vai trò và cách tính tỷ lệ

| Thành viên | Phần phụ trách theo phân công hiện tại | Đầu ra bổ sung để đủ bộ nộp | Giờ dự kiến | Tỷ lệ trên toàn bộ công việc report |
|---|---|---|---:|---:|
| Triết | Giới thiệu đề tài; luồng hoạt động; mô tả cấu trúc bên trong | BOM gắn với cấu trúc; ghép và định dạng PDF | 17 | 34% |
| Hải | Mô phỏng hệ thống; thiết kế 3D Fusion 360 | Hình mô phỏng có minh chứng; bản vẽ có kích thước/chú thích; ghép PPTX | 18 | 36% |
| Thành | Chức năng sản phẩm và web | Bảng phân công; kế hoạch tới sản phẩm; checklist yêu cầu và bộ nộp | 15 | 30% |
| **Tổng** | | | **50 giờ-người** | **100%** |

**Công thức:** tỷ lệ của một đầu việc = giờ dự kiến của việc đó / 50 × 100%. Tổng tỷ lệ thành viên = tổng tỷ lệ các đầu việc người đó phụ trách. Các tỷ lệ ở bảng chi tiết là phần trăm của **toàn bộ công việc report**, không phải phần trăm riêng trong phần của mỗi người. Đây là dự toán, chưa phải đóng góp thực tế; sau khi làm cần cập nhật theo nhật ký và sản phẩm bàn giao.

## 2. Bảng phân công chi tiết để đưa vào report

Mỗi mã có đúng một người chịu trách nhiệm hoàn thành đầu ra. Người kiểm tra chéo góp ý; chủ sở hữu nội dung phải sửa. Khung giờ đã gồm phối hợp và sửa nhỏ trong phạm vi đầu việc.

| Mã | Người phụ trách | Công việc cụ thể | Sản phẩm bàn giao / tiêu chí hoàn thành | Thời gian | Giờ | Tỷ lệ |
|---|---|---|---|---|---:|---:|
| T01 | Triết | Viết bối cảnh, vấn đề và lý do chọn đề tài | Nêu nhu cầu giám sát rung/tốc độ, đối tượng sử dụng và ý nghĩa vật lý/IoT; có nguồn cho nhận định cần dẫn chứng | Ngày 1 | 2 | 4% |
| T02 | Triết | Viết mục tiêu và phạm vi sản phẩm | Tên thống nhất; phân biệt thật/giả lập, hiện có/dự kiến/tùy chọn; không tuyên bố rung lớn chứng minh hư hỏng | Ngày 1 | 1,5 | 3% |
| T03 | Triết | Mô tả cấu trúc bên trong và lập bảng linh kiện | Nêu vai trò, vị trí, nguồn/tín hiệu của ESP32, MPU, Hall, driver/motor; BOM có số lượng, đơn giá, thành tiền, tổng, nguồn giá/ngày tra cứu | Ngày 2 | 2 | 4% |
| T04 | Triết | Vẽ và thuyết minh hai luồng dữ liệu cảm biến | Tách luồng MPU và Hall; ghi I²C/GPIO-xung → ESP → MQTT/broker → backend → WebSocket → frontend; có topic, payload, đơn vị và chiều truyền | Ngày 2 | 2 | 4% |
| T05 | Triết | Vẽ và thuyết minh luồng điều khiển cùng phản hồi | Web → HTTP API → backend → MQTT/broker → ESP → PWM/GPIO → driver/motor; vẽ ACK/state/RPM quay về, nhánh lỗi/mất kết nối/STOP | Ngày 3 | 2 | 4% |
| T06 | Triết | Viết thuyết minh cách xử lý dữ liệu và nguyên lý vật lý | Nêu nơi tính RPM/FFT nếu chọn, đơn vị, lấy mẫu khác nhịp gửi, PWM khác RPM, ACK khác motor đã quay; kiểm tính thống nhất giữa sơ đồ và lời văn | Ngày 3 | 1,5 | 3% |
| T07 | Triết | Đối chiếu cấu trúc mô tả với mô hình 3D của Hải | Bảng mã bộ phận/vị trí/thiết bị; phát hiện thiếu cổng, đường dây, nguồn, gá; gửi Hải danh sách sửa cụ thể | Ngày 4 | 1 | 2% |
| T08 | Triết | Ghép và định dạng báo cáo PDF | Bìa, mã nhóm/tên/MSSV, mục lục, font thống nhất, canh đều đoạn văn, số trang, hình/bảng/chú thích và tham khảo; ghép bản đủ nội dung | Ngày 4–5 | 2 | 4% |
| T09 | Triết | Sửa phần giới thiệu/flow/cấu trúc và xuất PDF cuối | Sửa theo review của Hải/Thành; kiểm từng trang, nguồn giá, hình, mục lục; PDF khớp PPTX | Ngày 5–6 | 2 | 4% |
| T10 | Triết | Chuẩn bị lời trình bày và luyện vấn đáp phần mình | Giải thích từng mũi tên/giao thức, cơ sở vật lý, cấu trúc; cung cấp nội dung slide phần mình và tham gia diễn tập chung | Ngày 6 | 1 | 2% |
| **Cộng Triết** | | | | | **17** | **34%** |
| H01 | Hải | Chốt linh kiện mô phỏng và bảng đấu nối | Bảng chân GPIO/I²C/PWM, mức nguồn, vai trò thiết bị; phân biệt sơ đồ mô phỏng và pinout vật thật dự kiến | Ngày 1 | 2 | 4% |
| H02 | Hải | Dựng/rà mô hình mô phỏng hệ thống | Sơ đồ mạch, các file firmware/cấu hình và link dự án; nêu rõ phần dùng thiết bị thay thế/custom chip và giới hạn | Ngày 1–2 | 2 | 4% |
| H03 | Hải | Kiểm ba luồng trên mô phỏng và ghi minh chứng | Kịch bản MPU, RPM, START/PWM/STOP; ảnh/log có phiên thử, kết quả mong đợi/thực tế; lỗi còn mở phải ghi rõ | Ngày 2–3 | 2 | 4% |
| H04 | Hải | Dựng thân/vỏ/đế sản phẩm trong Fusion 360 | File gốc chỉnh sửa được; kích thước tổng thể, chiều dày, nắp/vít, ngàm/thước, cổng/nút và che chắn theo cấu hình đã thống nhất | Ngày 2–3 | 3 | 6% |
| H05 | Hải | Dựng bố trí bên trong và cơ cấu gá trong Fusion 360 | ESP, cảm biến, driver, motor, nguồn, gá Hall/nam châm, đường dây và khoảng hở; khớp T03; không chỉ dựng hộp rỗng | Ngày 3–4 | 2 | 4% |
| H06 | Hải | Tạo các góc nhìn và chú thích bộ phận của mô hình 3D | Hình phối cảnh, trước/sau/trên, mở nắp/cắt và tách cụm; mã bộ phận, kích thước quan trọng và bảng đối chiếu chú thích | Ngày 4 | 2 | 4% |
| H07 | Hải | Viết mục mô phỏng và thiết kế 3D trong report | Thuyết minh ảnh/mạch/cách chạy, kết quả thử và giới hạn; bàn giao hình rõ nét cùng file gốc/link; không lấy ảnh sản phẩm có sẵn | Ngày 4–5 | 1,5 | 3% |
| H08 | Hải | Ghép PPTX từ nội dung ba thành viên | Bìa, nội dung tổng quan, hình/flow, chức năng, BOM, phân công/tiến độ, nguồn; đồng nhất với PDF | Ngày 5 | 1,5 | 3% |
| H09 | Hải | Kiểm tra chéo flow/cấu trúc của Triết và sửa phần mình | Đối chiếu từng cạnh truyền với mạch/mã mô phỏng; sửa CAD/mô phỏng theo phản hồi, chạy thử trình chiếu | Ngày 5–6 | 1 | 2% |
| H10 | Hải | Chuẩn bị lời trình bày và luyện vấn đáp phần mình | Giải thích chân dây, mô hình thật/giả lập, từng cụm Fusion, lý do bố trí và giới hạn; lưu PPTX cuối | Ngày 6 | 1 | 2% |
| **Cộng Hải** | | | | | **18** | **36%** |
| C01 | Thành | Lập bảng tóm tắt toàn bộ chức năng | Gán F-ID; đủ chức năng chính/phụ/web; mỗi mục có chủ sở hữu kỹ thuật và hiện có/dự kiến/tùy chọn | Ngày 1 | 2 | 4% |
| C02 | Thành | Mô tả chức năng đo rung và tốc độ | Mỗi chức năng có mục đích, đầu vào/xử lý/đầu ra, đơn vị, lỗi và tiêu chí thử; gửi Triết/Hải xác nhận tính khả thi | Ngày 2 | 1,5 | 3% |
| C03 | Thành | Mô tả chức năng điều khiển và bảo vệ | START/STOP/PWM, ACK, phản hồi trạng thái, STOP cục bộ, mất mạng/mất renew/reset; ghi điều kiện bật/dừng | Ngày 2–3 | 2 | 4% |
| C04 | Thành | Mô tả chi tiết chức năng website | Số liệu/đồ thị, kết nối/stale, lệnh và lỗi, log/CSV nếu chọn; ánh xạ F-ID với thành phần UI | Ngày 3 | 1,5 | 3% |
| C05 | Thành | Lập bảng phân công và kiểm tỷ lệ | Dùng mã T/H/C, mỗi việc một chủ sở hữu, giờ/tỷ lệ/mốc bàn giao; kiểm tổng toàn bảng = 100% | Ngày 3–4 | 1,5 | 3% |
| C06 | Thành | Lập kế hoạch từ đề cương tới sản phẩm hoàn chỉnh | Các đầu việc kỹ thuật cùng ID với bảng phân công sản phẩm; người làm, phụ thuộc, thời lượng, đầu ra; gồm tích hợp/test/đóng gói/demo | Ngày 4 | 1,5 | 3% |
| C07 | Thành | Lập checklist đối chiếu yêu cầu thầy | Đủ thông tin nhóm, lý do, chức năng, BOM/nguồn, hai loại bản vẽ, phân công/tiến độ, định dạng và hai file | Ngày 4–5 | 1 | 2% |
| C08 | Thành | Rà chức năng với flow, mô phỏng và 3D | Mỗi F-ID có đường xử lý/thiết bị tương ứng; phát hiện chức năng viết nhưng không có linh kiện hoặc chưa triển khai; gửi đúng người sửa | Ngày 5 | 1,5 | 3% |
| C09 | Thành | Kiểm bộ nộp và bàn giao nhóm trưởng | Đối chiếu PDF/PPTX, mã nhóm/MSSV, nguồn, tỷ lệ, tên file; sắp bộ câu hỏi chung, lưu phiên bản khóa và checklist cho người nộp | Ngày 5–6 | 1,5 | 3% |
| C10 | Thành | Chuẩn bị lời trình bày và luyện vấn đáp phần mình | Giải thích đầy đủ chức năng, lỗi và tiêu chí thử; cung cấp slide phần mình, tham gia diễn tập chung | Ngày 6 | 1 | 2% |
| **Cộng Thành** | | | | | **15** | **30%** |
| **TỔNG CỘNG** | | | | | **50** | **100%** |

**Nhiệm vụ nộp bài:** nhóm trưởng thực tế thực hiện thao tác nộp và lưu xác nhận, trong khoảng kiểm/bàn giao cuối đã dự trù; Thành chuẩn bị bộ nộp. Nếu phát sinh thêm giờ đáng kể, ghi nhật ký và tính lại tổng. Không tự coi Triết/Hải/Thành là nhóm trưởng khi nhóm chưa chọn.

## 3. Tiến độ 6 ngày và phụ thuộc

| Ngày | Triết | Hải | Thành | Mốc bàn giao chung |
|---|---|---|---|---|
| 1 | T01–T02 | H01; bắt đầu H02 | C01 | Thống nhất ý tưởng, phạm vi, chức năng và thiết bị; có bản nháp pinout |
| 2 | T03–T04 | Hoàn tất H02; bắt đầu H03/H04 | C02; bắt đầu C03 | BOM/cấu trúc nháp, flow cảm biến, sơ đồ mô phỏng và kích thước vỏ nháp |
| 3 | T05–T06 | H03/H04; bắt đầu H05 | Hoàn tất C03; C04; bắt đầu C05 | Flow đủ hai chiều, kết quả thử sơ bộ, mô hình vỏ và mô tả chức năng đầy đủ |
| 4 | T07; bắt đầu T08 | H05–H06; bắt đầu H07 | C05–C06 | Đủ hình ngoài/trong có chú thích; có bảng phân công và kế hoạch tới sản phẩm |
| 5 | T08; bắt đầu T09 | H07–H08; bắt đầu H09 | C07–C08; bắt đầu C09 | PDF/PPTX đủ bộ; mỗi lỗi review có người nhận sửa |
| 6 | T09–T10 | H09–H10 | C09–C10 | Diễn tập → sửa → khóa file → kiểm → nhóm trưởng nộp và lưu xác nhận |

- T03/H01/C01 phải trao đổi bản nháp sớm để chốt đúng linh kiện và phạm vi trước H04/H05. Mô hình 3D không cần chờ báo cáo ghép xong.
- T04/T05 dựa trên H01/H02 và giao diện mã hiện có; H09 kiểm lại theo kết quả H03. Không vẽ một hệ thống khác mô phỏng rồi ghi là đã chạy.
- H05 lấy bố trí từ T03; T07 kiểm ngược lại H05; Hải giữ trách nhiệm dựng/sửa CAD, Triết giữ trách nhiệm viết mô tả cấu trúc.
- T08 lấy bản nháp T/H/C từ ngày 4; H08 lấy nội dung từng người; C08/C09 kiểm trên cùng phiên bản. Không chờ ngày 6 mới ghép bài.
- Chốt hạn nội bộ sớm hơn hạn nộp chính thức. Lịch vấn đáp theo thông báo; cả ba xác nhận và có mặt đúng giờ, không trễ/vắng.

## 4. Tiêu chuẩn flow chi tiết để Triết vẽ và cả nhóm hiểu

Nên có **một sơ đồ kiến trúc tổng quan + ba sơ đồ luồng riêng + một sơ đồ tuần tự lệnh/ACK + một lưu đồ xử lý lỗi/dừng**. Sơ đồ cấu trúc cơ khí, sơ đồ đấu dây và flow truyền dữ liệu là các hình có mục đích khác nhau.

| Chặng cần thể hiện | Nội dung bắt buộc trên hình hoặc bảng kèm hình |
|---|---|
| MPU6050 ↔ ESP32 | I²C, SDA/SCL, chân thực dùng, nguồn/GND, cấu hình đo, đại lượng/đơn vị; tách tần số lấy mẫu khỏi nhịp publish |
| Hall → ESP32 | Xung số vào GPIO/ngắt, cạnh đếm, PPR; nơi tính RPM, trường hợp chưa đủ xung/timeout |
| ESP32 ↔ MQTT broker | MQTT trên TCP/IP qua kết nối WiFi/gateway; host/port theo cấu hình đang dùng; topic, publish/subscribe, QoS/retain đã xác minh |
| MQTT broker ↔ backend | Backend subscribe dữ liệu/ACK và publish lệnh; payload JSON, validate, command_id/boot_id, cập nhật trạng thái và log |
| Backend → frontend | WebSocket `/ws` cho dữ liệu/trạng thái realtime trong bản hiện có; nêu ws/wss theo môi trường, không ghi là MQTT trực tiếp vào trình duyệt |
| Frontend → backend | HTTP POST `/api/motor`, nội dung lệnh, phản hồi tiếp nhận; phân biệt với ACK thực thi từ ESP |
| ESP32 → driver → motor | PWM/GPIO là tín hiệu điều khiển; driver và nguồn riêng cấp công suất motor; thể hiện đường nguồn/GND phù hợp thiết kế vật thật |
| ESP32 → broker → backend → frontend | Luồng ACK/state; command_id khớp lệnh; phản hồi RUN/PWM và số đo RPM là các thông tin khác nhau |
| Nhánh lỗi | Payload sai, lệnh trùng/hết hạn, mất MQTT/WebSocket/renew, dữ liệu stale; vị trí phát hiện, hành động và điều kiện khởi động lại |

Các chặng HTTP/WebSocket/topic nêu trên được đối chiếu với `server/app.js`, `web/src/main.jsx`, `firmware/sketch.ino` của bản mô phỏng 03 hiện có. Khi report đổi sang thiết kế sản phẩm, phải cập nhật sơ đồ theo phiên bản thực tế. Dùng `PREFIX` minh họa, không đưa bí mật cấu hình vào hình.

Topic bản demo hiện có: `PREFIX/telemetry/vibration`, `PREFIX/telemetry/rpm`, `PREFIX/state`, `PREFIX/ack`, `PREFIX/cmd/motor`. Sơ đồ phải vẽ broker như một khối riêng, chỉ rõ ai publish và ai subscribe. WiFi là kết nối mạng, MQTT là giao thức ứng dụng, JSON là định dạng dữ liệu; không ghi cả ba như cùng một loại khái niệm.

Mỗi mũi tên nên có số bước, chiều truyền, giao thức/tín hiệu, dữ liệu chính. Mỗi nhánh quyết định ghi điều kiện đúng/sai và kết quả. Phân biệt mô phỏng motor/custom chip với driver điện học vật thật; mô phỏng không tự chứng minh motor thật đã được đấu và chạy.

## 5. Tiêu chuẩn Fusion 360 để Hải bàn giao

| Nhóm đầu ra | Chi tiết tối thiểu |
|---|---|
| File gốc | Thiết kế do nhóm tự dựng, chỉnh sửa được; component đặt tên; phiên bản thống nhất với hình xuất và BOM |
| Thân/vỏ/đế | Dài–rộng–cao, chiều dày dự kiến, nắp/điểm bắt vít/trụ đỡ, cổng nguồn/USB, lỗ nút/công tắc, lối đi dây; ghi đơn vị mm |
| Cụm thí nghiệm | Ngàm, thanh công xôn, chiều dài hữu hiệu, gá MPU, đế motor, vị trí Hall/nam châm và che chắn phần quay theo phương án chốt |
| Bố trí bên trong | Vị trí ESP, driver, nguồn/đầu nối, cảm biến, bó dây và khoảng hở lắp ráp/bảo trì; không dựng linh kiện sai kích thước chỉ để vừa vỏ |
| Góc nhìn | Phối cảnh; trước/sau/trên; mở nắp hoặc hình cắt; hình tách cụm nếu cần để nhìn rõ gá/vít và các cụm bên trong |
| Chú thích | Mã P01, P02… cho từng bộ phận; bảng mã–tên–chức năng–vị trí; chỉ rõ đường nguồn/đường tín hiệu nếu thể hiện |
| Kiểm thống nhất | Tên/số lượng/vị trí khớp T03, linh kiện khớp H01; ghi kích thước nào dự kiến/chưa đo, phương án gá nào chưa kiểm chứng |
| Hình cho report/slide | Ảnh rõ, nền sạch, đường dẫn chú thích không che bộ phận; chú thích hình và nguồn “Nhóm tự thiết kế bằng Fusion 360” khi đúng thực tế |

Không đưa hình sản phẩm có sẵn thay bản thiết kế. Thiết kế mô hình linh kiện để bố trí cần ghi nguồn nếu dùng mô hình thư viện; thân thiết bị, bố trí và bản phác thảo vẫn phải thể hiện thiết kế của nhóm.

## 6. Phân biệt phân công viết report và phân công làm sản phẩm

**Bảng 34% / 36% / 30% ở trên chỉ đo công việc chuẩn bị report trong 6 ngày.** Không dùng nó như bằng chứng rằng ba người đã hoàn thành sản phẩm, hoặc thay cho bảng phân công triển khai kỹ thuật mà thầy yêu cầu trong đề cương.

C06 cần lập bảng sản phẩm riêng: `SP-ID | Đầu việc nhỏ | Một người phụ trách | Đầu ra | Phụ thuộc | Thời lượng | Bắt đầu–kết thúc dự kiến | Tỷ lệ trên tổng công sức sản phẩm`. Lịch sản phẩm dùng đúng các SP-ID này; tổng tỷ lệ bảng đó cũng bằng 100%.

Vì PDF môn học yêu cầu **mỗi người một luồng hoàn chỉnh**, nhóm cần xác nhận riêng ai nhận luồng MPU, luồng Hall, luồng web → motor. Không suy ra “Thành viết chức năng” nghĩa là chỉ cần viết report, hoặc “Hải mô phỏng” nghĩa là làm hộ firmware của cả nhóm. Khi chốt người, mỗi luồng phải tách thành các việc firmware, MQTT, backend, frontend và kiểm thử, đều có người chịu trách nhiệm cụ thể.

Đối với bảng triển khai toàn sản phẩm đã có trong `PHAN_CONG_VA_KE_HOACH_RESONANCEGUARD.md`, Thành có thể dùng SP01–SP24 làm bản nháp, nhưng phải ánh xạ TV1/TV2/TV3 sang tên thật sau khi nhóm thống nhất, chỉnh giờ và lịch theo nguồn lực hiện tại. Không tự gán lại tỷ lệ sản phẩm từ tỷ lệ viết report.

## 7. Kiểm tra trước nộp

- Đủ mã nhóm, tên/MSSV ba người, tên sản phẩm, lý do, bảng chức năng và mô tả chi tiết cả sản phẩm/web.
- BOM có số lượng, đơn giá, thành tiền, tổng và nguồn giá; thiết bị trong chức năng phải xuất hiện trong BOM/thiết kế phù hợp.
- Có hình ngoài và cấu trúc trong do nhóm thiết kế; chú thích từng bộ phận; flow ghi rõ đường dữ liệu và giao thức.
- Từng đầu việc có đúng một chủ sở hữu. Phần trăm từng việc cộng ra tổng cá nhân; tổng ba cá nhân = 100%. Không tính mỗi người 100% rồi cộng thành 300%.
- Bảng phân công sản phẩm và kế hoạch tới khi hoàn thành dùng cùng task ID, có tích hợp, kiểm thử, đóng gói và tài liệu/demo.
- Font thống nhất, đoạn văn canh đều, bìa, mục lục cập nhật, tham khảo; PDF/PPTX không thiếu chữ/hình và cùng phạm vi.
- Hai file cuối là `MSSV1_MSSV2_MSSV3.pdf` và `MSSV1_MSSV2_MSSV3.pptx`, thay MSSV thật, giữ cùng thứ tự. Nhóm trưởng nộp đúng nơi/hạn và lưu xác nhận.
- Tất cả thành viên hiểu phần mình và kiến trúc chung; dự vấn đáp đầy đủ, đúng giờ. Chức năng nâng cao/thiết bị thay thế phải đối chiếu riêng với quy định, không tự suy điểm.

## 8. Căn cứ và nhật ký đóng góp

Đã đọc 12 trang `VLCNTT.pdf`, kiểm hình phác thảo, flow và bảng phân công: mục 5.1 để toàn bộ tỷ lệ ở 0%; flow ghi chung WiFi; mô tả có chỗ để trống giao thức; DHT11/DHT22 và ngưỡng nhiệt độ giữa các mục chưa thống nhất. Đây là tài liệu tham khảo bố cục của khóa trước, không phải mẫu để sao chép nội dung hoặc chuẩn tính điểm.

Quy định chính thức đối chiếu: `TCTA_QUY ĐỊNH ĐỒ ÁN CUỐI KỲ.pdf` và thông báo nộp do người dùng cung cấp. Fusion 360 và ba vai trò Triết/Hải/Thành là yêu cầu/phân công của nhóm trong cuộc trao đổi hiện tại; không mô tả Fusion 360 là công cụ bắt buộc được nêu trong PDF môn học.

Nhật ký cập nhật mỗi lần bàn giao: `Ngày | Task ID | Người thực hiện | Giờ thực tế | File/phiên bản | Kết quả kiểm tra | Việc còn lại`. Nếu phát sinh/chuyển việc, cập nhật cả số giờ, tỷ lệ và tiến độ trước khi xuất bản.
