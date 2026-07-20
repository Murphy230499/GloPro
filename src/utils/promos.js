const staticPromos = [
  { id: 'promo_1', name: 'Khuyến mãi hè - Giảm 20% Dịch vụ', type: 'service', valueType: 'percent', value: 20 },
  { id: 'promo_2', name: 'Combo Đón Thu - Giảm 50.000đ Sản phẩm', type: 'product', valueType: 'fixed', value: 50000 },
  { id: 'promo_3', name: 'Tri ân VIP - Giảm 10% Hóa đơn', type: 'invoice', valueType: 'percent', value: 10 },
];

export const PROMOTIONS = [...staticPromos];

export const reloadPromotions = () => {
  if (typeof window === 'undefined') return;
  try {
    const local = localStorage.getItem('glopro_promotions');
    const parsed = local ? JSON.parse(local) : [];
    PROMOTIONS.length = 0;
    PROMOTIONS.push(...staticPromos, ...parsed);
  } catch (e) {
    console.error('Error reloading promotions:', e);
  }
};

const staticVouchers = [
  { code: 'GIAM20K', name: 'Voucher giảm 20.000đ dịch vụ', type: 'service', valueType: 'fixed', value: 20000, quantity: 9999, expiryDate: '2030-12-31' },
  { code: 'GIAM10PCT', name: 'Voucher giảm 10% tổng đơn', type: 'invoice', valueType: 'percent', value: 10, quantity: 9999, expiryDate: '2030-12-31' },
  { code: 'SP30K', name: 'Voucher giảm 30.000đ sản phẩm', type: 'product', valueType: 'fixed', value: 30000, quantity: 9999, expiryDate: '2030-12-31' },
];

export const VOUCHERS = [...staticVouchers];

export const reloadVouchers = () => {
  if (typeof window === 'undefined') return;
  try {
    const local = localStorage.getItem('glopro_vouchers');
    const parsed = local ? JSON.parse(local) : [];
    VOUCHERS.length = 0;
    VOUCHERS.push(...staticVouchers, ...parsed);
  } catch (e) {
    console.error('Error reloading vouchers:', e);
  }
};

// Load initially
reloadPromotions();
reloadVouchers();

export const applyDiscountsToCart = (currentCart, promo, voucher) => {
  return currentCart.map((x) => {
    const origPrice = x.originalPrice || x.price || 0;
    let discountVal = 0;
    let discountLabel = '';

    if (x.type === 'service') {
      if (promo && promo.type === 'service') {
        const val = promo.valueType === 'percent' ? origPrice * (promo.value / 100) : promo.value;
        discountVal += val;
        discountLabel += `${promo.name} `;
      }
      if (voucher && voucher.type === 'service') {
        const val = voucher.valueType === 'percent' ? origPrice * (voucher.value / 100) : voucher.value;
        discountVal += val;
        discountLabel += `${voucher.name || voucher.code} `;
      }
    } else if (x.type === 'product') {
      if (promo && promo.type === 'product') {
        const val = promo.valueType === 'percent' ? origPrice * (promo.value / 100) : promo.value;
        discountVal += val;
        discountLabel += `${promo.name} `;
      }
      if (voucher && voucher.type === 'product') {
        const val = voucher.valueType === 'percent' ? origPrice * (voucher.value / 100) : voucher.value;
        discountVal += val;
        discountLabel += `${voucher.name || voucher.code} `;
      }
    }

    return {
      ...x,
      price: Math.max(0, Math.round(origPrice - discountVal)),
      originalPrice: origPrice,
      promoLabel: discountLabel.trim() || undefined
    };
  });
};
