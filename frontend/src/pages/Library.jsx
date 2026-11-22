import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { libraryApi } from '../api/library';
import { formatVnd } from '../utils/format';
import {
  getInstalledMap,
  markInstalled,
  clearInstalled,
  pickInstallFolder,
  loadInstallFolder,
  ensureWritePermission,
  writeInstalledFile,
  removeInstalledFile,
  supportsFsAccess,
} from '../utils/installedLibrary';
import { downloadGameBuild } from '../utils/gameDownload';

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

// ─── Main component ──────────────────────────────────────────────────────────
export default function Library() {
  const { user } = useShop();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('info'); // 'info' | 'success' | 'error'
  const [launching, setLaunching] = useState(false);

  // Redeem Key state
  const [showRedeem, setShowRedeem] = useState(false);
  const [keyCode, setKeyCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  // Cài đặt tại thư mục của người chơi (mô phỏng launcher: tải → cài → gỡ)
  const [installed, setInstalled] = useState({});
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(null); // { received, total, percent }
  const [uninstalling, setUninstalling] = useState(false);

  // Tải danh sách game từ API
  const fetchLibrary = useCallback(async (selectGameId = null) => {
    if (!user?.roles?.includes('Customer')) return;
    setLoading(true);
    try {
      const data = await libraryApi.list();
      const list = Array.isArray(data) ? data : [];
      setGames(list);
      if (selectGameId) {
        setSelectedId(selectGameId);
      } else {
        setSelectedId((current) => (current && list.some((g) => g.gameId === current) ? current : (list[0]?.gameId || '')));
      }
    } catch (err) {
      setNotice(`Lỗi tải thư viện: ${err.message}`);
      setNoticeType('error');
    } finally {
      setLoading(false);
    }
  }, [user?.accountId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const visibleGames = useMemo(() => (
    games.filter((g) => g.title?.toLowerCase().includes(search.trim().toLowerCase()))
  ), [games, search]);

  const selectedGame = useMemo(
    () => visibleGames.find((g) => g.gameId === selectedId) || visibleGames[0] || null,
    [visibleGames, selectedId],
  );

  // ─── Handle Redeem Key ────────────────────────────────────────────────────
  const handleRedeem = async (e) => {
    e.preventDefault();
    const code = keyCode.trim().toUpperCase();
    if (!code) {
      setRedeemError('Vui lòng nhập mã kích hoạt.');
      return;
    }

    setRedeeming(true);
    setRedeemError('');
    try {
      const result = await libraryApi.redeemKey(code);
      setNotice(result.message || `Kích hoạt thành công "${result.title || 'Game'}"!`);
      setNoticeType('success');
      setKeyCode('');
      setShowRedeem(false);
      // Tải lại thư viện và chọn game vừa kích hoạt
      await fetchLibrary(result.gameId);
    } catch (err) {
      setRedeemError(err.message || 'Mã kích hoạt không hợp lệ hoặc đã qua sử dụng.');
    } finally {
      setRedeeming(false);
    }
  };

  // ─── Launch game ───────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (!selectedGame) return;
    setLaunching(true);
    setNotice('');
    try {
      const result = await libraryApi.launch(selectedGame.gameId);
      // Mở tab mới với playUrl
      window.open(result.playUrl, '_blank', 'noopener,noreferrer');
      setNotice(`Đang mở ${selectedGame.title}... Nếu tab không mở tự động, hãy kiểm tra trình chặn cửa sổ bật lên (popup blocker).`);
      setNoticeType('info');
    } catch (err) {
      setNoticeType('error');
      setNotice(`Lỗi khởi chạy: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  }, [selectedGame]);

  // ─── Cài đặt / Gỡ cài đặt tại máy người chơi ──────────────────────────────
  // Load trạng thái đã cài từ localStorage khi mở trang.
  useEffect(() => {
    setInstalled(getInstalledMap());
  }, []);

  const installInfo = selectedGame ? installed[selectedGame.gameId] : null;

  const handleInstall = useCallback(async () => {
    if (!selectedGame) return;
    setInstalling(true);
    setNotice('');
    setProgress({ received: 0, total: 0, percent: 0 });
    try {
      // 1. Thư mục cài đặt trên máy người chơi (File System Access API)
      const useFs = supportsFsAccess();
      let dirHandle = null;
      if (useFs) {
        dirHandle = (await loadInstallFolder()) || (await pickInstallFolder());
        if (!dirHandle) {
          setNotice('Bạn chưa chọn thư mục cài đặt — đã hủy tải game.');
          setNoticeType('error');
          return;
        }
        dirHandle = await ensureWritePermission(dirHandle);
        if (!dirHandle) {
          setNotice('Không có quyền ghi vào thư mục đã chọn. Hãy chọn lại thư mục cài đặt.');
          setNoticeType('error');
          return;
        }
      }

      // 2. Tải stream build.zip kèm tiến trình %
      const result = await downloadGameBuild({ gameId: selectedGame.gameId, onProgress: setProgress });

      // 3. Xác minh checksum như launcher thật
      if (result.verified === false) {
        setNotice('❌ Tệp tải về sai checksum SHA-256 — đã hủy cài đặt để đảm bảo an toàn. Vui lòng thử tải lại.');
        setNoticeType('error');
        return;
      }

      // 4. Ghi file vào thư mục của người chơi + ghi nhận trạng thái đã cài
      if (useFs) {
        await writeInstalledFile(dirHandle, result.fileName, result.blob);
      } else {
        // Trình duyệt không hỗ trợ chọn thư mục (Firefox/Safari): lưu về Downloads mặc định
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      const info = markInstalled(selectedGame.gameId, {
        fileName: result.fileName,
        versionNumber: result.versionNumber,
        sha256: result.sha256,
        size: result.size,
        folder: dirHandle?.name || null,
        canAutoUninstall: useFs,
        verified: result.verified,
      });
      setInstalled(getInstalledMap());
      setNotice(
        `✅ Đã tải và cài đặt "${selectedGame.title}" (v${result.versionNumber}, ${formatSize(result.size)})`
        + `${info.folder ? ` vào thư mục "${info.folder}"` : ' vào thư mục Downloads của trình duyệt'}`
        + `${result.verified === true ? ' — checksum SHA-256 khớp.' : '.'}`,
      );
      setNoticeType('success');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setNotice('Đã hủy chọn thư mục cài đặt.');
        setNoticeType('info');
      } else {
        setNotice(`Lỗi tải game: ${err.message}`);
        setNoticeType('error');
      }
    } finally {
      setInstalling(false);
      setProgress(null);
    }
  }, [selectedGame]);

  // Gỡ cài đặt: CHỈ xóa tệp trong thư mục của người chơi — không gọi bất kỳ API
  // bản quyền nào. Thu hồi bản quyền chỉ xảy ra khi hoàn tiền/khóa tài khoản (server-side).
  const handleUninstall = useCallback(async () => {
    if (!selectedGame || !installed[selectedGame.gameId]) return;
    const info = installed[selectedGame.gameId];
    if (!confirm(
      `Gỡ cài đặt "${selectedGame.title}" khỏi máy?\n\n`
      + 'Chỉ xóa tệp cài đặt trong thư mục của bạn — BẢN QUYỀN VẪN GIỮ NGUYÊN, có thể tải lại bất cứ lúc nào.',
    )) return;
    setUninstalling(true);
    setNotice('');
    try {
      const manualOnly = info.canAutoUninstall === false;
      let removed = false;
      if (!manualOnly) {
        const dirHandle = await ensureWritePermission(await loadInstallFolder());
        if (dirHandle) removed = await removeInstalledFile(dirHandle, info.fileName);
      }
      clearInstalled(selectedGame.gameId);
      setInstalled(getInstalledMap());
      setNotice(manualOnly
        ? `🗑 Đã gỡ cài đặt "${selectedGame.title}" khỏi danh sách. Tệp ${info.fileName} nằm trong thư mục Downloads — xóa thủ công nếu muốn. Bản quyền vẫn còn, có thể tải lại.`
        : removed
          ? `🗑 Đã xóa "${info.fileName}" khỏi thư mục "${info.folder}". Bản quyền vẫn còn trong thư viện — bấm "Tải lại" để cài đặt lại bất cứ lúc nào.`
          : `🗑 Đã gỡ cài đặt "${selectedGame.title}". Không truy cập được thư mục "${info.folder}" — xóa thủ công tệp "${info.fileName}" nếu còn. Bản quyền vẫn còn.`);
      setNoticeType('success');
    } finally {
      setUninstalling(false);
    }
  }, [selectedGame, installed]);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!user?.roles?.includes('Customer')) {
    return (
      <div className="flex min-h-72 items-center justify-center p-10 text-center text-muted">
        Vui lòng <Link to="/login" className="ml-1 text-accent-light">đăng nhập</Link> để xem thư viện game.
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 pb-20 pt-10 lg:grid-cols-[340px_minmax(0,1fr)] md:px-8">
      {/* ── Sidebar danh sách game ── */}
      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-2xl font-extrabold">Thư viện</h1>
          <span className="text-sm text-muted">{games.length} trò chơi</span>
        </div>

        {/* Nút mở hộp thoại Đổi Key */}
        <button
          type="button"
          onClick={() => { setShowRedeem(!showRedeem); setRedeemError(''); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-4 py-2.5 text-sm font-bold text-accent-light hover:bg-accent/25 transition-colors"
        >
          <span>🔑</span>
          <span>{showRedeem ? 'Đóng nhập mã kích hoạt' : 'Kích hoạt mã game (Redeem Key)'}</span>
        </button>

        {/* Khung nhập Redeem Key */}
        {showRedeem && (
          <form onSubmit={handleRedeem} className="space-y-3 rounded-xl border border-indigo-500/30 bg-card p-4 shadow-lg">
            <h3 className="m-0 text-sm font-bold text-white">Nhập mã kích hoạt game</h3>
            <p className="m-0 text-xs text-muted">
              Nhập mã bản quyền gồm các chữ cái và số (ví dụ: STEAM-XXXX-YYYY).
            </p>
            <input
              type="text"
              value={keyCode}
              onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
              placeholder="MÃ-KÍCH-HOẠT-GAME"
              disabled={redeeming}
              className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm font-mono uppercase tracking-wider text-white outline-none focus:border-accent"
              autoFocus
            />
            {redeemError && (
              <p className="m-0 text-xs text-red-400 font-semibold">{redeemError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={redeeming || !keyCode.trim()}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent/80 disabled:opacity-50"
              >
                {redeeming ? 'Đang kích hoạt...' : 'Kích hoạt ngay'}
              </button>
              <button
                type="button"
                onClick={() => { setShowRedeem(false); setRedeemError(''); }}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted hover:text-white"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

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
          <ul className="m-0 list-none space-y-2 p-0 max-h-[600px] overflow-y-auto pr-1">
            {visibleGames.map((game) => {
              const selected = game.gameId === selectedGame?.gameId;
              return (
                <li key={game.gameId}>
                  <button
                    type="button"
                    onClick={() => { setSelectedId(game.gameId); setNotice(''); }}
                    aria-pressed={selected}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${selected ? 'border-indigo-500/70 bg-indigo-500/25 shadow-md' : 'border-line bg-card hover:border-accent/50'}`}
                  >
                    <span className="block font-bold truncate">{game.title}</span>
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
                  {selectedGame.versionNumber ? `Phiên bản v${selectedGame.versionNumber}` : 'Chưa có bản phát hành'}
                </span>
                {selectedGame.sha256 && (
                  <span className="ml-2 inline-block rounded bg-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-400" title={`SHA-256: ${selectedGame.sha256}`}>
                    SHA: {selectedGame.sha256.slice(0, 10)}...
                  </span>
                )}
              </div>
              <div>
                <h2 className="mb-3 mt-6 text-3xl font-extrabold md:text-4xl">{selectedGame.title}</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={launching || !selectedGame.versionNumber || selectedGame.licenseStatus !== 'Active'}
                    className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {launching ? '⏳ Đang khởi chạy...' : '▶ CHƠI NGAY (DRM)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleInstall}
                    disabled={launching || installing || !selectedGame.versionNumber || selectedGame.licenseStatus !== 'Active'}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {installing
                      ? `⬇ Đang tải...${progress?.percent != null ? ` ${progress.percent}%` : ''}`
                      : (installInfo ? '⬇ Tải lại / Cập nhật' : '⬇ Tải xuống & Cài đặt')}
                  </button>
                  {installInfo && (
                    <button
                      type="button"
                      onClick={handleUninstall}
                      disabled={uninstalling || installing}
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uninstalling ? '⏳ Đang gỡ...' : '🗑 Gỡ cài đặt'}
                    </button>
                  )}

                  <Link
                    to={`/games/${selectedGame.gameId}`}
                    className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-accent transition-colors"
                  >
                    Chi tiết trang cửa hàng
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
              label="DUNG LƯỢNG GÓI BUILD"
              value={formatSize(selectedGame.fileSize)}
              note="Kích thước tệp .zip nén"
            />
            <LibraryStat
              label="NGÀY MUA / KÍCH HOẠT"
              value={selectedGame.purchaseDate ? new Date(selectedGame.purchaseDate).toLocaleDateString('vi-VN') : '—'}
              note={`Nguồn: ${selectedGame.source === 'Key' ? 'Mã kích hoạt (Key)' : 'Mua trực tiếp'}`}
            />
            <LibraryStat
              label="TRẠNG THÁI BẢN QUYỀN"
              value={selectedGame.licenseStatus === 'Active' ? '✅ Hợp lệ' : '❌ Thu hồi'}
              note={selectedGame.gameStatus === 'Approved' ? 'Game đang phát hành' : selectedGame.gameStatus}
            />
          </div>

          {/* Cài đặt trên máy người chơi (mô phỏng luồng tải thật) */}
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="m-0 text-base font-bold">Cài đặt trên máy của bạn</h3>
              {installInfo ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                  ● Đã cài đặt{installInfo.folder ? ` · ${installInfo.folder}` : ''}
                </span>
              ) : (
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">○ Chưa cài đặt</span>
              )}
            </div>
            {progress && (
              <div className="mb-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress.percent ?? 5}%` }} />
                </div>
                <p className="m-0 mt-1 text-xs text-zinc-400">
                  {formatSize(progress.received)}{progress.total ? ` / ${formatSize(progress.total)}` : ''} · đang tải {installInfo?.fileName || `game-${selectedGame.gameId.slice(0, 8)}...`}
                </p>
              </div>
            )}
            {installInfo ? (
              <p className="m-0 text-xs leading-relaxed text-zinc-400">
                Tệp: <span className="font-mono">{installInfo.fileName}</span> · v{installInfo.versionNumber || '?'} · {formatSize(installInfo.size)}
                {installInfo.sha256 ? ` · SHA-256: ${String(installInfo.sha256).slice(0, 12)}...` : ''}
                {installInfo.verified === true ? ' · ✅ checksum khớp' : ''}
              </p>
            ) : (
              <p className="m-0 text-xs leading-relaxed text-zinc-400">
                Bấm "Tải xuống & Cài đặt" để tải gói build.zip vào thư mục bạn chọn trên máy — hệ thống tự xác minh checksum SHA-256 sau khi tải.
              </p>
            )}
            <p className="m-0 mt-2 text-xs leading-relaxed text-amber-300/80">
              ⚠ "Gỡ cài đặt" chỉ xóa tệp trong máy của bạn — bản quyền vẫn giữ nguyên, có thể tải lại bất cứ lúc nào.
              Bản quyền chỉ bị thu hồi khi hoàn tiền hoặc tài khoản bị khóa (do server xử lý).
            </p>
          </div>

          {/* Thông báo */}
          {notice && (
            <p
              role="status"
              className={`rounded-lg border p-3 text-sm ${
                noticeType === 'success'
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                  : noticeType === 'error'
                  ? 'border-red-500/50 bg-red-950/30 text-red-300'
                  : 'border-indigo-500/40 bg-card text-accent-light'
              }`}
            >
              {notice}
            </p>
          )}

          {/* Nhật ký cập nhật ChangeLog */}
          {selectedGame.changeLog && (
            <div className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="m-0 text-base font-bold text-white">Nhật ký cập nhật (ChangeLog)</h3>
                <span className="text-xs text-indigo-400">v{selectedGame.versionNumber}</span>
              </div>
              <div className="rounded-lg bg-page/60 p-4 font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed border border-white/5">
                {selectedGame.changeLog}
              </div>
              {selectedGame.sha256 && (
                <div className="mt-2 text-xs font-mono text-zinc-500 truncate">
                  SHA-256 Checksum: {selectedGame.sha256}
                </div>
              )}
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
