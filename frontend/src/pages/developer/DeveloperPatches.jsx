import { useCallback, useEffect, useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';
import { gameApi } from '../../api/game';
import { RollbackModal, UploadPatchModal } from './DeveloperGames';

export default function DeveloperPatches() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [patchTarget, setPatchTarget] = useState(null);
  const [rollbackTarget, setRollbackTarget] = useState(null);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await gameApi.listMyGames();
      const list = (Array.isArray(result) ? result : []).map((game) => ({
        id: game.GameID,
        title: game.Title,
        status: game.Status,
      }));
      setGames(list);
    } catch (loadError) {
      setError(loadError?.message || 'Không thể tải danh sách dự án.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleSuccess = async (result, operation) => {
    const versionNumber = result?.versionNumber || '';
    setNotice(operation === 'patch'
      ? `Đã tải lên bản vá v${versionNumber}.`
      : `Đã khôi phục về phiên bản v${versionNumber}.`);
    setPatchTarget(null);
    setRollbackTarget(null);
    await loadGames();
  };

  return (
    <DeveloperShell
      title="Quản lý bản vá"
      description="Tải bản build mới và khôi phục phiên bản trước cho các dự án game của bạn."
    >
      {error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p> : null}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="m-0 text-lg font-bold">Các dự án game</h2>
            <p className="mb-0 mt-1 text-sm text-muted">Chọn dự án để tải bản vá hoặc khôi phục phiên bản.</p>
          </div>
          <button type="button" onClick={loadGames} disabled={loading} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {loading ? <p className="p-5 text-sm text-muted">Đang tải dự án...</p> : null}
        {!loading && !error && !games.length ? <p className="p-8 text-center text-sm text-muted">Bạn chưa có dự án game.</p> : null}
        {!loading && games.length ? (
          <div className="divide-y divide-white/5">
            {games.map((game) => (
              <article key={game.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <h3 className="m-0 font-bold">{game.title}</h3>
                  <p className="mb-0 mt-1 text-xs text-muted">Mã: <span className="font-mono">{game.id}</span> · Trạng thái: {game.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setPatchTarget(game)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300">
                    Tải bản vá
                  </button>
                  <button type="button" onClick={() => setRollbackTarget(game)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300">
                    Khôi phục phiên bản
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {patchTarget ? (
        <UploadPatchModal
          game={patchTarget}
          onClose={() => setPatchTarget(null)}
          onSuccess={(result) => handleSuccess(result, 'patch')}
        />
      ) : null}
      {rollbackTarget ? (
        <RollbackModal
          game={rollbackTarget}
          onClose={() => setRollbackTarget(null)}
          onSuccess={(result) => handleSuccess(result, 'rollback')}
        />
      ) : null}
    </DeveloperShell>
  );
}
