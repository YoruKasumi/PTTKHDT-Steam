import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogApi } from '../api/catalog';
import { libraryApi } from '../api/library';
import { useShop } from '../context/ShopContext';
import { formatVnd } from '../utils/format';

export default function GameDetail() {
  const { id } = useParams();
  const { cart, addToCart, toggleWishlist, wishlist, user } = useShop();
  const [game, setGame] = useState(null);
  const [isOwned, setIsOwned] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    catalogApi.getGame(id).then((result) => {
      if (active) setGame(result);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!user?.roles?.includes('Customer')) {
      setIsOwned(false);
      setCheckingOwnership(false);
      return () => { active = false; };
    }

    setIsOwned(false);
    setCheckingOwnership(true);
    libraryApi.yeuCauXemThuVien().then((games) => {
      if (active) setIsOwned(games.some((ownedGame) => ownedGame.gameId === id));
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setCheckingOwnership(false);
    });
    return () => { active = false; };
  }, [id, user?.accountId, user?.roles]);

  const submitReview = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const review = await catalogApi.createReview(id, { rating, content });
      setGame((current) => ({
        ...current,
        reviews: [review, ...current.reviews],
        ratingCount: current.ratingCount + 1,
        rating: (current.rating * current.ratingCount + review.rating) / (current.ratingCount + 1),
      }));
      setContent('');
      setNotice('Đã gửi đánh giá.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addGameToCart = async () => {
    setError('');
    try {
      const result = await addToCart(game.gameId);
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleGameWishlist = async () => {
    setError('');
    try {
      const result = await toggleWishlist(game.gameId);
      setNotice(result.message || (result.added
        ? 'Đã thêm vào danh sách mong muốn.'
        : 'Đã xóa khỏi danh sách mong muốn.'));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) {
    return <p role="status" className="mx-auto max-w-4xl px-4 py-20 text-center text-muted">Đang tải thông tin trò chơi…</p>;
  }
  if (error && !game) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Không thể tải trò chơi</h1>
        <p role="alert" className="text-red-300">{error}</p>
        <Link to="/search" className="text-accent-light">Quay lại cửa hàng</Link>
      </div>
    );
  }
  if (!game) return null;

  const inCart = cart.includes(game.gameId);
  const isWishlisted = wishlist.includes(game.gameId);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <Link to={isOwned ? '/library' : '/search'} className="text-sm font-semibold text-accent-light">← {isOwned ? 'Quay lại thư viện' : 'Cửa hàng'}</Link>
      <section className="mt-5 overflow-hidden rounded-2xl border border-indigo-500/30 bg-card">
        <div className="relative flex min-h-[360px] flex-col justify-end overflow-hidden p-6 md:p-10">
          {game.coverImage ? <img src={game.coverImage} alt="" className="absolute inset-0 size-full object-cover opacity-40" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-light">{game.genres.join(' · ') || 'Trò chơi'}</p>
            <h1 className="mb-2 mt-3 text-3xl font-extrabold md:text-5xl">{game.title}</h1>
            <p className="mb-0 text-sm text-zinc-300">
              {game.developer} · {game.rating.toFixed(1)}/5 ({game.ratingCount} đánh giá)
            </p>
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
                onClick={addGameToCart}
                className="rounded-lg bg-indigo-500 px-5 py-3 font-bold disabled:opacity-50"
              >
                {inCart ? 'Đã có trong giỏ' : 'Thêm vào giỏ'}
              </button>
            )}
            <button type="button" onClick={toggleGameWishlist} className="rounded-lg border border-line px-5 py-3 font-semibold hover:border-accent">
              {isWishlisted ? '♥ Đã yêu thích' : '♡ Thêm vào Wishlist'}
            </button>
          </div>
        </div>
      </section>

      {notice ? <p role="status" className="mt-4 rounded-lg border border-indigo-500/40 bg-card p-3 text-sm text-accent-light">{notice}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-card p-3 text-sm text-red-300">{error}</p> : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="m-0 text-xl font-bold">Cấu hình yêu cầu</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="font-bold text-accent-light">Tối thiểu</dt><dd className="m-0 mt-1 whitespace-pre-wrap text-muted">{game.minSpec || 'Chưa có thông tin'}</dd></div>
            <div><dt className="font-bold text-accent-light">Đề nghị</dt><dd className="m-0 mt-1 whitespace-pre-wrap text-muted">{game.recSpec || 'Chưa có thông tin'}</dd></div>
          </dl>
          {game.currentVersion ? (
            <p className="mb-0 mt-5 border-t border-white/10 pt-3 text-xs text-muted">
              Phiên bản hiện hành: {game.currentVersion.versionNumber}
              {game.currentVersion.changeLog ? ` · ${game.currentVersion.changeLog}` : ''}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="m-0 text-xl font-bold">Đánh giá của người chơi</h2>
          {user?.roles?.includes('Customer') && checkingOwnership ? (
            <p role="status" className="mt-4 text-sm text-muted">Đang kiểm tra bản quyền trò chơi...</p>
          ) : user?.roles?.includes('Customer') && isOwned ? (
            <form onSubmit={submitReview} className="mt-4 space-y-3">
              <fieldset>
                <legend className="mb-2 text-sm font-bold">Số sao</legend>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className={`cursor-pointer rounded-lg border px-3 py-2 ${rating === value ? 'border-accent text-accent-light' : 'border-line text-muted'}`}>
                      <input className="sr-only" type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} />
                      {value} ★
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-bold">Nội dung đánh giá
                <textarea required maxLength={1000} value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-line bg-page p-3 font-normal" />
              </label>
              <button disabled={submitting} className="rounded-lg bg-accent px-4 py-2.5 font-bold disabled:opacity-50">
                {submitting ? 'Đang gửi…' : 'Gửi đánh giá'}
              </button>
            </form>
          ) : user?.roles?.includes('Customer') ? (
            <p className="mt-3 text-sm text-muted">Chỉ tài khoản có bản quyền game này mới được gửi đánh giá.</p>
          ) : <p className="mt-3 text-sm text-muted">Đăng nhập bằng tài khoản khách hàng để gửi đánh giá. Chỉ chủ sở hữu trò chơi được phép đánh giá.</p>}

          <ul className="mt-5 max-h-[440px] list-none space-y-3 overflow-y-auto p-0">
            {game.reviews.map((review) => (
              <li key={review.reviewId} className="rounded-xl border border-white/10 bg-page p-4">
                <div className="flex justify-between gap-3 text-sm">
                  <strong>{review.displayName}</strong>
                  <span className="text-amber-300">{review.rating}/5 ★</span>
                </div>
                <p className="mb-0 mt-2 whitespace-pre-wrap text-sm text-zinc-300">{review.content}</p>
                <time className="mt-2 block text-xs text-muted">{new Date(review.reviewDate).toLocaleDateString()}</time>
              </li>
            ))}
            {!game.reviews.length ? <li className="py-5 text-sm text-muted">Chưa có đánh giá hiển thị.</li> : null}
          </ul>
        </article>
      </section>
    </div>
  );
}
