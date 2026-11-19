import { useMemo, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';

const initialAccounts = [
  { id: 'ACC-0001', username: 'sherry', email: 'sherry@example.com', role: 'Customer', status: 'Active' },
  { id: 'ACC-0002', username: 'vortex_indie', email: 'studio@vortex.example', role: 'Developer', status: 'Active' },
  { id: 'ACC-0003', username: 'player_2048', email: 'player2048@example.com', role: 'Customer', status: 'Suspended' },
  { id: 'ACC-0004', username: 'manager_01', email: 'manager@example.com', role: 'Manager', status: 'Active' },
  { id: 'ACC-0005', username: 'repeat_offender', email: 'report@example.com', role: 'Customer', status: 'Banned' },
  { id: 'ACC-0006', username: 'admin_01', email: 'admin@example.com', role: 'Admin', status: 'Active' },
];

const statusLabels = {
  Active: 'Active',
  Suspended: 'Suspended (Tạm khóa)',
  Banned: 'Banned (Khóa vĩnh viễn)',
};

const actionDetails = {
  unlock: {
    title: 'Mở khóa',
    confirmation: (username) => <>Sau khi rà soát hoạt động trên hệ thống, Ban Quản trị quyết định <strong>Mở khóa</strong> đối với tài khoản <strong>{username}</strong>.</>,
    button: 'Xác nhận Mở khóa (Unlock)',
    nextStatus: 'Active',
  },
  suspend: {
    title: 'Tạm khóa',
    confirmation: (username) => <>Sau khi rà soát hoạt động trên hệ thống, Ban Quản trị quyết định <strong>Tạm khóa</strong> đối với tài khoản <strong>{username}</strong> do vi phạm tiên quyết đã đề ra.</>,
    button: 'Xác nhận Tạm khóa',
    nextStatus: 'Suspended',
  },
  ban: {
    title: 'Khóa vĩnh viễn',
    confirmation: (username) => <>Sau khi rà soát hoạt động trên hệ thống, Ban Quản trị quyết định <strong>Khóa vĩnh viễn</strong> đối với tài khoản <strong>{username}</strong> do vi phạm điều luật, tiêu chuẩn cộng đồng hoặc ảnh hưởng đến trải nghiệm người chơi khác.</>,
    button: 'Khóa vĩnh viễn (Ban)',
    nextStatus: 'Banned',
  },
};

function StatusBadge({ status }) {
  const styles = {
    Active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    Suspended: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    Banned: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${styles[status]}`}>{statusLabels[status]}</span>;
}

function ModerationDialog({ account, action, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const details = actionDetails[action];

  const submit = (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do chi tiết trước khi xác nhận.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="moderation-title" className="my-auto w-full max-w-[560px] rounded-2xl border border-purple-900 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id="moderation-title" className="m-0 text-xl font-bold text-neutral-100">{details.title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg px-2 py-1 text-muted hover:bg-white/5 hover:text-white">✕</button>
        </div>
        <div className="my-4 h-px bg-zinc-800" />
        <p className="mb-6 leading-6 text-zinc-400">{details.confirmation(account.username)}</p>

        <form onSubmit={submit}>
          <label htmlFor="moderation-reason" className="font-bold text-neutral-100">Nhập lý do chi tiết:</label>
          <textarea
            id="moderation-reason"
            autoFocus
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError('');
            }}
            placeholder="Nhập lý do cụ thể..."
            rows="4"
            className="mt-2 w-full resize-y rounded-2xl border border-zinc-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          />
          {error ? <p role="alert" className="mb-0 mt-2 text-sm text-red-400">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-muted hover:bg-white/5 hover:text-white">Hủy bỏ</button>
            <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2.5 font-bold text-white hover:bg-violet-500">
              {details.button}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [pendingAction, setPendingAction] = useState(null);
  const [notice, setNotice] = useState('');

  const visibleAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesQuery = !query || [account.username, account.email, account.id].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'All' || account.status === statusFilter;
      const matchesRole = roleFilter === 'All' || account.role === roleFilter;
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [accounts, roleFilter, search, statusFilter]);

  const confirmAction = (reason) => {
    const { account, action } = pendingAction;
    const { nextStatus } = actionDetails[action];
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, status: nextStatus, moderationReason: reason } : item));
    setNotice(`Đã ${action === 'unlock' ? 'mở khóa' : action === 'suspend' ? 'tạm khóa' : 'khóa vĩnh viễn'} tài khoản ${account.username}.`);
    setPendingAction(null);
  };

  const activeCount = accounts.filter((account) => account.status === 'Active').length;
  const suspendedCount = accounts.filter((account) => account.status === 'Suspended').length;
  const bannedCount = accounts.filter((account) => account.status === 'Banned').length;

  return (
    <AdminShell
      title="Kiểm soát tài khoản"
      description="Tra cứu tài khoản theo vai trò/trạng thái và ghi nhận lý do khi áp dụng biện pháp quản trị."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Active', activeCount, 'text-emerald-400'],
          ['Suspended', suspendedCount, 'text-amber-400'],
          ['Banned', bannedCount, 'text-rose-400'],
        ].map(([label, count, color]) => (
          <section key={label} className="rounded-xl border border-white/10 bg-card p-4">
            <p className="m-0 text-xs font-bold uppercase text-muted">{label}</p>
            <p className={`mb-0 mt-2 text-2xl font-extrabold ${color}`}>{count}</p>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-indigo-950 bg-card p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="text-sm font-semibold text-muted">
            Tìm tài khoản
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên đăng nhập, email hoặc mã tài khoản"
              className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm font-semibold text-muted">
            Trạng thái
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white">
              <option value="All">Tất cả trạng thái</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended (Tạm khóa)</option>
              <option value="Banned">Banned (Khóa vĩnh viễn)</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-muted">
            Vai trò
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white">
              <option value="All">Tất cả vai trò</option>
              <option value="Customer">Customer</option>
              <option value="Developer">Developer</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-page text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-3">Tài khoản</th>
                <th className="px-3 py-3">Vai trò</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">Lý do xử lý gần nhất</th>
                <th className="px-3 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleAccounts.map((account) => (
                <tr key={account.id} className="border-b border-white/5">
                  <td className="px-3 py-4">
                    <p className="m-0 font-bold">{account.username}</p>
                    <p className="m-0 mt-1 text-xs text-muted">{account.email} · {account.id}</p>
                  </td>
                  <td className="px-3 py-4">{account.role}</td>
                  <td className="px-3 py-4"><StatusBadge status={account.status} /></td>
                  <td className="max-w-64 px-3 py-4 text-xs text-muted">{account.moderationReason || '—'}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      {account.status !== 'Active' ? (
                        <button type="button" onClick={() => setPendingAction({ account, action: 'unlock' })} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10">
                          Mở khóa
                        </button>
                      ) : null}
                      {account.status === 'Active' ? (
                        <button type="button" onClick={() => setPendingAction({ account, action: 'suspend' })} className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10">
                          Tạm khóa
                        </button>
                      ) : null}
                      {account.status !== 'Banned' ? (
                        <button type="button" onClick={() => setPendingAction({ account, action: 'ban' })} className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10">
                          Khóa vĩnh viễn
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleAccounts.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-10 text-center text-muted">Không tìm thấy tài khoản phù hợp.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {notice ? (
        <div role="status" className="rounded-xl border border-indigo-500 bg-zinc-950 px-4 py-3 text-sm font-bold text-violet-400">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo" className="ml-3 text-muted hover:text-white">✕</button>
        </div>
      ) : null}
      {pendingAction ? (
        <ModerationDialog
          account={pendingAction.account}
          action={pendingAction.action}
          onClose={() => setPendingAction(null)}
          onConfirm={confirmAction}
        />
      ) : null}
    </AdminShell>
  );
}
