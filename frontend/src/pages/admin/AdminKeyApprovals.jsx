import { useMemo, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';

const initialBatches = [
  {
    id: 'BATCH-102',
    status: 'PendingActivation',
    createdAt: '15/11/2026',
    game: 'Cyber Odyssey 2088',
    keys: ['CYBER-2088X-PRO99', 'CYBER-2088Y-VIP77', 'CYBER-2088Z-GOLD5'],
  },
];

function BatchStatus({ status }) {
  const isPending = status === 'PendingActivation';
  const isRejected = status === 'Rejected';
  const style = isPending
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    : isRejected
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  const label = isPending ? 'PendingActivation' : isRejected ? 'Rejected' : 'Unused (Sẵn sàng dùng)';
  return <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${style}`}>{label}</span>;
}

export default function AdminKeyApprovals() {
  const [batches, setBatches] = useState(initialBatches);
  const [notice, setNotice] = useState('');
  const pendingBatches = useMemo(() => batches.filter((batch) => batch.status === 'PendingActivation'), [batches]);
  const pendingKeyCount = pendingBatches.reduce((total, batch) => total + batch.keys.length, 0);

  const reviewBatch = (batchId, decision) => {
    const approved = decision === 'approve';
    setBatches((current) => current.map((batch) => (
      batch.id === batchId
        ? { ...batch, status: approved ? 'Unused' : 'Rejected' }
        : batch
    )));
    setNotice(approved ? 'Đã phê duyệt !' : 'Đã từ chối yêu cầu kích hoạt Key.');
  };

  return (
    <AdminShell
      title="Duyệt mã bản quyền"
      description="Rà soát các lô Key do nhà phát hành tạo trước khi kích hoạt cho người dùng."
    >
      <section className="rounded-2xl border border-indigo-950 bg-card p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-bold">Phê duyệt & Kích hoạt Mã Key Bản quyền</h2>
          <span className="rounded-xl border border-yellow-900 bg-stone-900 px-4 py-2 text-xs font-bold text-amber-400">
            {pendingBatches.length} đợt Key chờ kích hoạt ({pendingKeyCount} mã)
          </span>
        </div>
      </section>

      <div className="space-y-4">
        {batches.map((batch) => {
          const isPending = batch.status === 'PendingActivation';
          return (
            <section key={batch.id} className="rounded-2xl border border-indigo-950 bg-card p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold text-accent-light">{batch.id}</span>
                <BatchStatus status={batch.status} />
                <span className="text-xs text-muted">• Ngày tạo: {batch.createdAt}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="m-0 text-base font-bold">Tựa game: {batch.game}</h3>
                <span className="text-sm text-muted">— Số lượng: {batch.keys.length} mã Key</span>
              </div>

              <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
                {batch.keys.map((code) => (
                  <li key={code} className="rounded-lg border border-zinc-800 bg-neutral-900 px-3 py-2 font-mono text-xs text-gray-300">
                    {code}
                  </li>
                ))}
              </ul>

              {isPending ? (
                <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => reviewBatch(batch.id, 'reject')}
                    className="rounded-xl border border-pink-900 bg-rose-950 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-900"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewBatch(batch.id, 'approve')}
                    className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-400"
                  >
                    ✔ Phê duyệt kích hoạt
                  </button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {notice ? (
        <div role="status" className="rounded-xl border border-indigo-500 bg-zinc-950 px-4 py-3 text-sm font-bold text-violet-400">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo" className="ml-3 text-muted hover:text-white">✕</button>
        </div>
      ) : null}
    </AdminShell>
  );
}
