# MaMau Minecraft — Xem Trước Màu Chữ

Web app để preview màu chữ Minecraft dành cho MOD / Plugin.

## Tính năng

- ✅ **Legacy codes**: `&0-9`, `&a-f`, `&l`, `&n`, `&o`, `&m`, `&k`, `&r`
- ✅ **Hex color codes**: `&#RRGGBB` (định dạng Bukkit/Spigot)
- ✅ **MiniMessage / Adventure**: `<red>`, `<bold>`, `<gradient:#ff0000:#00ff00>`, `<rainbow>`
- ✅ **Plugin tags**: `<lyellow>`, `<lgreen>`, `<lred>`, v.v.
- ✅ **Placeholders**: `%player_name%`, `%crate_name%`, v.v. (hiển thị highlight)
- ✅ Preview live với debounce
- ✅ Chuyển đổi nền (Dark / Light / Grass)
- ✅ Ví dụ nhanh click-to-use
- ✅ Bảng tham chiếu mã màu & format
- ✅ Obfuscated animation (`&k`)

## Cài đặt & Chạy

```bash
npm install
node server.js
```

Truy cập: http://localhost:3000

## Ví dụ định dạng

```
# Hex gradient bold
&#FF0000&l&nC&#FF3900&l&nÁ &#FF9C00&l&nN...

# Legacy codes
&a&lGreen Bold &eYellow &cRed

# MiniMessage gradient
<gradient:#ff0000:#00ff00>Rainbow text</gradient>

# Plugin tags + placeholder
<lyellow><b>%crate_name%</b></lyellow>
```

## Deploy lên GitHub Pages / Render / Railway

Xem hướng dẫn trong [DEPLOY.md](./DEPLOY.md)
