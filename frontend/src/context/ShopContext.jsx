import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/cart';
import { libraryApi } from '../api/library';
import { orderApi } from '../api/order';
import { wishlistApi } from '../api/wishlist';
import { authApi } from '../api/auth';
import { walletApi } from '../api/wallet';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => (
    localStorage.getItem('token') || sessionStorage.getItem('token') || ''
  ));
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [owned, setOwned] = useState([]);
  const [balance, setBalance] = useState(0);
  const [shopError, setShopError] = useState('');

  const loadShopState = useCallback(async () => {
    const [cartResult, wishlistResult, libraryResult, preview] = await Promise.all([
      cartApi.yeuCauXemGioHang(),
      wishlistApi.layDanhSachWishlist(),
      libraryApi.yeuCauXemThuVien(),
      orderApi.kiemTraMaGiamGia(),
    ]);
    return {
      cart: cartResult.items.map((item) => item.gameId),
      wishlist: wishlistResult.map((item) => item.gameId),
      owned: libraryResult.map((item) => item.gameId),
      balance: Number(preview.balance),
    };
  }, []);

  const applyShopState = useCallback((next) => {
    setCart(next.cart);
    setWishlist(next.wishlist);
    setOwned(next.owned);
    setBalance(next.balance);
  }, []);

  const refreshShop = useCallback(async () => {
    if (user?.roles?.includes('Developer') && !user?.roles?.includes('Customer')) {
      const wallet = await walletApi.yeuCauXemSoDu();
      setBalance(Number(wallet?.balance ?? wallet?.data?.balance ?? 0));
      return;
    }
    const next = await loadShopState();
    applyShopState(next);
    setShopError('');
  }, [applyShopState, loadShopState, user?.roles]);

  useEffect(() => {
    let active = true;
    const roles = user?.roles || [];
    if (!authToken || (!roles.includes('Customer') && !roles.includes('Developer'))) {
      setCart([]);
      setWishlist([]);
      setOwned([]);
      setBalance(0);
      setShopError('');
      return () => { active = false; };
    }

    if (roles.includes('Developer') && !roles.includes('Customer')) {
      setCart([]);
      setWishlist([]);
      setOwned([]);
      setShopError('');
      walletApi.yeuCauXemSoDu().then((result) => {
        if (active) setBalance(Number(result?.balance ?? result?.data?.balance ?? 0));
      }).catch(() => {
        if (active) setBalance(0);
      });
      return () => { active = false; };
    }

    setShopError('');
    loadShopState().then((next) => {
      if (active) applyShopState(next);
    }).catch((error) => {
      if (active) setShopError(error.message);
    });
    return () => { active = false; };
  }, [applyShopState, authToken, loadShopState, user?.accountId, user?.roles]);

  const addToCart = useCallback(async (id) => {
    try {
      const result = await cartApi.yeuCauThemSanPham(id);
      setCart((current) => [...new Set([...current, result.gameId])]);
      setShopError('');
      return { ok: true, message: 'Đã thêm vào giỏ hàng' };
    } catch (error) {
      if (error.status === 409) return { ok: false, message: error.message };
      throw error;
    }
  }, []);

  const addManyToCart = useCallback(async (ids) => {
    let added = 0;
    let skipped = 0;
    for (const id of [...new Set(ids)]) {
      const result = await addToCart(id);
      if (result.ok) added += 1;
      else skipped += 1;
    }
    return { added, skipped };
  }, [addToCart]);

  const removeFromCart = useCallback(async (id) => {
    await cartApi.yeuCauXoaSanPham(id);
    setCart((current) => current.filter((gameId) => gameId !== id));
  }, []);

  const toggleWishlist = useCallback(async (id) => {
    if (wishlist.includes(id)) {
      await wishlistApi.yeuCauXoaWishlist(id);
      setWishlist((current) => current.filter((gameId) => gameId !== id));
      return { added: false };
    }
    try {
      await wishlistApi.yeuCauThemWishlist(id);
      setWishlist((current) => [...new Set([...current, id])]);
      return { added: true };
    } catch (error) {
      if (error.status === 409) return { added: false, message: error.message };
      throw error;
    }
  }, [wishlist]);

  const checkout = useCallback(async (couponCode) => {
    const result = await orderApi.yeuCauThanhToan(couponCode);
    const purchasedIds = result.items.map((item) => item.gameId);
    setCart([]);
    setWishlist((current) => current.filter((id) => !purchasedIds.includes(id)));
    setOwned((current) => [...new Set([...current, ...purchasedIds])]);
    setBalance(Number(result.balance));
    setShopError('');
    return result;
  }, []);

  const login = useCallback((nextUser, token, remember = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    setAuthToken(token);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.guiYeuCauDangXuat();
    } catch (_) {
      // Đăng xuất local vẫn phải thành công khi backend không phản hồi.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
      setAuthToken('');
    }
  }, []);

  const value = useMemo(
    () => ({
      user, authToken, login, updateUser, logout,
      cart, wishlist, owned, balance, shopError, refreshShop,
      addToCart, addManyToCart, removeFromCart, toggleWishlist, checkout,
    }),
    [user, authToken, login, updateUser, logout, cart, wishlist, owned, balance, shopError, refreshShop, addToCart, addManyToCart, removeFromCart, toggleWishlist, checkout],
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
