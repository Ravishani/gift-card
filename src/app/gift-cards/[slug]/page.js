"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconGift,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
  IconShoppingCart,
  IconTag,
  IconTruck,
  IconX,
} from "@tabler/icons-react";
import { useCart } from "../../context/CartContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const IMAGE_FALLBACK =
  "https://placehold.co/700x700/f4f7fb/0d1b2a?text=Gift+Card";
const CHECKOUT_MIN_AMOUNT = 100;

function getCoupons(product) {
  const assignments = Array.isArray(product?.assign_coupons)
    ? product.assign_coupons
    : Array.isArray(product?.assignCoupons)
      ? product.assignCoupons
      : [];

  return assignments
    .map((item) => item?.coupon ?? item)
    .filter(Boolean)
    .filter((coupon) => {
      const discount = Number(coupon?.discount ?? 0);
      return coupon?.code && Number.isFinite(discount) && discount > 0;
    });
}

function getCouponKey(coupon, index) {
  return String(
    coupon?.id ?? coupon?._id ?? coupon?.coupon_id ?? coupon?.code ?? index,
  );
}

function getDiscountType(coupon) {
  const type = String(
    coupon?.discount_type ?? coupon?.discountType ?? coupon?.type ?? "percentage",
  ).toLowerCase();

  return ["fixed", "flat", "amount", "flat_amount"].includes(type)
    ? "fixed"
    : "percentage";
}

function getDiscountForAmount(coupon, amount) {
  if (!coupon || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return 0;
  }

  const discount = Number(coupon?.discount ?? 0);
  if (!Number.isFinite(discount) || discount <= 0) return 0;

  return getDiscountType(coupon) === "fixed"
    ? Math.min(discount, Number(amount))
    : Math.min((Number(amount) * discount) / 100, Number(amount));
}

function getCouponLabel(coupon) {
  const discount = Number(coupon?.discount ?? 0);
  return getDiscountType(coupon) === "fixed"
    ? `${formatNumber(discount)} OFF`
    : `${formatNumber(discount)}% OFF`;
}

function cleanDescription(value) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatNumber(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "0";

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
}

function getProductImage(product) {
  return (
    product?.brandLogo ||
    product?.image_url ||
    product?.image ||
    product?.thumbnail ||
    IMAGE_FALLBACK
  );
}

function getProductAmounts(product, minPrice, maxPrice) {
  const possibleAmounts =
    product?.amounts ??
    product?.denominations ??
    product?.prices ??
    product?.price_options ??
    product?.amount_options;

  let amounts = [];

  if (Array.isArray(possibleAmounts)) {
    amounts = possibleAmounts
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return Number(
            item?.amount ?? item?.value ?? item?.price ?? item?.denomination ?? 0,
          );
        }
        return Number(item || 0);
      })
      .filter((amount) => Number.isFinite(amount) && amount > 0);
  }

  if (!amounts.length) {
    amounts = [minPrice, 500, 1000, 1500, 2000, 2500, 5000, 10000];
  }

  return [...new Set(amounts)]
    .filter((amount) => amount >= minPrice)
    .filter((amount) => maxPrice <= 0 || amount <= maxPrice)
    .sort((a, b) => a - b)
    .slice(0, 8);
}

function GiftCardSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-5 sm:px-5 sm:py-7">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-5 h-3.5 w-44 rounded-full bg-[var(--border)]" />
        <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)_270px]">
          <div className="h-64 rounded-2xl bg-[var(--border)]" />
          <div className="space-y-4 rounded-2xl bg-[var(--surface)] p-4 sm:p-5">
            <div className="h-4 w-28 rounded bg-[var(--border)]" />
            <div className="h-7 w-3/4 rounded bg-[var(--border)]" />
            <div className="h-3 w-full rounded bg-[var(--secondary)]" />
            <div className="h-36 rounded-xl bg-[var(--secondary)]" />
          </div>
          <div className="h-80 rounded-2xl bg-[var(--border)]" />
        </div>
      </div>
    </main>
  );
}

