import { Link } from 'react-router-dom';
import { TrashIcon } from '../common/Icons';
import { formatVnd } from '../../utils/format';

/** Một dòng trong giỏ (Figma: node 94:1583). */
export default function CartItem({ game, onRemove }) {
  return (
    <li className="flex items-center gap-4 rounded-xl border-2 border-page bg-field p-3 sm:gap-6 sm:px-[18px]">
      <div className="min-w-0 flex-1">
        <Link to={`/games/${game.id}`} className="block truncate text-lg font-bold sm:text-xl">{game.title}</Link>
        <p className="m-0 mt-2 text-xs text-muted">{game.genres.join(', ')}</p>
        <p className="m-0 mt-3 flex flex-wrap items-center gap-4">
          {game.discount ? <span className="rounded bg-accent px-3 py-1.5 text-xs font-bold">-{game.discount}%</span> : null}
          <span className="font-mono text-base font-bold">{game.price === 0 ? 'Miễn phí' : formatVnd(game.price)}</span>
          {game.oldPrice ? <span className="font-mono text-sm text-muted line-through">{formatVnd(game.oldPrice)}</span> : null}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(game.id)}
        aria-label={`Xóa ${game.title} khỏi giỏ hàng`}
        className="flex size-[68px] flex-none items-center justify-center rounded-lg border-0 bg-field text-[34px] text-accent hover:text-red-400"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
