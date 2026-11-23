import { useEffect, useRef, useState } from 'react';
import { gameApi } from '../../api/game';
import { catalogApi } from '../../api/catalog';
import FeedbackDialog from '../common/FeedbackDialog';

const inputClass =
  'mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-sm text-white outline-none focus:border-accent';
const MAX_COVER_SIZE = 10 * 1024 * 1024;

/**
 * Modal tạo dự án game mới.
 * Props:
 *   onClose()  — đóng modal
 *   onCreate(data) — callback khi tạo thành công (nhận metadata từ server)
 */
export default function NewProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    price: '290000',
    minSpec: '',
    recommendedSpec: '',
    description: '',
  });
  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [file, setFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmUpload, setConfirmUpload] = useState(false);
  const formRef = useRef(null);
  const approvedUpload = useRef(false);

  useEffect(() => {
    let active = true;
    catalogApi.listGenres()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.data || []);
        setAvailableGenres(list);
        if (list.length > 0) {
          setSelectedGenreIds([list[0].genreId]);
        }
      })
      .catch((err) => {
        console.error('Không thể tải danh sách thể loại:', err);
      });
    return () => { active = false; };
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleGenreId = (genreId) => {
    setSelectedGenreIds((current) =>
      current.includes(genreId)
        ? current.filter((id) => id !== genreId)
        : [...current, genreId],
    );
  };

  const submit = async (event) => {
    event.preventDefault();

    // Validation phía client
    const price = Number(form.price);
    if (!form.title.trim() || !form.description.trim() || !form.minSpec.trim() || !form.recommendedSpec.trim()) {
      setError('Vui lòng điền tên game, cấu hình và mô tả.');
      return;
    }
    if (!Number.isInteger(price) || price < 0 || price > 5000000) {
      setError('Giá bán phải là số nguyên từ 0 đến 5.000.000 VND.');
      return;
    }
    if (selectedGenreIds.length === 0) {
      setError('Hãy chọn ít nhất một thể loại cho game.');
      return;
    }
    if (!coverFile) {
      setError('Vui lòng tải lên ảnh bìa đại diện (Cover Image) cho game (.jpg, .png, .webp).');
      return;
    }
    if (coverFile.size > MAX_COVER_SIZE) {
      setError('Ảnh poster tối đa 10 MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      setError('Vui lòng chọn tệp gói cài đặt định dạng .zip.');
      return;
    }

    if (!approvedUpload.current) {
      setConfirmUpload(true);
      return;
    }
    approvedUpload.current = false;
    setError('');
    setLoading(true);
    setResult(null);

    try {
      // Xây dựng FormData để upload multipart
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('price', String(price));
      formData.append('minSpec', form.minSpec.trim());
      formData.append('recSpec', form.recommendedSpec.trim());
      formData.append('genreIds', JSON.stringify(selectedGenreIds));
      formData.append('versionNumber', '1.0.0');
      formData.append('changeLog', 'Phiên bản đầu tiên.');
      formData.append('buildFile', file);
      if (coverFile) {
        formData.append('coverFile', coverFile);
      }
      if (trailerFile) {
        formData.append('trailerFile', trailerFile);
      }

      const data = await gameApi.createProject(formData);

      setResult(data);

      const selectedGenreNames = availableGenres
        .filter((g) => selectedGenreIds.includes(g.genreId))
        .map((g) => g.genreName)
        .join(', ');

      // Thông báo cho trang cha để thêm vào danh sách
      onCreate({
        gameId: data.gameId,
        title: form.title.trim(),
        genres: selectedGenreNames || 'Chưa phân loại',
        price,
        status: 'Pending',
        build: `v${data.versionNumber ?? '1.0.0'}`,
        discount: 0,
        sha256: data.sha256,
        fileSize: data.fileSize,
        hasDrmJs: data.hasDrmJs,
        hasManifest: data.hasManifest,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Lỗi không xác định khi tạo dự án.';
      setError(msg);
      setLoading(false);
    }
  };

  // Hiển thị màn hình thành công sau khi upload xong
  if (result) {
    const drmBadge = result.hasDrmJs && result.hasManifest
      ? { label: '✅ DRM tích hợp sẵn', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' }
      : { label: '🔧 Auto-DRM bởi nền tảng', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-400' };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
        <FeedbackDialog
          open={confirmUpload}
          title="Xác nhận đăng tải game"
          message={`Đăng tải “${form.title.trim()}” với giá ${Number(form.price).toLocaleString('vi-VN')} ₫ và gửi bản build để xét duyệt?`}
          onClose={() => setConfirmUpload(false)}
          onConfirm={() => { approvedUpload.current = true; setConfirmUpload(false); requestAnimationFrame(() => formRef.current?.requestSubmit()); }}
        />
        <section className="w-full max-w-[500px] rounded-2xl border border-indigo-900 bg-zinc-950 p-7 shadow-2xl">
          <h2 className="mb-4 text-lg font-bold text-emerald-400">🎮 Dự án đã được tạo thành công!</h2>
          <div className="space-y-3 text-sm">
            <p className="text-muted">Game ID: <span className="font-mono text-white">{result.gameId}</span></p>
            <p className="text-muted">
              Phiên bản: <span className="font-mono text-accent-light">v{result.versionNumber ?? '1.0.0'}</span>
            </p>
            <p className="text-muted">
              Dung lượng:{' '}
              <span className="font-mono text-white">
                {result.fileSize ? `${(result.fileSize / 1024).toFixed(1)} KB` : '—'}
              </span>
            </p>
            <p className="text-muted">
              SHA-256:{' '}
              <span className="font-mono text-xs text-white break-all">
                {result.sha256 ? `${result.sha256.slice(0, 16)}…` : '—'}
              </span>
            </p>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${drmBadge.cls}`}
            >
              {drmBadge.label}
            </span>
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              ⏳ Game đang ở trạng thái <strong>Pending</strong>. Vui lòng chờ Manager kiểm duyệt.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 font-bold"
          >
            Đóng
          </button>
        </section>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <FeedbackDialog
        open={confirmUpload}
        title="Xác nhận đăng tải game"
        message={`Đăng tải “${form.title.trim()}” với giá ${Number(form.price).toLocaleString('vi-VN')} ₫ và gửi bản build để xét duyệt?`}
        onClose={() => setConfirmUpload(false)}
        onConfirm={() => { approvedUpload.current = true; setConfirmUpload(false); requestAnimationFrame(() => formRef.current?.requestSubmit()); }}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="my-auto max-h-[92vh] w-full max-w-[730px] overflow-y-auto rounded-2xl border border-indigo-900 bg-zinc-950 p-5 shadow-2xl md:p-7"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="create-project-title" className="m-0 text-lg font-bold">
            Khởi tạo dự án game mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg bg-gray-900 px-3 py-2 text-muted hover:text-white"
          >
            ✕
          </button>
        </div>

        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">
              Tên trò chơi *
              <input
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="VD: Cyber Samurai 2099"
                className={inputClass}
                required
              />
            </label>
            <label className="text-sm text-muted">
              Giá bán niêm yết VND (tối đa 5.000.000 VND) *
              <input
                type="number"
                min="0"
                max="5000000"
                step="1"
                value={form.price}
                onChange={(event) => update('price', event.target.value)}
                className={inputClass}
                required
              />
            </label>
          </div>

          <fieldset className="border-0 p-0">
            <legend className="text-sm text-muted">Thể loại (bảng trung gian GAME_GENRE) *</legend>
            <div className="mt-2 flex flex-wrap gap-2 max-h-36 overflow-y-auto rounded-lg border border-line bg-page/50 p-2">
              {availableGenres.length === 0 ? (
                <p className="text-xs text-muted">Đang tải danh sách thể loại...</p>
              ) : (
                availableGenres.map((g) => {
                  const isChecked = selectedGenreIds.includes(g.genreId);
                  return (
                    <label
                      key={g.genreId}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-950 text-white'
                          : 'border-line bg-page text-muted hover:border-white/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleGenreId(g.genreId)}
                        className="sr-only"
                      />
                      {isChecked ? '✓ ' : ''}
                      {g.genreName}
                    </label>
                  );
                })
              )}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">
              Ảnh bìa Poster game (.jpg, .png, .webp · tối đa 10 MB) *
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  if (selected && selected.size > MAX_COVER_SIZE) {
                    setCoverFile(null);
                    setError('Ảnh poster tối đa 10 MB. Vui lòng chọn tệp nhỏ hơn.');
                    event.target.value = '';
                    return;
                  }
                  setError('');
                  setCoverFile(selected);
                }}
                className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-2 file:py-1 file:text-white`}
                required
              />
            </label>
            <label className="text-sm text-muted">
              Video Trailer giới thiệu (.mp4, .webm - tùy chọn)
              <input
                type="file"
                accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                onChange={(event) => setTrailerFile(event.target.files?.[0] ?? null)}
                className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-2 file:py-1 file:text-white`}
              />
            </label>
          </div>

          {(coverFile || trailerFile) && (
            <div className="space-y-1 text-xs text-muted">
              {coverFile && (
                <p className="m-0 rounded border border-white/10 bg-page p-2">
                  🖼 Ảnh bìa: <span className="font-mono text-white">{coverFile.name}</span> ({(coverFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {trailerFile && (
                <p className="m-0 rounded border border-white/10 bg-page p-2">
                  🎬 Trailer: <span className="font-mono text-white">{trailerFile.name}</span> ({(trailerFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">
              Cấu hình tối thiểu (MinSpec) *
              <input
                value={form.minSpec}
                onChange={(event) => update('minSpec', event.target.value)}
                placeholder="Core i5-8400 | RAM 8GB | GTX 1060"
                className={inputClass}
                required
              />
            </label>
            <label className="text-sm text-muted">
              Cấu hình đề nghị (RecSpec) *
              <input
                value={form.recommendedSpec}
                onChange={(event) => update('recommendedSpec', event.target.value)}
                placeholder="Core i7-12700 | RAM 16GB | RTX 3060"
                className={inputClass}
                required
              />
            </label>
          </div>

          <label className="block text-sm text-muted">
            Mô tả chi tiết trò chơi *
            <textarea
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Giới thiệu cốt truyện, cơ chế chiến đấu..."
              rows="3"
              className={inputClass}
              required
            />
          </label>

          <div className="grid gap-4">
            <label className="text-sm text-muted">
              Tệp gói cài đặt v1.0.0 (.zip) *
              <input
                type="file"
                accept=".zip,application/zip"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-2 file:py-1 file:text-white`}
                required
              />
            </label>
          </div>

          {file && (
            <p className="m-0 rounded-lg border border-white/10 bg-page p-2 text-xs text-muted">
              📦 Đã chọn: <span className="font-mono text-white">{file.name}</span>{' '}
              ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}

          <p className="m-0 text-xs text-muted">Gói .zip sẽ được kiểm tra cấu trúc và tính hợp lệ trước khi gửi xét duyệt.</p>

          {error ? (
            <p role="alert" className="m-0 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-line bg-page px-4 py-2.5 font-bold disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2.5 font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '⏳ Đang khởi tạo...' : 'Khởi tạo dự án'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
