# Phân công và kế hoạch ResonanceGuard — Vật lý cho CNTT, 24C11

**Loại tài liệu:** kế hoạch dự kiến để nhóm chỉnh và duyệt; không phải báo cáo kết quả hay bảng ghi nhận đóng góp đã thực hiện.  
**Đối chiếu workspace:** 28/10/2026. D1–D8 là ngày làm việc tương đối tính từ lúc nhóm bắt đầu kế hoạch; chưa quy đổi sang ngày lịch.  
**Lần nộp hiện tại:** BÁO CÁO ĐỀ CƯƠNG, gồm PDF và PPTX. Mục tiêu đủ bộ D6, sửa và chốt D7, dự phòng/nộp D8. Không đặt mục tiêu hoàn thành toàn bộ sản phẩm trong tám ngày.

## Cách sử dụng và giả định

- TV1/TV2/TV3 là vai trò tạm, chưa gán cho người dùng hay thành viên cụ thể. D1 nhóm điền tên/MSSV, năng lực, thời gian và thống nhất ai giữ vai trò nào.
- **NT** là đúng một nhóm trưởng/đại diện nộp được nhóm chỉ định ở DC03, phải ánh xạ thành một TV trước khi xuất bản. Đây không phải một thành viên thứ tư.
- Giả định mỗi người có **3 giờ công/ngày D1–D7**, tương đương 21 giờ/người. Công việc đề cương cần 54 giờ-người: TV1 18 giờ, TV2 17 giờ, TV3 19 giờ; còn lần lượt 3/4/2 giờ đệm trong bảy ngày. D8 là quỹ dự phòng và nộp riêng, không tiêu trước cho tính năng.
- Giờ trong bảng đã dự trù trao đổi/review và luyện vấn đáp. Reviewer góp ý; chủ sở hữu chịu trách nhiệm sửa và bàn giao. Không cộng thêm cùng một giờ review vào hai task. DC07/DC11/DC25 là các lượt review riêng; góp ý ngắn ở các mốc khác dùng thời gian phối hợp trong task của chính người góp ý.
- Phân công theo **luồng xuyên suốt**, không chia một người chỉ firmware, một người chỉ backend hay web. Mỗi task có một chủ sở hữu; phần tích hợp có người chịu trách nhiệm riêng.
- Quyết định thông thường trong tài liệu là **đề xuất để nhóm chốt**, không được mô tả là nhóm đã thống nhất. Các yêu cầu cần GV xác nhận vẫn mang trạng thái chờ trả lời.
- Lượt lập kế hoạch này chỉ đọc tài liệu/mã/log và tạo file Markdown này; không sửa firmware/backend/frontend, không chạy thêm prototype, không tạo PDF/PPTX hay tuyên bố có kết quả thử mới.

## Nguồn đã đối chiếu

| Nguồn | Phần dùng và giới hạn |
|---|---|
| [RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md](RESONANCE_GUARD_COMPLETE_PROJECT_GUIDE.md) — đã đọc toàn bộ | §2 vật lý, §3 ba luồng, §4 BOM, §6 wiring dự kiến, §7 phần mềm, §8–9 thực nghiệm, §10 phân công, §11 quy định, §12–15 test/demo. Là thiết kế dài hạn; không phải bằng chứng đã lắp/chạy. |
| [ToiHieu.md](ToiHieu.md) — đã đọc toàn bộ | §1–3 ý tưởng và ba luồng. Dùng cách diễn giải dễ hiểu sau khi sửa các chỗ thiếu/đơn giản hóa trong đề cương. |
| [TCTA_QUY ĐỊNH ĐỒ ÁN CUỐI KỲ.pdf](<TCTA_QUY ĐỊNH ĐỒ ÁN CUỐI KỲ.pdf>) — đã đọc cả 4 trang | Quy định đồ án chung: 2–3 người; mỗi người một luồng đầy đủ; thiết bị I/O khác nhau; thật hoặc giả lập; điều kiện điểm nâng cao và hiểu bài. Không suy diễn thành hạn nộp/số slide đề cương. |
| Thông báo đề cương do người dùng cung cấp trong yêu cầu lập kế hoạch | Nguồn ưu tiên cho nội dung và định dạng của lần nộp này: 9 nội dung bắt buộc, hai tên file, nhóm trưởng nộp, mọi thành viên dự vấn đáp. Chưa có file thông báo riêng để xác minh ngày/giờ. |
| [README_HUONG_DAN.md](README_HUONG_DAN.md), nhất là §2, §7–8, §10–11 | Hướng dẫn bản 03 mô phỏng và giới hạn. Có chi tiết cũ “chưa có Git” không còn đúng: workspace hiện có Git, trạng thái sạch trước khi thêm kế hoạch. |
| [docs/VALIDATION.md](ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/docs/VALIDATION.md), [docs/MQTT_ACK_INVESTIGATION.md](ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/docs/MQTT_ACK_INVESTIGATION.md), [log cuối](ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/docs/evidence/mqtt-ack-final.txt) | Báo cáo kiểm thử đã có; kết quả local không nâng thành kiểm chứng Wokwi/thiết bị thật. Lượt lập kế hoạch này không chạy lại các bài test. |
| [proof/](proof/) và mã trong project lồng hai cấp | Đối chiếu CSV, ảnh web, file serial và các module thực tế. Bằng chứng cũ chỉ cho phép khẳng định từng đoạn đã chạy; không chứng minh ACK/renew ổn định hiện nay. |

