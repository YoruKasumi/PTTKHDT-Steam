// Dữ liệu giả cho giao diện (lấy từ Figma). Khi backend cài xong, thay bằng gọi API ở src/api/catalog.js.
export const homeEvent = {
  tag: 'Sự kiện đặc biệt',
  title: 'SIÊU HỘI GIẢM GIÁ NGÀY 11/11',
  description: 'Hàng trăm tựa game AAA và Indie giảm giá sốc lên đến 80%. Tặng thêm voucher 50.000 ₫ cho đơn hàng đầu tiên!',
  cta: 'Khám phá ngay',
  to: '/search/results?onSale=1',
};

export const saleGames = [
  { id: 'g-sky', title: 'Sky', price: 270000, oldPrice: 450000, discount: 40, image: '/assets/game-sky.png' },
  { id: 'g-tiny-pasture', title: 'Tiny Pasture', price: 150000, oldPrice: 350000, discount: 30, image: '/assets/game-tiny-pasture.png' },
  { id: 'g-cs2', title: 'CS2', price: 0, oldPrice: 200000, discount: 100, image: '/assets/game-cs2.png' },
  { id: 'g-repo', title: 'Repo', price: 100000, oldPrice: 200000, discount: 30, image: '/assets/game-repo.png' },
];

export const popularGames = saleGames;
