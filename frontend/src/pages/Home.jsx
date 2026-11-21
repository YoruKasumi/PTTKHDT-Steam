import { useEffect, useState } from 'react';
import HeroBanner from '../components/HeroBanner';
import GameCarousel from '../components/GameCarousel';
import { catalogApi } from '../api/catalog';

const homeEvent = {
  tag: 'Cửa hàng Vortex',
  title: 'Tìm trò chơi tiếp theo của bạn',
  description: 'Khám phá danh mục trò chơi và các ưu đãi đang hoạt động.',
  cta: 'Khám phá cửa hàng',
  to: '/search',
};

/** Màn hình Home (Figma: node 1:200). */
export default function Home() {
  const [saleGames, setSaleGames] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      catalogApi.listGames({ onSale: true, sort: 'popularity' }),
      catalogApi.listGames({ sort: 'popularity' }),
    ]).then(([sales, popular]) => {
      if (!active) return;
      setSaleGames(sales);
      setPopularGames(popular);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1698px] flex-col gap-[70px] px-4 pb-[100px] pt-[53px] md:px-[76px]">
      <HeroBanner event={homeEvent} />
      {error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-card p-4 text-red-300">Không thể tải cửa hàng: {error}</p> : null}
      {loading ? <p role="status" className="text-center text-muted">Đang tải trò chơi…</p> : null}
      {!loading && !error ? (
        <>
          <GameCarousel title="Đang giảm giá" badge="Ưu đãi" games={saleGames} />
          <GameCarousel title="Được yêu thích nhất" games={popularGames} />
        </>
      ) : null}
    </div>
  );
}
