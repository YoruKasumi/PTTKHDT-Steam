import { Link } from 'react-router-dom';

const vnd = (n) => `${n.toLocaleString('vi-VN')}đ`;

/** Thẻ game 200x300 (Figma: node 1:205). */
export default function GameCard({ game }) {
  const free = game.price === 0;
  return (
    <Link to={`/games/${game.id}`} className="relative block h-[300px] w-[200px] flex-none snap-start overflow-hidden rounded-[10px]">
      <img className="absolute inset-0 size-full object-cover" src={game.image} alt={game.title} />
      <span
        className={`absolute left-2 top-2.5 rounded-[5px] px-2 py-1 text-[13px] font-bold ${free ? 'bg-success' : 'bg-accent'}`}
      >
        {free ? 'Free' : `${game.discount}%`}
      </span>
      <div className="absolute inset-x-2 bottom-2.5">
        <p className="m-0 text-[32px] font-bold leading-[1.1] [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{game.title}</p>
        <p className="mt-2 flex items-baseline gap-3.5">
          <span className="text-base font-bold text-accent">{free ? 'Miễn phí' : vnd(game.price)}</span>
          {game.oldPrice ? <span className="text-[13px] text-white/73 line-through">{vnd(game.oldPrice)}</span> : null}
        </p>
      </div>
    </Link>
  );
}
