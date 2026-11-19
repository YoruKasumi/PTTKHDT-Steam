// Mã giảm giá mẫu (bảng COUPON: DiscountValue là số tiền cố định). Khớp gợi ý trong Figma 94:1576.
export const coupons = {
  STEAM2026: { discount: 50000 },
  VORTEX10: { discount: 10000 },
};

/** Sequence UC15: kiemTraMaGiamGia → truyVanMaGiamGia → traVeThongTinGiamGia. */
export function lookupCoupon(code) {
  const c = coupons[String(code).trim().toUpperCase()];
  return c ? { code: String(code).trim().toUpperCase(), ...c } : null;
}
