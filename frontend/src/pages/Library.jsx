import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { findGame } from '../data/games';

const libraryInfo = {
  'counter-strike-2': {
    status: 'Sẵn sàng chơi',
    description: 'Huyền thoại bắn súng góc nhìn thứ nhất với đồ họa Source 2 sống động và hệ thống sub-tick tiên tiến.',
    version: 'VALVE OFFICIAL • Phiên bản 1.39.8.2',
    hours: '148.5 Giờ',
    lastPlayed: 'Hôm qua',
    achievements: '18 / 25',
    cloud: '3.4 MB',
    friends: '3 người',
  },
  'sky-children-of-light': {
    status: 'Đã cài đặt',
    description: 'Khám phá thế giới kỳ diệu, kết nối với bạn bè và cùng nhau trải nghiệm những chuyến phiêu lưu nhẹ nhàng.',
    version: 'ĐÃ CÀI ĐẶT • Phiên bản mới nhất',
    hours: '32.0 Giờ',
    lastPlayed: '3 ngày trước',
    achievements: '12 / 20',
    cloud: '1.8 MB',
    friends: '1 người',
  },
  repo: {
    status: 'Cần cập nhật (1.2 GB)',
    description: 'Trải nghiệm lén lút đi lấy đồ ở những nơi nguy hiểm, đối mặt thử thách cùng các sinh vật và màn chơi ngẫu nhiên.',
    version: 'CÓ BẢN CẬP NHẬT • v0.2.1',
    hours: '18.5 Giờ',
    lastPlayed: 'Hôm qua',
    achievements: '7 / 15',
    cloud: '860 KB',
    friends: '2 người',
  },
};

function LibraryStat({ label, value, note }) {
  return (
    <section className="rounded-xl border border-indigo-950 bg-neutral-900 p-4">
      <p className="m-0 text-xs font-bold text-zinc-400">{label}</p>
      <p className="mb-0 mt-3 text-lg font-bold">{value}</p>
      <p className="mb-0 mt-2 text-xs text-violet-400">{note}</p>
    </section>
  );
}

export default function Library() {
  const { owned } = useShop();
  const [selectedId, setSelectedId] = useState(owned[0] || '');
  const [search, setSearch] = useState('');
  const [filterInstalled, setFilterInstalled] = useState(false);
  const [notice, setNotice] = useState('');
  const games = useMemo(
    () => owned.map((id) => findGame(id)).filter(Boolean),
    [owned],
  );
  const visibleGames = games.filter((game) => {
    const info = libraryInfo[game.id] || {};
    return game.title.toLowerCase().includes(search.trim().toLowerCase())
      && (!filterInstalled || info.status === 'Đã cài đặt' || info.status === 'Sẵn sàng chơi');
  });
  const selectedGame = visibleGames.find((game) => game.id === selectedId) || visibleGames[0] || null;
  const details = selectedGame ? libraryInfo[selectedGame.id] || {} : {};

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 pb-20 pt-10 lg:grid-cols-[320px_minmax(0,1fr)] md:px-8">
      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-2xl font-extrabold">Thư viện</h1>
          <span className="text-sm text-muted">{games.length} trò chơi</span>
        </div>
        <label className="sr-only" htmlFor="library-search">Tìm game trong thư viện</label>
        <input
          id="library-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm trong thư viện..."
          className="w-full rounded-lg border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          aria-pressed={filterInstalled}
          onClick={() => setFilterInstalled((value) => !value)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${filterInstalled ? 'border-accent bg-accent/20 text-accent-light' : 'border-line bg-card text-muted'}`}
        >
          ⚙ Lọc {filterInstalled ? '· Đã cài đặt' : ''}
        </button>
        <ul className="m-0 list-none space-y-2 p-0">
          {visibleGames.map((game) => {
            const info = libraryInfo[game.id] || {};
            const selected = game.id === selectedGame?.id;
            return (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(game.id)}
                  aria-pressed={selected}
                  className={`w-full rounded-lg border px-4 py-3 text-left ${selected ? 'border-indigo-500/70 bg-indigo-500/25' : 'border-line bg-card hover:border-accent/50'}`}
                >
                  <span className="block font-bold">{game.title}</span>
                  <span className={`mt-1 block text-xs ${info.status?.startsWith('Cần') ? 'text-violet-400' : 'text-green-500'}`}>● {info.status || 'Đã cài đặt'}</span>
                </button>
              </li>
            );
          })}
          {!visibleGames.length ? <li className="rounded-lg border border-line bg-card p-4 text-sm text-muted">Không tìm thấy game trong thư viện.</li> : null}
        </ul>
      </aside>

      {selectedGame ? (
        <section className="min-w-0">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-indigo-500/30 bg-neutral-900 p-6 md:p-8">
            <div className="absolute inset-0 opacity-50" style={{ background: `linear-gradient(110deg, ${selectedGame.poster}, transparent 75%)` }} />
            <div className="relative flex min-h-[250px] flex-col justify-between">
              <span className="w-fit rounded bg-indigo-500/30 px-3 py-1 text-xs font-bold text-violet-300">{details.version}</span>
              <div>
                <h2 className="mb-3 mt-10 text-3xl font-extrabold md:text-4xl">{selectedGame.title}</h2>
                <p className="max-w-3xl text-sm leading-6 text-zinc-300">{details.description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setNotice(`${selectedGame.title}: launcher thật sẽ được tích hợp sau.`)} className="rounded-lg bg-indigo-500 px-5 py-3 font-bold">▶ CHƠI NGAY</button>
                  <button type="button" onClick={() => setNotice(`Đã mở tùy chọn quản lý cho ${selectedGame.title}.`)} className="rounded-lg border border-indigo-950 bg-gray-900 px-5 py-3 text-sm font-semibold text-zinc-300">⚙ Quản lý &amp; Cài đặt</button>
                  <Link to={`/games/${selectedGame.id}`} className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-accent">Chi tiết game</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LibraryStat label="THỜI GIAN CHƠI" value={details.hours || '0 Giờ'} note={`Lần cuối: ${details.lastPlayed || 'Chưa chơi'}`} />
            <LibraryStat label="THÀNH TỰU" value={details.achievements || '0 / 0'} note="Tiến trình đồng bộ" />
            <LibraryStat label="LƯU TRỮ CLOUD" value="Đã đồng bộ" note={details.cloud || '0 KB'} />
            <LibraryStat label="BẠN BÈ ĐANG CHƠI" value={details.friends || '0 người'} note="Trong server công cộng" />
          </div>
          {notice ? <p role="status" className="mt-4 rounded-lg border border-indigo-500/40 bg-card p-3 text-sm text-accent-light">{notice}</p> : null}
        </section>
      ) : (
        <section className="flex min-h-72 items-center justify-center rounded-2xl border border-indigo-950 bg-card p-6 text-center text-muted">
          Thư viện chưa có trò chơi. <Link to="/search" className="ml-1 text-accent-light">Khám phá cửa hàng</Link>
        </section>
      )}
    </div>
  );
}
