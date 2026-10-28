# ResonanceGuard --- Ý tưởng và 3 luồng hoạt động chính

## 1. Mục đích của hệ thống

-   Được tạo ra để kiểm tra sức khỏe kết cấu trong các tình huống có dao
    động tự nhiên, cố tình, hay có cộng hưởng. Phát cảnh báo và hiển thị
    được phổ tần số dao động.

Nói chính xác hơn, hệ thống theo dõi phản ứng rung của kết cấu, phân
tích phổ tần số và cảnh báo khi phát hiện những dấu hiệu bất thường theo
tiêu chí được cấu hình. Tuy nhiên, phát hiện rung động bất thường không
đồng nghĩa với việc đã chứng minh kết cấu bị hư hỏng.

## 2. Hệ thống gồm 3 luồng chính

### Luồng 1: Luồng đo đạc tần số dao động và hiển thị lên dashboard

Luồng này dùng MPU6050 để đo gia tốc của thanh công-xôn. Nếu dùng tần số
lấy mẫu 200 Hz thì hệ thống sẽ lấy được một mẫu gia tốc sau mỗi 5 ms,
vì:

\[ T_s=`\frac{1}{f_s}`{=tex}=`\frac{1}{200}`{=tex}=0.005s=5ms \]

MPU6050 cung cấp dữ liệu gia tốc, còn ESP32 là nơi đọc dữ liệu cảm biến,
đóng gói và gửi dữ liệu, đồng thời điều khiển motor.

Lưu ý: tần số lấy mẫu 200 Hz là độc lập với tốc độ motor. Khi người dùng
thay đổi tốc độ motor, ESP32 không tự động gửi dữ liệu nhanh hơn. Chỉ
khi cấu hình tần số lấy mẫu thay đổi thì chu kỳ đọc và gửi dữ liệu mới
có thể thay đổi tương ứng.

Sau đó, dữ liệu được ESP32 đóng gói và gửi về MQTT broker (nó như một
cổng trung gian nhận và gửi thông báo) → BE.

BE nhận và tập hợp dữ liệu thành một đoạn tín hiệu, xử lý chúng bằng
FFT - biến dãy gia tốc trên thành phổ tần số.

#### FFT biến đổi như thế nào?

**Bước 1 --- Dữ liệu trong miền thời gian**

MPU6050 đo gia tốc liên tục theo thời gian.

Ví dụ: thu 200 mẫu trong 1 giây khi lấy mẫu ở 200 Hz.

**Bước 2 --- Phổ tần số**

FFT phân tích các thành phần tần số có trong tín hiệu, cho biết những
tần số nào đóng góp mạnh vào dao động đo được.

Đỉnh càng cao thường biểu thị thành phần dao động tại tần số đó càng
mạnh theo cách biểu diễn phổ đang sử dụng.

Hiểu đơn giản, dữ liệu gia tốc ban đầu cho biết thanh rung như thế nào
theo thời gian. Sau khi chạy FFT, ta có phổ tần số cho biết trong chuyển
động đó có những thành phần tần số nào và chúng mạnh đến mức nào.

Ví dụ, nếu backend phát hiện một đỉnh phổ tại **14,5 Hz**, điều đó có
nghĩa là tín hiệu gia tốc đang phân tích có một thành phần dao động nổi
bật ở tần số 14,5 Hz. Nói cách khác, thành phần này lặp lại khoảng 14,5
chu kỳ mỗi giây.

Tuy nhiên, đỉnh 14,5 Hz không tự động có nghĩa đó là tần số tự nhiên của
thanh. Nếu motor đang chạy, đỉnh đó có thể liên quan đến tần số kích
thích của motor hoặc phản ứng của kết cấu. Để ước lượng tần số tự nhiên,
có thể tắt motor rồi kích thích thanh và quan sát dao động tự do của
thanh.

Một lưu ý kỹ thuật: với tần số lấy mẫu 200 Hz và 200 mẫu, độ phân giải
tần số cơ bản của FFT là:

\[
`\Delta `{=tex}f=`\frac{f_s}{N}`{=tex}=`\frac{200}{200}`{=tex}=1`\text{ Hz}`{=tex}
\]

Điều này có nghĩa là các bin tần số cơ bản cách nhau 1 Hz. Vì vậy, để
xác định đỉnh tại 14,5 Hz chính xác hơn, cần phương pháp ước lượng đỉnh
hoặc cấu hình phân tích phù hợp, chẳng hạn sử dụng cửa sổ dữ liệu dài
hơn.

