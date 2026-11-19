import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ownedIds, wishlistIds } from '../data/games';

const ShopContext = createContext(null);

const load = (key, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
};

export const INITIAL_BALANCE = 1250000;

/**
 * Giỏ hàng, wishlist, thư viện và ví phía GUI (lưu localStorage) cho đến khi backend cài xong
 * CartService / WishlistService / OrderService / WalletService. Hàm khớp sơ đồ UC9, UC10, UC11, UC15:
 * thêm vào giỏ kiểm tra "đã có trong giỏ" và "đã sở hữu"; thanh toán kiểm tra số dư rồi cấp bản quyền.
 */
export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => load('cart', []));
  const [wishlist, setWishlist] = useState(() => load('wishlist', wishlistIds));
  const [owned, setOwned] = useState(() => load('owned', ownedIds));
  const [balance, setBalance] = useState(() => load('balance', INITIAL_BALANCE));

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('owned', JSON.stringify(owned)), [owned]);
  useEffect(() => localStorage.setItem('balance', JSON.stringify(balance)), [balance]);

  const addToCart = useCallback((id) => {
    if (owned.includes(id)) return { ok: false, message: 'Bạn đã sở hữu game này' };
    if (cart.includes(id)) return { ok: false, message: 'Game đã có trong giỏ hàng' };
    setCart((c) => [...c, id]);
    return { ok: true, message: 'Đã thêm vào giỏ hàng' };
  }, [cart, owned]);

  const addManyToCart = useCallback((ids) => {
    const requested = [...new Set(ids)];
    const eligible = requested.filter((id) => !owned.includes(id) && !cart.includes(id));
    setCart((current) => [...new Set([...current, ...eligible])]);
    return {
      added: eligible.length,
      skipped: requested.length - eligible.length,
    };
  }, [cart, owned]);

  const removeFromCart = useCallback((id) => setCart((c) => c.filter((x) => x !== id)), []);
  const toggleWishlist = useCallback((id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])), []);

  /** Thanh toán bằng ví: total là số tiền cuối cùng sau giảm giá. Trả { ok, reason?, items? }. */
  const checkout = useCallback((total) => {
    if (!cart.length) return { ok: false, reason: 'empty' };
    if (total > balance) return { ok: false, reason: 'balance' };
    const items = [...cart];
    setBalance((b) => b - total);
    setOwned((o) => [...new Set([...o, ...items])]);
    setCart([]);
    return { ok: true, items };
  }, [cart, balance]);

  const value = useMemo(
    () => ({ cart, wishlist, owned, balance, addToCart, addManyToCart, removeFromCart, toggleWishlist, checkout }),
    [cart, wishlist, owned, balance, addToCart, addManyToCart, removeFromCart, toggleWishlist, checkout],
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
