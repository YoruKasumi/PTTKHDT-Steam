import { useRef } from 'react';
import GameCard from './GameCard';

/** Khối "Sale / Hot deal" và "Được yêu thích nhất" (Figma: node 1:247, 1:203). */
export default function GameCarousel({ title, badge, games }) {
  const track = useRef(null);
  const scroll = (dir) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * 453, behavior: 'smooth' });
  };

  return (
    <section className="rounded-3xl bg-card px-4 pb-6 pt-3 md:rounded-section md:px-[38px] md:pb-10 md:pt-[18px]">
      <div className="flex min-h-[68px] items-center gap-4">
        <h2 className="m-0 text-[22px] font-bold md:text-[35px]">{title}</h2>
        {badge ? (
          <span className="rounded-[10px] border border-accent bg-accent/19 px-3 text-[22px] font-bold text-accent md:text-[35px]">
            {badge}
          </span>
        ) : null}
        <div className="ml-auto flex gap-6 md:gap-[55px]">
          <button type="button" className="border-0 bg-transparent p-0" onClick={() => scroll(-1)} aria-label="Trước">
            <img className="size-[35px] rotate-180" src="/assets/arrow-prev.svg" alt="" />
          </button>
          <button type="button" className="border-0 bg-transparent p-0" onClick={() => scroll(1)} aria-label="Sau">
            <img className="size-[35px]" src="/assets/arrow-next.svg" alt="" />
          </button>
        </div>
      </div>
      {/* Figma: các thẻ cách nhau 453px (thẻ rộng 200px) */}
      <div
        ref={track}
        className="flex snap-x snap-proximity gap-4 overflow-x-auto px-[22px] pb-2 pt-[18px] [scrollbar-width:none] md:gap-20 min-[1500px]:gap-[232px] [&::-webkit-scrollbar]:hidden"
      >
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  );
}
