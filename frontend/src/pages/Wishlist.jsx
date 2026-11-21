import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../api/wishlist';
import { useShop } from '../context/ShopContext';
import { formatVnd } from '../utils/format';

export default function Wishlist() {
  const { cart, addToCart, addManyToCart, toggleWishlist } = useShop();
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    wishlistApi.list().then((result) => {
      if (active) setItems(result);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const addOne = async (item) => {
    setError('');
    try {
      const result = await addToCart(item.gameId);
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const addAll = async () => {
    setError('');
    try {
      const result = await addManyToCart(items.map((item) => item.gameId));
      setNotice(result.added
        ? `Đã thêm ${result.added} game vào giỏ hàng${result.skipped ? `; bỏ qua ${result.skipped} game đã có hoặc đã sở hữu` : ''}.`
        : 'Không có game mới để thêm vào giỏ hàng.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const remove = async (item) => {
    setError('');
    try {
      await toggleWishlist(item.gameId);
      setItems((current) => current.filter((entry) => entry.gameId !== item.gameId));
      setNotice(`Đã xóa ${item.title} khỏi danh sách mong muốn.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="m-0 text-2xl font-extrabold">❤️ Danh sách mong muốn (Wishlist)</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Bạn có {items.length} trò chơi đang theo dõi giá</p>
        </div>
        <button
          type="button"
          onClick={addAll}
          disabled={!items.length || loading}
          className="rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          🛒 Thêm tất cả vào giỏ
        </button>
      </header>

      {error ? <p role="alert" className="mt-4 text-sm text-red-400">{error}</p> : null}
      {loading ? <p role="status" className="mt-8 text-center text-muted">Đang tải Wishlist…</p> : null}

      <section aria-label="Danh sách game mong muốn" className="mt-8 space-y-3">
        {items.map((game) => {
          const inCart = cart.includes(game.gameId);
          const positive = game.ratingCount
            ? `${Math.round(game.rating * 20)}%`
            : 'Chưa có đánh giá';
          const addedDate = game.addedDate
            ? new Date(game.addedDate).toLocaleDateString()
            : '—';
          return (
            <article key={game.gameId} className="flex flex-wrap items-center gap-4 rounded-xl border border-indigo-950 bg-neutral-900 p-4 md:min-h-24 md:flex-nowrap">
              <Link
                to={`/games/${game.gameId}`}
                aria-label={`Xem ${game.title}`}
                className="flex h-16 w-28 flex-none items-center justify-center overflow-hidden rounded-md border border-white/10 bg-page text-2xl font-black text-white/80"
              >
                {game.coverImage ? <img className="size-full object-cover" src={game.coverImage} alt={game.title} /> : game.title.split(/[\s:]/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('')}
              </Link>
              <div className="min-w-[220px] flex-1">
                <Link to={`/games/${game.gameId}`} className="font-bold text-white hover:text-accent-light">{game.title}</Link>
                <p className="mb-0 mt-2 text-xs text-zinc-400">
                  {game.genres.join(' ')} • {positive} • Đã thêm: {addedDate}
                </p>
              </div>
              {game.percentOff ? (
                <span className="rounded-md bg-indigo-500 px-2.5 py-1 text-xs font-bold text-white">-{game.percentOff}%</span>
              ) : null}
              <div className="w-32 text-right">
                {game.basePrice > game.currentPrice ? <p className="m-0 text-xs text-zinc-400 line-through">{formatVnd(game.basePrice)}</p> : null}
                <p className="m-0 mt-1 font-bold text-white">{game.currentPrice === 0 ? 'Miễn phí' : formatVnd(game.currentPrice)}</p>
              </div>
              <button
                type="button"
                onClick={() => addOne(game)}
                disabled={inCart}
                className="rounded-md bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inCart ? 'Đã có trong giỏ' : 'Thêm vào giỏ'}
              </button>
              <button
                type="button"
                onClick={() => remove(game)}
                aria-label={`Xóa ${game.title} khỏi danh sách mong muốn`}
                className="rounded-md px-2 py-2 text-lg text-zinc-400 hover:bg-white/5 hover:text-rose-400"
              >
                🗑️
              </button>
            </article>
          );
        })}
        {!loading && !items.length ? (
          <div className="rounded-xl border border-indigo-950 bg-neutral-900 px-5 py-14 text-center text-muted">
            Danh sách mong muốn đang trống. <Link to="/search" className="font-bold text-accent-light">Khám phá trò chơi</Link>
          </div>
        ) : null}
      </section>

      {notice ? (
        <p role="status" className="mt-4 rounded-lg border border-indigo-500/50 bg-indigo-950/60 p-3 text-sm text-accent-light">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
