import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

const reviewStatuses = ['Visible', 'Hidden', 'Removed'];

export default function CommunityModeration() {
  const [reviews, setReviews] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listCommunityReviews();
      setReviews(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(loadError?.message || 'Không thể tải đánh giá cộng đồng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filteredReviews = useMemo(
    () => reviews.filter((review) => statusFilter === 'all' || review.status === statusFilter),
    [reviews, statusFilter],
  );

  const updateDecision = (reviewId, field, value, review) => {
    setDecisions((current) => ({
      ...current,
      [reviewId]: { status: review.status, reason: '', ...current[reviewId], [field]: value },
    }));
  };

  const moderate = async (review) => {
    const decision = decisions[review.reviewId] || { status: review.status, reason: '' };
    if (!decision.reason.trim()) {
      setError('Vui lòng nhập lý do xử lý.');
      return;
    }
    setSavingId(review.reviewId);
    setError('');
    setNotice('');
    try {
      await adminApi.moderateCommunityReview(review.reviewId, decision.status, decision.reason.trim());
      setNotice(`Đã cập nhật đánh giá "${review.gameTitle}" thành ${decision.status}.`);
      await loadReviews();
    } catch (saveError) {
      setError(saveError?.message || 'Không thể cập nhật trạng thái đánh giá.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <AdminShell
      title="Kiểm duyệt cộng đồng"
      description="Quản lý nội dung đánh giá game hiện có, cập nhật trạng thái và ghi nhận lý do xử lý."
    >
      {error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-card p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-muted">
          Trạng thái
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-line bg-page px-3 py-2 text-white">
            <option value="all">Tất cả</option>
            <option value="Visible">Hiển thị</option>
            <option value="Hidden">Đã ẩn</option>
            <option value="Removed">Đã gỡ</option>
          </select>
        </label>
        <button type="button" onClick={loadReviews} disabled={loading} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <section className="space-y-3">
        {filteredReviews.map((review) => {
          const decision = decisions[review.reviewId] || { status: review.status, reason: '' };
          return (
            <article key={review.reviewId} className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-bold">{review.gameTitle}</h2>
                  <p className="m-0 mt-1 text-xs text-muted">
                    {review.username} · {review.rating}/5 · {review.reviewDate ? new Date(review.reviewDate).toLocaleString('vi-VN') : '—'}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs">{review.status}</span>
              </div>
              <p className="my-4 whitespace-pre-wrap text-sm text-zinc-300">{review.content}</p>
              <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                <select
                  aria-label={`Trạng thái mới cho ${review.gameTitle}`}
                  value={decision.status}
                  onChange={(event) => updateDecision(review.reviewId, 'status', event.target.value, review)}
                  className="rounded-lg border border-line bg-page p-2.5 text-white"
                >
                  {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <input
                  aria-label={`Lý do xử lý cho ${review.gameTitle}`}
                  value={decision.reason}
                  maxLength={500}
                  onChange={(event) => updateDecision(review.reviewId, 'reason', event.target.value, review)}
                  placeholder="Lý do xử lý (bắt buộc)"
                  className="rounded-lg border border-line bg-page p-2.5 text-white"
                />
                <button
                  type="button"
                  disabled={loading || savingId === review.reviewId}
                  onClick={() => moderate(review)}
                  className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  {savingId === review.reviewId ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </article>
          );
        })}
        {!loading && !filteredReviews.length ? <p className="rounded-xl border border-white/10 p-8 text-center text-muted">Không có đánh giá phù hợp.</p> : null}
        {loading ? <p className="py-6 text-center text-sm text-muted">Đang tải đánh giá...</p> : null}
      </section>
    </AdminShell>
  );
}
