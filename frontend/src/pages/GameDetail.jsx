import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { findGame } from '../data/games';
import { formatVnd } from '../utils/format';

export default function GameDetail() {
  const { id } = useParams();
  const game = findGame(id);
  const { owned, cart, addToCart, toggleWishlist, wishlist } = useShop();
  const [notice, setNotice] = useState('');

  if (!game) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy trò chơi</h1>
        <Link to="/search" className="text-accent-light">Quay lại cửa hàng</Link>
      </div>
    );
  }

  const isOwned = owned.includes(game.id);
  const inCart = cart.includes(game.id);
  const isWishlisted = wishlist.includes(game.id);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <Link to={isOwned ? '/library' : '/search'} className="text-sm font-semibold text-accent-light">← {isOwned ? 'Quay lại thư viện' : 'Cửa hàng'}</Link>
      <section className="mt-5 overflow-hidden rounded-2xl border border-indigo-500/30 bg-card">
        <div className="relative flex min-h-[360px] flex-col justify-end p-6 md:p-10" style={{ background: `linear-gradient(115deg, ${game.poster}, #080213 82%)` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-light">{game.genres.join(' · ')}</p>
            <h1 className="mb-2 mt-3 text-3xl font-extrabold md:text-5xl">{game.title}</h1>
            <p className="mb-0 text-sm text-zinc-300">{game.developer} · {game.positive || `${Math.round(game.rating * 20)}%`} đánh giá tích cực</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 md:p-8">
          <div>
            {game.oldPrice ? <p className="m-0 text-sm text-muted line-through">{formatVnd(game.oldPrice)}</p> : null}
            <p className="m-0 mt-1 text-2xl font-extrabold text-white">{game.price === 0 ? 'Miễn phí' : formatVnd(game.price)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isOwned ? (
              <Link to="/library" className="rounded-lg bg-indigo-500 px-5 py-3 font-bold">Đã có trong thư viện</Link>
            ) : (
              <button
                type="button"
                disabled={inCart}
                onClick={() => setNotice(addToCart(game.id).message)}
                className="rounded-lg bg-indigo-500 px-5 py-3 font-bold disabled:opacity-50"
              >
                {inCart ? 'Đã có trong giỏ' : 'Thêm vào giỏ'}
              </button>
            )}
            <button type="button" onClick={() => { toggleWishlist(game.id); setNotice(isWishlisted ? 'Đã xóa khỏi danh sách mong muốn.' : 'Đã thêm vào danh sách mong muốn.'); }} className="rounded-lg border border-line px-5 py-3 font-semibold hover:border-accent">
              {isWishlisted ? '♥ Đã yêu thích' : '♡ Thêm vào Wishlist'}
            </button>
          </div>
        </div>
      </section>
      {notice ? <p role="status" className="mt-4 rounded-lg border border-indigo-500/40 bg-card p-3 text-sm text-accent-light">{notice}</p> : null}
    </div>
  );
}
