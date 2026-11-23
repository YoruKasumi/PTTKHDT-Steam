import { useEffect, useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';
import { gameApi } from '../../api/game';
import { promotionApi } from '../../api/promotion';

const initialKeys = [
  { code: 'REPO9-8821A-VX901', game: 'R.E.P.O.', date: '15/11/2026', status: 'Chờ duyệt' },
  { code: 'REPO9-4410B-VX902', game: 'R.E.P.O.', date: '14/11/2026', status: 'Chờ duyệt' },
  { code: 'TINY2-7731C-LP110', game: 'Tiny Pasture', date: '12/11/2026', status: 'Sẵn sàng dùng' },
  { code: 'CYBER-9920X-OD881', game: 'Cyber Odyssey 2088', date: '10/11/2026', status: 'Sẵn sàng dùng' },
  { code: 'CYBER-1104Z-OD882', game: 'Cyber Odyssey 2088', date: '05/11/2026', status: 'Đã kích hoạt' },
];

function KeyStatus({ status }) {
  const tone = status === 'Đã kích hoạt'
    ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
    : status === 'Sẵn sàng dùng'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>{status}</span>;
}

export default function DeveloperKeys() {
  const [gamesList, setGamesList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [keys, setKeys] = useState(initialKeys);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    gameApi.layDanhSachDuAnCuaToi()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : (res?.data || []);
        setGamesList(list);
        if (list.length > 0) {
          setSelectedGameId(list[0].GameID || list[0].id);
        }
      })
      .catch(() => {
        // Fallback demo games if empty
      });
    return () => { mounted = false; };
  }, []);

  const generateKeys = async (event) => {
    event.preventDefault();
    const count = Number(quantity);
    if (!Number.isInteger(count) || count < 1 || count > 199) {
      setMessage('Số lượng mỗi đợt phải từ 1 đến 199 Key.');
      return;
    }
    if (!selectedGameId) {
      setMessage('Vui lòng chọn một tựa game để sinh mã Key.');
      return;
    }
    const selectedGame = gamesList.find((g) => (g.GameID || g.id) === selectedGameId);
    setLoading(true);
    setMessage('');
    try {
      const res = await promotionApi.generateKeys({
        gameId: selectedGameId,
        quantity: count,
      });
      const generatedCodes = res?.keys || res?.data?.keys || [];
      const gameTitle = selectedGame?.Title || selectedGame?.title || 'Game';
      const formattedDate = new Intl.DateTimeFormat('vi-VN').format(new Date());
      const newKeyRows = generatedCodes.map((code) => ({
        code,
        game: gameTitle,
        date: formattedDate,
        status: 'Chờ duyệt',
      }));
      setKeys((current) => [...newKeyRows, ...current]);
      setMessage(`Đã sinh thành công ${generatedCodes.length || count} mã kích hoạt bản quyền cho ${gameTitle}.`);
    } catch (error) {
      setMessage(error?.message || 'Không thể sinh mã Key.');
    } finally {
      setLoading(false);
    }
  };

  const copyCodes = async (codes) => {
    if (!navigator.clipboard) {
      setMessage('Trình duyệt hiện tại không hỗ trợ sao chép tự động.');
      return;
    }
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setMessage(codes.length > 1 ? `Đã sao chép ${codes.length} mã Key.` : 'Đã sao chép mã Key.');
    } catch (error) {
      setMessage(`Không thể sao chép mã Key: ${error.message}`);
    }
  };

  return (
    <DeveloperShell
      title="Quản lý mã bản quyền"
      description="Tạo lô Key chờ duyệt, theo dõi trạng thái và sao chép mã để gửi cho người dùng."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-white/10 bg-card p-5">
          <p className="m-0 text-xs font-bold uppercase text-muted">Giới hạn mỗi đợt sinh Key</p>
          <p className="mb-0 mt-3 font-mono text-2xl font-extrabold">1 – 199 Key</p>
        </section>
        <section className="rounded-xl border border-accent bg-card p-5 shadow-lg shadow-accent/10">
          <p className="m-0 text-xs font-bold uppercase text-muted">Hạn mức Key tồn kho chưa dùng</p>
          <p className="mb-0 mt-3 font-mono text-2xl font-extrabold">340 / 2.000 Key</p>
          <div className="mt-3 h-2 rounded-full bg-page">
            <div className="h-full w-[17%] rounded-full bg-gradient-to-r from-accent to-accent-light" />
          </div>
        </section>
        <section className="rounded-xl border border-white/10 bg-card p-5">
          <p className="m-0 text-xs font-bold uppercase text-muted">Vòng đời mã Key</p>
          <p className="mb-0 mt-3 font-mono font-bold text-amber-400">PendingActivation → Unused</p>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
        <form onSubmit={generateKeys} className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Sinh Mã Key Mới</h2>
          <label className="block text-sm font-semibold text-muted">
            Chọn tựa game phát hành mã Key
            <select
              value={selectedGameId}
              onChange={(event) => setSelectedGameId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white"
            >
              {gamesList.length === 0 ? (
                <option value="">(Không có game tính phí)</option>
              ) : (
                gamesList.map((item) => (
                  <option key={item.GameID || item.id} value={item.GameID || item.id}>
                    {item.Title || item.title}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block text-sm font-semibold text-muted">
            Số lượng mã cần sinh
            <input
              type="number"
              min="1"
              max="199"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-mono text-white"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !selectedGameId}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? 'Đang tạo Key...' : 'Sinh danh sách Key (PendingActivation)'}
          </button>
          <p className="m-0 text-xs text-muted">Mã được sinh trực tiếp trên hệ thống và chuyển trạng thái chờ duyệt.</p>
          {message ? <p role="status" className="m-0 text-sm text-accent-light">{message}</p> : null}
        </form>

        <section className="min-w-0 rounded-2xl border border-white/10 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <h2 className="m-0 text-lg font-bold">Danh sách Mã kích hoạt bản quyền đã khởi tạo</h2>
            <button type="button" onClick={() => copyCodes(keys.map((item) => item.code))} className="rounded-lg border border-line bg-page px-3 py-2 text-sm font-bold hover:border-accent">
              Sao chép tất cả
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="bg-page text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-3">Mã KeyCode</th>
                  <th className="px-3 py-3">Tựa Game</th>
                  <th className="px-3 py-3">Ngày khởi tạo</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Sao chép</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((item) => (
                  <tr key={item.code} className="border-b border-white/5">
                    <td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-accent-light">{item.code}</td>
                    <td className="px-3 py-3">{item.game}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{item.date}</td>
                    <td className="px-3 py-3"><KeyStatus status={item.status} /></td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => copyCodes([item.code])} className="rounded-md border border-line px-3 py-1.5 text-xs font-bold hover:border-accent">
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DeveloperShell>
  );
}
