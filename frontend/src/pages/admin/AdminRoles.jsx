import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [roleRows, permissionRows] = await Promise.all([adminApi.listRoles(), adminApi.listPermissions()]);
      setRoles(roleRows);
      setPermissions(permissionRows);
      if (selectedId) {
        const selected = roleRows.find((role) => role.roleId === selectedId);
        if (selected) setSelectedPermissions(selected.permissions);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectRole = (role) => {
    setSelectedId(role.roleId);
    setRoleName(role.roleName);
    setSelectedPermissions(role.permissions);
    setCreating(false);
  };

  const togglePermission = (code) => {
    setSelectedPermissions((current) => (
      current.includes(code) ? current.filter((value) => value !== code) : [...current, code]
    ));
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    try {
      let roleId = selectedId;
      if (creating) {
        const created = await adminApi.createRole({ roleName });
        roleId = created.roleId;
      } else {
        await adminApi.updateRole(roleId, { roleName });
      }
      await adminApi.updateRolePermissions(roleId, selectedPermissions);
      setSelectedId(roleId);
      setCreating(false);
      setNotice('Đã lưu vai trò và danh sách quyền.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const remove = async () => {
    if (!selectedId || !window.confirm('Xóa vai trò này? Chỉ xóa được vai trò chưa được gán cho nhân sự.')) return;
    setError('');
    try {
      await adminApi.deleteRole(selectedId);
      setSelectedId('');
      setRoleName('');
      setSelectedPermissions([]);
      setNotice('Đã xóa vai trò.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <AdminShell title="Ma trận phân quyền" description="Tạo vai trò nội bộ và cập nhật quyền truy cập dựa trên PermissionCode.">
      {error && <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p>}
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/10 bg-card p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="m-0 font-bold">Vai trò</h2><button type="button" onClick={() => { setCreating(true); setSelectedId(''); setRoleName(''); setSelectedPermissions([]); }} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-bold">Tạo mới</button></div>
          <div className="space-y-2">
            {roles.map((role) => (
              <button key={role.roleId} type="button" onClick={() => selectRole(role)} className={`w-full rounded-xl border p-3 text-left ${selectedId === role.roleId ? 'border-accent bg-accent/10' : 'border-white/10 bg-page'}`}>
                <span className="block font-bold">{role.roleName}</span>
                <span className="text-xs text-muted">{role.memberCount} nhân sự · {role.permissions.length} quyền</span>
              </button>
            ))}
            {!roles.length && !loading && <p className="text-sm text-muted">Chưa có vai trò.</p>}
          </div>
        </section>

        <form onSubmit={save} className="rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="mt-0 font-bold">{creating ? 'Tạo vai trò' : selectedId ? 'Chỉnh sửa vai trò' : 'Chọn vai trò để chỉnh sửa'}</h2>
          <label className="block max-w-lg text-sm font-semibold text-muted">Tên vai trò
            <input required maxLength={50} value={roleName} onChange={(event) => setRoleName(event.target.value)} disabled={!creating && !selectedId} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white disabled:opacity-50" />
          </label>
          <h3 className="mb-3 mt-6 text-sm font-bold uppercase text-muted">Quyền hạn</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissions.map((permission) => (
              <label key={permission.code} className="flex items-start gap-3 rounded-lg border border-white/10 bg-page p-3">
                <input type="checkbox" checked={selectedPermissions.includes(permission.code)} onChange={() => togglePermission(permission.code)} disabled={!creating && !selectedId} />
                <span><span className="block text-sm font-semibold">{permission.label}</span><code className="text-xs text-muted">{permission.code}</code></span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={loading || (!creating && !selectedId)} className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50">Lưu thay đổi</button>
            {!creating && selectedId && <button type="button" onClick={remove} className="rounded-lg border border-rose-500/40 px-4 py-2 text-rose-300">Xóa vai trò</button>}
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
