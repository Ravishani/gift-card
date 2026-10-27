'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconArrowRight,
  IconCheck,
  IconGift,
  IconShoppingCartPlus,
  IconSparkles,
  IconTag,
} from '@tabler/icons-react';
import { useCart } from '../context/CartContext';

function normalizeAmount(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'object') {
    return 0;
  }

  const amount = Number(String(value).replace(/[^0-9.-]/g, ''));

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Number(amount.toFixed(2));
}

function formatPrice(value, symbol = '₹') {
  const amount = normalizeAmount(value);

  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getProductId(card) {
  return (
    card?.id ??
    card?.product_id ??
    card?.productId ??
    card?.sku ??
    card?.url ??
    card?.slug
  );
}

function getProductSku(card) {
  return card?.sku ?? card?.product_sku ?? card?.productSku ?? null;
}

function getProductUrl(card) {
  if (card?.url) {
    return `/gift-cards/${card.url}`;
  }

  return `/gift-cards/${card?.sku || card?.id}`;
}

function getProductImage(card) {
  const image =
    card?.upload_image ||
    card?.image ||
    card?.image_url ||
    card?.brandLogo ||
    card?.brand_logo ||
    null;

  if (!image || typeof image !== 'string') {
    return null;
  }

  const cleanImage = image.trim();

  if (!cleanImage) {
    return null;
  }

  if (
    cleanImage.startsWith('http://') ||
    cleanImage.startsWith('https://') ||
    cleanImage.startsWith('data:')
  ) {
    return cleanImage;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const baseUrl = apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

  return `${baseUrl}/${cleanImage.replace(/^\/+/, '')}`;
}

function getCouponInfo(card) {
  const assignedCoupons = Array.isArray(card?.assign_coupons)
    ? card.assign_coupons
    : [];

  const coupons = assignedCoupons
    .map((assignment) => {
      if (!assignment?.coupon) {
        return null;
      }

      return {
        ...assignment.coupon,
        assignment_id: assignment?.id ?? null,
        product_id: assignment?.product_id ?? card?.id ?? null,
        coupon_id: assignment?.coupon_id ?? assignment?.coupon?.id ?? null,
      };
    })
    .filter(Boolean);

  if (!coupons.length) {
    return {
      coupons: [],
      bestCoupon: null,
      discount: 0,
      discountType: null,
    };
  }

  const percentageCoupons = coupons.filter(
    (coupon) =>
      coupon?.discount_type === 'percentage' ||
      coupon?.discount_type === 'percent'
  );

  const fixedCoupons = coupons.filter(
    (coupon) => coupon?.discount_type === 'fixed'
  );

  const bestPercentage = percentageCoupons.reduce(
    (best, coupon) => Math.max(best, Number(coupon?.discount || 0)),
    0
  );

  const bestFixed = fixedCoupons.reduce(
    (best, coupon) => Math.max(best, Number(coupon?.discount || 0)),
    0
  );

  let bestCoupon = null;
  let discount = 0;
  let discountType = null;

  if (bestPercentage > 0) {
    bestCoupon =
      percentageCoupons.find(
        (coupon) => Number(coupon?.discount || 0) === bestPercentage
      ) || null;

    discount = bestPercentage;
    discountType = 'percentage';
  } else if (bestFixed > 0) {
    bestCoupon =
      fixedCoupons.find(
        (coupon) => Number(coupon?.discount || 0) === bestFixed
      ) || null;

    discount = bestFixed;
    discountType = 'fixed';
  }

  return {
    coupons,
    bestCoupon,
    discount,
    discountType,
  };
}

function GiftCard({ card, index, visible }) {
  const { addToCart, cartItems = [] } = useCart();

  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { coupons, bestCoupon, discount, discountType } = getCouponInfo(card);

  const productImage = getProductImage(card);

  const symbol =
    typeof card?.currency?.symbol === 'string' ? card.currency.symbol : '₹';

  const currencyCode =
    card?.currency?.code || card?.currency_code || card?.currencyCode || 'INR';

  const minPrice = normalizeAmount(
    card?.minPrice ??
    card?.min_price ??
    card?.minimum_amount ??
    card?.min_amount ??
    0
  );

  const maxPrice = normalizeAmount(
    card?.maxPrice ??
    card?.max_price ??
    card?.maximum_amount ??
    card?.max_amount ??
    0
  );

  const productId = getProductId(card);
  const productSku = getProductSku(card);
  const productUrl = getProductUrl(card);

  const currentCartItem = cartItems.find((item) => {
    const itemId = getProductId(item);
    const itemSku = getProductSku(item);

    if (productId && itemId && String(itemId) === String(productId)) {
      return true;
    }

    return Boolean(
      productSku && itemSku && String(itemSku) === String(productSku)
    );
  });

  const alreadyInCart = Boolean(currentCartItem);

  const currentQuantity = Math.max(1, Number(currentCartItem?.quantity || 1));

  const hasDiscount = Number(discount) > 0;

  const discountText =
    discountType === 'percentage'
      ? `${discount}% OFF`
      : `${formatPrice(discount, symbol)} OFF`;

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (adding) {
      return;
    }

    const selectedAmount = normalizeAmount(minPrice);

    if (!productId && !productSku) {
      console.error('Product ID and SKU are missing', card);
      return;
    }

    if (!Number.isFinite(selectedAmount) || selectedAmount <= 0) {
      console.error('Invalid gift card amount', {
        selectedAmount,
        minPrice,
        maxPrice,
      });

      return;
    }

    const cartProduct = {
      ...card,
      id: card?.id ?? card?.product_id ?? card?.productId ?? productSku,
      product_id: card?.product_id ?? card?.id ?? card?.productId ?? productSku,
      productId: card?.productId ?? card?.id ?? card?.product_id ?? productSku,
      sku: productSku,
      name: card?.name || card?.title || 'Gift Card',
      title: card?.title || card?.name || 'Gift Card',
      upload_image: card?.upload_image || productImage || null,
      image: productImage || card?.image || null,
      image_url: productImage || card?.image_url || null,
      brandLogo: productImage || card?.brandLogo || null,
      amount: selectedAmount,
      price: selectedAmount,
      selectedPrice: selectedAmount,
      selectedAmount,
      denomination: selectedAmount,
      selected_amount: selectedAmount,
      currency: card?.currency || {
        code: currencyCode,
        symbol,
      },
      currency_code: currencyCode,
      currencyCode,
      coupons,
      assign_coupons: Array.isArray(card?.assign_coupons)
        ? card.assign_coupons
        : [],
      appliedCoupon: null,
      coupon: null,
      discount: 0,
      discountType: null,
    };

    try {
      setAdding(true);

      const result = await addToCart(cartProduct, selectedAmount, 1);

      if (result === false) {
        return;
      }

      setAdded(true);

      setTimeout(() => {
        setAdded(false);
      }, 1800);
    } catch (error) {
      console.error('Unable to add gift card to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#e9e1d0] bg-white shadow-[0_4px_18px_rgba(38,34,24,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a85f] hover:shadow-[0_16px_36px_rgba(38,34,24,0.11)] ${visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}
      style={{
        transitionDelay: `${Math.min(index * 55, 350)}ms`,
      }}
    >
      <Link
        href={productUrl}
        className="relative hidden overflow-hidden md:block"
        aria-label={`View ${card?.name || card?.title || 'gift card'}`}
      >
        <div className="relative flex h-[155px] items-center justify-center overflow-hidden bg-[#f8f6f0] sm:h-[165px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(216,190,130,0.25),transparent_68%)]" />

          <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full border border-[#e9dfc8]/70" />
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full border border-[#e9dfc8]/70" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full border border-[#e9dfc8]/70" />

          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e9dfcf] bg-white/90 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#78643b] shadow-sm backdrop-blur-sm">
              <IconSparkles size={12} stroke={1.8} />
              Gift Collection
            </span>
          </div>

          {hasDiscount && (
            <div className="absolute right-3 top-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#28251f] px-2.5 py-1.5 text-[9px] font-bold text-[#f5dfaa] shadow-sm">
                <IconTag size={11} stroke={2} />
                {discountText}
              </span>
            </div>
          )}

          {productImage && !imageError ? (
            <img
              src={productImage}
              alt={card?.name || card?.title || 'Gift Card'}
              loading={index < 4 ? 'eager' : 'lazy'}
              decoding="async"
              onError={() => setImageError(true)}
              className="relative z-[1] h-full w-full object-contain p-7 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="relative z-[1] flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-[#e6d8b7] bg-white text-[#a48648] shadow-[0_8px_24px_rgba(60,48,25,0.08)]">
              <IconGift size={32} stroke={1.4} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#e8dfcd]/45 to-transparent" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-[#a18448]">
            {card?.category_name || card?.category?.name || 'Gift Card'}
          </span>

          {hasDiscount && (
            <span className="shrink-0 rounded-md border border-[#efe2bf] bg-[#fbf6e8] px-2 py-1 text-[8px] font-bold text-[#8a6a2c]">
              Special Offer
            </span>
          )}
        </div>

        <Link href={productUrl}>
          <h3 className="line-clamp-2 min-h-[42px] text-[14px] font-bold leading-[1.55] tracking-[-0.02em] text-[#29271f] transition-colors duration-200 group-hover:text-[#927438] sm:text-[15px]">
            {card?.name || card?.title || 'Gift Card'}
          </h3>
        </Link>

        <div className="mt-3 border-t border-[#eee8dc] pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#918a7b]">
                Available Value
              </p>

              <p className="truncate text-[15px] font-extrabold tracking-[-0.035em] text-[#29271f] sm:text-[16px]">
                {formatPrice(minPrice, symbol)}

                {maxPrice > minPrice && (
                  <>
                    <span className="mx-1 text-[#c3bba9]">–</span>
                    {formatPrice(maxPrice, symbol)}
                  </>
                )}
              </p>
            </div>

            {hasDiscount && (
              <div className="shrink-0 rounded-lg bg-[#f0f7f0] px-2.5 py-1.5 text-right">
                <p className="text-[8px] font-medium text-[#63816a]">
                  You save
                </p>

                <p className="mt-0.5 text-[11px] font-extrabold text-[#267447]">
                  {discountType === 'percentage'
                    ? `${discount}%`
                    : formatPrice(discount, symbol)}
                </p>
              </div>
            )}
          </div>
        </div>

        {bestCoupon?.code && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-dashed border-[#e3d4b2] bg-[#fcfaf5] px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0e5ca] text-[#8c713b]">
              <IconTag size={15} stroke={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-[#93866b]">
                Exclusive Coupon
              </p>

              <p className="mt-0.5 truncate text-[10px] font-extrabold tracking-[0.06em] text-[#51452d]">
                {bestCoupon.code}
              </p>
            </div>

            <IconCheck
              size={15}
              stroke={2.3}
              className="shrink-0 text-[#56845c]"
            />
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            href={productUrl}
            className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e5dece] bg-white px-2 text-[10px] font-bold text-[#514b3e] transition-all duration-200 hover:border-[#c5a65e] hover:bg-[#fbf8f0] hover:text-[#8b6c2d] sm:text-[11px]"
          >
            View Details
            <IconArrowRight
              size={14}
              stroke={2}
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={minPrice <= 0 || adding}
            aria-label={alreadyInCart ? 'Add another to cart' : 'Add to cart'}
            title={alreadyInCart ? 'Add another' : 'Add to cart'}
            className={`relative flex h-10 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${added
                ? 'bg-[#267447] text-white'
                : alreadyInCart
                  ? 'bg-[#29271f] text-[#f5dfaa] hover:bg-[#403a2d]'
                  : 'bg-[#c7a65e] text-[#28251f] hover:bg-[#b49147]'
              } ${minPrice <= 0 || adding
                ? 'cursor-not-allowed opacity-50'
                : 'active:scale-95'
              }`}
          >
            {adding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            ) : added ? (
              <IconCheck size={18} stroke={2.5} />
            ) : (
              <IconShoppingCartPlus size={18} stroke={1.9} />
            )}

            {alreadyInCart && !added && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#29271f] px-1 text-[8px] font-bold text-white">
                {currentQuantity}
              </span>
            )}
          </button>
        </div>

        {added && (
          <p className="mt-2 text-center text-[9px] font-semibold text-[#267447]">
            Added to cart successfully
          </p>
        )}
      </div>
    </article>
  );
}

export default function GiftCardSections() {
  const sectionRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      const baseUrl = apiUrl.replace(/\/+$/, '');

      const response = await fetch(`${baseUrl}/products`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Products API failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result?.status) {
        throw new Error(result?.message || 'Unable to fetch products.');
      }

      setGiftCards(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      console.error('Products API Error:', err);

      setError(err?.message || 'Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main ref={sectionRef} className="bg-white">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8f6ef] via-white to-white py-12 sm:py-14 lg:py-16">
        <div className="pointer-events-none absolute -left-36 top-10 h-72 w-72 rounded-full bg-[#d4a017]/[0.07] blur-3xl" />

        <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#e8b84b]/[0.09] blur-3xl" />

        <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
          <div
            className={`mb-7 flex flex-col gap-4 transition-all duration-700 sm:mb-9 sm:flex-row sm:items-end sm:justify-between ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
          >
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="h-px w-7 bg-[#d4a017]" />

                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#987317]">
                  Popular Gift Cards
                </span>
              </div>

              <h2 className="max-w-3xl text-2xl font-black leading-tight tracking-[-0.035em] text-[#142337] sm:text-3xl lg:text-4xl">
                Give a gift they will love
                <span className="text-[#b8890e]">.</span>
              </h2>

              <p className="mt-2 max-w-xl text-xs leading-6 text-[#716d64] sm:text-sm">
                Explore favourite brands, discover exclusive offers, and find
                the perfect gift for every occasion.
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-2.5 rounded-xl border border-[#e8e0cf] bg-white/90 px-3.5 py-2.5 shadow-sm sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff5d6] text-[#9b7410]">
                <IconGift size={19} stroke={1.8} />
              </span>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#817b70]">
                  Find something special
                </p>

                <p className="mt-0.5 text-xs font-extrabold text-[#142337]">
                  The perfect gift, made easy
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-[#e8e2d5] bg-white"
                >
                  <div className="h-[142px] animate-pulse bg-[#f1ede3] sm:h-[150px]" />

                  <div className="space-y-3 p-3.5 sm:p-4">
                    <div className="h-2.5 w-16 animate-pulse rounded bg-[#eae5da]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#eae5da]" />
                    <div className="h-8 animate-pulse rounded-lg bg-[#f5f2eb]" />
                    <div className="h-9 animate-pulse rounded-lg bg-[#eae5da]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-white p-7 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <IconGift size={24} stroke={1.6} />
              </div>

              <h3 className="mt-4 text-sm font-extrabold text-[#142337]">
                Unable to load gift cards
              </h3>

              <p className="mt-2 break-words text-xs leading-5 text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchProducts}
                className="mt-4 rounded-lg bg-[#d4a017] px-5 py-2.5 text-xs font-extrabold text-[#172536] transition hover:bg-[#e8b84b]"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && giftCards.length === 0 && (
            <div className="rounded-2xl border border-[#e8e2d5] bg-white px-5 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff7df] text-[#b8890e]">
                <IconGift size={27} stroke={1.5} />
              </div>

              <h3 className="mt-4 text-base font-extrabold text-[#142337]">
                No Gift Cards Found
              </h3>

              <p className="mt-1.5 text-xs text-[#817b70]">
                No products are currently available.
              </p>
            </div>
          )}

          {!loading && !error && giftCards.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4">
                {giftCards.slice(0, 8).map((card, index) => (
                  <GiftCard
                    key={card?.id || card?.sku || card?.url || index}
                    card={card}
                    index={index}
                    visible={visible}
                  />
                ))}
              </div>

              {giftCards.length > 8 && (
                <div className="mt-8 flex justify-center sm:mt-10">
                  <Link
                    href="/gift-cards"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d9c89d] bg-white px-5 text-xs font-extrabold text-[#26364a] shadow-sm transition hover:border-[#d4a017] hover:bg-[#fffaf0] hover:text-[#8d6b13]"
                  >
                    Explore All Gift Cards
                    <IconArrowRight size={15} stroke={2.2} />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
