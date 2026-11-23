import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

export default function AdminSystemConfig() {
  const [parameters, setParameters] = useState([]);
  const [initialParameters, setInitialParameters] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getSystemConfig();
      setParameters(data);
      setInitialParameters(data);
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
    setNotice('');

    // Kiểm tra validation cho PLATFORM_COMMISSION_PERCENT
    const commissionParam = parameters.find((p) => p.key === 'PLATFORM_COMMISSION_PERCENT');
    const initialCommissionParam = initialParameters.find((p) => p.key === 'PLATFORM_COMMISSION_PERCENT');

    if (commissionParam) {
      const rate = Number(commissionParam.value);
      if (Number.isNaN(rate) || rate < 1 || rate > 50) {
        setError('Tỷ lệ hoa hồng sàn (PLATFORM_COMMISSION_PERCENT) phải nằm trong khoảng từ 1% đến 50%.');
        return;
      }
      if (initialCommissionParam && Number(initialCommissionParam.value) === rate) {
        // Kiểm tra xem có tham số nào khác thay đổi không
        const hasOtherChanges = parameters.some((p) => {
          const init = initialParameters.find((i) => i.key === p.key);
          return init && String(init.value) !== String(p.value);
        });
        if (!hasOtherChanges) {
          setError('Tỷ lệ hoa hồng và các giá trị tham số chưa thay đổi so với cấu hình hiện tại.');
          return;
        }
      }
    }

    // Kiểm tra có thay đổi nào không
    const hasChanges = parameters.some((p) => {
      const init = initialParameters.find((i) => i.key === p.key);
      return !init || String(init.value) !== String(p.value);
    });

    if (!hasChanges) {
      setError('Không có tham số nào thay đổi.');
      return;
    }

    setLoading(true);
    try {
      await adminApi.updateSystemConfig(parameters.map(({ key, value }) => ({ key, value })));
      setNotice('Đã lưu tham số hệ thống thành công.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell title="Cấu hình hệ thống" description="Cập nhật tham số vận hành; hoa hồng sàn giới hạn từ 1% đến 50%.">
      {error && <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p>}
      <form onSubmit={save} className="rounded-2xl border border-white/10 bg-card p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Tham số</th><th className="p-3">Giá trị</th><th className="p-3">Mô tả</th><th className="p-3">Cập nhật</th></tr></thead>
            <tbody>{parameters.map((parameter) => (
              <tr key={parameter.key} className="border-t border-white/5">
                <td className="p-3"><code>{parameter.key}</code></td>
                <td className="p-3">
                  <input
                    type="number"
                    step="any"
                    min={parameter.key === 'PLATFORM_COMMISSION_PERCENT' ? '1' : undefined}
                    max={parameter.key === 'PLATFORM_COMMISSION_PERCENT' ? '50' : undefined}
                    value={parameter.value}
                    onChange={(event) => updateValue(parameter.key, event.target.value)}
                    className="w-48 rounded-lg border border-line bg-page p-2 text-white"
                  />
                </td>
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
