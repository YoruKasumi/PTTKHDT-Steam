import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-accent-light">404</p>
      <h1 className="mb-2 mt-3 text-3xl font-extrabold">Không tìm thấy trang</h1>
      <p className="m-0 text-sm text-muted">Đường dẫn này không tồn tại hoặc trang đã được di chuyển.</p>
      <Link to="/" className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white">
        Về trang chủ
      </Link>
    </section>
  );
}