Cuối cùng là hiển thị phổ tần số đó lên dashboard, giúp người dùng theo
dõi tình trạng rung động và nhận biết những thay đổi đáng chú ý.

### Luồng 2: Luồng đo tốc độ motor

Cảm biến Hall đo bằng xung. Mỗi khi cục nam châm trên trục hoặc phần
quay của động cơ đi qua vị trí cảm biến thì tạo ra một xung. Dựa vào
xung đó, ESP32 tính ra được RPM (là tốc độ quay của động cơ), sau đó
tính:

\[ f\_{`\text{excitation}`{=tex}}=`\frac{RPM}{60}`{=tex} \]

Kết quả là số vòng quay mỗi giây, hay số chu kỳ kích thích mỗi giây nếu
mỗi vòng quay tạo ra một chu kỳ kích thích.

Ví dụ, nếu motor quay ở 900 RPM:

\[
f\_{`\text{excitation}`{=tex}}=`\frac{900}{60}`{=tex}=15`\text{ Hz}`{=tex}
\]

Điều đó có nghĩa là motor quay 15 vòng mỗi giây. Nếu mỗi vòng tạo ra một
chu kỳ kích thích, tần số kích thích sẽ là 15 Hz.

**Tại sao cần luồng này?** Vì ta có thể so sánh tần số kích thích của
motor với các thành phần tần số quan sát được trên phổ FFT để xem motor
có đang kích thích kết cấu ở vùng tần số đáng chú ý hay không.

### Luồng 3: Luồng điều chỉnh motor

Người dùng có thể chỉnh tốc độ motor trên dashboard → BE nhận và gửi cho
MQTT broker → MQTT broker chuyển thông điệp đến ESP32 để điều chỉnh tốc
độ motor.

ESP32 nhận lệnh và sử dụng PWM để điều khiển motor. Trong quá trình đó,
cảm biến Hall tiếp tục đo tốc độ quay thực tế để hệ thống biết motor
đang chạy ở mức nào.

Nhờ vậy, người dùng có thể thay đổi tốc độ motor để quan sát phản ứng
rung của thanh ở các mức kích thích khác nhau, đặc biệt là khi tần số
kích thích tiến gần vùng cộng hưởng.

Cần phân biệt: **lệnh tốc độ là giá trị yêu cầu, còn RPM từ cảm biến
Hall là tốc độ thực tế được đo**. Hai giá trị này có thể khác nhau.

## 3. Tóm tắt để dễ nhớ khi thuyết trình

  -----------------------------------------------------------------------
  Luồng                   Thành phần chính        Vai trò
  ----------------------- ----------------------- -----------------------
  1\. Đo rung và hiển thị MPU6050 → ESP32 → MQTT  Đo gia tốc, phân tích
                          → BE → FFT → Dashboard  phổ tần số và hiển thị

  2\. Đo tốc độ motor     Hall sensor → ESP32     Đo xung, tính RPM và
                                                  suy ra tần số quay

  3\. Điều khiển motor    Dashboard → BE → MQTT → Nhận lệnh và điều chỉnh
                          ESP32 → Motor           tốc độ motor
  -----------------------------------------------------------------------

Điểm quan trọng nhất cần nhớ: **MPU6050 cho biết kết cấu đang rung như
thế nào; Hall sensor cho biết motor đang quay ra sao; FFT giúp phân tích
tín hiệu rung theo tần số; còn dashboard giúp người dùng quan sát và
điều khiển thí nghiệm.**

### Câu 2:
1. Nếu lấy một mẫu duy nhất thì ta chỉ biết được gia tốc tại một thời điểm, không biết đầy đủ xu hướng biến thiên của nó theo thời gian. Vì tần số cho biết số chu kỳ dao động trong một giây nên cần nhiều mẫu liên tiếp để tạo thành một đoạn tín hiệu, sau đó dùng FFT phân tích các thành phần tần số.

2. Không thể khẳng định đỉnh FFT tại 14,5 Hz là tần số tự nhiên của thanh, vì khi motor đang chạy, tín hiệu đo được có thể chịu ảnh hưởng từ kích thích của motor và phản ứng của kết cấu. Đỉnh phổ đó có thể liên quan đến tần số kích thích hoặc hiện tượng cộng hưởng, nên cần kiểm tra thêm, chẳng hạn tắt motor và quan sát dao động tự do của thanh. Giải thích: kết cấu tự nhiên sẽ có 1 tần số dao động nhất định, đó là đặc tính theo từng kết cấu khác nhau.