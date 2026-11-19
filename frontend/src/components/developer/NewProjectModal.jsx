import { useState } from 'react';

const genres = ['Hành động', 'Phiêu lưu', 'Kinh dị Co-op', 'Nhập vai RPG', 'Mô phỏng'];

const inputClass = 'mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-sm text-white outline-none focus:border-accent';

export default function NewProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    price: '290000',
    genres: ['Hành động', 'Phiêu lưu'],
    minSpec: '',
    recommendedSpec: '',
    description: '',
    scanner: 'Gói cài đặt an toàn (Clean .zip)',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleGenre = (genre) => {
    setForm((current) => ({
      ...current,
      genres: current.genres.includes(genre)
        ? current.genres.filter((item) => item !== genre)
        : [...current.genres, genre],
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.title.trim() || !form.description.trim() || !form.minSpec.trim() || !form.recommendedSpec.trim()) {
      setError('Vui lòng điền tên game, cấu hình và mô tả.');
      return;
    }
    if (!Number.isInteger(price) || price < 0) {
      setError('Giá bán phải là số nguyên VND không âm.');
      return;
    }
    if (form.genres.length === 0) {
      setError('Hãy chọn ít nhất một thể loại.');
      return;
    }
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      setError('Vui lòng chọn tệp gói cài đặt định dạng .zip.');
      return;
    }

    onCreate({
      title: form.title.trim(),
      price,
      genres: form.genres,
      minSpec: form.minSpec.trim(),
      recommendedSpec: form.recommendedSpec.trim(),
      description: form.description.trim(),
      packageName: file.name,
      scanner: form.scanner,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="create-project-title" className="my-auto max-h-[92vh] w-full max-w-[730px] overflow-y-auto rounded-2xl border border-indigo-900 bg-zinc-950 p-5 shadow-2xl md:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="create-project-title" className="m-0 text-lg font-bold">Khởi tạo dự án game mới</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg bg-gray-900 px-3 py-2 text-muted hover:text-white">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">
              Tên trò chơi
              <input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="VD: Cyber Samurai 2099" className={inputClass} />
            </label>
            <label className="text-sm text-muted">
              Giá bán niêm yết VND
              <input type="number" min="0" step="1" value={form.price} onChange={(event) => update('price', event.target.value)} className={inputClass} />
            </label>
          </div>

          <fieldset className="border-0 p-0">
            <legend className="text-sm text-muted">Thể loại (bảng trung gian GAME_GENRE)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {genres.map((genre) => (
                <label key={genre} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold ${form.genres.includes(genre) ? 'border-indigo-500 bg-indigo-950 text-white' : 'border-line bg-page text-muted'}`}>
                  <input type="checkbox" checked={form.genres.includes(genre)} onChange={() => toggleGenre(genre)} className="sr-only" />
                  {form.genres.includes(genre) ? '✓ ' : ''}{genre}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">
              Cấu hình tối thiểu (MinSpec)
              <input value={form.minSpec} onChange={(event) => update('minSpec', event.target.value)} placeholder="Core i5-8400 | RAM 8GB | GTX 1060" className={inputClass} />
            </label>
            <label className="text-sm text-muted">
              Cấu hình đề nghị (RecSpec)
              <input value={form.recommendedSpec} onChange={(event) => update('recommendedSpec', event.target.value)} placeholder="Core i7-12700 | RAM 16GB | RTX 3060" className={inputClass} />
            </label>
          </div>

          <label className="block text-sm text-muted">
            Mô tả chi tiết trò chơi
            <textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Giới thiệu cốt truyện, cơ chế chiến đấu..." rows="3" className={inputClass} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">
              Tệp gói cài đặt v1.0.0 (.zip)
              <input type="file" accept=".zip,application/zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-2 file:py-1 file:text-white`} />
            </label>
            <label className="text-sm text-muted">
              Chế độ kiểm thử Antivirus Scanner
              <select value={form.scanner} onChange={(event) => update('scanner', event.target.value)} className={inputClass}>
                <option>Gói cài đặt an toàn (Clean .zip)</option>
                <option>Quét khi gửi xét duyệt</option>
              </select>
            </label>
          </div>

          <p className="m-0 text-xs text-muted">Quét Antivirus ở đây chỉ là thao tác giao diện mẫu; tệp chưa được tải lên hoặc quét thật.</p>
          {error ? <p role="alert" className="m-0 text-sm text-red-400">{error}</p> : null}
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 pt-4 sm:flex-row">
            <button type="button" onClick={onClose} className="rounded-lg border border-line bg-page px-4 py-2.5 font-bold">Hủy bỏ</button>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 font-bold">Quét Antivirus & Khởi tạo Dự án</button>
          </div>
        </form>
      </section>
    </div>
  );
}
