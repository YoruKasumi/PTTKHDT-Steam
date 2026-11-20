import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

const emptyBanner = { imageUrl: '', linkUrl: '', title: '', startDate: '', endDate: '', sortOrder: 0, isActive: true };

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminGenresBanners() {
  const [genres, setGenres] = useState([]);
  const [banners, setBanners] = useState([]);
  const [genreForm, setGenreForm] = useState({ genreName: '', description: '' });
  const [genreId, setGenreId] = useState('');
  const [bannerForm, setBannerForm] = useState(emptyBanner);
  const [bannerId, setBannerId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [genreRows, bannerRows] = await Promise.all([adminApi.listGenres(), adminApi.listBanners()]);
      setGenres(genreRows);
      setBanners(bannerRows);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const saveGenre = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (genreId) await adminApi.updateGenre(genreId, genreForm);
      else await adminApi.createGenre(genreForm);
      setGenreForm({ genreName: '', description: '' });
      setGenreId('');
      setNotice('Đã lưu thể loại.');
      await load();
    } catch (requestError) { setError(requestError.message); }
  };

  const deleteGenre = async (genre) => {
    if (!window.confirm(`Xóa thể loại "${genre.genreName}"? Việc xóa bị chặn nếu còn game liên kết.`)) return;
    setError('');
    try {
      await adminApi.deleteGenre(genre.genreId);
      setNotice('Đã xóa thể loại.');
      await load();
    } catch (requestError) { setError(requestError.message); }
  };

  const saveBanner = async (event) => {
    event.preventDefault();
    setError('');
    const body = {
      ...bannerForm,
      sortOrder: Number(bannerForm.sortOrder),
      startDate: bannerForm.startDate.replace('T', ' '),
      endDate: bannerForm.endDate.replace('T', ' '),
    };
    try {
      if (bannerId) await adminApi.updateBanner(bannerId, body);
      else await adminApi.createBanner(body);
      setBannerForm(emptyBanner);
      setBannerId('');
      setNotice('Đã lưu cấu hình banner.');
      await load();
    } catch (requestError) { setError(requestError.message); }
  };

  const editBanner = (banner) => {
    setBannerId(banner.bannerId);
    setBannerForm({
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      title: banner.title || '',
      startDate: toLocalDateTime(banner.startDate),
      endDate: toLocalDateTime(banner.endDate),
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
  };

  const deleteBanner = async (banner) => {
    if (!window.confirm('Xóa banner này?')) return;
    setError('');
    try {
      await adminApi.deleteBanner(banner.bannerId);
      setNotice('Đã xóa banner.');
      await load();
    } catch (requestError) { setError(requestError.message); }
  };

  return (
    <AdminShell title="Thể loại & banner" description="Quản lý danh mục game và lịch hiển thị banner trang chủ.">
      {error && <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p>}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="mt-0">Thể loại</h2>
          <form onSubmit={saveGenre} className="space-y-3">
            <input required maxLength={80} value={genreForm.genreName} onChange={(event) => setGenreForm({ ...genreForm, genreName: event.target.value })} placeholder="Tên thể loại" className="w-full rounded-lg border border-line bg-page p-2.5 text-white" />
            <textarea maxLength={500} value={genreForm.description} onChange={(event) => setGenreForm({ ...genreForm, description: event.target.value })} placeholder="Mô tả" className="w-full rounded-lg border border-line bg-page p-2.5 text-white" />
            <div className="flex gap-2"><button className="rounded-lg bg-accent px-4 py-2 font-bold text-white">{genreId ? 'Cập nhật' : 'Thêm thể loại'}</button>{genreId && <button type="button" onClick={() => { setGenreId(''); setGenreForm({ genreName: '', description: '' }); }} className="rounded-lg border border-line px-4 py-2">Hủy</button>}</div>
          </form>
          <ul className="mt-5 space-y-2 pl-0">
            {genres.map((genre) => <li key={genre.genreId} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><span><strong>{genre.genreName}</strong><small className="block text-muted">{genre.description}</small></span><span className="flex gap-2"><button onClick={() => { setGenreId(genre.genreId); setGenreForm({ genreName: genre.genreName, description: genre.description || '' }); }} className="rounded border border-white/20 px-2 py-1 text-xs">Sửa</button><button onClick={() => deleteGenre(genre)} className="rounded border border-rose-500/30 px-2 py-1 text-xs text-rose-300">Xóa</button></span></li>)}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="mt-0">Banner trang chủ</h2>
          <form onSubmit={saveBanner} className="grid gap-3 sm:grid-cols-2">
            <input required maxLength={255} value={bannerForm.imageUrl} onChange={(event) => setBannerForm({ ...bannerForm, imageUrl: event.target.value })} placeholder="Ảnh URL hoặc object key" className="rounded-lg border border-line bg-page p-2.5 text-white sm:col-span-2" />
            <input maxLength={255} value={bannerForm.linkUrl} onChange={(event) => setBannerForm({ ...bannerForm, linkUrl: event.target.value })} placeholder="Link đích (không bắt buộc)" className="rounded-lg border border-line bg-page p-2.5 text-white sm:col-span-2" />
            <input maxLength={150} value={bannerForm.title} onChange={(event) => setBannerForm({ ...bannerForm, title: event.target.value })} placeholder="Tiêu đề" className="rounded-lg border border-line bg-page p-2.5 text-white sm:col-span-2" />
            <label className="text-xs text-muted">Bắt đầu<input required type="datetime-local" value={bannerForm.startDate} onChange={(event) => setBannerForm({ ...bannerForm, startDate: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2 text-white" /></label>
            <label className="text-xs text-muted">Kết thúc<input required type="datetime-local" value={bannerForm.endDate} onChange={(event) => setBannerForm({ ...bannerForm, endDate: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2 text-white" /></label>
            <label className="text-xs text-muted">Thứ tự<input type="number" min="0" value={bannerForm.sortOrder} onChange={(event) => setBannerForm({ ...bannerForm, sortOrder: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2 text-white" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bannerForm.isActive} onChange={(event) => setBannerForm({ ...bannerForm, isActive: event.target.checked })} />Đang bật</label>
            <div className="flex gap-2 sm:col-span-2"><button className="rounded-lg bg-accent px-4 py-2 font-bold text-white">{bannerId ? 'Cập nhật banner' : 'Tạo banner'}</button>{bannerId && <button type="button" onClick={() => { setBannerId(''); setBannerForm(emptyBanner); }} className="rounded-lg border border-line px-4 py-2">Hủy</button>}</div>
          </form>
          <div className="mt-5 space-y-2">
            {banners.map((banner) => <article key={banner.bannerId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><span className="min-w-0"><strong>{banner.title || banner.imageUrl}</strong><small className="block truncate text-muted">{banner.startDate} — {banner.endDate} · thứ tự {banner.sortOrder} · {banner.isActive ? 'Đang bật' : 'Đã tắt'}</small></span><span className="flex gap-2"><button onClick={() => editBanner(banner)} className="rounded border border-white/20 px-2 py-1 text-xs">Sửa</button><button onClick={() => deleteBanner(banner)} className="rounded border border-rose-500/30 px-2 py-1 text-xs text-rose-300">Xóa</button></span></article>)}
          </div>
        </div>
      </section>
      {loading && <p className="text-sm text-muted">Đang tải...</p>}
    </AdminShell>
  );
}
