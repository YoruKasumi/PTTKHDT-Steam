import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api/catalog';
import GameCard from '../components/GameCard';

export default function CatalogSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.toString();
  const [genres, setGenres] = useState([]);
  const [games, setGames] = useState([]);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    genreId: searchParams.get('genreId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    onSale: searchParams.get('onSale') === '1',
    sort: searchParams.get('sort') || 'popularity',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    catalogApi.listGenres().then((items) => {
      if (active) setGenres(items);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(query).entries());
    setFilters({
      keyword: params.keyword || '',
      genreId: params.genreId || '',
      minPrice: params.minPrice || '',
      maxPrice: params.maxPrice || '',
      onSale: params.onSale === '1' || params.onSale === 'true',
      sort: params.sort || 'popularity',
    });
    let active = true;
    setLoading(true);
    setError('');
    catalogApi.listGames(params).then((items) => {
      if (active) setGames(items);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [query]);

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const next = Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => value !== '' && value !== false)
        .map(([key, value]) => [key, key === 'onSale' ? (value ? '1' : '') : value]),
    );
    setSearchParams(next);
  };

  return (
    <div className="mx-auto grid w-full max-w-[1698px] grid-cols-1 items-start gap-6 px-4 pb-20 pt-8 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
      <aside className="self-start lg:sticky lg:top-6">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
          <div className="border-b border-white/10 pb-3">
            <h1 className="m-0 text-xl font-extrabold">Bộ lọc game</h1>
            <p className="mb-0 mt-1 text-xs text-muted">Tùy chỉnh kết quả tìm kiếm</p>
          </div>
          <label className="block text-sm font-bold">Từ khóa
            <input value={filters.keyword} onChange={update('keyword')} maxLength={200} placeholder="Tên hoặc mô tả game" className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-normal" />
          </label>
          <label className="block text-sm font-bold">Thể loại
            <select value={filters.genreId} onChange={update('genreId')} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-normal">
              <option value="">Tất cả thể loại</option>
              {genres.map((genre) => <option key={genre.genreId} value={genre.genreId}>{genre.genreName}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">Giá từ
              <input type="number" min="0" value={filters.minPrice} onChange={update('minPrice')} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-normal" />
            </label>
            <label className="text-sm font-bold">Đến
              <input type="number" min="0" value={filters.maxPrice} onChange={update('maxPrice')} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-normal" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={filters.onSale} onChange={update('onSale')} className="accent-accent" /> Chỉ game đang giảm giá
          </label>
          <label className="block text-sm font-bold">Sắp xếp
            <select value={filters.sort} onChange={update('sort')} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-normal">
              <option value="popularity">Phổ biến</option>
              <option value="releaseDate">Ngày phát hành</option>
              <option value="price">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </label>
          <button className="w-full rounded-lg bg-accent px-5 py-3 font-bold hover:bg-accent/80">Áp dụng bộ lọc</button>
        </form>
      </aside>

      <section aria-label="Kết quả tìm kiếm" className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div><p className="m-0 text-xs font-bold uppercase tracking-widest text-accent-light">Cửa hàng</p><h2 className="mb-0 mt-1 text-2xl font-extrabold">Tìm kiếm trò chơi</h2></div>
          {!loading && !error ? <span className="text-sm text-muted">{games.length} trò chơi</span> : null}
        </div>
        {loading ? <p role="status" className="text-muted">Đang tải kết quả…</p> : null}
        {error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-card p-4 text-red-300">Không thể tải danh mục: {error}</p> : null}
        {!loading && !error ? (
          games.length ? (
            <div className="flex flex-wrap gap-5">
              {games.map((game) => <GameCard key={game.gameId} game={game} />)}
            </div>
          ) : <p className="rounded-xl border border-white/10 bg-card p-8 text-center text-muted">Không tìm thấy trò chơi phù hợp.</p>
        ) : null}
      </section>
    </div>
  );
}
