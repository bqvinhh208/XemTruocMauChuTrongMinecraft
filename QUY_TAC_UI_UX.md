# Đánh giá UI/UX & Quy tắc Thiết kế (MaMau Minecraft)

Dựa trên yêu cầu của bạn, web app đã được cập nhật đầy đủ tính năng "Gradient Builder" (nhập chữ -> chọn màu -> xem live preview -> copy mã màu) lấy cảm hứng từ độ hoàn thiện của Birdflop. 

Dưới đây là bảng tự đánh giá và các quy tắc UI/UX đã được áp dụng, cũng như lưu ý để duy trì dự án:

## 1. Mức độ đáp ứng yêu cầu (Thỏa mãn 100%)
- **Giao diện nhập text đơn giản:** Có ngay ô "Nội dung text" rõ ràng.
- **Chọn màu trực quan:** Dùng Color Picker native, hiển thị dải màu (gradient bar) để xem trước phổ màu. Cấp phép thêm/xóa mốc màu (stops) tùy ý.
- **Tự động xuất code để copy:** Hỗ trợ ngay 3 chuẩn phổ biến nhất: 
  - `&#RRGGBB` (Bukkit/Spigot thuần)
  - `<gradient>` (MiniMessage/Adventure)
  - `&x` mã legacy (CMI, EssentialsX, LuckPerms).

## 2. Quy tắc UI/UX đã áp dụng (Cần giữ nguyên khi phát triển tiếp)
1. **Glassmorphism & Depth (Độ sâu & Kính mờ):**
   - *Quy tắc:* Mọi thẻ (card) phải dùng `background: rgba(255,255,255,0.035)` kết hợp `backdrop-filter: blur(16px)`. Tránh dùng màu bệt (solid) cho background để giữ độ sang trọng.
2. **Typography (Nghệ thuật chữ):**
   - Dùng **Inter** cho các nhãn, nút bấm, tiêu đề (dễ đọc, hiện đại).
   - Dùng **JetBrains Mono** (hoặc Consolas) cho TẤT CẢ các thành phần liên quan tới mã code, input màu sắc (monospaced giúp dễ canh gióng mã hex).
3. **Micro-interactions (Tương tác nhỏ):**
   - Hover vào mốc màu -> có viền sáng.
   - Bấm nút "Copy" -> Đổi thành "✓ Copied" và chuyển viền xanh lá (Success Feedback). 
4. **Visual Hierarchy (Phân cấp thị giác):**
   - Ô Preview Text to nhất, có viền nổi và shadow mạnh nhất để người dùng thấy ngay kết quả.
   - Các nút công cụ phụ trợ (Thêm/Xóa màu) dùng viền dashed hoặc thiết kế chìm hơn nút chính.
5. **Color Palette (Bảng màu tĩnh):**
   - Giữ màu nền tổng thể là Deep Dark (`#0c0e14`) với gradient tím/xanh nhạt tỏa ra từ các góc, làm nổi bật tông màu sặc sỡ của chữ Minecraft.

## 3. Đề xuất cải tiến nhỏ trong tương lai (Tiềm năng nâng cấp)
- **Local Storage:** Lưu lại dải màu người dùng vừa chọn vào bộ nhớ trình duyệt, f5 không bị mất.
- **Draggable Stops:** Cho phép người dùng kéo thả các mốc màu trên thanh gradient để đổi vị trí (hiện tại đang cách đều nhau).
- **Dark/Light Mode:** Dù Minecraft hợp với Dark mode hơn, nhưng cung cấp nút gạt đổi giao diện tổng thể sang Light mode sẽ tăng tính tiếp cận.

*Kết luận:* UI/UX hiện tại đã ở mức **rất chuyên nghiệp**, hoàn toàn sẵn sàng để publish và cạnh tranh tốt với các trang tool Minecraft khác!