export default function GiftCardDetails() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, cartItems = [] } = useCart();
  const slug = params?.slug;
  const offersRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!slug) return undefined;

    const controller = new AbortController();

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");

        const response = await fetch(
          `${API_URL}/products/${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error("Gift card not found.");

        const result = await response.json();
        const product = result?.data ?? result;

        if (!product || typeof product !== "object" || Array.isArray(product)) {
          throw new Error("Gift card not found.");
        }

        setCard(product);
        setSelectedCouponId(null);
        setImageError(false);

        const minimum = Number(product?.minPrice ?? 0);
        const effectiveMinimum = Math.max(
          Number.isFinite(minimum) ? minimum : 0,
          CHECKOUT_MIN_AMOUNT,
        );
        const maximum = Number(product?.maxPrice ?? 0);

        setSelectedAmount(
          String(maximum > 0 ? Math.min(effectiveMinimum, maximum) : effectiveMinimum),
        );
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("[GiftCardDetails] Product fetch error:", err);
        setError(err?.message || "Unable to load gift card.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchProduct();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const coupons = useMemo(() => getCoupons(card), [card]);
  const currencySymbol = card?.currency?.symbol || card?.currency_symbol || "₹";
  const currencyCode =
    card?.currency?.code ||
    (typeof card?.currency === "string" ? card.currency : "") ||
    "INR";
  const productMinPrice = Number(card?.minPrice ?? 0);
  const maxPrice = Number(card?.maxPrice ?? 0);
  const minPrice = Math.max(
    Number.isFinite(productMinPrice) ? productMinPrice : 0,
    CHECKOUT_MIN_AMOUNT,
  );
  const numericAmount = Number(selectedAmount);
  const amountValid =
    selectedAmount !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount >= CHECKOUT_MIN_AMOUNT &&
    numericAmount >= minPrice &&
    (maxPrice <= 0 || numericAmount <= maxPrice);

  const presetAmounts = useMemo(
    () => getProductAmounts(card, minPrice, maxPrice),
    [card, minPrice, maxPrice],
  );

  const selectedCoupon = useMemo(() => {
    if (!selectedCouponId) return null;
    return (
      coupons.find(
        (coupon, index) => getCouponKey(coupon, index) === String(selectedCouponId),
      ) || null
    );
  }, [coupons, selectedCouponId]);

  const discountPerCard =
    selectedCoupon && amountValid
      ? getDiscountForAmount(selectedCoupon, numericAmount)
      : 0;
  const subtotal = amountValid ? numericAmount : 0;
  const totalDiscount = discountPerCard;
  const totalPrice = Math.max(subtotal - totalDiscount, 0);
  const savingsPercentage =
    subtotal > 0 ? Math.round((totalDiscount / subtotal) * 100) : 0;
  const description =
    cleanDescription(card?.description) ||
    "Give someone the freedom to choose exactly what they love with this digital gift card.";
  const imageSrc = imageError ? IMAGE_FALLBACK : getProductImage(card);
  const productName = card?.name || card?.productName || "Gift Card";

  const handleAmountChange = (event) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) setSelectedAmount(value);
  };

  const handleAmountBlur = () => {
    if (selectedAmount === "") return;

    let amount = Number(selectedAmount);
    if (!Number.isFinite(amount)) {
      setSelectedAmount(String(minPrice));
      return;
    }

    amount = Math.max(amount, minPrice);
    if (maxPrice > 0) amount = Math.min(amount, maxPrice);
    setSelectedAmount(String(amount));
  };

  const handlePresetAmount = (amount) => {
    let finalAmount = Number(amount);
    if (!Number.isFinite(finalAmount)) return;

    finalAmount = Math.max(finalAmount, minPrice);
    if (maxPrice > 0) finalAmount = Math.min(finalAmount, maxPrice);
    setSelectedAmount(String(finalAmount));
  };

  const selectCoupon = (coupon, index) => {
    setSelectedCouponId(getCouponKey(coupon, index));
  };

  const copyCoupon = async (code) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard access is not available.");
      }

      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedCode(""), 1800);
    } catch (err) {
      console.error("[GiftCardDetails] Coupon copy error:", err);
    }
  };

  const scrollOffers = (direction) => {
    offersRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  };

  const handleOfferMouseDown = (event) => {
    if (!offersRef.current || event.button !== 0) return;
    setIsDragging(true);
    offersRef.current.dataset.startX = String(event.pageX);
    offersRef.current.dataset.startScroll = String(offersRef.current.scrollLeft);
  };

  const handleOfferMouseMove = (event) => {
    if (!isDragging || !offersRef.current) return;
    const startX = Number(offersRef.current.dataset.startX);
    const startScroll = Number(offersRef.current.dataset.startScroll);
    offersRef.current.scrollLeft = startScroll - (event.pageX - startX) * 1.2;
  };

  const stopOfferDragging = () => setIsDragging(false);

  const handleOfferWheel = (event) => {
    if (
      !offersRef.current ||
      Math.abs(event.deltaY) <= Math.abs(event.deltaX)
    ) {
      return;
    }
    event.preventDefault();
    offersRef.current.scrollLeft += event.deltaY;
  };

  const buildCartItem = () => ({
    ...card,
    id: card?.id,
    product_id: card?.id,
    productId: card?.id,
    name: productName,
    title: productName,
    slug: card?.slug || slug,
    image: getProductImage(card),
    selectedPrice: numericAmount,
    amount: numericAmount,
    price: numericAmount,
    quantity: 1,
    is_gift_card: true,
    minPrice: productMinPrice,
    maxPrice,
    coupons,
    assign_coupons: card?.assign_coupons || [],
    assignCoupons: card?.assignCoupons || [],
    appliedCoupon: selectedCoupon || null,
    couponCode: selectedCoupon?.code || null,
    discount: selectedCoupon ? Number(selectedCoupon?.discount ?? 0) : 0,
    discountType: selectedCoupon ? getDiscountType(selectedCoupon) : null,
    discountAmount: discountPerCard,
    totalDiscount,
    finalPricePerCard: Math.max(numericAmount - discountPerCard, 0),
    finalPrice: totalPrice,
    totalPrice,
    recipient_name: "",
    recipient_email: "",
    gift_message: "",
  });

  const handleAddToCart = () => {
    if (!card || !amountValid) return;
    addToCart(buildCartItem(), numericAmount, 1);
  };

  const handleBuyNow = () => {
    if (!card || !amountValid) return;
    addToCart(buildCartItem(), numericAmount, 1);
    router.push("/checkout");
  };

  const alreadyInCart = Boolean(card?.id) && cartItems.some(
    (item) =>
      String(item?.id) === String(card.id) ||
      String(item?.product_id) === String(card.id) ||
      (card?.sku && item?.sku === card.sku),
  );

  if (loading) return <GiftCardSkeleton />;

  if (error || !card) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary)]">
            <IconInfoCircle size={25} />
          </div>
          <h1 className="mt-4 text-lg font-bold text-[var(--foreground)]">
            Gift card unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {error || "The requested gift card could not be found."}
          </p>
          <Link
            href="/gift-cards"
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--primary-dark)]"
          >
            <IconArrowLeft size={16} /> Back to Gift Cards
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-[var(--foreground)] sm:px-5 sm:py-6 lg:px-6">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px] text-[var(--muted)] sm:mb-5">
          <Link href="/" className="shrink-0 transition hover:text-[var(--primary)]">Home</Link>
          <IconChevronRight size={13} className="shrink-0 opacity-60" />
          <Link href="/gift-cards" className="shrink-0 transition hover:text-[var(--primary)]">Gift Cards</Link>
          <IconChevronRight size={13} className="shrink-0 opacity-60" />
          <span className="truncate font-semibold text-[var(--foreground)]">{productName}</span>
        </nav>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/gift-cards"
              aria-label="Back to gift cards"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <IconArrowLeft size={17} />
            </Link>
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[var(--primary)]">Curated for you</p>
              <h1 className="mt-0.5 text-base font-bold tracking-tight text-[var(--foreground)] sm:text-lg">Gift card details</h1>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 sm:flex">
            <IconShieldCheck size={14} className="text-[var(--success)]" />
            <span className="text-[10px] font-semibold text-[var(--muted)]">Secure shopping experience</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_270px]">
            <section className="min-w-0 border-b border-[var(--border)] bg-[var(--surface-hover)] p-3 sm:p-4 lg:border-b-0 lg:border-r">
              <div className="relative flex min-h-[190px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:min-h-[220px] lg:min-h-[205px]">
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent-light)] opacity-80 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-[var(--secondary)] blur-2xl" />
                <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-[var(--ve-dark)] shadow-sm">
                  <IconGift size={11} className="text-[var(--primary)]" /> Digital gift card
                </span>
                <Image
                  src={imageSrc}
                  alt={productName}
                  width={280}
                  height={280}
                  className="relative z-[1] h-auto max-h-40 w-auto max-w-full object-contain sm:max-h-48"
                  onError={() => setImageError(true)}
                  unoptimized
                  priority
                />
              </div>

              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary)]"><IconBolt size={17} /></div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[var(--foreground)]">Instant delivery</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-[var(--muted)]">Delivered digitally after payment</p>
                  </div>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--success)]"><IconShieldCheck size={16} /></div>
                  <p className="mt-1.5 text-[11px] font-bold text-[var(--foreground)]">Secure</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-[var(--muted)]">Safe purchase</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary)]"><IconLock size={16} /></div>
                  <p className="mt-1.5 text-[11px] font-bold text-[var(--foreground)]">Protected</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-[var(--muted)]">Secure checkout</p>
                </div>
              </div>

              <div className="mt-2 rounded-xl bg-[var(--ve-dark)] p-3 text-white">
                <div className="flex items-center gap-2"><IconGift size={16} className="text-[var(--ve-gold2)]" /><span className="text-[11px] font-bold">The perfect gift</span></div>
                <p className="mt-1.5 text-[10px] leading-4 text-white/70">Let someone choose something they truly love.</p>
              </div>
            </section>

            <section className="min-w-0 p-4 sm:p-5 lg:p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                {card?.brandName && <span className="rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-[9px] font-bold text-[var(--ve-dark)]">{card.brandName}</span>}
                {card?.category?.name && <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[9px] font-semibold text-[var(--muted)]">{card.category.name}</span>}
              </div>

              <h2 className="mt-3 text-xl font-extrabold leading-tight tracking-tight text-[var(--foreground)] sm:text-2xl">{productName}</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--muted)] sm:text-sm sm:leading-6">{description}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-1.5"><IconBolt size={14} className="text-[var(--primary)]" /><span className="text-[10px] font-semibold">Digital delivery</span></div>
                <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-1.5"><IconLock size={13} className="text-[var(--success)]" /><span className="text-[10px] font-semibold">Secure checkout</span></div>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-light)] text-[var(--primary)]"><IconGift size={14} /></span><h3 className="text-sm font-bold text-[var(--foreground)]">Choose your amount</h3></div>
                    <p className="mt-1.5 text-[10px] leading-4 text-[var(--muted)]">Select a value or enter your own amount.</p>
                  </div>
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-1 text-[9px] font-extrabold tracking-wider text-[var(--ve-dark)]">{currencyCode}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--muted)]">
                  <span>Minimum <strong className="text-[var(--foreground)]">{currencySymbol}{formatNumber(minPrice)}</strong></span>
                  {maxPrice > 0 && <span>Maximum <strong className="text-[var(--foreground)]">{currencySymbol}{formatNumber(maxPrice)}</strong></span>}
                </div>

                {presetAmounts.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {presetAmounts.map((amount) => {
                      const isSelected = Number(selectedAmount) === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handlePresetAmount(amount)}
                          aria-pressed={isSelected}
                          className={`relative flex min-h-10 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-bold transition ${isSelected ? "border-[var(--primary)] bg-[var(--ve-dark)] text-white shadow-sm" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--accent-light)]"}`}
                        >
                          {isSelected && <IconCheck size={12} className="text-[var(--ve-gold2)]" />}
                          {currencySymbol}{formatNumber(amount)}
                        </button>
                      );
                    })}
                  </div>
                )}

                <label htmlFor="gift-card-amount" className="mt-3 block text-[11px] font-semibold text-[var(--foreground)]">Enter custom amount</label>
                <div className="mt-1.5 flex h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 transition focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--accent-light)]">
                  <span className="text-sm font-bold text-[var(--primary)]">{currencySymbol}</span>
                  <input
                    id="gift-card-amount"
                    type="text"
                    inputMode="decimal"
                    value={selectedAmount}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    aria-label="Gift card amount"
                    placeholder={`Minimum ${formatNumber(minPrice)}`}
                    className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs font-bold text-[var(--foreground)] outline-none placeholder:font-normal placeholder:text-[var(--muted)]"
                  />
                  {amountValid && <IconCheck size={16} className="shrink-0 text-[var(--success)]" />}
                </div>

                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[var(--surface-hover)] p-2.5">
                  <IconInfoCircle size={14} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                  <p className="text-[10px] leading-4 text-[var(--muted)]">
                    Minimum checkout amount: {currencySymbol}{formatNumber(CHECKOUT_MIN_AMOUNT)}.
                    {selectedAmount !== "" && !amountValid
                      ? numericAmount < CHECKOUT_MIN_AMOUNT
                        ? ` Enter at least ${currencySymbol}${formatNumber(CHECKOUT_MIN_AMOUNT)}.`
                        : numericAmount < minPrice
                          ? ` Minimum for this card is ${currencySymbol}${formatNumber(minPrice)}.`
                          : maxPrice > 0 && numericAmount > maxPrice
                            ? ` Maximum allowed is ${currencySymbol}${formatNumber(maxPrice)}.`
                            : " Enter a valid amount."
                      : ""}
                  </p>
                </div>
              </div>

              {/* <div className="mt-5 border-t border-[var(--border)] pt-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary)]"><IconTag size={17} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5"><h3 className="text-sm font-bold text-[var(--foreground)]">Available offers</h3>{coupons.length > 0 && <span className="rounded-full bg-[var(--ve-dark)] px-2 py-0.5 text-[8px] font-extrabold text-[var(--ve-gold2)]">{coupons.length} {coupons.length === 1 ? "OFFER" : "OFFERS"}</span>}</div>
                      <p className="mt-0.5 text-[10px] text-[var(--muted)]">Apply an offer and save.</p>
                    </div>
                  </div>
                  {selectedCoupon && <button type="button" onClick={() => setSelectedCouponId(null)} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"><IconX size={13} /> Remove</button>}
                </div>

                {coupons.length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-hover)] p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--muted)]"><IconTag size={16} /></div>
                    <div><p className="text-xs font-bold text-[var(--foreground)]">No offers available</p><p className="mt-0.5 text-[10px] leading-4 text-[var(--muted)]">Check back later for exclusive savings.</p></div>
                  </div>
                ) : (
                  <div className="relative min-w-0">
                    <button type="button" onClick={() => scrollOffers(-1)} aria-label="Previous offers" className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><IconArrowLeft size={14} /></button>
                    <div
                      ref={offersRef}
                      onMouseDown={handleOfferMouseDown}
                      onMouseMove={handleOfferMouseMove}
                      onMouseUp={stopOfferDragging}
                      onMouseLeave={stopOfferDragging}
                      onWheel={handleOfferWheel}
                      onDragStart={(event) => event.preventDefault()}
                      className={`offers-scroll w-full overflow-x-auto overflow-y-hidden px-8 pb-1 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                    >
                      <div className="flex w-max gap-2.5">
                        {coupons.map((coupon, index) => {
                          const couponKey = getCouponKey(coupon, index);
                          const isSelected = String(selectedCouponId) === String(couponKey);
                          const discountValue = amountValid
                            ? getDiscountForAmount(coupon, numericAmount)
                            : Number(coupon?.discount ?? 0);

                          return (
                            <article key={couponKey} className={`w-[205px] shrink-0 overflow-hidden rounded-xl border bg-[var(--surface)] transition ${isSelected ? "border-[var(--primary)] shadow-[0_5px_14px_rgba(13,27,42,0.08)]" : "border-[var(--border)] hover:border-[var(--primary-light)]"}`}>
                              <div className="flex min-h-[90px]">
                                <button
                                  type="button"
                                  onClick={() => selectCoupon(coupon, index)}
                                  aria-label={`Select ${coupon.code} offer`}
                                  className={`flex w-[66px] shrink-0 flex-col items-center justify-center gap-1.5 p-1.5 transition ${isSelected ? "bg-[var(--ve-dark)] text-white" : "bg-[var(--accent-light)] text-[var(--ve-dark)]"}`}
                                >
                                  <IconTag size={17} className={isSelected ? "text-[var(--ve-gold2)]" : "text-[var(--primary)]"} />
                                  <span className="text-center text-[10px] font-extrabold leading-3.5">{getCouponLabel(coupon)}</span>
                                  {isSelected && <span className="rounded-full bg-[var(--ve-gold)] px-1.5 py-0.5 text-[7px] font-extrabold uppercase text-[var(--ve-dark)]">Applied</span>}
                                </button>
                                <div className="flex min-w-0 flex-1 flex-col p-2.5">
                                  <div className="flex min-w-0 items-center gap-1"><span className="truncate font-mono text-[10px] font-extrabold uppercase tracking-wide text-[var(--foreground)]">{coupon.code}</span>{isSelected && <IconCheck size={13} className="shrink-0 text-[var(--success)]" />}</div>
                                  <p className="mt-1.5 text-[10px] leading-4 text-[var(--muted)]">{amountValid ? `Save ${currencySymbol}${formatNumber(discountValue)}` : "Exclusive offer available"}</p>
                                  <div className="mt-auto flex items-center gap-1.5 pt-2">
                                    <button type="button" onClick={() => copyCoupon(coupon.code)} className="inline-flex min-h-7 items-center justify-center gap-1 rounded-md border border-[var(--border)] px-1.5 text-[9px] font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"><IconCopy size={11} />{copiedCode === coupon.code ? "Copied" : "Copy"}</button>
                                    <button type="button" onClick={() => selectCoupon(coupon, index)} className={`inline-flex min-h-7 flex-1 items-center justify-center rounded-md px-1.5 text-[9px] font-bold transition ${isSelected ? "bg-[var(--accent-light)] text-[var(--ve-dark)]" : "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"}`}>{isSelected ? "Applied" : "Apply"}</button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                    <button type="button" onClick={() => scrollOffers(1)} aria-label="Next offers" className="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><IconChevronRight size={14} /></button>
                  </div>
                )}

                {selectedCoupon && <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"><div className="flex min-w-0 items-center gap-1.5"><IconCheck size={14} className="shrink-0 text-emerald-700" stroke={3} /><p className="truncate text-[10px] font-semibold text-emerald-800">{selectedCoupon.code} applied successfully</p></div><span className="shrink-0 text-xs font-extrabold text-emerald-800">−{currencySymbol}{formatNumber(discountPerCard)}</span></div>}
              </div> */}
            </section>

            <aside className="min-w-0 border-t border-[var(--border)] bg-[var(--surface-hover)] p-3.5 sm:p-4 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ve-dark)] text-[var(--ve-gold2)]"><IconShoppingCart size={17} /></div>
                  <div><h3 className="text-sm font-bold text-[var(--foreground)]">Order summary</h3><p className="mt-0.5 text-[10px] text-[var(--muted)]">Your selected gift card</p></div>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-[var(--ve-dark)]">1 item</span>
              </div>

              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] p-1"><Image src={imageSrc} alt={productName} width={48} height={48} className="h-full w-full object-contain" unoptimized /></div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold leading-4.5 text-[var(--foreground)]">{productName}</p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">Digital gift card</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[var(--accent-light)] px-1.5 py-1 text-[9px] font-bold text-[var(--ve-dark)]"><IconGift size={11} /> Quantity: 1</div>
                  </div>
                </div>

                <div className="my-3 border-t border-dashed border-[var(--border)]" />
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]"><span className="text-[var(--muted)]">Gift card value</span><span className="font-semibold text-[var(--foreground)]">{currencySymbol}{formatNumber(subtotal)}</span></div>
                  {selectedCoupon && <div className="flex items-center justify-between gap-2 text-[11px]"><span className="text-[var(--success)]">Offer discount</span><span className="font-bold text-[var(--success)]">−{currencySymbol}{formatNumber(totalDiscount)}</span></div>}
                  <div className="border-t border-[var(--border)]" />
                  <div className="flex items-end justify-between gap-2 pt-0.5">
                    <div><p className="text-[11px] font-semibold text-[var(--muted)]">Total payable</p>{savingsPercentage > 0 && <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-1 text-[9px] font-bold text-emerald-700"><IconCheck size={11} /> Save {savingsPercentage}%</span>}</div>
                    <p className="text-xl font-extrabold tracking-tight text-[var(--foreground)]"><span className="mr-0.5 text-xs font-bold text-[var(--primary)]">{currencySymbol}</span>{formatNumber(totalPrice)}</p>
                  </div>
                </div>
              </div>

              {selectedCoupon ? (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2"><IconCheck size={13} className="shrink-0 text-emerald-700" stroke={3} /><span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-emerald-800">{selectedCoupon.code} applied</span><span className="shrink-0 text-[10px] font-bold text-emerald-800">−{currencySymbol}{formatNumber(totalDiscount)}</span></div>
              ) : (
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"><IconTag size={14} className="mt-0.5 shrink-0 text-[var(--primary)]" /><p className="text-[10px] leading-4 text-[var(--muted)]">Apply an available offer to save on your purchase.</p></div>
              )}

              {!amountValid && <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5"><IconInfoCircle size={14} className="mt-0.5 shrink-0 text-red-600" /><p className="text-[10px] leading-4 text-red-700">{selectedAmount === "" ? "Enter a gift card amount to continue." : numericAmount < CHECKOUT_MIN_AMOUNT ? `Enter at least ${currencySymbol}${formatNumber(CHECKOUT_MIN_AMOUNT)} to continue.` : numericAmount < minPrice ? `Minimum amount is ${currencySymbol}${formatNumber(minPrice)}.` : maxPrice > 0 && numericAmount > maxPrice ? `Maximum amount is ${currencySymbol}${formatNumber(maxPrice)}.` : "Please enter a valid amount."}</p></div>}

              <div className="mt-3 space-y-2">
                <button type="button" onClick={handleBuyNow} disabled={!amountValid} className="group flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2.5 text-xs font-bold text-[var(--button-text)] shadow-sm transition hover:bg-[var(--primary-dark)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"><IconBolt size={16} /> Buy Now <IconChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" /></button>
                <button type="button" onClick={handleAddToCart} disabled={!amountValid} className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--accent-light)] disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] disabled:text-[var(--muted)]">{alreadyInCart ? <IconCheck size={15} /> : <IconShoppingCart size={15} />}{alreadyInCart ? "Add Another to Cart" : "Add to Cart"}</button>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-medium text-[var(--muted)]"><IconLock size={12} className="text-[var(--success)]" /> Secure checkout · Digital delivery</div>
              <div className="mt-3 border-t border-[var(--border)] pt-3"><div className="flex items-start gap-1.5"><IconInfoCircle size={13} className="mt-0.5 shrink-0 text-[var(--primary)]" /><p className="text-[9px] leading-4 text-[var(--muted)]">Your final payable amount reflects the selected gift card value and applied offer.</p></div></div>
            </aside>
          </div>

          <div className="grid border-t border-[var(--border)] bg-[var(--surface)] sm:grid-cols-3">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-3 sm:border-b-0 sm:border-r sm:px-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary)]"><IconBolt size={16} /></div><div><p className="text-[11px] font-bold text-[var(--foreground)]">Instant delivery</p><p className="mt-0.5 text-[9px] text-[var(--muted)]">Delivered digitally</p></div></div>
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-3 sm:border-b-0 sm:border-r sm:px-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[var(--success)]"><IconShieldCheck size={16} /></div><div><p className="text-[11px] font-bold text-[var(--foreground)]">Secure payment</p><p className="mt-0.5 text-[9px] text-[var(--muted)]">Protected checkout</p></div></div>
            <div className="flex items-center gap-2.5 px-3 py-3 sm:px-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary)]"><IconTruck size={16} /></div><div><p className="text-[11px] font-bold text-[var(--foreground)]">Digital fulfilment</p><p className="mt-0.5 text-[9px] text-[var(--muted)]">No physical delivery</p></div></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .offers-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--primary-light) transparent;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          touch-action: pan-x pan-y;
        }

        .offers-scroll::-webkit-scrollbar {
          height: 4px;
        }

        .offers-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .offers-scroll::-webkit-scrollbar-thumb {
          background: var(--primary-light);
          border-radius: 999px;
        }

        .offers-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }

        @media (max-width: 640px) {
          .offers-scroll {
            scrollbar-width: none;
          }

          .offers-scroll::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