Trong các dẫn chiếu bên dưới, **P/** viết tắt cho **ResonanceGuard_03_IOT_INTEGRATION/ResonanceGuard_03_IOT_INTEGRATION/**. Đây mới là thư mục có package.json, setup.mjs, firmware/, server/, web/, tests/; workspace root không phải thư mục chạy npm. Các tài liệu khác chỉ được dẫn tên trong sổ tay không được coi là đã đọc độc lập nếu không có file.

## A. Hiện trạng, mâu thuẫn và phạm vi nên cam kết

### A1. Ý tưởng chung

ResonanceGuard là mô hình học tập giám sát dao động của thước/cấu trúc công xôn, đo tốc độ motor và điều khiển motor qua IoT. MPU6050 đo gia tốc, cảm biến tốc độ đo xung quay độc lập, ESP32 giao tiếp MQTT với backend Node/Express và website React. Phân tích vật lý phải dựa trên phép đo có kiểm chất lượng, không suy ra “hư hỏng” chỉ từ rung lớn.

**Tên đề xuất:** “ResonanceGuard — Mô hình giám sát rung, đo tốc độ và điều khiển motor qua IoT”. Giữ tên ResonanceGuard nhưng không hứa hệ thống đã phát hiện cộng hưởng/hư hỏng tự động. Nhóm cần duyệt tên ở D1.

### A2. Mức trưởng thành có bằng chứng

| Hạng mục | Thiết kế/dự kiến | Mã nguồn hiện có | Kiểm thử local đã ghi nhận | Wokwi/vật thật và kết luận được phép |
|---|---|---|---|---|
| MPU → ESP → MQTT → backend → web | Sổ tay §3, §7 hướng tới sampler và raw block | P/firmware/sketch.ino: readImu/envelope/loop; P/server/protocol.js; P/web/src/main.jsx. Dữ liệu synthetic; gửi một điểm khoảng 250 ms | Bộ test protocol/HTTP/WS/MQTT có dữ liệu thiết bị giả; không là kiểm chứng tốc độ lấy mẫu MPU | Chưa có bằng chứng đủ để nghiệm thu toàn luồng MPU mới. MPU Wokwi không liên kết cơ học motor. Không gọi đây là sampler phân tích dao động |
| Encoder/RPM | ToiHieu §2 luồng 2; sổ tay §9.5 dự kiến cảm biến độc lập | P/firmware/rpm_reader.h, custom chip, telemetry RPM/PPR và UI | Header portable/custom chip được test bằng fixture; Node tích hợp dùng ESP giả | CSV trong proof có RPM tới khoảng **461,5** và serial được báo RUN=1/PWM=77: đường motor/RPM mô phỏng đã hoạt động ít nhất một lần. Không chứng minh Hall vật thật đã chạy |
| START/PWM/STOP, ACK và lease | Sổ tay §7.7 thiết kế đầy đủ hơn bản 03 | P/server/app.js: API motor, ACK_RX/ACK_ACCEPT/ACK_WS_SEND; P/firmware/mqtt_support.h và motor_control.h; P/web/src/control.js. Có boot/deadline/dedup/lease và log | Log cuối ghi **13/13 test pass**, không skip; build Vite thành công. Bao gồm native fixture và broker local/ESP giả | Chưa xác nhận START→ACK→renew ổn định trong Wokwi sau bản sửa. Log cuối nói sketch/QoS1/wrapper chưa được biên dịch/chạy Wokwi lại. Không coi là hoàn thành điều khiển tích hợp |
| Chạy local thực tế | README có hướng dẫn HTTP/WS/MQTT | Backend/frontend, setup, scripts probe/smoke có sẵn | Có báo cáo local cũ; lần smoke bổ sung cuối lỗi **EADDRINUSE 127.0.0.1:3000**. Test tích hợp dùng cổng tạm riêng vẫn pass | Không thể dùng log smoke lỗi để nói toàn bộ máy đang chạy ổn. Không cần dừng tiến trình người dùng cho lượt lập kế hoạch |
| Raw đều, RMS, modal/FFT, baseline, sweep | Có trong sổ tay và diễn giải ToiHieu | Chưa thấy pipeline sampler đều, worker phân tích, UI modal, SQLite/baseline/sweep tương ứng trong cấu trúc bản 03 | Chưa có kiểm thử phân tích vật lý thực tế tương ứng | **Chưa triển khai/chưa kiểm chứng.** Số liệu ví dụ không phải số đo |
| Sản phẩm vật thật, vỏ/gá/cắt nguồn | Sổ tay §5–6, §12 mô tả dự kiến | Sơ đồ Wokwi không thay được thiết kế điện/cơ vật thật | Không có log nghiệm thu vật thật | Chưa có bằng chứng lắp, lấy mẫu, đo ringdown hay dừng an toàn vật thật |

**Tái sử dụng:** cấu trúc Node/React, setup và lockfile, MQTT topics/schema hiện tại, logic lệnh/ACK/stale, cơ sở test và nhật ký chẩn đoán, mô hình motor/encoder Wokwi. Mở rộng dần theo hợp đồng dữ liệu; không viết lại ứng dụng chỉ để khớp cây thư mục minh họa trong sổ tay. Tái sử dụng logic không đồng nghĩa mang nguyên cấu hình broker công cộng sang motor thật.

**Đọc đúng proof:** khoảng trống CSV gần 94,7 giây theo đồng hồ máy trong khi đồng hồ ESP chỉ tăng khoảng 2 giây cho thấy hai thang thời gian khác nhau trong lần mô phỏng đó. Chưa đủ để kết luận duy nhất là lỗi broker, client ID trùng hay publish. Reconnect lặp và web mất ACK là sự kiện cần truy nguyên. File serial_log.txt hiện không thay thế được bản log serial đầy đủ có thời gian; cần thu lại khi kiểm chứng. Ảnh web/CSV cũ không chứng minh bản firmware mới đã chạy.

### A3. Điểm cần thống nhất

| Nguồn/điểm lệch | Tác động | Cách thống nhất đưa vào đề cương |
|---|---|---|
| ToiHieu §3 rút Hall thành Hall→ESP | Thiếu trọn luồng theo PDF GV | Ghi đầy đủ Hall→ESP→MQTT→backend→frontend, do TV2 sở hữu từ đầu đến cuối |
| ToiHieu phần trả lời “một tần số đặc tính”; sổ tay §2.4 nói nhiều mode | Dễ bảo vệ sai vật lý | Cấu trúc có nhiều mode; chỉ ước lượng mode ứng viên quan sát được trong cấu hình/dải đo đã nêu |
| Sổ tay BOM dùng TCRT5000 quang; ToiHieu dùng Hall/nam châm | Khác thiết bị, PPR, gá, mức điện và giá | Phương án chính **đề xuất Hall**; D3 chốt đúng biến thể. TCRT5000 chỉ là phương án thay thế được phê duyệt, không cùng lúc tính hai luồng/điểm |
| ToiHieu ví dụ 200 Hz, 200 mẫu và đỉnh 14,5 Hz | FFT thô 1 giây có khoảng bin 1 Hz; không tự có bin 14,5 Hz | Nêu thời lượng cửa sổ, độ phân giải/ước lượng và bất định; ví dụ chỉ minh họa. Tách Fs lấy mẫu khỏi nhịp gửi block/cập nhật UI |
| Bản 03 gửi điểm khoảng 250 ms; sổ tay pilot 200 Hz/FIFO | Không thể phân tích dao động từ telemetry thưa hiện tại | Bản 03 xác minh IoT; sampler đều là SP07 tương lai. Không nội suy thành “đã đo 200 Hz” |
| Sổ tay có baseline/sweep/Cloud/AI và nhiều lựa chọn | Phạm vi vượt lần nộp đề cương và năng lực chưa biết | Lõi + tùy chọn có cổng; không coi mọi mục là cam kết hay được điểm tự động |
| Pinout sổ tay §6.2 khác Wokwi: ví dụ GPIO27, GPIO19 | Có nguy cơ đấu nhầm MPU INT/LED RUN/STOP | Tách sơ đồ as-built Wokwi khỏi pinout vật thật dự kiến; TV3 chủ trì khóa pinout ở SP01, không dùng lẫn |
| Tên “bản 03” và MVP1/2/3 của sổ tay | Dễ hiểu nhầm đã qua các cổng vật lý | Folder 03 là mốc mô phỏng tích hợp; không tương đương MVP3 có dữ liệu vật thật |
| Sổ tay gợi ý 8–10 slide/demo 10–12 phút | Không phải yêu cầu GV của lần này | Chỉ chọn bố cục phù hợp; không ghi giới hạn số trang/slide/phút là quy định |
| README nói chưa có Git | Không đúng trạng thái hiện tại | Kế hoạch dùng trạng thái Git đã kiểm: root có Git sạch trước khi thêm file này; không sửa README trong lượt này |

### A4. Phương án chính và dự phòng

**A — đề xuất chính cho sản phẩm cuối:** mô hình vật thật có ba luồng khác thiết bị I/O: MPU6050 (TV1), Hall tốc độ (TV2), driver/motor (TV3), dùng ESP32 chung nếu được GV chấp thuận. Trước hết đo thước chỉ có cảm biến; motor/Hall có thể đặt trên đế riêng có che chắn. Cam kết ba luồng IoT, giám sát raw/RMS/peak/quality, lưu/xem lại phiên local và một quy trình dao động tự do khi motor OFF. FFT cơ bản theo phiên là phần dự kiến của sản phẩm, **không phải mục phải lập trình trong tuần đề cương**.

Cách này có phép đo vật lý độc lập để kiểm tính khả thi và không phụ thuộc ngay vào motor phù hợp dải mode hay bài toán lực kích thích. Nó cũng không khẳng định motor trên đế riêng đã kích thích thước. Ghép motor lệch tâm vào thước/quét cưỡng bức chỉ mở sau khi đạt các cổng cơ, điện, sampler và dải RPM. Nếu muốn tên/mục tiêu đặt trọng tâm “khảo sát cộng hưởng”, phải đăng ký phần đó thành phạm vi có nguồn lực bổ sung và được GV đồng ý; không lén dùng phương án đế riêng để nhận đã hoàn thành khảo sát.

**B — dự phòng để nhóm cân nhắc:** Wokwi + backend/frontend local, dữ liệu synthetic và bài phân tích tín hiệu mô phỏng được ghi nhãn riêng. Chỉ dùng nếu nguồn lực/thời gian hoặc thí nghiệm pilot không cho phép làm thật, và GV xác nhận custom chip/mô phỏng Hall phù hợp quy định. Dữ liệu MPU Wokwi không ghép cơ motor nên không dùng để chứng minh cộng hưởng của thước. Nếu chọn B, DC19 phải tái ước lượng WBS/tỷ lệ/đầu ra cho mô phỏng trước D6; bảng sản phẩm ở mục E hiện tính cho A, không giữ các task vật thật như thể vẫn sẽ làm.

**Cam kết của đề cương:** mô tả trọn phạm vi đã chọn, đủ chức năng phụ, BOM dự toán trung thực, bản phác thảo nhóm tự vẽ, phân công và kế hoạch tới sản phẩm, minh chứng khả thi có nhãn mức độ. Đề cương không cần báo cáo sản phẩm hoàn chỉnh để che rủi ro đang mở.

**Không cam kết:** chẩn đoán vết nứt/hư hỏng, tự động suy ra tần số riêng từ phổ motor đang chạy, “tìm cộng hưởng” bằng điểm gia tốc lớn nhất, FFT được mặc định tính AI/DS, SQLite/file local là Cloud, một thiết bị tính trùng nhiều luồng/điểm. Wi-Fi provisioning, chatbot, tối ưu tự động và điều khiển từ Internet là hướng phát triển chưa đăng ký.

### A5. Câu hỏi cần GV xác nhận

TV2 theo dõi trong DC03, NT gửi theo kênh chính thức sau khi nhóm duyệt nội dung; tài liệu này không tự gửi tin:

1. Hai input MPU6050/Hall và output driver/motor dùng chung ESP32 có được chấp nhận đúng ba luồng, đôi một khác thiết bị I/O không? Driver+motor là một đường output, không tự tính thành hai thiết bị lấy điểm.
2. Mô hình thật có motor/RPM trên đế riêng và modal thước ở phiên motor OFF có phù hợp phạm vi đề xuất? Nếu cần khảo sát cưỡng bức phải nêu rõ mức yêu cầu.
3. Nếu dùng dự phòng Wokwi, custom motor/encoder và Hall mô phỏng được xét như thế nào theo quy định chỉ thay thế tối đa một thiết bị không mô phỏng được? Không mặc định được cộng điểm.
4. Luồng LAN qua MQTT có đủ yêu cầu hay cần kết nối Internet? Không vì câu hỏi này mà mở router hay đưa motor thật lên broker công cộng.
5. Website React tự xây và phân tích FFT cơ bản được ghi nhận ở mục nâng cao nào, nếu có? Mỗi hạng mục có một chủ sở hữu và thiết bị riêng theo quy định; không mặc định FFT là AI/DS.
6. Hạn nộp đề cương chính xác, mã số nhóm, lịch/phương thức vấn đáp, có mẫu bắt buộc hay giới hạn trình bày bổ sung không? Chưa biết thì giữ D1–D8 và không bịa thời lượng.
7. Nếu muốn điểm thưởng vật thật/Cloud/auth, điều kiện nghiệm thu và cách phân bổ từng người thế nào? Chỉ đưa vào cam kết sau khi đủ điều kiện.

PDF cho phép thật hoặc giả lập và nêu điều kiện hiểu bài từng cá nhân; không có căn cứ bắt nhóm hoàn thành mọi nâng cao trong tuần này. Những mức điểm là quy định có điều kiện, không phải dự báo điểm nhóm sẽ đạt.

## B. Ma trận đáp ứng yêu cầu đề cương

Mỗi dòng dưới có một người giữ đầu ra cuối; phần đóng góp chi tiết vẫn theo các task riêng ở mục C.

| Yêu cầu GV | Nội dung/đầu ra cần chuẩn bị | Task ID | Người phụ trách | Tiêu chí hoàn thành |
|---|---|---|---|---|
| Thống nhất một ý tưởng, làm theo nhóm | Phiếu tên/phạm vi A hoặc B, lý do và câu hỏi chưa duyệt | DC01, DC17 | TV3 (chốt phạm vi) | Có quyết định nhóm ghi ngày; không gọi đề xuất là đã được GV duyệt |
| Mã nhóm, họ tên, MSSV ba người | Trang bìa và bảng thành viên/vai trò | DC03, DC28 | TV2 | Đủ và đúng cả ba; không tự điền tên/MSSV |
| Tên sản phẩm | Tên thống nhất trên bìa, nội dung, slide, hình | DC01 | TV1 | Không dùng nhiều tên/mục tiêu mâu thuẫn |
| Lý do thực hiện | Vấn đề học tập, giá trị vật lý/IoT, giới hạn kết luận | DC06 | TV1 | Có căn cứ, không hứa chứng nhận hư hỏng |
| Bảng tất cả chức năng, kể cả phụ/web | Danh mục F-ID duy nhất, tách lõi/tùy chọn/phát triển | DC11, DC17 | TV3 | PDF/PPTX cùng ID/phạm vi; đủ nhận dữ liệu, UI, trạng thái, lưu/xem lại, lỗi và STOP |
| Mô tả chi tiết sản phẩm và web | Đầu vào/đầu ra, trạng thái, sơ đồ luồng, lỗi và tiêu chí từng chức năng | DC06, DC08, DC10, DC20 | TV3 (ghép) | Mỗi F-ID có mô tả; ba tác giả chịu nội dung của mình; không chỉ có bảng tên |
| Thiết bị, số lượng, đơn giá, thành tiền, nguồn | BOM điện tử + cơ/nguồn/bảo vệ, biến thể/ngày giá | DC08, DC15, DC28 | TV2 | Cộng đúng; không lấy giá quang thay Hall; giá cũ ghi tham khảo; khoản chưa chốt được xử lý công khai |
| Tự vẽ hình ngoài | Phác thảo ngoài có nút/cổng/kích thước dự kiến/che chắn | DC09 | TV2 | Có bản gốc do nhóm vẽ; không lấy ảnh sản phẩm hay sơ đồ khối thay thế |
| Tự vẽ cấu trúc trong | Bố trí linh kiện, gá, đường nguồn/tín hiệu và chú thích | DC13 | TV1 | Khớp BOM/phương án; phân biệt với sơ đồ dây và khối |
| Phân công dự kiến từng người, task nguyên tử và % | Bảng sản phẩm SP-ID và tỷ lệ riêng; bảng DC-ID cho tuần đề cương | DC18, DC19 | TV2 (tính/kiểm bảng) | Một owner/task; tổng mỗi bảng 100%; cùng ID với lịch tương ứng |
| Kế hoạch chi tiết tới sản phẩm | G0–G6, phụ thuộc, cổng đo, tích hợp, đóng gói/tài liệu | DC18, DC19 | TV2 (lịch) | Không lấy D1–D8 làm deadline sản phẩm; có cùng SP-ID của bảng phân công |
| Font thống nhất, canh đều, bìa, mục lục, tham khảo | PDF định dạng thống nhất; PPTX font/hệ ký hiệu thống nhất | DC24 | TV1 | Mở PDF kiểm từng trang; mục lục cập nhật, nguồn gắn với số liệu/hình |
| Nộp đúng hai file | MSSV1_MSSV2_MSSV3.pdf và MSSV1_MSSV2_MSSV3.pptx | DC29, NOP01 | NT (được chốt D1) | Thay bằng ba MSSV thật, cùng thứ tự; không để chữ MSSV1 làm tên cuối |
| Nhóm trưởng/đại diện nộp và lưu bằng chứng | Kiểm file tải lên, biên nhận, giờ nộp, phiên bản | NOP01, NOP02 | NT (nộp) | Nộp theo thông báo chính thức; có bằng chứng lưu, không chỉ “đã bấm” |
| Tất cả tham gia vấn đáp, không trễ/vắng | Danh sách xác nhận lịch, diễn tập từng người và kiến trúc chung | DC27 | TV1 (giữ checklist diễn tập) | TV1/TV2/TV3 có lượt tập ở DC27/28/29; từng người xác nhận lịch và phương án đến đúng giờ |
| PPTX trình chiếu được, khớp PDF | Bản đủ D6, sửa sau review D7 | DC23, DC26, DC29 | TV3 | Chạy trình chiếu thật; không mất hình/font hay đổi phạm vi giữa hai file |

## C. Phân công hoàn thành đề cương D1–D7

Trọng số dự kiến = giờ task / 54 × 100%. Làm tròn đến 0,01%, phân bổ phần dư để tổng task và tổng theo người khớp 100%; sai khác làm tròn tối đa khoảng 0,01 điểm %/task. Đây là dự toán công sức/độ khó, không phải tỷ lệ đóng góp thực tế đã hoàn thành.

| Task ID | Công việc cụ thể | Chủ sở hữu | Reviewer | Đầu ra bàn giao | Phụ thuộc | Ước lượng giờ | Bắt đầu–kết thúc | Tiêu chí nghiệm thu | Trọng số % |
|---|---|---|---|---|---|---:|---|---|---:|
| DC01 | Chốt bản nháp ý tưởng, phạm vi cam kết/tùy chọn và bảng mâu thuẫn | TV1 | TV2 | Phiếu phạm vi v0.1, tên sản phẩm đề xuất | — | 2 | D1–D1 | Nêu rõ vật thật/mô phỏng còn là quyết định; không hứa khảo sát cộng hưởng ngay | 3,70 |
| DC02 | Lập dàn ý PDF, thuật ngữ và phân vùng nội dung | TV1 | TV3 | Khung PDF có người soạn từng mục | DC01 (bản nháp) | 1 | D1–D1 | Đủ chín nội dung bắt buộc; có chỗ cho nguồn và trạng thái kiểm chứng | 1,85 |
| DC03 | Đối chiếu yêu cầu GV, thu thông tin nhóm, chốt người nộp và câu hỏi cần xác nhận | TV2 | TV1 | Ma trận yêu cầu, danh sách thông tin thiếu, NT được chỉ định | — | 2 | D1–D1 | Mỗi yêu cầu có đầu ra; không tự gán nhóm trưởng; câu hỏi có người theo dõi | 3,71 |
| DC04 | Soạn hợp đồng dữ liệu và ba luồng đầy đủ | TV2 | TV3 | Bảng trường/đơn vị/nguồn/thời gian/PPR và ba sơ đồ luồng | DC01 (bản nháp) | 1 | D1–D1 | Hall đi đến website; phân biệt PWM, ACK, RUN và RPM; phân biệt giờ ESP/máy | 1,85 |
| DC05 | Vẽ kiến trúc, thống nhất giao diện điều khiển và tạo khung PPTX | TV3 | TV1 | Sơ đồ khối, hợp đồng lệnh/trạng thái, PPTX khung | DC02, DC04 (bản nháp) | 3 | D1–D1 | Có command_id/boot/deadline/lease; slide khung dùng cùng phạm vi PDF | 5,56 |
| DC06 | Soạn lý do, vật lý, chức năng rung và phiên dao động tự do; đưa vào slide nháp | TV1 | TV2 | Nội dung rung/vật lý và slide phần TV1 | DC01, DC02, DC04 | 2,5 | D2–D2 | Không nhầm forced peak với tần số riêng; mô tả raw/RMS/quality và điều kiện phân tích | 4,63 |
| DC07 | Review sớm hợp đồng điều khiển và khung slide | TV1 | — | Danh sách nhận xét cho DC05/DC10/DC11 | DC05 (bản nháp) | 0,5 | D2–D2 | Nhận xét có chỗ sửa cụ thể; không chờ ghép cuối tuần | 0,93 |
| DC08 | Kiểm kê vật tư, tra BOM Hall và soạn chức năng RPM/slide nháp | TV2 | TV3 | BOM nháp có nguồn/ngày/biến thể, nội dung RPM | DC03, DC04 | 2 | D2–D2 | Không dùng giá TCRT5000 làm giá Hall; xác định món mượn và món chưa chốt | 3,71 |
| DC09 | Tự vẽ phác thảo bên ngoài sản phẩm | TV2 | TV1 | Bản gốc chỉnh sửa được và ảnh/PDF phác thảo ngoài | DC01, DC08 (bản nháp) | 1 | D2–D2 | Có góc nhìn, kích thước dự kiến, nút/cổng/che chắn, chú thích; không dùng ảnh sản phẩm | 1,85 |
| DC10 | Soạn điều khiển/bảo vệ và rà bằng chứng ACK hiện có | TV3 | TV2 | Mục chức năng điều khiển, bảng bằng chứng/giả thuyết, slide nháp | DC04, DC05 | 2 | D2–D2 | Không gọi MQTT connected là ACK; không gọi test ESP giả là Wokwi; ghi giới hạn motor thật | 3,71 |
| DC11 | Review sớm tính thống nhất của ba luồng và danh mục chức năng | TV3 | — | Danh mục F-ID v0.2 và lỗi giao diện cần sửa | DC06, DC08, DC10 (bản nháp) | 1 | D2–D2 | Mỗi chức năng có một chủ sở hữu; thuật ngữ/đơn vị khớp giữa ba phần | 1,85 |
| DC12 | Xác minh khả thi luồng rung trong giới hạn 1,5 giờ | TV1 | TV2 | Biên bản đọc mã/log và phép thử có thể làm; danh sách chưa xác minh | DC06 | 1,5 | D3–D3 | Tách điểm gửi 250 ms khỏi sampler; không triển khai FFT; hết giờ thì ghi rủi ro | 2,78 |
| DC13 | Tự vẽ phác thảo cấu trúc bên trong và rà với BOM | TV1 | TV3 | Bản gốc hình trong, vị trí linh kiện, chú thích và phương án gá | DC09, DC08 | 1,5 | D3–D3 | Thấy ngàm/thước/MPU/ESP/Hall/driver/nguồn/đường dây/che rotor; ghi bản dự kiến | 2,78 |
| DC14 | Xác minh khả thi RPM trong giới hạn 1,5 giờ | TV2 | TV1 | Biên bản PPR, CSV và giới hạn thay custom encoder bằng Hall | DC08, DC04 | 1,5 | D3–D3 | RPM mô phỏng được ghi đúng nguồn; không suy ra Hall vật thật đã chạy | 2,78 |
| DC15 | Chốt dự toán BOM và phương án thay thế | TV2 | TV3 | BOM cộng đúng, nguồn giá/ngày, danh sách tồn kho/mượn và khoản chưa chốt | DC08, DC09, DC13 (bản nháp) | 1,5 | D3–D3 | Không gán giá giả; phần chưa báo giá có cách chốt trước D6 hoặc ghi dự toán có căn cứ | 2,78 |
| DC16 | Xác minh chuỗi START–ACK–renew trong giới hạn 2 giờ | TV3 | TV1 | Log theo command_id nếu chạy được; nếu không, biên bản lỗi và bước tiếp theo | DC10, DC11 | 2 | D3–D3 | Không thêm tính năng/bỏ bảo vệ; không tăng timeout để coi là sửa; kết quả không là điều kiện nộp đề cương | 3,70 |
| DC17 | Chủ trì mốc tích hợp và quyết định phạm vi A/B | TV3 | TV2 | Phiếu phạm vi v1, F-ID v1 và danh sách rủi ro đóng/mở | DC12, DC14, DC15, DC16 | 1 | D3–D3 | Có lựa chọn đề xuất và ý kiến ba người; mục cần GV xác nhận vẫn ghi chưa được duyệt | 1,85 |
| DC18 | Soạn WBS sản phẩm, phương pháp đo và tiêu chí vật lý | TV1 | TV3 | Bảng SP-ID và tiêu chí phân tích/kiểm chất lượng | DC17 | 2 | D4–D4 | Không đưa chức năng nâng cao vào lõi; không coi năm ringdown là quy định GV | 3,70 |
| DC19 | Tính tải người, phụ thuộc, tỷ lệ và lịch sản phẩm tương đối | TV2 | TV1 | Bảng giờ/%, lịch G0–G6, rủi ro và cổng nghiệm thu | DC18 (bản nháp), DC17 | 2 | D4–D4 | Cùng SP-ID trong phân công và lịch; tỷ lệ sản phẩm riêng đủ 100%; nếu chọn B thì tái ước lượng | 3,70 |
| DC20 | Ghép PDF nháp đầy đủ nội dung | TV3 | TV2 | Tài liệu nguồn PDF v0.7, ghép hình/BOM/chức năng/kế hoạch | DC06, DC09, DC10, DC13, DC15, DC18, DC19 | 2 | D4–D4 | Mọi mục có nội dung, thiếu dữ kiện đánh dấu để xử lý; không để trống cả mục | 3,70 |
| DC21 | Hoàn thiện slide vật lý, kế hoạch đo và tài liệu tham khảo | TV1 | TV3 | Phần slide TV1 v0.8 và nguồn cho các nhận định | DC20 (bản nháp) | 2 | D5–D5 | Không dùng số minh họa như dữ liệu đo; công thức/đơn vị đọc được | 3,70 |
| DC22 | Hoàn thiện slide RPM, BOM, phác thảo và phân công | TV2 | TV1 | Phần slide TV2 v0.8, bảng số đối chiếu | DC15, DC19, DC20 (bản nháp) | 2 | D5–D5 | Giá, số lượng, F-ID/SP-ID và tỷ lệ khớp PDF | 3,70 |
| DC23 | Hoàn thiện slide điều khiển và ghép PPTX đầy đủ | TV3 | TV2 | PPTX v0.8, đối chiếu danh mục chức năng với PDF | DC21, DC22, DC10 | 3 | D5–D5 | Không mất chức năng phụ trên web; có giới hạn hiện trạng và kế hoạch | 5,56 |
| DC24 | Chuẩn hóa và xuất PDF đầy đủ | TV1 | TV2 | PDF v1 và tài liệu nguồn có mục lục/tài liệu tham khảo | DC20, DC21, DC22, DC23 | 2 | D6–D6 | Mở được; font thống nhất, văn bản canh đều, hình/bảng không bị cắt | 3,70 |
| DC25 | Review chéo trọn bộ: nguồn, số học, ID và nội dung | TV2 | — | Checklist lỗi có mức độ và người sửa; đối chiếu PDF/PPTX | DC24, DC26 (bản v1) | 2 | D6–D6 | Cộng lại BOM/giờ/%; rà đủ yêu cầu GV; ghi lỗi chưa đóng | 3,70 |
| DC26 | Hoàn thiện PPTX và chạy trình chiếu thử | TV3 | TV1 | PPTX v1, log mở/trình chiếu và rà font/hình | DC23 | 2 | D6–D6 | Đọc được trên màn hình trình chiếu; công thức/hình/bảng không tràn; có đủ nội dung | 3,70 |
| DC27 | Luyện vấn đáp luồng rung, review chéo và chốt PDF sau sửa | TV1 | TV2 | Câu trả lời TV1, PDF cuối và nhật ký sửa lỗi | DC24, DC25, DC26 | 3 | D7–D7 | Giải thích trọn luồng và giới hạn khoa học; không còn lỗi bắt buộc của phần TV1/PDF | 5,56 |
| DC28 | Luyện vấn đáp RPM và chốt BOM/thông tin nhóm | TV2 | TV3 | Câu trả lời TV2, BOM/thông tin/nguồn cuối đã kiểm | DC25, DC27 (bản sửa) | 2 | D7–D7 | Tính lại RPM/PPR/chi phí; tên/MSSV/NT đúng; câu hỏi chưa duyệt không giả làm đã duyệt | 3,70 |
| DC29 | Luyện vấn đáp điều khiển và chốt gói nộp | TV3 | TV1 | PPTX cuối, hai tên file đúng, phiên bản khóa và checklist bàn giao | DC25, DC27, DC28 | 3 | D7–D7 | Phân biệt gửi/ACK/RUN/RPM; hai file mở được và thống nhất; bàn giao NT | 5,56 |

| Tổng hợp | Giờ dự kiến | Tỷ lệ dự kiến | Quỹ D1–D7 theo giả định | Đệm còn lại |
|---|---:|---:|---:|---:|
| TV1 — rung/vật lý, hình trong, PDF | 18 | 33,33% | 21 giờ | 3 giờ |
| TV2 — RPM, BOM, hình ngoài, lịch/tỷ lệ | 17 | 31,48% | 21 giờ | 4 giờ |
| TV3 — điều khiển, kiến trúc, tích hợp, PPTX | 19 | 35,19% | 21 giờ | 2 giờ |
| **Tổng** | **54** | **100,00%** | **63 giờ** | **9 giờ** |

Không ép chia đều: TV3 có thêm ghép slide/kiến trúc và rủi ro ACK; TV1 phải kiểm vật lý và ghép PDF; TV2 có BOM/lịch/hình vẽ và review số học. Nếu năng lực hoặc quỹ giờ thực tế khác, D1 đổi người theo **cả luồng**, điều chỉnh ước lượng/tỷ lệ cùng lúc, không đổi riêng tỷ lệ để trông cân bằng.

**Xác minh prototype chỉ 5 giờ-người:** DC12 1,5 + DC14 1,5 + DC16 2. Không mua/cài bộ công cụ lớn, phát triển FFT hay hoàn thiện sản phẩm trong khoản này. Có thể dùng mã/log đã có; thử Wokwi chỉ khi công cụ/tài khoản sẵn và được phép. Không đạt sau D3 vẫn hoàn thành đề cương với lỗi ghi rõ và SP06 là việc tương lai. Không biến lỗi prototype thành kết quả thành công.

**Chuẩn bàn giao mỗi task:** tệp nguồn chỉnh sửa được, bản xem được, nguồn trích dẫn, trạng thái “dự kiến/local/Wokwi/thật/chưa thử”, người làm và reviewer, nhận xét còn mở. Các bản nháp có thể trao đổi trước khi kết thúc task để làm song song; phụ thuộc “bản nháp/giao diện” không đợi toàn bộ file hoàn thiện.

## D. Lịch D1–D8 và mốc tích hợp

| Ngày | TV1 | TV2 | TV3 | Đầu ra cuối ngày và mốc tích hợp |
|---|---|---|---|---|
| D1 | DC01–02: phạm vi, tên, dàn ý PDF (3 giờ) | DC03–04: yêu cầu GV, NT/thông tin nhóm, hợp đồng dữ liệu (3 giờ) | DC05: kiến trúc, lệnh/trạng thái, khung PPTX (3 giờ) | **I0:** bản nháp phạm vi, schema/đơn vị, ba luồng đầy đủ, dàn ý PDF + PPTX và câu hỏi GV. Chốt vai trò theo năng lực/giờ, không đợi đến D3 mới giao diện |
| D2 | DC06–07: nội dung vật lý/rung, slide nháp, review sớm (3 giờ) | DC08–09: RPM/BOM, slide nháp, tự vẽ hình ngoài (3 giờ) | DC10–11: điều khiển/ACK, slide nháp, rà F-ID (3 giờ) | **I1:** ba phần nội dung/slide đã có bản đầu; hình ngoài/BOM nháp; phát hiện lệch thuật ngữ/đơn vị ngay |
| D3 | DC12–13: xác minh rung có giới hạn, tự vẽ hình trong (3 giờ) | DC14–15: xác minh RPM, chốt dự toán (3 giờ) | DC16–17: xác minh ACK tối đa 2 giờ, chủ trì khóa phạm vi (3 giờ) | **I2:** phiếu phạm vi A/B, F-ID v1, hai hình phác thảo và BOM có trạng thái. Không cần ACK pass để khóa tài liệu. Nếu chưa có hồi đáp GV, ghi rõ giả định và hạn chế |
| D4 | DC18: WBS/tiêu chí sản phẩm (2 giờ) | DC19: giờ/%/phụ thuộc/lịch tương đối (2 giờ) | DC20: ghép PDF v0.7 (2 giờ) | **I3:** PDF nháp đầy đủ mọi mục; bảng SP-ID dùng chung trong phân công/lịch; khung slide đã cập nhật từ D2 |
| D5 | DC21: slide vật lý/đo/nguồn (2 giờ) | DC22: slide RPM/BOM/hình/phân công (2 giờ) | DC23: slide điều khiển và PPTX v0.8 (3 giờ) | **I4:** đủ nội dung cả PDF và PPTX; đối chiếu danh mục chức năng; ngừng thêm ý tưởng mới |
| D6 | DC24: PDF v1, kiểm mở/định dạng (2 giờ) | DC25: kiểm chéo nguồn, số học, ID và phạm vi (2 giờ) | DC26: PPTX v1, trình chiếu thử (2 giờ) | **I5:** **hai file đầy đủ** mở/trình chiếu được; danh sách lỗi giao cho đúng owner. Không để D6 mới viết một chương chưa có |
| D7 | DC27: luyện rung, kiểm chung và sửa/chốt PDF (3 giờ) | DC28: luyện RPM, chốt BOM/thông tin/nguồn (2 giờ) | DC29: luyện điều khiển, sửa/chốt PPTX và gói nộp (3 giờ) | **I6:** đóng lỗi bắt buộc, ba người xác nhận nội dung/giới hạn và lịch vấn đáp; khóa phiên bản cho NT |
| D8 | Dự phòng sửa phần vật lý/PDF theo lỗi có thật; kiểm bản khóa | NOP02: kiểm hai file đã nộp và lưu bằng chứng | Dự phòng lỗi PPTX/tệp, hỗ trợ NT đúng phần phụ trách | **I7:** NT làm NOP01 nộp, kiểm kết quả tải lên; TV2 lưu bằng chứng. Không mở đợt phát triển tính năng |

**NOP01:** chủ sở hữu NT duy nhất đã được chỉ định D1; reviewer là một TV khác NT, điền vào checklist D1. Đầu ra: hai file tải lên đúng kênh/tên/hạn, trạng thái nộp được xác nhận.  
**NOP02:** chủ sở hữu TV2; reviewer TV1. Đầu ra: bản tải về kiểm lại, ảnh/biên nhận và thư mục lưu phiên bản. Nếu TV2 cũng là NT, TV1 kiểm độc lập sau nộp; trách nhiệm nộp và trách nhiệm lưu vẫn rõ.  
Hai việc này dùng khoảng 0,5–1 giờ/người liên quan trong quỹ D8, không nằm trong 54 giờ và 100% chuẩn bị đề cương. Giờ vấn đáp chính thức chưa biết nên chưa đưa thành số giờ giả; mọi người phải dành lịch theo thông báo thật.

Cuộc review ngắn ở I0/I1/I2/I3 và đối chiếu I4/I5 bảo đảm tích hợp sớm. Các mốc cần phối hợp có thể trải qua ngày với tổng giờ công như bảng, không giả định mọi phụ thuộc hoàn tất trong một phiên ba giờ liền.

## E. Phân công và kế hoạch tới khi hoàn thành sản phẩm

### E1. Cách đọc và ba trách nhiệm xuyên suốt

Bảng này là **kế hoạch sản phẩm A**, tách khỏi 54 giờ làm đề cương. Chưa biết hạn nộp sản phẩm cuối nên dùng G0–G6 và giờ công tương đối. Các task SP là phần việc **còn phải làm/hoàn thiện/kiểm chứng**, không tính toàn bộ mã sẵn có như việc mới và không ghi là đã xong.

| Thành viên | Thiết bị/luồng chính | Trách nhiệm trọn luồng và phần chung |
|---|---|---|
| TV1 | MPU6050 → ESP32 → MQTT → backend → frontend | Lấy mẫu/rung/quality; xử lý và hiển thị rung, modal theo phiên; chịu định nghĩa khoa học. Soạn đặc tả và phần kết quả vật lý |
| TV2 | Hall → ESP32 → MQTT → backend → frontend | Xung/PPR/RPM/f_exc, giao diện/quality RPM; phối hợp lưu phiên và hợp đồng dữ liệu, BOM, bằng chứng/lịch |
| TV3 | Frontend → backend → MQTT → ESP32 → driver/motor | START/STOP/PWM, ACK/renew, bảo vệ; broker/cấu hình điều khiển; chủ sở hữu tích hợp chung và đóng gói |

ESP32/broker/backend là hạ tầng dùng chung; mỗi người vẫn phải thực hiện và giải thích phần firmware, MQTT, backend, UI của luồng mình. Owner mô-đun chung không thay người khác triển khai cả luồng. Chia vùng sửa file/chốt schema ở SP01; thay đổi schema/pinout phải báo hai reviewer liên quan. Thiết bị đầu vào MPU và Hall khác nhau, đầu ra driver/motor khác hai input; không cộng điểm lại Hall vì nó cũng phản hồi cho điều khiển.

### E2. Bảng công việc sản phẩm lõi

Tất cả SP01–SP24 là bắt buộc **nếu nhóm chọn A và cam kết lõi tại A4/F**. Task có cổng thì chỉ bắt đầu phần nguy cơ sau cổng; không bỏ cổng để giữ lịch. Giờ là công sức gồm review/test/sửa dự kiến, không là thời gian chờ giao hàng. “Buổi” khoảng 3–4 giờ để ước lượng tổ chức, không phải lịch GV.

| Task ID | Công việc cụ thể | Chủ sở hữu | Reviewer | Đầu ra | Phụ thuộc | Giờ dự kiến | Thời lượng tương đối | Tiêu chí nghiệm thu | Trọng số % |
|---|---|---|---|---|---|---:|---|---|---:|
| SP01 | Chốt đặc tả sản phẩm, schema, API và giới hạn kết luận | TV1 | TV3 | Hợp đồng dữ liệu/lệnh, F-ID và kế hoạch nghiệm thu | DC17, DC19 | 8 | 2–3 buổi | Có nguồn/boot/seq/run/config/đơn vị/clock; thống nhất thuật ngữ và phạm vi | 4,0 |
| SP02 | Kiểm kê/mượn/mua vật tư giai đoạn cảm biến; chốt biến thể Hall | TV2 | TV1 | BOM cập nhật, datasheet, danh sách nhận vật tư | SP01 | 8 | 2–3 buổi + thời gian giao hàng | Đối chiếu logic 3,3 V, PPR, gá; chỉ mua motor sau cổng SP16/SP12 | 4,0 |
| SP03 | Thiết lập cấu hình broker riêng, xác thực/ACL và môi trường tích hợp | TV3 | TV2 | Cấu hình firmware/backend phù hợp, hướng dẫn chạy, quản lý cấu hình | SP01 | 8 | 2–3 buổi | Motor thật không dùng broker công cộng; client ID không trùng; không đưa bí mật vào Git | 4,0 |
| SP04 | Lắp thước/ngàm/MPU thật và kiểm gia tốc tĩnh/đơn vị | TV1 | TV2 | Cụm cảm biến, ảnh cấu hình, phép đo tĩnh và cấu hình MPU | SP02 | 10 | 3–4 buổi | Gá chắc; kiểm trục/dấu/thang đo/g; ghi ảnh và chiều dài hữu hiệu; chưa quay motor | 5,0 |
| SP05 | Thử Hall thật bằng quay tay, xác định PPR và mức điện | TV2 | TV3 | Mạch Hall, log xung/đếm vòng và biên bản chống nhiễu | SP02 | 8 | 2–3 buổi | Đếm vòng biết trước; không nhầm xung/trục motor với xung/trục ra; gá nam châm chắc | 4,0 |
| SP06 | Ổn định chuỗi website–lệnh–ACK–renew trên tải thử | TV3 | TV1 | Log command_id xuyên FE/BE/MQTT/ESP và test lỗi có chủ đích | SP03 | 10 | 3–4 buổi | ACK khớp boot/lệnh; publish lỗi được ghi; không dùng tải motor khi chuỗi chưa ổn | 5,0 |
| SP07 | Xây sampler đều và buffer/FIFO, đo thời gian thực trên ESP | TV1 | TV3 | Raw block, seq, Fs thực đo, test dưới tải Wi-Fi | SP04, SP03 | 10 | 3–4 buổi | Fs pilot 200 Hz chỉ chốt sau đo; thấy gap/clip/overrun; không dùng giờ nhận MQTT tính Fs | 5,0 |
| SP08 | Hoàn thiện Hall→MQTT→backend→web, RPM và tần số kích thích | TV2 | TV1 | Toàn luồng RPM, cấu hình PPR/tỷ số truyền, UI đơn vị/quality | SP05, SP03 | 8 | 2–3 buổi | RPM đo độc lập PWM; phân biệt 0/không biết/stale; f_exc có giả định số chu kỳ lực/vòng | 4,0 |
| SP09 | Kiểm bảo vệ cục bộ trên tải thử trước cấp nguồn motor | TV3 | TV2 | Lease/watchdog/STOP/cut feedback/max runtime và ma trận lỗi | SP06 | 10 | 3–4 buổi | Mất mạng/BE/renew thì OFF; lệnh sai/đúp/hết hạn không bật lại; không phụ thuộc web để dừng | 5,0 |
| SP10 | Hoàn thiện raw→backend→web, RMS/peak và chất lượng liên tục | TV1 | TV2 | Luồng rung đầy đủ, biểu đồ thời gian, thống kê có định nghĩa cửa sổ | SP07, SP03 | 10 | 3–4 buổi | Chọn trục/loại DC/đơn vị rõ; dữ liệu không hợp lệ không hiển thị như mới; thống kê không lẫn modal | 5,0 |
| SP11 | Lưu/đọc lại phiên local và xuất dữ liệu/metadata | TV2 | TV3 | Raw file + manifest phiên, danh sách phiên, xem lại và export | SP01, SP08 | 8 | 2–3 buổi | Nạp lại truy được nguồn/run/config; lỗi ghi file hiện rõ; local storage không gọi Cloud | 4,0 |
| SP12 | Chọn motor/driver/nguồn, gá và che chắn theo phép đo pilot | TV3 | TV1 | Tính chọn dải RPM/dòng tải, mạch cấp nguồn/cắt và cụm motor | SP16, SP09, SP03 | 8 | 2–3 buổi + thời gian mua/gia công | Có kiểm dòng khởi động/kẹt, giới hạn driver/nguồn, điện áp; không chọn chỉ theo giá | 4,0 |
| SP13 | Xử lý và hiển thị phiên free-decay cơ bản | TV1 | TV2 | Mô-đun xử lý, kiểm chất lượng, FFT/chu kỳ và UI kết quả theo phiên | SP01, SP11 (giao diện) | 10 | 3–4 buổi | Thử tín hiệu biết trước; phổ/độ phân giải đúng; fd/mode ứng viên không tự gọi fn; không sửa baseline | 5,0 |
| SP14 | Gá Hall với motor và đối chiếu RPM dưới tải | TV2 | TV3 | Cụm tốc độ đã gá, PPR/tỷ số truyền và bảng sai số/độ lặp | SP12, SP05, SP08 | 8 | 2–3 buổi | Có phương pháp tham chiếu/độ không chắc; nếu thiếu chuẩn thì ghi chưa hiệu chuẩn tuyệt đối | 4,0 |
| SP15 | Kiểm START/PWM/STOP motor thật trên bàn thử có bảo vệ | TV3 | TV2 | Log/clip RUN, duty, RPM, STOP/cắt nguồn và coastdown | SP12, SP09 | 8 | 2–3 buổi | Tải/gá/che chắn đạt; dừng đầu ra khác rotor dừng; không tự chạy lại sau nối mạng | 4,0 |
| SP16 | Thu ít nhất 5 free-decay hợp lệ trên cấu hình vật thật | TV1 | TV2 | Raw, ảnh gá, chất lượng, độ lặp và đối chiếu chu kỳ/phổ | SP04, SP07, SP10, SP11, SP13 | 8 | 2–3 buổi | Motor OFF/rotor dừng; không clipping/gap ảnh hưởng; không đạt thì sửa phép đo trước chọn motor | 4,0 |
| SP17 | Tích hợp quy ước thời gian/phiên/nguồn và test hợp đồng dữ liệu | TV2 | TV1 | Bộ dữ liệu tham chiếu và báo cáo lỗi giao diện ba luồng | SP10, SP11, SP14 | 8 | 2–3 buổi | Không trộn boot/config/source; xử lý stale và dữ liệu đến muộn; không đánh dấu thực tế cho synthetic | 4,0 |
| SP18 | Chủ trì tích hợp đồng thời ba luồng và chốt bản thử | TV3 | TV1 | Bản chạy chung, log ba luồng cùng run và danh sách lỗi | SP10, SP14, SP15, SP17 | 8 | 2–3 buổi | Web điều khiển có ACK/renew, RUN/RPM và rung cập nhật đồng thời; hết kết nối phải dừng đúng | 4,0 |
| SP19 | Kiểm chất lượng rung, modal và giới hạn kết luận | TV1 | TV3 | Báo cáo kiểm dữ liệu hợp lệ/không hợp lệ và kết quả vật lý | SP16, SP18 | 8 | 2–3 buổi | Không kết luận từ điểm lớn nhất/forced FFT; kết quả lỗi trả không đủ dữ liệu; giữ dữ liệu gốc | 4,0 |
| SP20 | Chạy độ bền, khôi phục lịch sử và kiểm chất lượng RPM/clock | TV2 | TV1 | Log phiên 15–30 phút theo chu kỳ an toàn, báo cáo mất dữ liệu | SP18, SP16 | 6 | 2 buổi | Đây là phiên hệ thống, không bắt motor quay liên tục vượt max runtime; lỗi lưu/RPM được truy vết | 3,0 |
| SP21 | Kiểm lỗi vật thật: STOP/cắt nguồn/mất mạng/boot/phục hồi | TV3 | TV2 | Ma trận lỗi, thời gian dừng đo được và log tái kết nối | SP18, SP15 | 8 | 2–3 buổi | Đủ các lỗi bắt buộc; không hạ bảo vệ để qua test; mọi lỗi chặn an toàn đã đóng | 4,0 |
| SP22 | Hoàn thiện báo cáo khoa học, raw và giới hạn sản phẩm | TV1 | TV2 | Phần kết quả/phương pháp/tài liệu tham khảo và hồ sơ kiểm chứng | SP19, SP20, SP21 | 8 | 2–3 buổi | Tách dữ liệu thật/mô phỏng, mục tiêu/kết quả, không dùng số minh họa làm đo | 4,0 |
| SP23 | Hoàn thiện slide, bằng chứng và luyện vấn đáp ba luồng | TV2 | TV3 | Slide cuối, bản demo dự phòng, câu hỏi và nhật ký đóng góp | SP19, SP20, SP21 | 6 | 2 buổi | Ba người giải thích được luồng mình và kiến trúc chung; ai cũng có nội dung tham gia | 3,0 |
| SP24 | Đóng gói, ghi nhãn, kiểm lại sau lắp và bàn giao bản cuối | TV3 | TV1 | Vỏ/gá gọn, README/as-built, bản phát hành và gói nộp cho NT | SP21, SP22, SP23 | 8 | 2–3 buổi | Kiểm lại rung/RPM/STOP sau đổi gá; bản vẽ và BOM khớp bản thật; NT nộp theo thông báo | 4,0 |

| Tổng sản phẩm A | Giờ dự kiến | Tỷ lệ riêng |
|---|---:|---:|
| TV1 | 72 | 36% |
| TV2 | 60 | 30% |
| TV3 | 68 | 34% |
| **Tổng lõi** | **200** | **100%** |

Cách tính: giờ task / 200 × 100%; tổng TV1/TV2/TV3 là tổng các SP-ID do người đó sở hữu. Không cộng với tỷ lệ đề cương. Quỹ dự phòng đề xuất **25% = 50 giờ-người** dùng cho tái đo/lỗi tích hợp, chưa phân thành chức năng hay đóng góp; khi dùng phải ghi thực tế và tái lập dự toán.

Ví dụ kiểm sức tải, nếu sau đề cương mỗi người chỉ có 9 giờ/tuần: TV1 cần ít nhất 72/9 = 8 tuần công; thêm dự phòng tỷ lệ tương ứng là khoảng 10 tuần công. Đây chỉ là **giới hạn theo nguồn lực**, chưa tính phụ thuộc/giao hàng và không phải lời hứa ngày hoàn thành. Nhóm phải đối chiếu hạn chính thức rồi thu hẹp/tái phân bổ; không nhét 200 giờ vào D1–D7.

### E3. Lịch triển khai tương đối dùng cùng SP-ID

Các tổng giờ theo giai đoạn dưới đây cộng đúng 200; có thể mở việc kế tiếp theo đầu ra trung gian đã khóa, không cần đợi mọi người cùng hết giai đoạn.

| Giai đoạn | Task ID và chủ sở hữu | Tải giờ-người | Mốc/điều kiện chuyển tiếp |
|---|---|---:|---|
| G0 — đặc tả và chuẩn bị | SP01 TV1; SP02 TV2; SP03 TV3 | 24 | M0: schema/đơn vị/chủ sở hữu, BOM đợt cảm biến, broker riêng và cấu hình phù hợp. Khóa pinout vật thật riêng với Wokwi |
| G1 — ba nhánh trên bàn thử | SP04 TV1; SP05 TV2; SP06 TV3 | 28 | M1: MPU tĩnh thật, Hall quay tay/PPR, lệnh–ACK–renew trên tải thử đều có log; tích hợp giao diện lần đầu, chưa cấp motor |
| G2 — thời gian và bảo vệ | SP07 TV1; SP08 TV2; SP09 TV3 | 28 | M2: raw đều có quality, RPM đi tới web, local fail-safe trên tải thử. Thử mất mạng sớm |
| G3 — phép đo vật lý không motor | SP10/SP13/SP16 TV1; SP11 TV2 | 36 | M3: raw/RMS/web + lưu phiên; ≥5 ringdown hợp lệ, vùng mode ứng viên và độ lặp. SP13 có thể chuẩn bị bằng tín hiệu synthetic khi giao diện SP11 đã chốt |
| G4 — motor và RPM có bảo vệ | SP12/SP15 TV3; SP14 TV2 | 24 | M4: chọn theo pilot; quay có che chắn, RUN/ACK/RPM khác nhau; STOP/cắt nguồn và coastdown có số đo. Không cấp nguồn trước SP09 |
| G5 — ba luồng và ma trận lỗi | SP17/SP20 TV2; SP18/SP21 TV3; SP19 TV1 | 38 | M5: tích hợp đồng thời, chất lượng rung/RPM, phiên độ bền, dừng/mất mạng/phục hồi. Không có lỗi an toàn chặn phát hành |
| G6 — hồ sơ, đóng gói và bàn giao | SP22 TV1; SP23 TV2; SP24 TV3 | 22 | M6: kết quả khớp bằng chứng, vỏ/gá khớp bản vẽ as-built, kiểm lại sau lắp, ba người luyện và NT nhận bản cuối |
| **Tổng** | **SP01–SP24** | **200** | Không gán ngày cuối kỳ khi chưa có thông báo |

**Đường găng kỹ thuật sơ bộ:** SP04 → SP07 → SP10 → SP16 → SP12 → SP14/SP15 → SP17/SP18 → SP19–SP21 → SP22/SP23 → SP24. SP11/SP13 cũng phải sẵn để SP16 đạt; SP03/SP06/SP09 là nhánh chặn motor. Giao hàng/gia công có thể thành đường găng mới. Chốt lịch thực sau pilot và kiểm nguồn lực, không chỉ cộng thời lượng trung bình.

Trước mỗi lần quay thật, TV3 xác nhận đầu ra mặc định OFF khi boot/reset, giới hạn đã khai báo, gá/guard/cắt nguồn đạt; TV2 xác nhận RPM hợp lệ; TV1 xác nhận sampler/quality theo chế độ chạy. Task xác nhận từng phần vẫn thuộc owner tương ứng, quyết định cho phép chạy thuộc TV3.

### E4. Tùy chọn có điều kiện, chưa nằm trong 200 giờ/100%

| ID | Chức năng/đầu ra | Owner | Reviewer | Ước lượng thêm | Chỉ mở khi | Tiêu chí/giới hạn |
|---|---|---|---|---|---|---|
| TC01 | Thí nghiệm đổi cấu hình A–B–A, bảng so sánh mode/độ lặp | TV1 | TV2 | 8–12 giờ | M3 đạt, phép đổi chiều dài/tải an toàn và còn quỹ giờ | Chứng minh đáp ứng thay đổi cấu hình có kiểm soát; không gọi là kiểm thử bộ phát hiện |
| TC02 | Baseline đóng băng và phát hiện thay đổi theo phiên | TV1 | TV3 | 16–24 giờ | SP19 đạt, có đủ dữ liệu train/test độc lập, GV đồng ý phạm vi | Tối thiểu theo thiết kế sổ tay: train A≥5 hợp lệ; test A≥5/B≥5 và quay lại A. Khóa đặc trưng/ngưỡng trước test; không dùng config_id để đoán nhãn |
| TC03 | Sweep cưỡng bức theo RPM và đối chiếu đáp ứng | TV1 | TV3 | 16–24 giờ | M5 đạt; ghép lực thật, dải RPM phủ hai phía mode, guard/giới hạn đạt; đo free-decay lại cùng cấu hình gắn tải | Xét xác lập, chất lượng, độ lặp và biến thiên lực ERM; dùng A1/ω² có giả định, không gọi FRF đo lực khi không đo lực; không chọn điểm lớn nhất rồi kết luận |
| TC04 | Xác thực người dùng web/phiên thao tác | TV2 | TV3 | 8–12 giờ | Lõi ổn, nhu cầu/phạm vi và cách chấm GV rõ | Kiểm quyền và phiên; không thay thế broker riêng/local fail-safe; không tính trùng thiết bị |
| TC05 | Lưu/đọc dữ liệu Cloud thực sự và hiển thị trên web | TV2 | TV1 | 12–20 giờ | Có tài khoản/chi phí/dữ liệu/quyền, M5 đạt và GV duyệt cách tính | Có đọc lại Cloud bằng Text/Gauge/Chart theo mục đăng ký; SQLite local không đạt mục này |

**Trọng số hiện tại của TC01–TC05: 0% vì chưa kích hoạt**, không phải “làm miễn phí”. Ước lượng trên là sơ bộ, chưa bao gồm hạ tầng mới/phí dịch vụ. Không mở tất cả; nếu chọn, thêm task vào WBS/lịch cùng ID, xác định một owner, cập nhật tổng giờ và tính lại tỷ lệ về 100% trước khi cam kết. Với tải TV1 hiện cao, phải giảm một phạm vi khác hoặc bố trí thêm thời gian, không giữ nguyên tỷ lệ rồi cộng việc.

Hướng phát triển chưa đăng ký: Wi-Fi provisioning, chatbot, điều khiển từ xa công khai, tự tối ưu, phân loại hư hỏng/AI. Không đưa chúng vào bảng chức năng cam kết, BOM bắt buộc hoặc dự báo điểm. Python/NumPy là phương án xử lý trong sổ tay; chốt công cụ sau pilot, không thêm worker chỉ để làm đẹp kiến trúc.

## F. Khung PDF, PPTX và nội dung dùng chung

### F1. Dàn ý PDF để soạn ngay

Cấu trúc dưới là khung nội dung, **không đặt số trang tối đa/tối thiểu** thay GV.

| Phần | Nội dung phải viết | Người soạn | Người ghép/kiểm |
|---|---|---|---|
| Bìa | Môn/lớp, mã nhóm, tên đề tài, đủ họ tên/MSSV, thông tin GV theo thông báo, phiên bản | TV2 — DC03/DC28 | TV1 — DC24; TV2 xác nhận tên/số |
| Mục lục và danh mục hình/bảng nếu cần | Mục lục tự cập nhật; thuật ngữ/viết tắt nhất quán | TV1 — DC02/DC24 | TV2 — DC25 |
| 1. Ý tưởng, lý do, mục tiêu | Vấn đề học tập, lý do chọn, người dùng demo, phạm vi A/B đề xuất/đã chốt, các giới hạn | TV1 — DC01/DC06 | TV3 — DC20, TV2 review |
| 2. Cơ sở vật lý và cách kiểm chứng | Gia tốc/rung, mode, fd/fn/f_exc; lấy mẫu, RMS, modal motor OFF; phương pháp đánh giá và bất định | TV1 — DC06/DC18 | TV2 review, TV3 ghép |
| 3. Kiến trúc và ba luồng | Khối chung, thiết bị khác nhau, giao diện MQTT/HTTP/WS và trách nhiệm ba người | TV3 — DC05; TV2 cung cấp DC04 | TV1 review; TV3 ghép |
| 4. Bảng chức năng và mô tả chi tiết | Danh mục F-ID; mỗi chức năng có tình huống sử dụng/đầu vào/xử lý/đầu ra/quality/lỗi/nghiệm thu | TV1 viết rung; TV2 viết RPM/lưu phiên; TV3 viết điều khiển/UI chung | TV3 — DC11/DC17/DC20 giữ danh mục; TV2 kiểm đủ |
| 5. Thiết bị/BOM/dự toán | Điện tử, cơ, nguồn/bảo vệ; biến thể/SL/giá/tổng/nguồn/ngày và phương án chưa chốt | TV2 — DC08/DC15 | TV3 review chọn nguồn/driver; TV1 kiểm gá |
| 6. Phác thảo sản phẩm | Hình ngoài TV2 tự vẽ; hình trong TV1 tự vẽ; chú thích và thông số dự kiến. Sơ đồ khối/dây trình bày riêng | TV2 — DC09; TV1 — DC13 | TV3 kiểm vị trí nguồn/STOP và khớp BOM |
| 7. Hiện trạng và khả thi | Bảng thiết kế/mã/local/Wokwi/thật/chưa thử; proof có nhãn; lỗi ACK và giới hạn hiện tại | TV3 — DC10/DC16; TV1 DC12; TV2 DC14 | TV1 review bằng chứng, TV3 ghép |
| 8. Phân công và kế hoạch | Bảng SP-ID, % riêng, phụ thuộc, lịch G0–G6, tích hợp, thử vật lý, đóng gói. Bảng DC-ID để quản lý tuần này có thể ở phụ lục | TV1 — DC18; TV2 — DC19 | TV3 ghép, TV1 review phép gán khoa học |
| 9. Rủi ro/giảm tải và tiêu chí hoàn thành | MQTT/ACK, sampler, dải motor/gá, giá/tồn kho, hỏi GV; tùy chọn có cổng và phương án dự phòng | TV2 — DC19, TV3 — DC17/DC20 | TV1 review; TV2 kiểm nhất quán |
| Tài liệu tham khảo | Quy định GV, nguồn kỹ thuật/linh kiện, sổ tay/ToiHieu phân biệt tài liệu nội bộ; nguồn gắn với từng nhận định | TV1 tập hợp — DC21/DC24; mỗi TV cung cấp nguồn phần mình | TV2 — DC25 xác minh đủ thông tin |
| Phụ lục nếu hữu ích | Schema, proof/log rút gọn không bí mật, checklist, câu hỏi chờ GV, bản vẽ gốc | TV3 tập hợp — DC20 | TV1/TV2 kiểm đúng phần |

TV3 ghép **bản nội dung** D4; TV1 nhận trách nhiệm **PDF xuất bản** D6–D7. Quy trình này không dồn viết toàn bộ tài liệu cho một người. Tài liệu nguồn giữ chỉnh sửa được; không chỉ bàn giao bản PDF đã khóa.

### F2. Khung PPTX

Đây là các **khối nội dung**, một khối có thể cần hơn một slide. Không xem số hàng là số slide GV yêu cầu.

| Khối | Nội dung | Người soạn | Người ghép/kiểm |
|---|---|---|---|
| Mở đầu | Mã nhóm/tên/MSSV, tên sản phẩm, lý do | TV1 và thông tin TV2; owner khối TV1 | TV3 ghép, TV2 kiểm danh tính |
| Mục tiêu/phạm vi | Lõi, tùy chọn, không cam kết; phương án A/B và điểm chưa duyệt | TV1 | TV3 kiểm theo DC17 |
| Kiến trúc | Ba luồng xuyên suốt, thiết bị khác nhau, lớp truyền thông | TV3 | TV1 |
| Rung/vật lý | Raw/RMS/quality và phiên modal riêng; lấy mẫu, điều kiện phân tích, giới hạn | TV1 | TV2 |
| RPM | Hall/PPR/RPM/f_exc, trường hợp không hợp lệ, không suy từ duty | TV2 | TV1 |
| Điều khiển | START/PWM/STOP, gửi→ACK→RUN→RPM, lease và mất kết nối | TV3 | TV2 |
| Chức năng thiết bị/web | Bảng F-ID gọn và thao tác UI dự kiến; chức năng nhỏ không bị bỏ khỏi bảng tổng | TV3 giữ danh mục, ba người cung cấp phần mình | TV2 đối chiếu PDF |
| Phác thảo và BOM | Ngoài/trong có chú thích, linh kiện/giá/nguồn, khoản chưa chốt | TV2; hình trong nhận từ TV1 | TV3 kiểm |
| Hiện trạng/minh chứng | Cái đã có mã, đã test local, Wokwi một phần và cái chưa có | TV3 | TV1 |
| Phân công/kế hoạch/rủi ro | Tỷ lệ/SP-ID, G0–G6, đường găng, phương án giảm tải | TV2 | TV1 |
| Tài liệu tham khảo/câu hỏi | Nguồn chính đọc được, câu hỏi nhóm cần làm rõ | TV1 | TV2; TV3 chạy trình chiếu |

TV3 giữ master PPTX; TV1/TV2 phải tự tạo và sửa phần slide của mình. Thuyết trình chia theo trọn luồng, có chuyển ý giữa các luồng; không để một người chỉ đọc phần hành chính.

### F3. Danh mục chức năng chuẩn dùng chung PDF/PPTX

Trạng thái **“cam kết dự kiến”** chỉ nghĩa đề xuất đưa vào sản phẩm A, không nghĩa đã hoàn thành. Cột hiện trạng rút gọn phải giữ trong hồ sơ khả thi; khi trình bày có thể tách thành bảng riêng nhưng không đổi ID/nội dung. Mỗi ID có một owner; chức năng chung TV3/TV2 phụ trách tích hợp không thay owner luồng.

| ID | Chức năng/mô tả | Thao tác/đầu vào | Đầu ra thiết bị/web | Trạng thái dự kiến và hiện trạng | Chủ sở hữu |
|---|---|---|---|---|---|
| F01 | Đọc gia tốc ba trục, cấu hình và raw block | MPU6050, cấu hình trục/range/Fs | Gia tốc có dấu, m/s², seq/t_device, cấu hình | Cam kết; hiện chỉ điểm synthetic thưa, sampler đều chưa có | TV1 |
| F02 | Chất lượng và biểu đồ raw | Raw, gap/clip/overrun, thời gian thiết bị | Đồ thị, Fs thực đo, cờ lỗi; từ chối phân tích khi không đạt | Cam kết; UI raw/quality bản 03 một phần, quality sampler còn thiếu | TV1 |
| F03 | RMS/peak liên tục | Cửa sổ hợp lệ, trục và cách loại DC công bố | RMS/peak cùng đơn vị và thời gian cửa sổ; không trộn modal | Cam kết; chưa có pipeline tương ứng | TV1 |
| F04 | Đếm xung/PPR và RPM thực đo | Hall; PPR/tỷ số truyền đã kiểm | RPM và quality, zero khác unknown/stale | Cam kết; encoder custom có mã/CSV, Hall thật chưa kiểm | TV2 |
| F05 | Tần số kích thích có điều kiện và biểu đồ tốc độ | RPM, số chu kỳ lực/vòng q | f_exc = q×RPM/60; hiển thị giả định q=1 khi phù hợp, lịch sử RPM | Cam kết; RPM có UI, quy ước f_exc cần hoàn thiện | TV2 |
| F06 | Thao tác START và đặt/thay đổi duty | Người vận hành, duty trong giới hạn | Lệnh có ID/boot/deadline, trạng thái yêu cầu và giới hạn | Cam kết; có mã, ACK Wokwi sau sửa chưa xác nhận | TV3 |
| F07 | Phản hồi lệnh, đầu ra và chuyển động | MQTT ACK, telemetry RUN/PWM, RPM từ F04 | Tách “backend gửi”, “ESP ACK”, RUN/duty và RPM; lỗi/timeout rõ | Cam kết; có mã/test local, toàn chuỗi Wokwi chưa ổn định | TV3 |
| F08 | STOP trên web và ngừng renew | STOP/đóng hoặc mất phiên điều khiển | Gửi STOP khi có thể; hết lease thì OFF, không dựa riêng unload của trình duyệt | Cam kết; logic mô phỏng có mã/test, vật thật chưa kiểm | TV3 |
| F09 | STOP cục bộ và cắt điện motor thật | Nút STOP; công tắc cắt đường nguồn có hồi tiếp phù hợp | Đầu ra OFF; trạng thái lý do; rotor có thể còn coastdown | Cam kết A; STOP logic có mã, cắt nguồn thật chưa có | TV3 |
| F10 | Lease, mất kết nối và khởi động an toàn | Mất renew/MQTT/backend, boot/reset/reconnect | Dừng đúng điều kiện; mặc định OFF, không tự START khi nối lại | Cam kết; có mã/test portable/local, cần kiểm hệ thật | TV3 |
| F11 | Kiểm lệnh không hợp lệ | Trùng ID, hết hạn, sai boot, payload sai | ACK/reject có lý do, không vô tình gia hạn hoặc bật lại | Cam kết; có test local, cần kiểm thiết bị | TV3 |
| F12 | Giới hạn vận hành và lỗi thiết bị | Duty/RPM/runtime, tach/sampler/STOP feedback theo chế độ | Chặn/dừng, cảnh báo nguyên nhân; có nhật ký | Cam kết A; bản 03 chưa đủ mọi bảo vệ cho motor thật | TV3 |
| F13 | Trạng thái kết nối/nguồn/stale trên dashboard | MQTT/WS, boot/source, tuổi dữ liệu của từng luồng | Nhãn synthetic/measured, online/stale/unknown, giữ cũ có nhãn và thời điểm | Cam kết; có mã/test bản 03, cần tích hợp quality mới | TV3 |
| F14 | Tạo/kết thúc phiên và lưu metadata/raw | Loại phiên, config/run, nguồn, chú thích gá | Raw file + manifest local, trạng thái ghi/lỗi | Cam kết; có log chẩn đoán nhưng quản lý phiên đo chưa có | TV2 |
| F15 | Danh sách phiên, xem lại và xuất dữ liệu | Chọn phiên, tải dữ liệu/CSV/metadata | Dữ liệu gốc truy được, phân biệt xem lại với live; báo lỗi lưu/đọc | Cam kết; export mô phỏng một phần, lịch sử phiên đầy đủ chưa có | TV2 |
| F16 | Thu phiên dao động tự do riêng | Motor OFF/rotor dừng; chọn trục/cấu hình; kéo–thả bằng tay | Phiên free-decay có raw/quality và lý do chưa đủ điều kiện | Cam kết A; chưa có phiên vật thật | TV1 |
| F17 | Phân tích/hiển thị modal cơ bản theo phiên | Phiên F16 hợp lệ, cửa sổ/FFT và đối chiếu chu kỳ | Phổ, fd/mode ứng viên, độ phân giải/bất định; lỗi trả “không đủ dữ liệu” | Cam kết A; chưa có mã tương ứng; không suy fn từ forced FFT | TV1 |
| F18 | Chẩn đoán và truy vết điều khiển | command_id, boot, send/ACK/publish/disconnect, lý do OFF | Log ngắn đối chiếu được và trạng thái cuối trên web | Cam kết; mã chẩn đoán mới có, chưa xác nhận log ESP mới trong Wokwi | TV3 |
| F19 | Cấu hình vận hành và phiên an toàn | PPR/config ID, địa chỉ thiết bị, giới hạn theo cấu hình đã duyệt | Hiển thị cấu hình đang dùng; đổi cấu hình đo chỉ lúc phù hợp, không trộn dữ liệu | Cam kết; setup bản 03 có, chưa là màn hình cấu hình đầy đủ | TV2 |
| F20 | Hiển thị cảnh báo vận hành | Cờ quality, stale, lỗi lệnh/lưu, vượt giới hạn | Thông báo cụ thể có thời gian/lý do; không gắn nhãn “hỏng cấu trúc” | Cam kết; một phần bản 03, cần kết nối các cờ mới | TV3 |
| F21 | Tách chế độ mô phỏng và vật thật | source/run/config và môi trường đã chọn | Nhãn xuyên thiết bị→MQTT→lưu→web→export; không trộn tập đo | Cam kết; bản 03 synthetic, chưa có luồng measured | TV1 |

Ghi chú mô tả chi tiết để không phát sinh chức năng ngầm:

- “Cảnh báo” lõi chỉ cảnh báo chất lượng/điều kiện vận hành, không phải detector hư hỏng. Phát hiện thay đổi đặc trưng thuộc TC02.
- “Cấu hình” không cam kết quản trị người dùng hay sửa broker/secret trên web. Giá trị nhạy cảm cấu hình ngoài UI; PPR/giới hạn không được đổi giữa cửa sổ rồi vẫn nối dữ liệu như cùng cấu hình.
- UI có biểu đồ gia tốc/RPM, đơn vị, thời điểm cuối, trạng thái nút/khóa START khi thiếu điều kiện, lỗi request/ACK, xem lại/xuất và trạng thái ghi phiên. Đây đều là phần của F02/F05/F06–08/F13–15/F20, không bị bỏ vì là chức năng nhỏ.
- Không cam kết closed-loop giữ RPM ở lõi. Duty là đầu ra điều khiển; RPM là tốc độ đo. Nếu đổi mục tiêu này phải thêm task/kiểm thử riêng.
- Raw/RMS chạy liên tục không tự động thành phiên modal. Phiên modal có điều kiện motor OFF, cấu hình cố định, lấy mẫu/quality đạt và raw lưu được.
- Source measured chỉ được dùng cho giá trị thực sự đọc từ cảm biến thật; dữ liệu tổng hợp hoặc giả thiết vẫn synthetic, kể cả backend/frontend chạy trên máy thật.

Danh mục tùy chọn dùng **TC01–TC05** ở E4 làm ID chức năng tương ứng trong PDF/PPTX; nếu chưa kích hoạt thì để dưới nhãn “tùy chọn có điều kiện”, không trộn vào danh sách nghiệm thu lõi. TC03 nếu kích hoạt có thêm trạng thái web: **insufficient_data, surveying, supported, inconclusive**; chỉ “supported” cho phiên có bằng chứng đáp ứng/đối chiếu hợp lệ, không là chứng nhận cộng hưởng mọi cấu hình.

### F4. BOM — mẫu điền và ngân sách tham khảo có nguồn

**Không tra giá thị trường mới trong lượt lập kế hoạch này.** Các giá dưới trích sổ tay §4, mốc tham khảo **21/10/2026**, chưa xác minh lại tồn kho/biến thể/thuế/vận chuyển. Nhãn “ước tính” khác giá có nguồn cửa hàng. Không dùng bảng này như báo giá đặt hàng đã chốt.

| Nhóm/thiết bị | SL | Biến thể cần ghi | Đơn giá tham khảo (đ) | Thành tiền (đ) | Nguồn/mốc và việc cần xác minh |
|---|---:|---|---:|---:|---|
| ESP32 | 1 | DevKit V1 30 pin, WROOM theo sổ tay | 155.000 | 155.000 | [Tâm Công Nghệ](https://tamcongnghe.vn/san-pham/esp32-devkit-v1), sổ tay 21/10; kiểm đúng board/chân/mức logic |
| MPU6050 | 1 | Module GY-521; kiểm chất lượng/nguồn pull-up | 85.000 | 85.000 | [Hshop](https://hshop.vn/cam-bien-6-dof-bac-tu-do-gy-521-mpu6050), sổ tay 21/10; không thay bằng giá món hết hàng khác |
| Cảm biến tốc độ của BOM cũ | 1 | TCRT5000 DO **quang**, không phải Hall | 15.000 | 15.000 | [Hshop dò line đơn](https://hshop.vn/cam-bien-do-line-don), sổ tay 21/10; chưa chứng minh phù hợp tachometer |
| Vạch phản xạ/gá của phương án quang | 1 bộ | Chỉ dùng nếu chọn quang | 5.000 | 5.000 | Ước tính nội bộ sổ tay, chưa có báo giá |
| Dây nối | 1 bộ | Loại/chiều dài/đầu nối cần chốt | 20.000 | 20.000 | Ước tính nội bộ; tách số lượng khi chốt |
| **Cộng điện tử phương án cũ** | | | | **280.000** | Không phải tổng điện tử Hall |
| Thước thép | 1 | Khoảng 30 cm; đo bề dày thực, chiều dài hữu hiệu | 25.000 | 25.000 | Ước tính nội bộ, chưa chốt vật liệu/kích thước |
| Ngàm/đế cứng | 1 bộ | Mượn được thì ghi người cho mượn | 0 có điều kiện | 0 có điều kiện | Chỉ tính 0 sau khi xác nhận có; nếu phải mua phải cộng lại |
| Gá MPU | 1 bộ | Nhẹ, cứng, không làm biến dạng phép đo | 10.000 | 10.000 | Ước tính nội bộ |
| Gá motor/tốc độ/lệch tâm | 1 bộ | Kiểm giữ nam châm/khối lệch tâm và che rotor | 20.000 | 20.000 | Ước tính nội bộ; không cộng trùng với bộ nam châm mới |
| Vỏ/che chắn | 1 bộ | Bố trí ngàm, nguồn và rotor có che | 25.000 | 25.000 | Ước tính nội bộ; có thể cần tăng sau thiết kế |
| **Cộng cơ khí cũ** | | | | **80.000** | Có điều kiện mượn ngàm/đế |
| Motor DC nhỏ | 1 | Chưa chốt model/RPM/dòng/tải; chọn sau pilot | 50.000 | 50.000 | Ước tính nội bộ, không phải model đã được khuyến nghị/chọn mua |
| Driver motor | 1 | TB6612FNG trong sổ tay; kiểm dòng khởi động/kẹt trước dùng | 45.000 | 45.000 | [Hshop](https://hshop.vn/mach-dieu-khien-dong-co-dc-tb6612fng-dc-motor-driver), sổ tay 21/10; có thể phải thay |
| Nguồn DC motor | 1 | Điện áp/dòng/đầu nối chờ motor | 40.000 | 40.000 | Ước tính nội bộ, chưa có model/nguồn giá |
| Cắt nguồn/hồi tiếp, cầu chì, đế/terminal | 1 bộ tạm | Chọn đúng định mức, chia thành từng linh kiện trong BOM cuối | 20.000 | 20.000 | Ước tính gộp sổ tay; **chưa đủ chi tiết để coi là thiết kế chốt** |
| Tụ/pulldown/cách điện | 1 bộ tạm | Giá trị/SL/điện áp theo thiết kế điện | 10.000 | 10.000 | Ước tính gộp; tách từng món khi chốt |
| Cáp USB | 1 | Có sẵn hay mua phải xác nhận | 0 có điều kiện | 0 có điều kiện | Không mặc định mọi người đều có cáp phù hợp |
| **Cộng nguồn/driver/bảo vệ cũ** | | | | **165.000** | Chưa xác minh dòng/định mức |
| Vận chuyển dự tính | 1 khoản | Phụ thuộc số đơn/cửa hàng | 35.000 | 35.000 | Ước tính, không phải linh kiện |
| Dự phòng giá/vật tư | 1 khoản | Tách khỏi tiền linh kiện | 50.000 | 50.000 | Ước tính, không giấu vào đơn giá |
| **Tổng kịch bản cũ** | | | | **610.000** | 280.000 + 80.000 + 165.000 + 35.000 + 50.000 |

**Bổ sung bắt buộc cho phương án Hall đề xuất:**

| Hạng mục chưa chốt | SL dự kiến | Biến thể/điều kiện phải xác định | Giá/nguồn hiện có |
|---|---:|---|---|
| Hall đo tốc độ | 1 | Mã linh kiện/module, kiểu ngõ ra, điện áp/logic 3,3 V, tần số xung, khoảng cách làm việc | Chưa có giá/nguồn đã xác minh; DC08/DC15 tra và lưu bằng chứng |
| Nam châm và giữ cơ khí | 1 bộ | Số cực/nam châm/PPR, gá không văng; tách phần đã gồm trong gá motor | Chưa có giá/nguồn đã xác minh |
| Chuyển mức/pull-up nếu cần | Theo datasheet | Không nối mức không phù hợp vào ESP; kiểm module cụ thể | Chưa xác định có cần; không tự điền 0 đồng |
| Từng phần tử nguồn/cắt/bảo vệ | Theo sơ đồ | Rating, số lượng, chỗ mua; không chỉ một dòng “bảo vệ” | Giá gộp cũ chỉ là dự toán, cần phân rã |

Công thức tham chiếu khi đổi đúng hai dòng quang sang Hall: **610.000 − 15.000 − 5.000 + H + M = 590.000 + H + M**, với H là Hall, M là phần nam châm/gá chưa tính ở nơi khác. Còn phải cộng phần chuyển mức/định mức nguồn/gá phát sinh nếu có và cập nhật vận chuyển. Đây **không phải ngân sách Hall đã chốt**. Không chọn con số 610.000 làm ngân sách trần khi H/M còn chưa biết.

DC15 phải có dự toán dùng được cho đề cương: biến thể ưu tiên và phương án thay, SL rõ, giá có ngày/nguồn hoặc giá ước tính có căn cứ ghi riêng, món mượn có xác nhận. Trước D6 không để “TBD” âm thầm trong tổng chốt; nếu model motor phải đợi pilot, ghi rõ **dự trù theo dải yêu cầu/nguồn báo giá**, cổng chọn ở SP12 và chi phí chưa chắc, không bịa model/link. Nếu không đủ căn cứ dự toán, phải mở lỗi chặn hoàn thiện mục BOM để DC15 xử lý, không đánh dấu đạt.

BOM xuất bản cần cột **STT/thiết bị/biến thể/SL/đơn giá/thành tiền/nguồn URL/ngày tra cứu/tình trạng có sẵn-mượn-mua/ghi chú**. SL×đơn giá phải khớp thành tiền; điện tử không được mất khỏi bảng chỉ vì nằm trong bộ gá. Vật tư Wokwi là danh sách mô phỏng riêng, không trình bày như thiết bị thật đã mua giá 0.

### F5. Yêu cầu phác thảo và trình bày

- **Hình ngoài (TV2/DC09):** mặt trước và góc bên/phối cảnh tự vẽ; kích thước dự kiến; ngàm/thước lộ ra, vùng rotor có che, nút STOP/công tắc cắt, cổng nguồn/USB và vị trí quan sát. Ghi tên từng phần và “phác thảo dự kiến”.
- **Hình trong (TV1/DC13):** hình cắt hoặc mở nắp; vị trí ESP/MPU/Hall/driver/nguồn/cầu chì/cắt nguồn; gá thước/nam châm/rotor, đường dây nguồn–tín hiệu, chỗ cố định và khoảng tránh phần quay. Nếu motor ở đế riêng, thể hiện đúng sự tách cơ học.
- TV3 kiểm với BOM/logic nguồn; giữ bản gốc do nhóm tự vẽ và lịch sử sửa. Có thể dùng công cụ vẽ hoặc vẽ tay scan rõ; không lấy ảnh sản phẩm hoặc ảnh AI tạo để thay bản nhóm tự vẽ.
- Sơ đồ khối, sơ đồ dây/Wokwi và sơ đồ luồng là hình phụ riêng. Mermaid có sẵn không thay được hai hình phác thảo hình dáng/cấu trúc.
- Nhóm chọn **một font hỗ trợ tiếng Việt** dùng thống nhất, quy định cỡ/heading/caption trong template D1; đây là lựa chọn nội bộ, không tự coi một font/cỡ cụ thể là yêu cầu GV. Văn bản PDF canh đều; bảng, công thức, đơn vị và caption rõ. PPTX thống nhất hệ font và kiểm hiển thị khi trình chiếu.
- Gỡ ký hiệu chuyển đổi Markdown/Pandoc như `{=tex}` còn trong ToiHieu khỏi bản xuất; dựng công thức đúng thay vì copy nguyên backtick. Gắn số hình/bảng, nguồn ngay nơi dùng; phân biệt hình tự vẽ với hình tham khảo.
- Trích nguồn kỹ thuật gốc/datasheet và tài liệu môn khi viết bản cuối; sổ tay là tài liệu nội bộ tổng hợp, không tự biến URL trong đó thành nguồn đã kiểm lại. Không đưa .env/token/credentials vào ảnh/log/tài liệu.


## G. Rủi ro, đường găng và cách giảm tải

### G1. Đường găng của lần nộp đề cương

**DC01/03/04 → DC05 và ba nhánh nội dung DC06/08/10 → DC13/15/17 → DC18/19 → DC20 → DC23/24/26 → DC25 → DC27/28/29 → NOP01.** Phác thảo/BOM/phạm vi là đầu vào bắt buộc; thiếu chúng chặn bộ đề cương đầy đủ. Các phụ thuộc dùng bản nháp cho phép làm sớm, nhưng số liệu/nguồn cuối phải khóa trước xuất bản.

**DC12/14/16 là điểm kiểm rủi ro có thời hạn, không là đường găng bắt buộc phải “test pass”.** Hết D3 chúng phải bàn giao biên bản kết quả hoặc chưa kiểm chứng để DC17 chốt tài liệu trung thực. Không kéo bug ACK sang D6 khiến chưa có bản PDF/PPTX.

### G2. Sổ rủi ro có chủ sở hữu

| Rủi ro | Dấu hiệu/căn cứ | Chủ sở hữu | Xử lý và mốc quyết định |
|---|---|---|---|
| Chưa chốt phạm vi hoặc cách hiểu yêu cầu GV | Hall/quang, vật thật/giả lập, cộng hưởng/giám sát khác nhau | TV2 | DC03 lập câu hỏi, D1 ghi giả định; DC17 D3 chốt phạm vi để viết. Chưa có trả lời thì ghi “đề xuất/chờ xác nhận”, không nhận là đã duyệt |
| MQTT/ACK Wokwi chưa ổn | Web timeout/ngừng renew, reconnect nhiều lần; patch mới chưa chạy Wokwi | TV3 | DC16 tối đa 2 giờ; ghi trace command_id và kết quả, chuyển lỗi sang SP06 nếu còn. Không hạ bảo vệ/boot/deadline hay tăng timeout để che lỗi |
| Hai đồng hồ khác nhịp trong Wokwi | Khoảng gap ~94,7 giây máy nhưng ESP tăng ~2 giây | TV3 | Thu song song thời gian máy/ESP, client ID, disconnect reason và publish result. Phân biệt ACK đến muộn/không publish/BE reject/FE không xử lý. Chưa có log thì giữ là giả thuyết |
| Lấy mẫu thưa bị dùng làm phân tích | Bản 03 gửi khoảng 250 ms/điểm | TV1 | DC12 mô tả đúng giới hạn; SP07 là cổng trước RMS/modal. Không dùng timestamp nhận MQTT hoặc nội suy để giả 200 Hz |
| Hall/nam châm/model/giá chưa chốt | Sổ tay ghi TCRT5000, ToiHieu Hall | TV2 | DC08/DC15 xác định biến thể, logic, PPR, giữ nam châm và báo giá; không lấy giá quang thay Hall; nếu chưa đủ thì lỗi BOM còn mở |
| Motor không phù hợp dải đo hoặc nguồn/driver | Chưa có mode thật/dòng khởi động/tải/gá | TV3 | Báo giá dự trù có điều kiện ở đề cương; chọn mua/lắp theo SP16→SP12. Không cấp motor từ GPIO, không bỏ guard/cắt điện |
| Khó quan sát mode/dao động hoặc gá ảnh hưởng | Chưa có ringdown thật; khối lượng MPU/gá có thể đổi hệ | TV1 | Pilot cảm biến trước; ghi chiều dài/tải/gá, đo lặp; không đạt thì điều chỉnh/giảm kết luận, chưa mở sweep |
| Bản phác thảo không đạt yêu cầu | Chỉ có sơ đồ khối/dây hoặc ảnh sản phẩm | TV1 | TV2 làm hình ngoài DC09, TV1 làm hình trong DC13, TV3 rà BOM. Không thay bằng hình có sẵn |
| Một người gánh ghép tài liệu và lỗi tích hợp | TV3 19 giờ đề cương, 68 giờ sản phẩm | TV3 | Chặn thêm ý tưởng D5; TV1 giữ PDF, TV2 giữ BOM/lịch và QA. Tái phân bổ cả phạm vi/task nếu vượt 3 giờ/ngày; không bù bằng xóa review |
| Tài liệu bịa trạng thái/nguồn | Ví dụ trong sổ tay, test giả thiết bị bị gọi thành kết quả thật | TV1 | Bảng hiện trạng A2 và nhãn từng hình/log; DC25 kiểm độc lập; thiếu bằng chứng ghi chưa kiểm chứng |
| Trình chiếu/font/tên file/nộp lỗi | Chưa có bản export, thiếu MSSV/NT/lịch thật | TV2 | D6 mở/trình chiếu; D7 chốt tên; D8 NT nộp và TV2 lưu bằng chứng. Không để D8 mới xuất lần đầu |
| Lịch thật ngắn hơn nguồn lực cần | Chưa có deadline sản phẩm và quỹ giờ chính thức | TV2 | Kiểm lại tại D1 và khi nhận thông báo; giữ lõi phù hợp, cập nhật giờ/% cùng lúc, không hứa 200 giờ trong một tuần |

### G3. Minh chứng tối thiểu, không đánh đồng với nghiệm thu

Tuần đề cương cần **hồ sơ khả thi**, không cần sản phẩm hoàn chỉnh:

1. Ba sơ đồ luồng, hợp đồng dữ liệu/lệnh và bảng thiết bị khác nhau.
2. Trích mã hiện có và báo cáo local kèm ngày/phiên bản nếu xác định được; viết “theo log đã lưu”, không “vừa chạy lại” khi chưa chạy.
3. Trích CSV/ảnh Wokwi có source synthetic, nêu RPM mô phỏng đã xuất hiện và giới hạn ACK/đồng hồ/ghép cơ; không vẽ đường cộng hưởng từ CSV này.
4. Hai hình nhóm tự vẽ, BOM có nguồn và dự toán có điều kiện, kế hoạch lấy mẫu/kiểm chứng sau đề cương.
5. Nếu có thêm log DC16, phải theo đủ chuỗi: ESP tạo ACK → kết quả publish → broker/backend ACK_RX → chấp nhận hoặc loại với lý do → WS gửi → frontend nhận/xử lý. Chọn cùng command_id/boot; ghi rõ thời gian ESP và thời gian máy. Không có đủ thì chỉ đánh dấu đoạn quan sát được.

Với reconnect/publish/poll/client ID, DC16 ghi những gì quan sát được: ID duy nhất giữa các instance, code publish/subscribe, trạng thái kết nối, poll có được gọi và lỗi mạng. Chưa có log không kết luận client ID trùng. Wokwi chậm có thể làm timeout theo đồng hồ máy khác lease theo ESP; đó là **giả thuyết kỹ thuật cần đối chiếu**, không lý do xóa deadline hoặc coi timeout là thành công. RUN/PWM có thể OFF do lease/local STOP/mất MQTT/lệnh STOP; phải có log nguyên nhân để phân biệt.

### G4. Thứ tự giảm tải

- **Có thể lùi ngay:** TC01–TC05; Cloud/auth/AI/provisioning, video demo trau chuốt, đồ họa trang trí, chạy sweep/mua motor trong tuần đề cương. Không ảnh hưởng độ đầy đủ của đề cương nếu không đăng ký là cam kết.
- **Có thể thay cách chứng minh:** prototype live không ổn thì dùng log/ảnh cũ có nhãn, sơ đồ và kế hoạch test; ghi bug còn mở. Không dựng video/giá trị giả làm kết quả live.
- **Có thể giản lược kiến trúc tương lai:** raw file + manifest thay database khi đủ chức năng local; chọn một pipeline xử lý phù hợp, không thêm cả Python/SQLite/Cloud chỉ vì sổ tay có nhắc.
- **Không cắt:** nội dung bắt buộc, danh mục đầy đủ chức năng trong phạm vi, hai hình tự vẽ, BOM/nguồn, tỷ lệ/ID nhất quán, phân biệt thực tế/dự kiến, review D6–D7, font/tên file/kiểm mở và sự tham gia của ba người.
- **Không cắt để kịp demo:** STOP, lease/boot/deadline, chất lượng/stale, nhãn synthetic, che chắn/cắt nguồn khi làm thật.
- Nếu thiếu dữ liệu vật lý/dải motor khi tới SP16/SP12, ưu tiên free-decay + ba luồng độc lập; chỉ đổi phạm vi có ghi nhận và xác nhận GV khi cần. Nếu chọn giả lập, cập nhật cả mục tiêu, BOM, hình, WBS/giờ/% và giới hạn, không chỉ đổi một chữ trên bìa.

### G5. Thông tin nhóm phải điền/chốt

| Thông tin | Owner thu thập/chốt | Muộn nhất theo mục tiêu | Nếu chưa có |
|---|---|---|---|
| Mã nhóm, họ tên/MSSV, thứ tự MSSV trong tên file, lớp/GV | TV2 | Thu D1; xác nhận D7 | Giữ placeholder trong nháp; không xuất bản cuối với thông tin bịa |
| NT, TV tương ứng và reviewer việc nộp | TV2 ghi quyết định nhóm | D1 | Chưa thể giao nộp thật; không tự gán người dùng làm nhóm trưởng |
| Năng lực và số giờ rảnh thực tế mỗi người | TV2 tổng hợp, từng TV xác nhận phần mình | D1 | Tạm dùng 3 giờ/ngày; điều chỉnh task/giờ/% trước khóa |
| Hướng A/B, Hall hay quang, thiết bị mượn/có sẵn | TV3 giữ phiếu phạm vi; TV2 cập nhật BOM | D3 | Ghi phương án đề xuất có điều kiện, không khẳng định đã thống nhất |
| Ngân sách trần, vật tư/dụng cụ/nguồn và quyền dùng Wokwi | TV2 | D1–D3 | Không tự mua; dùng kiểm mã/log trong 5 giờ khả thi |
| Hạn nộp/lịch vấn đáp/kênh nộp/mẫu bổ sung | TV2 | Hỏi D1, rà lại D7 | Không tự đổi sang ngày lịch hoặc đặt số phút/slide; NT kiểm thông báo trước nộp |
| GV chấp nhận thiết bị/ESP chung, phạm vi đo và cách tính nâng cao | TV2 theo dõi; NT là người liên hệ sau duyệt | Trước cam kết phần liên quan | Ghi chờ xác nhận; không hứa điểm hoặc đánh dấu đã duyệt |
| Model/giá/nguồn/ngày và khoản chi chưa chốt | TV2 | D3 có dự toán; D6 đủ căn cứ xuất bản | Giá cũ chỉ là tham khảo; lỗi BOM phải xử lý công khai |
| Bằng chứng raw serial/WS/backend theo cùng command_id | TV3 | DC16 nếu lấy được; nếu không SP06 | Ghi thiếu log và giả thuyết; không kết luận đã sửa ổn |

## H. Checklist bàn giao và luyện vấn đáp

### H1. Checklist trước khóa D7 và nộp D8

**Nội dung và tính trung thực**

- [ ] Đã có tên đề tài, lý do, mã nhóm, đủ ba họ tên/MSSV; NT và TV1/TV2/TV3 được ánh xạ rõ.
- [ ] Phạm vi đã được nhóm chốt; điều chưa có GV phản hồi ghi đúng trạng thái. Không hứa mọi ý tưởng trong sổ tay.
- [ ] Đủ chín nội dung yêu cầu đề cương; bảng chức năng có cả chức năng nhỏ/web, lõi/tùy chọn/hướng phát triển tách rõ.
- [ ] Mỗi F-ID có mô tả chi tiết tương ứng: thao tác/đầu vào, xử lý, đầu ra, lỗi/quality và tiêu chí kiểm. Cùng F-ID trên PDF/PPTX.
- [ ] Có hai input khác nhau và output riêng; mỗi người phụ trách đủ ESP–MQTT–backend–web của luồng mình.
- [ ] Không nhầm PWM/RPM/f_exc, forced FFT/fd/fn; không coi maximum acceleration là cộng hưởng.
- [ ] Raw/RMS/quality liên tục và modal theo phiên tách biệt; A–B–A không được gọi là frozen-baseline test.
- [ ] Phân biệt thiết kế/mã/local/Wokwi/thật/chưa thử. Mọi số minh họa và dữ liệu synthetic có nhãn; không ghi test ESP giả là Wokwi.
- [ ] MQTT/ACK chưa giải quyết được ghi là rủi ro/SP06 cần làm; không ghi “START ổn định” từ hai lệnh được ESP nhận.
- [ ] Có phương pháp kiểm chứng vật lý/độ lặp/chất lượng/giới hạn; không chẩn đoán hỏng từ dữ liệu chưa đạt.

**BOM, nguồn và hình vẽ**

- [ ] Từng linh kiện điện tử có SL, biến thể, đơn giá, thành tiền, nguồn/ngày; tách giá tra được với ước tính/món mượn.
- [ ] SL×đơn giá và tổng nhóm/tổng toàn BOM được TV2 cộng lại; vận chuyển/dự phòng tách riêng, không tính trùng bộ gá.
- [ ] Hall có giá/nguồn riêng hoặc dự toán có căn cứ công khai; không dùng giá TCRT5000. Motor/nguồn/driver có cổng chọn phù hợp.
- [ ] Giá cũ ghi mốc tham khảo, không giả như vừa tra. Link/tài liệu nguồn được kiểm trước xuất bản; không bịa giá/link/tồn kho.
- [ ] Hình ngoài và cấu trúc trong do nhóm tự vẽ, có chú thích, bản gốc và kích thước dự kiến; hình khớp BOM/phạm vi.
- [ ] Sơ đồ khối/wiring không thay hai hình phác thảo. Không dùng ảnh sản phẩm có sẵn thay bản nhóm vẽ.
- [ ] Công thức/đơn vị/nguồn hình và dữ liệu có chú thích; không còn ký tự chuyển đổi như {=tex}.

**Phân công và kế hoạch**

- [ ] Mỗi DC-ID/SP-ID có đúng một owner; reviewer riêng, không tự review khi cần độc lập; không ghi “cả nhóm” làm owner.
- [ ] Cộng DC01–DC29 = 54 giờ, TV1/2/3 = 18/17/19; % = 100%. Nếu nhóm đổi phải cập nhật mọi bảng.
- [ ] Cộng SP01–SP24 = 200 giờ, TV1/2/3 = 72/60/68; % = 100% riêng, không cộng tỷ lệ đề cương.
- [ ] Bảng phân công và lịch dùng cùng Task ID; phụ thuộc không vòng; đã có owner tích hợp, cổng đo và ma trận STOP/mất kết nối.
- [ ] Tỷ lệ ghi “dự kiến”; đóng góp thực tế có nhật ký riêng, không suy ra từ bảng kế hoạch.
- [ ] D6 đủ bộ, D7 review/luyện/chốt, D8 dự phòng/nộp; sản phẩm dùng giai đoạn tương đối và không bịa deadline cuối kỳ.
- [ ] Nếu kích hoạt TC hoặc đổi A/B, đã cập nhật giờ/%/BOM/chức năng/lịch và tiêu chí đồng bộ.

**Xuất bản và nộp**

- [ ] Font/cỡ/heading thống nhất trong từng template; tiếng Việt đủ dấu; PDF canh đều văn bản, có bìa/mục lục/tài liệu tham khảo.
- [ ] Mục lục/số trang/số hình/bảng/cross-reference cập nhật; không tràn/cắt bảng hoặc mất công thức.
- [ ] PDF mở được từng trang; PPTX mở được và chạy trình chiếu thật D6, kiểm lại sau sửa D7.
- [ ] PDF/PPTX thống nhất tên sản phẩm, mã nhóm, F-ID, chức năng cam kết, số tiền, tỷ lệ, Task ID và trạng thái kiểm chứng.
- [ ] Tên cuối là **MSSV1_MSSV2_MSSV3.pdf** và **MSSV1_MSSV2_MSSV3.pptx** với MSSV thật, cùng thứ tự và đuôi đúng.
- [ ] Gói nộp không chứa .env/token/credentials; ảnh/log đã rà bí mật. Lưu bản nguồn chỉnh sửa riêng, không tự đưa thêm file lên nơi chỉ yêu cầu hai file.
- [ ] NT nộp đúng kênh/hạn theo thông báo; TV2 kiểm hai file đã tải lên, lưu bản/biên nhận/giờ nộp.
- [ ] Ba người xác nhận lịch/phương thức vấn đáp, đường đi/thiết bị và phương án đến đúng giờ; không tự giả định một người đại diện là đủ.

### H2. Câu hỏi luyện vấn đáp theo người

Mỗi người phải vừa mô tả xuôi đường dữ liệu, vừa chỉ được điểm có thể lỗi ở ESP/MQTT/backend/web. Câu hỏi sau là đề luyện nội bộ, không phải đề GV đã công bố.

| Người | Câu hỏi về trọn luồng và phần đề cương phụ trách | Bằng chứng/tài liệu phải chỉ được |
|---|---|---|
| TV1 | MPU đo đại lượng nào, dấu/trục/đơn vị ra sao? 1 g tĩnh khác rung thế nào? | F01–03, SP04/SP07; cấu hình và cách kiểm đơn vị |
| TV1 | Lấy mẫu 200 Hz khác gửi block/cập nhật web thế nào? Làm sao biết mất mẫu, Fs thực và stale? | Seq/t_device/Fs/quality; không lấy thời gian MQTT làm clock lấy mẫu |
| TV1 | Từ raw qua MQTT/backend đến chart/RMS xử lý ở đâu? Vì sao điểm gửi 250 ms hiện tại chưa phân tích dao động được? | Các module hiện có và SP07/SP10 còn phải làm |
| TV1 | Vì sao FFT motor ON không cho ngay tần số riêng? fd, fn, mode và độ phân giải là gì? | ToiHieu được chỉnh cách diễn giải; sổ tay §2, F16–17, SP13/SP16 |
| TV1 | Năm ringdown để kiểm gì, nếu gap/clip hoặc không thấy đỉnh thì báo sao? A–B–A khác baseline đóng băng thế nào? | Tiêu chí M3 và TC01/02; chưa đủ dữ liệu phải nói chưa đủ |
| TV1 | Vì sao chọn phạm vi này, hình trong/gá ảnh hưởng đo ra sao, PDF lấy nguồn nào? | DC06/DC13/DC18/DC24; hình tự vẽ và giới hạn vật lý |
| TV2 | Hall tạo xung thế nào, PPR/tỷ số truyền/nam châm ảnh hưởng công thức RPM ra sao? | F04, SP05/SP08/SP14, BOM đúng biến thể |
| TV2 | Xung → ESP → MQTT → backend → web đi qua trường/topic/validation nào? | Hợp đồng DC04 và module RPM của luồng mình |
| TV2 | Không xung là 0 RPM hay không biết? Mất dữ liệu/stale và quay chậm xử lý thế nào? | Quality/timeout theo phép đo, phân biệt unknown/zero/stale |
| TV2 | RPM/60 là gì, giả định một chu kỳ lực/vòng có luôn đúng không? PWM có thay được Hall không? | F05 và q; không dùng duty suy RPM |
| TV2 | CSV Wokwi chứng minh được gì, gap hai đồng hồ nói được gì, còn thiếu gì để nghiệm thu Hall thật? | proof + bảng A2; không nhận giả thuyết là kết luận |
| TV2 | BOM cộng thế nào, giá Hall ở đâu, vật tư mượn nào đã xác nhận? Tại sao tỷ lệ không chia đều? | DC08/DC15/DC19/DC28; nguồn/ngày, tổng giờ/% và lịch SP-ID |
| TV3 | Một START từ web tới ESP có ID/boot/deadline/lease thế nào? ACK quay lại web qua đâu? | F06–07/F11/F18, app.js/protocol/control và firmware; trace cùng command_id |
| TV3 | Backend gửi, broker PUBACK, ESP ACK, RUN/PWM và RPM khác nhau thế nào? | Chỉ được từng trạng thái và nguồn xác nhận, không dùng một ACK thay cả chuỗi |
| TV3 | Vì sao renew dừng khi không có ACK? Nếu Wokwi chạy chậm, cần log gì thay vì bỏ deadline? | DC16/SP06; cả hai clock, publish/receive/reject/WS/FE, client ID |
| TV3 | STOP web, STOP cục bộ, cắt nguồn thật, lease hết, MQTT rớt khác nhau ra sao? Rotor dừng ngay không? | F08–12, SP09/SP15/SP21; log lý do OFF và coastdown |
| TV3 | Lệnh trùng/hết hạn/sai boot, payload lỗi và nối mạng lại phải làm gì? | Test/ma trận lỗi; không tự START và không ngầm renew bằng lệnh không hợp lệ |
| TV3 | Broker công cộng có dùng cho motor thật không? Pinout Wokwi và vật thật khác ở đâu? | SP01/SP03, sơ đồ nguồn/guard/cắt; không đưa secret vào slide |
| TV3 | Chủ sở hữu tích hợp là ai, khi lỗi ACK còn mở nhóm vẫn nộp trung thực thế nào? | DC17/DC20/DC23/DC29, SP18/SP24, lịch và giảm tải |

**Ba người đều phải trả lời được:** mục đích sản phẩm; ba luồng và thiết bị khác nhau; phạm vi nào cam kết/tùy chọn; cái gì đã có mã/đã local/đã Wokwi/chưa thật; sơ đồ nguồn và STOP; lý do không kết luận cộng hưởng/hư hỏng từ dữ liệu mô phỏng; ngân sách/tỷ lệ là dự kiến; kế hoạch tới sản phẩm và việc cá nhân thực sự làm. Review chéo TV1→TV2, TV2→TV3, TV3→TV1 ở D7; hỏi thêm một câu ngoài phần mình để kiểm bức tranh chung.

### H3. Nhật ký đóng góp và sổ quyết định

Dùng một dòng cho mỗi lần bàn giao/review để không biến tỷ lệ dự kiến thành “đóng góp đã đạt”:

| Ngày tương đối | Task ID | Owner thực hiện | Giờ thực tế | File/phiên bản/đầu ra | Reviewer/nhận xét | Trạng thái kiểm chứng | Việc còn lại |
|---|---|---|---:|---|---|---|---|
| Chưa bắt đầu | — | — | — | — | — | — | — |

Sổ quyết định tối thiểu: tên/phạm vi A/B, phân vai và NT; Hall/quang; giao diện schema/pinout; BOM/dự trù; chọn/bỏ TC; phản hồi GV; phiên bản khóa nộp. Ghi rõ ngày, người giữ quyết định và căn cứ. File kế hoạch không tự chứng nhận các quyết định này đã xảy ra.

## Việc khởi động D1

- **TV1:** DC01–02 — đưa bản nháp tên/phạm vi và dàn ý PDF; thống nhất cách diễn giải rung/modal, các điều không được kết luận.
- **TV2:** DC03–04 — thu thông tin nhóm/quỹ giờ, chỉ định NT qua quyết định nhóm, đối chiếu yêu cầu GV; soạn schema/đơn vị/PPR và ba luồng đầy đủ.
- **TV3:** DC05 — nhận giao diện nháp, vẽ kiến trúc và trạng thái START/ACK/RUN/RPM/STOP; tạo PPTX khung, giữ danh sách rủi ro điều khiển.

**Cần nhóm xác nhận trước khi xuất bản cuối:** tên/MSSV/mã nhóm/NT; phân vai theo năng lực và giờ rảnh; ngân sách/vật tư mượn; phương án vật thật hay mô phỏng và Hall hay quang; hạn/kênh nộp/lịch vấn đáp chính thức; phản hồi GV về ESP chung, thiết bị mô phỏng, phạm vi đo và mục nâng cao nếu đăng ký.

