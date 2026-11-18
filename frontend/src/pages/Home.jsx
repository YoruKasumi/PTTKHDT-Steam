import HeroBanner from '../components/HeroBanner';
import GameCarousel from '../components/GameCarousel';
import { homeEvent, saleGames, popularGames } from '../data/mockGames';

/** Màn hình Home (Figma: node 1:200). */
export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[1698px] flex-col gap-[70px] px-4 pb-[100px] pt-[53px] md:px-[76px]">
      <HeroBanner event={homeEvent} />
      <GameCarousel title="Sale" badge="Hot deal" games={saleGames} />
      <GameCarousel title="Được yêu thích nhất" games={popularGames} />
    </div>
  );
}
