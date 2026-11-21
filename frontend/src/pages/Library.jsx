import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { libraryApi } from '../api/library';
import { getDeviceFingerprint, getDeviceName } from '../utils/deviceFingerprint';
import { formatVnd } from '../utils/format';

// ─── Helper: format byte → MB/KB ─────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function LibraryStat({ label, value, note }) {
  return (
    <section className="rounded-xl border border-indigo-950 bg-neutral-900 p-4">
      <p className="m-0 text-xs font-bold text-zinc-400">{label}</p>
      <p className="mb-0 mt-3 text-lg font-bold">{value}</p>
      {note ? <p className="mb-0 mt-2 text-xs text-violet-400">{note}</p> : null}
    </section>
  );
}

// ─── Device row ──────────────────────────────────────────────────────────────
function DeviceRow({ device, gameId, onRevoke }) {
  const [loading, setLoading] = useState(false);
  const revoke = async () => {
    if (!confirm(`Thu hồi thiết bị "${device.deviceName || device.deviceId.slice(0, 8)}"?`)) return;
    setLoading(true);
    try {
      await libraryApi.revokeDevice(gameId, device.deviceId);
      onRevoke(device.deviceId);
    } catch (err) {
      alert(err.message || 'Lỗi khi thu hồi thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-page px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-sm font-semibold">{device.deviceName || 'Không rõ thiết bị'}</p>
        <p className="m-0 mt-0.5 font-mono text-xs text-zinc-500">
          ID: {device.deviceFingerprint} · Lần cuối: {device.lastSeen ? new Date(device.lastSeen).toLocaleString('vi-VN') : '—'}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${device.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
        {device.status === 'Active' ? '● Đang hoạt động' : '○ Đã thu hồi'}
      </span>
      {device.status === 'Active' && (
        <button
          type="button"
          onClick={revoke}
          disabled={loading}
          className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1 text-xs font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          {loading ? '...' : 'Thu hồi'}
        </button>
      )}
    </li>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Library() {
  const { user } = useShop();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [launching, setLaunching] = useState(false);

  // Devices panel
  const [showDevices, setShowDevices] = useState(false);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  // Tải danh sách game từ API
  useEffect(() => {
    if (!user?.roles?.includes('Customer')) return;
    setLoading(true);
    libraryApi.list()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setGames(list);
        if (list.length > 0) setSelectedId(list[0].gameId);
      })
      .catch((err) => setNotice(`Lỗi tải thư viện: ${err.message}`))
      .finally(() => setLoading(false));
  }, [user]);

  const visibleGames = useMemo(() => (
    games.filter((g) => g.title?.toLowerCase().includes(search.trim().toLowerCase()))
  ), [games, search]);

  const selectedGame = useMemo(
    () => visibleGames.find((g) => g.gameId === selectedId) || visibleGames[0] || null,
    [visibleGames, selectedId],
  );

  // ─── Launch game ───────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (!selectedGame) return;
    setLaunching(true);
    setNotice('');
    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceName = getDeviceName();
      const result = await libraryApi.launch(selectedGame.gameId, fingerprint, deviceName);
      // Mở tab mới với playUrl
      window.open(result.playUrl, '_blank', 'noopener,noreferrer');
      setNotice(`Đang mở ${selectedGame.title}... Nếu tab không mở tự động, hãy kiểm tra popup blocker.`);
    } catch (err) {
      if (err.code === 'DEVICE_LIMIT_EXCEEDED') {
        setNotice(`⚠ ${err.message} Hãy thu hồi thiết bị cũ trong mục Quản lý thiết bị.`);
      } else {
        setNotice(`Lỗi khởi chạy: ${err.message}`);
      }
    } finally {
      setLaunching(false);
    }
  }, [selectedGame]);

  // ─── Load devices ──────────────────────────────────────────────────────────
  const loadDevices = useCallback(async () => {
    if (!selectedGame) return;
    setDevicesLoading(true);
    try {
      const data = await libraryApi.listDevices(selectedGame.gameId);
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice(`Lỗi tải thiết bị: ${err.message}`);
    } finally {
      setDevicesLoading(false);
    }
  }, [selectedGame]);

  const toggleDevices = useCallback(() => {
    if (!showDevices) loadDevices();
    setShowDevices((v) => !v);
  }, [showDevices, loadDevices]);

  const handleRevokeDevice = useCallback((deviceId) => {
    setDevices((current) => current.map((d) => d.deviceId === deviceId ? { ...d, status: 'Revoked' } : d));
    setNotice('Đã thu hồi thiết bị. Slot thiết bị đã được giải phóng.');
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!user?.roles?.includes('Customer')) {
    return (
      <div className="flex min-h-72 items-center justify-center p-10 text-center text-muted">
        Vui lòng <Link to="/login" className="ml-1 text-accent-light">đăng nhập</Link> để xem thư viện game.
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 pb-20 pt-10 lg:grid-cols-[320px_minmax(0,1fr)] md:px-8">
      {/* ── Sidebar danh sách game ── */}
      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-2xl font-extrabold">Thư viện</h1>
          <span className="text-sm text-muted">{games.length} trò chơi</span>
        </div>

        <label className="sr-only" htmlFor="library-search">Tìm game trong thư viện</label>
        <input
          id="library-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm trong thư viện..."
          className="w-full rounded-lg border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
        />

        {loading ? (
          <p className="text-sm text-muted">Đang tải thư viện...</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {visibleGames.map((game) => {
              const selected = game.gameId === selectedGame?.gameId;
              return (
                <li key={game.gameId}>
                  <button
                    type="button"
                    onClick={() => { setSelectedId(game.gameId); setShowDevices(false); setNotice(''); }}
                    aria-pressed={selected}
                    className={`w-full rounded-lg border px-4 py-3 text-left ${selected ? 'border-indigo-500/70 bg-indigo-500/25' : 'border-line bg-card hover:border-accent/50'}`}
                  >
                    <span className="block font-bold">{game.title}</span>
                    <span className="mt-1 block text-xs text-green-500">
                      ● {game.licenseStatus === 'Active' ? 'Đã sở hữu' : 'Bản quyền thu hồi'}
                      {game.versionNumber ? ` · v${game.versionNumber}` : ''}
                    </span>
                  </button>
                </li>
              );
            })}
            {!visibleGames.length && !loading && (
              <li className="rounded-lg border border-line bg-card p-4 text-sm text-muted">
                {games.length === 0
                  ? <>Thư viện chưa có trò chơi. <Link to="/search" className="text-accent-light">Khám phá cửa hàng</Link></>
                  : 'Không tìm thấy game khớp.'}
              </li>
            )}
          </ul>
        )}
      </aside>

      {/* ── Nội dung chi tiết game ── */}
      {selectedGame ? (
        <section className="min-w-0 space-y-5">
          {/* Hero card */}
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-indigo-500/30 bg-neutral-900 p-6 md:p-8">
            <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(110deg, #312e81, transparent 75%)' }} />
            <div className="relative flex min-h-[230px] flex-col justify-between">
              <div>
                <span className="inline-block rounded bg-indigo-500/30 px-3 py-1 text-xs font-bold text-violet-300">
                  {selectedGame.versionNumber ? `v${selectedGame.versionNumber}` : 'Chưa có build'}
                </span>
                {selectedGame.changeLog && (
                  <span className="ml-2 inline-block rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                    {selectedGame.changeLog.slice(0, 60)}{selectedGame.changeLog.length > 60 ? '…' : ''}
                  </span>
                )}
              </div>
              <div>
                <h2 className="mb-3 mt-6 text-3xl font-extrabold md:text-4xl">{selectedGame.title}</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={launching || !selectedGame.versionNumber}
                    className="rounded-lg bg-indigo-500 px-6 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {launching ? '⏳ Đang khởi chạy...' : '▶ CHƠI NGAY'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleDevices}
                    className="rounded-lg border border-indigo-950 bg-gray-900 px-5 py-3 text-sm font-semibold text-zinc-300"
                  >
                    {showDevices ? '✕ Đóng thiết bị' : '⚙ Quản lý thiết bị'}
                  </button>
                  <Link
                    to={`/games/${selectedGame.gameId}`}
                    className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-accent"
                  >
                    Chi tiết game
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LibraryStat
              label="PHIÊN BẢN HIỆN HÀNH"
              value={selectedGame.versionNumber ? `v${selectedGame.versionNumber}` : '—'}
              note={selectedGame.versionDate ? `Cập nhật: ${new Date(selectedGame.versionDate).toLocaleDateString('vi-VN')}` : ''}
            />
            <LibraryStat
              label="DUNG LƯỢNG BUILD"
              value={formatSize(selectedGame.fileSize)}
              note="Kích thước gói .zip"
            />
            <LibraryStat
              label="NGÀY MUA"
              value={selectedGame.purchaseDate ? new Date(selectedGame.purchaseDate).toLocaleDateString('vi-VN') : '—'}
              note={`Nguồn: ${selectedGame.source === 'Key' ? 'Mã kích hoạt' : 'Mua trực tiếp'}`}
            />
            <LibraryStat
              label="TRẠNG THÁI BẢN QUYỀN"
              value={selectedGame.licenseStatus === 'Active' ? '✅ Hợp lệ' : '❌ Thu hồi'}
              note={selectedGame.gameStatus === 'Approved' ? 'Game đang phát hành' : selectedGame.gameStatus}
            />
          </div>

          {/* Thông báo */}
          {notice && (
            <p role="status" className="rounded-lg border border-indigo-500/40 bg-card p-3 text-sm text-accent-light">
              {notice}
            </p>
          )}

          {/* Quản lý thiết bị */}
          {showDevices && (
            <div className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="m-0 text-base font-bold">Thiết bị đang kích hoạt</h3>
                <span className="text-xs text-muted">Tối đa 3 thiết bị Active</span>
              </div>
              {devicesLoading ? (
                <p className="text-sm text-muted">Đang tải...</p>
              ) : devices.length === 0 ? (
                <p className="text-sm text-muted">Chưa có thiết bị nào được đăng ký.</p>
              ) : (
                <ul className="space-y-2">
                  {devices.map((device) => (
                    <DeviceRow
                      key={device.deviceId}
                      device={device}
                      gameId={selectedGame.gameId}
                      onRevoke={handleRevokeDevice}
                    />
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-zinc-500">
                Thu hồi thiết bị cũ để giải phóng slot cho thiết bị mới.
                SHA-256 đầy đủ của fingerprint được ẩn để bảo mật.
              </p>
            </div>
          )}
        </section>
      ) : (
        !loading && (
          <section className="flex min-h-72 items-center justify-center rounded-2xl border border-indigo-950 bg-card p-6 text-center text-muted">
            Thư viện chưa có trò chơi. <Link to="/search" className="ml-1 text-accent-light">Khám phá cửa hàng</Link>
          </section>
        )
      )}
    </div>
  );
}
