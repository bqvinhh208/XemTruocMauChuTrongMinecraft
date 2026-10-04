<div align="center">
  <h1>🎨 MC Color Preview (Xem Trước Màu Chữ Minecraft)</h1>
  <p><b>Công cụ Web tạo và xem trước mã màu Minecraft hiện đại dành cho Server Owner & Developer</b></p>
  
  <a href="https://bqvinhh208.github.io/XemTruocMauChuTrongMinecraft/"><img src="https://img.shields.io/github/deployments/bqvinhh208/XemTruocMauChuTrongMinecraft/github-pages?label=Tr%E1%BA%A1ng%20th%C3%A1i%20Web&style=for-the-badge&color=2ea043" alt="GitHub Pages"></a>
  <a href="https://discord.lunanw.online"><img src="https://img.shields.io/badge/Discord-LunaNW-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
</div>

---

## 🌟 Trải Nghiệm Ngay

Truy cập trang web trực tiếp hoàn toàn miễn phí tại:  
👉 **[XemTruocMauChuTrongMinecraft - GitHub Pages](https://bqvinhh208.github.io/XemTruocMauChuTrongMinecraft/)**

## ✨ Tính Năng Nổi Bật

- 🚀 **Live Preview Siêu Mượt**: Nhập mã đến đâu, xem trước trực tiếp đến đó (Hiển thị chân thực cả hiệu ứng chữ xáo trộn `&k`).
- 🌈 **Gradient Builder (Tạo Dải Màu)**: Tự động nội suy (interpolate) màu sắc để tạo gradient cho văn bản. Hỗ trợ Random màu, Thêm/Bớt các điểm dừng (stops).
- 🛠️ **Hỗ Trợ Mọi Chuẩn Mã Hoá Server**:
  - **Legacy Codes**: Các mã cổ điển `&0-9`, `&a-f`, `&l`, `&n`, `&o`, v.v.
  - **Hex Bungee/Spigot**: Hỗ trợ toàn diện `&#RRGGBB` và cả định dạng dài `&x&r&r&g&g&b&b`.
  - **MiniMessage (Adventure)**: `<red>`, `<bold>`, `<gradient:#ff0000:#00ff00>`, `<rainbow>`...
- 🔠 **Tùy Chỉnh Font Hiển Thị**: Tích hợp sẵn Font Minecraft gốc (có font VT323 pixel backup cho Tiếng Việt có dấu), hoặc bạn có thể đổi sang Font Code, Font Sans-Serif để dễ đọc.
- 📋 **Bảng Mã "Click to Copy"**: Bộ tổng hợp tất cả các mã màu Legacy, MiniMessage và Định dạng. Chỉ cần bấm vào là tự động copy vào bộ nhớ.
- 🌓 **Đổi Phông Nền (Background)**: Kiểm tra trực quan chữ in-game trên nền Đen trong suốt (Chat), Nền Trắng, hoặc Nền Khối Cỏ (Grass block).

---

## 💻 Cài Đặt Cho Developer (Local)

Toàn bộ ứng dụng là các tệp tĩnh (Static Web), nhưng có kèm theo `server.js` nhỏ dành cho các nhà phát triển muốn chạy thử nghiệm trên máy cá nhân.

```bash
# 1. Cài đặt các gói phụ thuộc (Express)
npm install

# 2. Khởi chạy máy chủ cục bộ
node server.js
```

Sau đó mở trình duyệt và truy cập: `http://localhost:3000`

---

## 📝 Các Ví Dụ Định Dạng

**Legacy & Hex Cổ Điển (Bukkit / Spigot)**
```text
&#FF0000&l[!] &c&lCẢNH BÁO
&fHành vi sử dụng Hack sẽ bị &cbanned &fvĩnh viễn!
```

**MiniMessage (Paper / Velocity)**
```text
<gradient:#ff9900:#ff0000>Sóng gió phủ đời trai</gradient>
<gradient:#00ff00:#0099ff>Tương lai nhờ nhà vợ</gradient>
```

---

## 🤝 Góp Ý & Hỗ Trợ
Nếu bạn có ý tưởng mới hoặc phát hiện lỗi, hãy thoải mái tạo *Issues* hoặc tham gia máy chủ Discord của **LunaNW** để trao đổi trực tiếp!
