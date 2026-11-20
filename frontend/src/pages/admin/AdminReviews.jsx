import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

const reviewStatuses = ['Visible', 'Hidden', 'Removed'];

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setReviews(await adminApi.listReviews());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const moderate = async (review) => {
    const decision = decisions[review.reviewId] || { status: review.status, reason: '' };
    if (!decision.reason.trim()) {
      setError(`Nhập lý do xử lý cho đánh giá của ${review.username}.`);
      return;
    }
    setError('');
    try {
      await adminApi.moderateReview(review.reviewId, decision.status, decision.reason.trim());
      setNotice(`Đã cập nhật đánh giá thành ${decision.status}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateDecision = (reviewId, field, value) => {
    setDecisions((current) => ({
      ...current,
      [reviewId]: { status: 'Visible', reason: '', ...current[reviewId], [field]: value },
    }));
  };

  return (
    <AdminShell title="Kiểm duyệt đánh giá" description="Ẩn, xóa hoặc khôi phục đánh giá; mỗi quyết định gửi thông báo và ghi audit log.">
      {error && <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p>}
      <section className="space-y-3">
        {reviews.map((review) => {
          const decision = decisions[review.reviewId] || { status: review.status, reason: '' };
          return (
            <article key={review.reviewId} className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div><h2 className="m-0 text-lg font-bold">{review.gameTitle}</h2><p className="m-0 mt-1 text-xs text-muted">{review.username} · {review.rating}/5 · {new Date(review.reviewDate).toLocaleString()}</p></div>
                <span className="h-fit rounded-full border border-white/10 px-3 py-1 text-xs">{review.status}</span>
              </div>
              <p className="my-4 whitespace-pre-wrap text-sm text-zinc-300">{review.content}</p>
              <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)_auto]">
                <select value={decision.status} onChange={(event) => updateDecision(review.reviewId, 'status', event.target.value)} className="rounded-lg border border-line bg-page p-2.5 text-white">
                  {reviewStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <input value={decision.reason} maxLength={500} onChange={(event) => updateDecision(review.reviewId, 'reason', event.target.value)} placeholder="Lý do xử lý (bắt buộc)" className="rounded-lg border border-line bg-page p-2.5 text-white" />
                <button disabled={loading} onClick={() => moderate(review)} className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50">Lưu</button>
              </div>
            </article>
          );
        })}
        {!loading && !reviews.length && <p className="rounded-xl border border-white/10 p-8 text-center text-muted">Không có đánh giá.</p>}
        {loading && <p className="text-sm text-muted">Đang tải...</p>}
      </section>
    </AdminShell>
  );
}
