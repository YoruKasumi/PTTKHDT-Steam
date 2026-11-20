import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

const emptyForm = { username: '', email: '', displayName: '', password: '', roleId: '' };

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [staffRows, roleRows] = await Promise.all([adminApi.listStaff(), adminApi.listRoles()]);
      setStaff(staffRows);
      setRoles(roleRows);
      if (!form.roleId && roleRows[0]) setForm((current) => ({ ...current, roleId: roleRows[0].roleId }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditingId('');
    setForm({ ...emptyForm, roleId: roles[0]?.roleId || '' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editingId) {
        await adminApi.updateStaff(editingId, form);
        setNotice('Đã cập nhật thông tin nhân sự.');
      } else {
        await adminApi.createStaff(form);
        setNotice('Đã tạo tài khoản nhân sự.');
      }
      reset();
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (member) => {
    const status = member.status === 'Active' ? 'Suspended' : 'Active';
    setError('');
    try {
      await adminApi.setStaffStatus(member.accountId, status);
      setNotice(`Đã chuyển ${member.username} sang trạng thái ${status}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const edit = (member) => {
    setEditingId(member.accountId);
    setForm({
      username: member.username,
      email: member.email,
      displayName: member.displayName,
      password: '',
      roleId: member.roleId,
    });
  };

  return (
    <AdminShell title="Quản lý nhân sự" description="Tạo tài khoản Manager với một vai trò nội bộ, cập nhật vai trò và khóa/mở khóa nhân sự.">
      {error && <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p>}
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/10 bg-card p-5 md:grid-cols-2">
        <h2 className="m-0 md:col-span-2">{editingId ? 'Cập nhật nhân sự' : 'Tạo nhân sự mới'}</h2>
        <label className="text-sm text-muted">Username<input required minLength={3} maxLength={30} disabled={Boolean(editingId)} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white disabled:opacity-50" /></label>
        <label className="text-sm text-muted">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white" /></label>
        <label className="text-sm text-muted">Tên hiển thị<input required maxLength={50} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white" /></label>
        {!editingId && <label className="text-sm text-muted">Mật khẩu<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white" /></label>}
        <label className="text-sm text-muted">Vai trò
          <select required value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white">
            <option value="">Chọn vai trò</option>
            {roles.map((role) => <option key={role.roleId} value={role.roleId}>{role.roleName}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-2 md:col-span-2">
          <button disabled={loading || !roles.length} className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50">{editingId ? 'Lưu cập nhật' : 'Tạo tài khoản'}</button>
          {editingId && <button type="button" onClick={reset} className="rounded-lg border border-line px-4 py-2">Hủy sửa</button>}
        </div>
      </form>

      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="mt-0">Danh sách nhân sự</h2>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Tài khoản</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead>
          <tbody>{staff.map((member) => (
            <tr key={member.accountId} className="border-t border-white/5">
              <td className="p-3"><strong>{member.username}</strong><div className="text-xs text-muted">{member.displayName} · {member.email}</div></td>
              <td className="p-3">{member.roleName}</td>
              <td className="p-3">{member.status}</td>
              <td className="p-3"><div className="flex gap-2">
                <button type="button" onClick={() => edit(member)} className="rounded border border-white/20 px-3 py-1">Sửa</button>
                <button type="button" onClick={() => changeStatus(member)} className="rounded border border-white/20 px-3 py-1">{member.status === 'Active' ? 'Khóa' : 'Mở khóa'}</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {!loading && !staff.length && <p className="text-sm text-muted">Chưa có nhân sự.</p>}
      </section>
    </AdminShell>
  );
}
