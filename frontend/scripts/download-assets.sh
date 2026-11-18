#!/usr/bin/env bash
# Tải tài nguyên (ảnh, icon) của màn hình Home từ Figma vào public/assets.
# Liên kết do Figma cấp chỉ sống 7 ngày kể từ lúc đọc thiết kế; nếu hết hạn, đọc lại thiết kế để lấy liên kết mới.
set -e
cd "$(dirname "$0")/../public/assets"
curl -fL "https://www.figma.com/api/mcp/asset/52359053-5ce0-4093-af1e-e480eb095f8e.png" -o "game-sky.png"
curl -fL "https://www.figma.com/api/mcp/asset/594c1ae3-9e4a-4406-ac23-41ad1df10e79.png" -o "game-tiny-pasture.png"
curl -fL "https://www.figma.com/api/mcp/asset/3f5c2714-8d79-42d1-8ccf-c1dd89df6ec5.png" -o "game-cs2.png"
curl -fL "https://www.figma.com/api/mcp/asset/0ecf1ab9-3986-4e3f-aed1-7f841758b27a.png" -o "game-repo.png"
curl -fL "https://www.figma.com/api/mcp/asset/dc170d5b-b9d8-418f-bac5-0eb99f7a862c.svg" -o "arrow-prev.svg"
curl -fL "https://www.figma.com/api/mcp/asset/6709b526-81b0-4bd3-be7d-2ebbf431d1a1.svg" -o "arrow-next.svg"
curl -fL "https://www.figma.com/api/mcp/asset/91a870ac-a4ff-43ae-b6a0-82187af91909.svg" -o "icon-cart.svg"
curl -fL "https://www.figma.com/api/mcp/asset/702f4f41-ef3a-4317-893a-f37956aecf9d.svg" -o "search-bg.svg"
curl -fL "https://www.figma.com/api/mcp/asset/aee328bc-f74a-4436-86a7-ffd9b91030e3.svg" -o "icon-search.svg"
curl -fL "https://www.figma.com/api/mcp/asset/df8bccbe-3e16-4058-a66f-557b9cae68d4.svg" -o "caret-user.svg"
curl -fL "https://www.figma.com/api/mcp/asset/2fbeb863-97a8-4933-8114-407126f2e379.svg" -o "icon-user-frame.svg"
curl -fL "https://www.figma.com/api/mcp/asset/c8f5923a-4f0b-460b-97fb-e1c857020a31.svg" -o "icon-user.svg"
curl -fL "https://www.figma.com/api/mcp/asset/96cf5c99-7e04-4835-96dc-8a2da5073389.svg" -o "caret-bell.svg"
curl -fL "https://www.figma.com/api/mcp/asset/fa40825d-c217-4a2b-9756-6a3fa2047212.svg" -o "icon-bell.svg"
curl -fL "https://www.figma.com/api/mcp/asset/83a3d364-c292-4d40-838d-d6aa66354242.svg" -o "icon-home.svg"
curl -fL "https://www.figma.com/api/mcp/asset/1f2dc8bb-5a63-4c86-bb74-3a326eeb5b4f.svg" -o "icon-heart.svg"
curl -fL "https://www.figma.com/api/mcp/asset/fdf3f91a-133a-4465-9432-472a4c574af4.svg" -o "icon-filter.svg"
curl -fL "https://www.figma.com/api/mcp/asset/4ab5f75c-26e5-43fd-a1df-358176f2844f.svg" -o "icon-library.svg"
echo "Đã tải xong tài nguyên."
