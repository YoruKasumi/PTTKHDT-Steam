import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';

/** Khối logo + ô tìm kiếm + giỏ hàng (Figma: node 1:304). */
export default function Header() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const { cart } = useShop();

  const submit = (e) => {
    e.preventDefault();
    navigate(`/search/results?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <header className="flex min-h-[116px] items-center gap-3 bg-card px-4 py-3 md:gap-6 md:px-[66px] md:py-4">
      <Link
        to="/"
        className="flex h-12 w-[90px] flex-none items-end justify-center border border-accent pb-1.5 text-sm md:h-[70px] md:w-[157px] md:pb-3 md:text-xl"
      >
        LOGO
      </Link>
      <form className="relative mx-auto h-[57px] max-w-[733px] flex-1" onSubmit={submit} role="search">
        <img className="absolute inset-0 size-full" src="/assets/search-bg.svg" alt="" />
        <input
          className="relative size-full border-0 bg-transparent pl-[46px] pr-[70px] text-xl text-white outline-none placeholder:text-white/90"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập từ khóa tìm kiếm..."
          aria-label="Tìm kiếm game"
        />
        <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0" aria-label="Tìm kiếm">
          <img className="size-[30px]" src="/assets/icon-search.svg" alt="" />
        </button>
      </form>
      <Link to="/cart" className="relative size-9 flex-none md:mr-6 md:size-[50px]" aria-label={`Giỏ hàng (${cart.length})`}>
        <img className="size-full" src="/assets/icon-cart.svg" alt="" />
        {cart.length ? (
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold">{cart.length}</span>
        ) : null}
      </Link>
    </header>
  );
}
