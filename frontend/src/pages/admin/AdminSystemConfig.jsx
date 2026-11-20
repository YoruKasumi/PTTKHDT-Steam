import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

export default function AdminSystemConfig() {
  const [parameters, setParameters] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setParameters(await adminApi.getSystemConfig());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const updateValue = (key, value) => {
    setParameters((current) => current.map((item) => item.key === key ? { ...item, value } : item));
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await adminApi.updateSystemConfig(parameters.map(({ key, value }) => ({ key, value })));
      setNotice('Đã lưu tham số hệ thống.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <AdminShell title="Cấu hình hệ thống" description="Cập nhật tham số vận hành; hoa hồng sàn bị giới hạn từ 0 đến 50%.">
      {error && <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p>}
      <form onSubmit={save} className="rounded-2xl border border-white/10 bg-card p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Tham số</th><th className="p-3">Giá trị</th><th className="p-3">Mô tả</th><th className="p-3">Cập nhật</th></tr></thead>
            <tbody>{parameters.map((parameter) => (
              <tr key={parameter.key} className="border-t border-white/5">
                <td className="p-3"><code>{parameter.key}</code></td>
                <td className="p-3"><input type="number" step="any" value={parameter.value} onChange={(event) => updateValue(parameter.key, event.target.value)} className="w-48 rounded-lg border border-line bg-page p-2 text-white" /></td>
                <td className="p-3 text-muted">{parameter.description}</td>
                <td className="p-3 text-xs text-muted">{parameter.updatedAt ? new Date(parameter.updatedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!parameters.length && !loading && <p className="text-sm text-muted">Không có cấu hình; chạy backend/sql/extra_tables.sql sau schema.</p>}
        <div className="mt-4 flex gap-2"><button disabled={loading || !parameters.length} className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50">Lưu</button><button type="button" onClick={load} disabled={loading} className="rounded-lg border border-line px-4 py-2">Hoàn nguyên</button></div>
      </form>
    </AdminShell>
  );
}
