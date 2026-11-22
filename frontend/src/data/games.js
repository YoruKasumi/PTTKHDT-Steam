// Danh mục game mẫu lấy từ Figma. Khi backend cài xong CatalogService, thay bằng src/api/catalog.js.
// price = giá hiện hành (đã trừ giảm giá); oldPrice = giá gốc nếu đang giảm.
export const catalog = [
  { id: 'elden-legend-shadows-realm', title: 'Elden Legend: Shadows Realm', genres: ['Action', 'RPG'], rating: 4.7, ratingCount: 9420, positive: '94%', developer: 'Moonforge Studio', price: 490000, oldPrice: 980000, discount: 50, poster: '#302039', coop: false, release: '2026-09-01', addedAt: '12/10/2026' },
  { id: 'hollow-kingdom-silksong', title: 'Hollow Kingdom: Silksong', genres: ['Metroidvania', 'Indie'], rating: 4.8, ratingCount: 8230, positive: 'Cực kỳ tích cực', developer: 'Team Cherry', price: 182000, oldPrice: 280000, discount: 35, poster: '#24303b', coop: false, release: '2026-08-20', addedAt: '05/10/2026' },
  { id: 'space-drift-odyssey', title: 'Space Drift Odyssey', genres: ['Simulation', 'Space'], rating: 4.4, ratingCount: 1260, positive: '88%', developer: 'Orbit Nine', price: 192000, oldPrice: 350000, discount: 45, poster: '#102d48', coop: false, release: '2026-07-14', addedAt: '28/09/2026' },
  { id: 'counter-strike-2', title: 'Counter-Strike 2', genres: ['Action', 'FPS'], rating: 4.7, ratingCount: 98000, developer: 'Valve', price: 0, oldPrice: null, discount: 0, poster: '#29333b', coop: true, release: '2026-03-22' },
  { id: 'cyber-odyssey-2088', thumb: '/assets/cart-cyber-odyssey.svg', title: 'Cyber Odyssey 2088', genres: ['Sci-Fi', 'RPG', 'Action'], rating: 4.8, ratingCount: 1420, developer: 'NeoSaigon Lab', price: 270000, oldPrice: 450000, discount: 40, poster: '#1f0d40', coop: false, release: '2026-09-12' },
  { id: 'cyberpunk-neon-drift', title: 'Cyberpunk: Neon Drift', genres: ['Action', 'Sci-Fi'], rating: 4.7, ratingCount: 2890, developer: 'Kurogane Works', price: 295000, oldPrice: 590000, discount: 50, poster: '#141a40', coop: false, release: '2026-07-03' },
  { id: 'cyber-blade-ronin', title: 'Cyber Blade: Ronin', genres: ['Action', 'Indie'], rating: 4.6, ratingCount: 845, developer: 'Katana Pixel', price: 165000, oldPrice: 220000, discount: 25, poster: '#330d1f', coop: false, release: '2026-10-01' },
  { id: 'cyber-core-tactics', title: 'Cyber Core: Tactics', genres: ['Strategy', 'Sci-Fi'], rating: 4.5, ratingCount: 512, developer: 'Aegis Strategy', price: 320000, oldPrice: null, discount: 0, poster: '#0d2633', coop: false, release: '2026-05-20' },
  { id: 'cyber-arena-2099', title: 'Cyber Arena 2099', genres: ['Action', 'Sci-Fi', 'Co-op'], rating: 4.4, ratingCount: 3150, developer: 'Vortex Competitive', price: 0, oldPrice: null, discount: 0, poster: '#1a1438', coop: true, release: '2026-03-15' },
  { id: 'shadow-protocol-zero', title: 'Shadow Protocol Zero', genres: ['Action', 'RPG'], rating: 4.6, ratingCount: 730, developer: 'Vortex Indie Lab', price: 318500, oldPrice: 490000, discount: 35, poster: '#141f2e', coop: false, release: '2026-08-08' },
  { id: 'repo', thumb: '/assets/game-repo.png', title: 'R.E.P.O.', genres: ['Horror', 'Indie', 'Co-op'], rating: 4.9, ratingCount: 4120, developer: 'Semiwork', price: 131600, oldPrice: 188000, discount: 30, poster: '#332414', coop: true, release: '2026-06-01' },
  { id: 'sky-children-of-light', title: 'Sky: Children of Light', genres: ['Indie', 'Simulation', 'Co-op'], rating: 4.9, ratingCount: 5420, developer: 'thatgamecompany', price: 0, oldPrice: null, discount: 0, poster: '#1a5973', coop: true, release: '2026-01-10' },
];

// Game tài khoản đang đăng nhập đã sở hữu (dữ liệu giả; thật sự lấy từ LibraryService).
export const ownedIds = ['counter-strike-2', 'sky-children-of-light', 'repo'];
export const wishlistIds = [
  'elden-legend-shadows-realm',
  'hollow-kingdom-silksong',
  'space-drift-odyssey',
  'cyberpunk-neon-drift',
];

export const findGame = (id) => catalog.find((g) => g.id === id) || null;

export const SORTS = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới phát hành' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
];

export const GENRES = ['Action', 'RPG', 'Sci-Fi', 'Indie', 'Horror', 'Strategy', 'Simulation'];

export const emptyFilters = {
  keyword: '', onSale: false, free: false, min: '', max: '', genres: [],
  topRated: false, coop: false, inLibrary: false, sort: 'popular',
};

/** Lọc, sắp xếp phía GUI (tạm thời). Quy tắc lọc theo sơ đồ UC6: từ khóa, thể loại, khoảng giá, trạng thái Sale. */
export function searchGames(filters, owned = ownedIds) {
  const f = { ...emptyFilters, ...filters };
  const kw = f.keyword.trim().toLowerCase();
  const min = f.min === '' ? null : Number(f.min);
  const max = f.max === '' ? null : Number(f.max);
  let list = catalog.filter((g) => {
    if (kw && !g.title.toLowerCase().includes(kw) && !g.developer.toLowerCase().includes(kw)) return false;
    if (f.onSale && !g.discount) return false;
    if (f.free && g.price !== 0) return false;
    if (min !== null && g.price < min) return false;
    if (max !== null && g.price > max) return false;
    if (f.genres.length && !f.genres.every((x) => g.genres.includes(x))) return false;
    if (f.topRated && g.rating < 4.5) return false;
    if (f.coop && !g.coop) return false;
    if (f.inLibrary && !owned.includes(g.id)) return false;
    return true;
  });
  const by = {
    popular: (a, b) => b.ratingCount - a.ratingCount,
    newest: (a, b) => b.release.localeCompare(a.release),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
  }[f.sort] || (() => 0);
  return [...list].sort(by);
}
