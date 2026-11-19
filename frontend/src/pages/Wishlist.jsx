import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { findGame } from '../data/games';
import { formatVnd } from '../utils/format';

export default function Wishlist() {
  const { wishlist, cart, addToCart, addManyToCart, toggleWishlist } = useShop();
  const [notice, setNotice] = useState('');
  const games = useMemo(() => wishlist.map(findGame).filter(Boolean), [wishlist]);

  const addOne = (game) => {
    const result = addToCart(game.id);
    setNotice(result.message);
  };

  const addAll = () => {
    const result = addManyToCart(games.map((game) => game.id));
    setNotice(result.added
      ? `Đã thêm ${result.added} game vào giỏ hàng${result.skipped ? `; bỏ qua ${result.skipped} game đã có hoặc đã sở hữu` : ''}.`
      : 'Không có game mới để thêm vào giỏ hàng.');
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="m-0 text-2xl font-extrabold">❤️ Danh sách mong muốn (Wishlist)</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Bạn có {games.length} trò chơi đang theo dõi giá</p>
        </div>
        <button
          type="button"
          onClick={addAll}
          disabled={!games.length}
          className="rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          🛒 Thêm tất cả vào giỏ
        </button>
      </header>

      <section aria-label="Danh sách game mong muốn" className="mt-8 space-y-3">
        {games.map((game) => {
          const inCart = cart.includes(game.id);
          const positive = game.positive || `${Math.round(game.rating * 20)}%`;
          return (
            <article key={game.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-indigo-950 bg-neutral-900 p-4 md:min-h-24 md:flex-nowrap">
              <Link
                to={`/games/${game.id}`}
                aria-label={`Xem ${game.title}`}
                className="flex h-16 w-28 flex-none items-center justify-center overflow-hidden rounded-md border border-white/10 text-2xl font-black text-white/80"
                style={{ background: `linear-gradient(135deg, ${game.poster}, #111827)` }}
              >
                {game.title.split(/[\s:]/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('')}
              </Link>
              <div className="min-w-[220px] flex-1">
                <Link to={`/games/${game.id}`} className="font-bold text-white hover:text-accent-light">{game.title}</Link>
                <p className="mb-0 mt-2 text-xs text-zinc-400">
                  {game.genres.join(' ')} • {positive} • Đã thêm: {game.addedAt || '12/10/2026'}
                </p>
              </div>
              {game.discount ? (
                <span className="rounded-md bg-indigo-500 px-2.5 py-1 text-xs font-bold text-white">-{game.discount}%</span>
              ) : null}
              <div className="w-32 text-right">
                {game.oldPrice ? <p className="m-0 text-xs text-zinc-400 line-through">{formatVnd(game.oldPrice)}</p> : null}
                <p className="m-0 mt-1 font-bold text-white">{game.price === 0 ? 'Miễn phí' : formatVnd(game.price)}</p>
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
                onClick={() => {
                  toggleWishlist(game.id);
                  setNotice(`Đã xóa ${game.title} khỏi danh sách mong muốn.`);
                }}
                aria-label={`Xóa ${game.title} khỏi danh sách mong muốn`}
                className="rounded-md px-2 py-2 text-lg text-zinc-400 hover:bg-white/5 hover:text-rose-400"
              >
                🗑️
              </button>
            </article>
          );
        })}
        {!games.length ? (
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
