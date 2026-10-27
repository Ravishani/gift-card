'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconCreditCard,
  IconDeviceMobile,
  IconGift,
  IconLock,
  IconMinus,
  IconPlus,
  IconReceipt,
  IconShieldCheck,
  IconShoppingBag,
  IconSparkles,
  IconTag,
  IconTrash,
  IconTruckDelivery,
  IconWallet,
  IconX,
} from '@tabler/icons-react';

import { useCart } from '../context/CartContext';

const THEME = {
  primary: '#d4a017',
  primaryDark: '#b8890e',
  primaryLight: '#e8b84b',
  accentLight: '#fff5d6',
  navy: '#0d1b2a',
  navyLight: '#162032',
  background: '#f4f7fb',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#4a5568',
};

const CURRENCY_SYMBOLS = {
  INR: '₹',
  AED: 'د.إ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: '﷼',
};

let razorpayPromise = null;

function getCustomerAuth() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('customer_token');
  const storedUser = localStorage.getItem('customer_user');

  if (!token || !storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser);

    if (!user?.id) {
      return null;
    }

    return { token, user };
  } catch {
    return null;
  }
}

function numberValue(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getCurrencyCode(item) {
  return String(
    item?.currency?.code ||
    item?.currency_code ||
    item?.currencyCode ||
    (typeof item?.currency === 'string' ? item.currency : '') ||
    'INR'
  ).toUpperCase();
}

function getAmount(item) {
  const values = [
    item?.amount,
    item?.selectedAmount,
    item?.selected_amount,
    item?.price,
    item?.value,
  ];

  for (const value of values) {
    const amount = numberValue(value);

    if (amount > 0) {
      return amount;
    }
  }

  return 0;
}

function getQuantity(item) {
  return Math.max(
    1,
    Math.floor(numberValue(item?.quantity || 1))
  );
}

function getCartKey(item) {
  return String(
    item?.cart_key ||
    item?.cartKey ||
    `${item?.id || item?.product_id || item?.productId}-${getCurrencyCode(item)}`
  );
}

function getProductId(item) {
  return (
    item?.product_id ||
    item?.productId ||
    item?.product?.id ||
    item?.product?._id ||
    item?.id ||
    null
  );
}

function getProductName(item) {
  return (
    item?.name ||
    item?.title ||
    item?.product_name ||
    item?.productName ||
    item?.product?.name ||
    'Gift Card'
  );
}


function getImage(item) {
  return (
    item?.brandLogo ||
    item?.brand_logo ||
    item?.brand_logo_url ||
    item?.product?.brandLogo ||
    item?.product?.brand_logo ||
    item?.product?.image ||
    item?.product?.image_url ||
    item?.product?.logo ||
    item?.logo_url ||
    item?.logo ||
    item?.image ||
    item?.image_url ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.product_image ||
    ''
  );
}


function getCouponCode(coupon) {
  return String(
    coupon?.code ||
    coupon?.coupon_code ||
    coupon?.couponCode ||
    ''
  ).trim();
}

function getCouponName(coupon) {
  return (
    coupon?.name ||
    coupon?.title ||
    coupon?.coupon_name ||
    coupon?.couponName ||
    getCouponCode(coupon) ||
    'Special Offer'
  );
}

function getCouponType(coupon) {
  const type = String(
    coupon?.discount_type ||
    coupon?.discountType ||
    coupon?.type ||
    'fixed'
  ).toLowerCase();

  return type === 'percentage' || type === 'percent'
    ? 'percentage'
    : 'fixed';
}

function getCouponValue(coupon) {
  return Math.max(
    0,
    numberValue(
      coupon?.discount ??
      coupon?.discount_value ??
      coupon?.discountValue ??
      0
    )
  );
}

function getCouponPaymentMethod(coupon) {
  return String(
    coupon?.payment_method ||
    coupon?.paymentMethod ||
    coupon?.payment_type ||
    coupon?.paymentType ||
    'all'
  )
    .trim()
    .toLowerCase();
}

function getPaymentLabel(coupon) {
  const payment = getCouponPaymentMethod(coupon);

  if (payment === 'upi') return 'UPI Only';
  if (payment === 'card') return 'Card Only';
  if (payment === 'wallet') return 'Wallet Only';

  return 'All Payments';
}

function isFirstUserCoupon(coupon) {
  const value =
    coupon?.first_user_only ??
    coupon?.firstUserOnly ??
    coupon?.first_user ??
    coupon?.firstUser ??
    false;

  return (
    value === true ||
    value === 1 ||
    String(value) === '1' ||
    String(value).toLowerCase() === 'true'
  );
}

function normalizePaymentMethod(value) {
  const method = String(value || '').trim().toLowerCase();

  return ['upi', 'card', 'wallet'].includes(method)
    ? method
    : method;
}

function couponMatchesPayment(coupon, paymentMethod) {
  const couponPayment = normalizePaymentMethod(
    getCouponPaymentMethod(coupon)
  );

  const selectedPayment = normalizePaymentMethod(paymentMethod);

  return (
    couponPayment === 'all' ||
    couponPayment === '' ||
    couponPayment === selectedPayment
  );
}

function getCouponProductIds(coupon) {
  const values = [];

  const addValue = (value) => {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(addValue);
      return;
    }

    if (typeof value === 'object') {
      addValue(
        value?.id ||
        value?._id ||
        value?.product_id ||
        value?.productId
      );

      return;
    }

    const stringValue = String(value).trim();

    if (stringValue) {
      values.push(stringValue);
    }
  };

  addValue(coupon?.product_id);
  addValue(coupon?.productId);
  addValue(coupon?.product_ids);
  addValue(coupon?.productIds);
  addValue(coupon?.products);
  addValue(coupon?.assigned_products);
  addValue(coupon?.assignedProducts);

  return [...new Set(values)];
}

function couponAppliesToProduct(coupon, item) {
  const productIds = getCouponProductIds(coupon);

  if (!productIds.length) {
    return true;
  }

  const productId = getProductId(item);

  if (!productId) {
    return false;
  }

  return productIds.includes(String(productId));
}

function buildAvailableCoupons(cartItems = [], contextCoupons = []) {
  const couponMap = new Map();

  const addCoupon = (coupon, productId = null) => {
    if (!coupon || typeof coupon !== 'object') {
      return;
    }

    const code = getCouponCode(coupon).trim().toUpperCase();

    if (!code) {
      return;
    }

    const existing = couponMap.get(code) || {};

    const productIds = [
      ...getCouponProductIds(existing),
      ...getCouponProductIds(coupon),
      ...(productId ? [productId] : []),
    ]
      .filter(Boolean)
      .map(String);

    couponMap.set(code, {
      ...existing,
      ...coupon,
      product_ids: [...new Set(productIds)],
    });
  };

  if (Array.isArray(contextCoupons)) {
    contextCoupons.forEach((coupon) => addCoupon(coupon));
  }

  cartItems.forEach((item) => {
    const productId = getProductId(item);

    [
      item?.coupons,
      item?.assign_coupons,
      item?.assigned_coupons,
    ].forEach((coupons) => {
      if (Array.isArray(coupons)) {
        coupons.forEach((coupon) => addCoupon(coupon, productId));
      }
    });
  });

  return Array.from(couponMap.values());
}

function calculateCoupon(coupon, items) {
  if (!coupon || !items.length) {
    return {
      totalDiscount: 0,
      itemDiscounts: {},
      type: null,
      description: '',
      eligibleItems: [],
    };
  }

  const type = getCouponType(coupon);
  const value = getCouponValue(coupon);

  if (value <= 0) {
    return {
      totalDiscount: 0,
      itemDiscounts: {},
      type,
      description: '',
      eligibleItems: [],
    };
  }

  const eligibleItems = items.filter((item) =>
    couponAppliesToProduct(coupon, item)
  );

  if (!eligibleItems.length) {
    return {
      totalDiscount: 0,
      itemDiscounts: {},
      type,
      description: 'Coupon is not applicable to this cart',
      eligibleItems: [],
    };
  }

  const productAssigned = getCouponProductIds(coupon).length > 0;

  if (type === 'fixed') {
    const eligibleSubtotal = eligibleItems.reduce(
      (sum, item) =>
        sum + getAmount(item) * getQuantity(item),
      0
    );

    const discount = Math.min(value, eligibleSubtotal);

    return {
      totalDiscount: Number(discount.toFixed(2)),
      itemDiscounts: {},
      type: 'fixed',
      description: productAssigned
        ? 'Applied once to eligible product(s)'
        : 'Applied once to the complete order',
      eligibleItems,
    };
  }

  const itemDiscounts = {};
  let totalDiscount = 0;

  eligibleItems.forEach((item) => {
    const subtotal = getAmount(item) * getQuantity(item);

    if (subtotal <= 0) {
      return;
    }

    const discount = Math.min(
      subtotal,
      (subtotal * value) / 100
    );

    const roundedDiscount = Number(discount.toFixed(2));

    itemDiscounts[getCartKey(item)] = roundedDiscount;
    totalDiscount += roundedDiscount;
  });

  return {
    totalDiscount: Number(totalDiscount.toFixed(2)),
    itemDiscounts,
    type: 'percentage',
    description: productAssigned
      ? 'Applied product-wise to eligible product(s)'
      : 'Applied product-wise',
    eligibleItems,
  };
}

function formatPrice(value, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${CURRENCY_SYMBOLS[currency] || currency}${Number(
      value || 0
    ).toFixed(2)}`;
  }
}

function loadRazorpay() {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('Razorpay can only be loaded in the browser.')
    );
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = new Promise((resolve, reject) => {
    const scriptUrl =
      'https://checkout.razorpay.com/v1/checkout.js';

    const existingScript = document.querySelector(
      `script[src="${scriptUrl}"]`
    );

    if (existingScript) {
      const checkRazorpay = () => {
        if (window.Razorpay) {
          resolve(window.Razorpay);
        } else {
          reject(
            new Error(
              'Razorpay SDK loaded but Razorpay Checkout is unavailable.'
            )
          );
        }
      };

      existingScript.addEventListener('load', checkRazorpay, {
        once: true,
      });

      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Razorpay SDK.')),
        { once: true }
      );

      setTimeout(() => {
        if (window.Razorpay) {
          resolve(window.Razorpay);
        }
      }, 100);

      return;
    }

    const script = document.createElement('script');

    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(
          new Error(
            'Razorpay SDK loaded but Razorpay Checkout is unavailable.'
          )
        );
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Razorpay SDK.'));
    };

    document.body.appendChild(script);
  }).catch((error) => {
    razorpayPromise = null;
    throw error;
  });

  return razorpayPromise;
}

function SectionHeader({ icon, title, description, badge }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff5d6] text-[#b8890e]">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black tracking-tight text-[#0d1b2a] sm:text-lg">
              {title}
            </h2>

            {badge && (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-600">
                {badge}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-0.5 text-[11px] font-medium leading-5 text-slate-500 sm:text-xs">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductImage({ item }) {
  const [failed, setFailed] = useState(false);
  const image = getImage(item);

  if (!image || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fff5d6] to-[#f4f7fb] text-[#b8890e]">
        <IconGift size={28} stroke={1.7} />
      </div>
    );
  }

  return (
    <Image
      src={image}
      alt={getProductName(item)}
      fill
      sizes="90px"
      className="object-contain p-2"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function AmountInput({ item, onUpdateAmount }) {
  const [value, setValue] = useState(
    String(item?.amount ?? '')
  );

  useEffect(() => {
    setValue(String(item?.amount ?? ''));
  }, [item?.amount]);

  const save = () => {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) {
      setValue(String(item?.amount ?? ''));
      return;
    }

    onUpdateAmount(item, amount);
  };

  const currency = getCurrencyCode(item);

  return (
    <div className="relative w-full sm:w-32">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400">
        {CURRENCY_SYMBOLS[currency] || currency}
      </span>

      <input
        type="number"
        min="1"
        step="0.01"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs font-black text-[#0d1b2a] outline-none transition focus:border-[#d4a017] focus:bg-white focus:ring-4 focus:ring-[#fff5d6]"
      />
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  description,
  badge,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative rounded-xl border p-3 text-left transition-all ${active
        ? 'border-[#d4a017] bg-[#fff9e8] shadow-sm ring-2 ring-[#f5e7bc]'
        : 'border-slate-200 bg-white hover:border-[#e8b84b] hover:bg-[#fffdf7]'
        }`}
    >
      {active && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#b8890e] text-white">
          <IconCheck size={12} stroke={3} />
        </span>
      )}

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${active
          ? 'bg-[#d4a017] text-[#0d1b2a]'
          : 'bg-[#fff5d6] text-[#b8890e]'
          }`}
      >
        {icon}
      </div>

      <div className="mt-2.5 pr-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-xs font-black text-[#0d1b2a]">
            {title}
          </p>

          {badge && (
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-600">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-[9px] font-semibold leading-4 text-slate-400">
          {description}
        </p>
      </div>
    </button>
  );
}

export default function CheckoutPage() {
  const {
    cartItems = [],
    coupon,
    setCoupon,
    paymentMethod,
    setPaymentMethod,
    availableCoupons = [],
    updateAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCouponCode: contextGetCouponCode,
    getCouponName: contextGetCouponName,
    hydrated,
  } = useCart();

  const placeOrderRef = useRef(null);

  const couponCode = contextGetCouponCode || getCouponCode;
  const couponName = contextGetCouponName || getCouponName;

  const [customerUser, setCustomerUser] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [couponSearch, setCouponSearch] = useState('');

  useEffect(() => {
    loadRazorpay().catch((error) => {
      console.error('RAZORPAY SDK LOAD ERROR:', error);
    });
  }, []);

  useEffect(() => {
    const auth = getCustomerAuth();

    if (auth?.user?.id) {
      setCustomerUser(auth.user);
    }
  }, []);

  const checkoutItems = useMemo(
    () =>
      cartItems.filter(
        (item) => getAmount(item) > 0 && getQuantity(item) > 0
      ),
    [cartItems]
  );

  const availableCouponsFromCart = useMemo(
    () => buildAvailableCoupons(checkoutItems, availableCoupons),
    [checkoutItems, availableCoupons]
  );

  const currencyCode = useMemo(() => {
    if (!checkoutItems.length) {
      return 'INR';
    }

    return getCurrencyCode(checkoutItems[0]);
  }, [checkoutItems]);

  const hasMixedCurrencies = useMemo(
    () =>
      checkoutItems.some(
        (item) => getCurrencyCode(item) !== currencyCode
      ),
    [checkoutItems, currencyCode]
  );

  const totalQuantity = useMemo(
    () =>
      checkoutItems.reduce(
        (count, item) => count + getQuantity(item),
        0
      ),
    [checkoutItems]
  );

  const checkoutSubtotal = useMemo(() => {
    const value = checkoutItems.reduce(
      (sum, item) => sum + getAmount(item) * getQuantity(item),
      0
    );

    return Number(value.toFixed(2));
  }, [checkoutItems]);

  const calculatedCoupon = useMemo(
    () => calculateCoupon(coupon, checkoutItems),
    [coupon, checkoutItems]
  );

  const checkoutDiscount = calculatedCoupon.totalDiscount;

  const checkoutTotal = Math.max(
    0,
    Number((checkoutSubtotal - checkoutDiscount).toFixed(2))
  );

  const savingsPercent =
    checkoutSubtotal > 0 && checkoutDiscount > 0
      ? Math.round((checkoutDiscount / checkoutSubtotal) * 100)
      : 0;

  const filteredCoupons = useMemo(() => {
    const search = couponSearch.trim().toLowerCase();

    if (!search) {
      return availableCouponsFromCart;
    }

    return availableCouponsFromCart.filter((item) => {
      return (
        couponCode(item).toLowerCase().includes(search) ||
        couponName(item).toLowerCase().includes(search)
      );
    });
  }, [
    availableCouponsFromCart,
    couponSearch,
    couponCode,
    couponName,
  ]);

  useEffect(() => {
    if (!coupon) {
      return;
    }

    const stillExists = availableCouponsFromCart.some(
      (item) =>
        couponCode(item).toUpperCase() ===
        couponCode(coupon).toUpperCase()
    );

    if (!stillExists) {
      setCoupon(null);
      setCouponMessage(
        'The selected coupon is no longer available.'
      );
      return;
    }

    if (!couponMatchesPayment(coupon, paymentMethod)) {
      setCoupon(null);
      setCouponMessage(
        'The selected coupon is not available for this payment method.'
      );
      return;
    }

    const calculation = calculateCoupon(coupon, checkoutItems);

    if (calculation.totalDiscount <= 0) {
      setCoupon(null);
      setCouponMessage(
        'The selected coupon is not applicable to the current cart.'
      );
    }
  }, [
    coupon,
    paymentMethod,
    checkoutItems,
    availableCouponsFromCart,
    couponCode,
    setCoupon,
  ]);

  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
    setCouponMessage('');
    setOrderError('');

    if (coupon && !couponMatchesPayment(coupon, method)) {
      setCoupon(null);
      setCouponMessage(
        'The previous coupon was removed because it is not available for this payment method.'
      );
    }
  };

  const handleSelectCoupon = (selectedCoupon) => {
    if (!selectedCoupon) {
      return;
    }

    const code = couponCode(selectedCoupon);

    if (!code) {
      setOrderError('Invalid coupon.');
      return;
    }

    if (!couponMatchesPayment(selectedCoupon, paymentMethod)) {
      setOrderError(
        `This coupon is available only with ${getPaymentLabel(
          selectedCoupon
        )}.`
      );
      return;
    }

    const calculation = calculateCoupon(
      selectedCoupon,
      checkoutItems
    );

    if (calculation.totalDiscount <= 0) {
      setOrderError(
        'This coupon is not applicable to the current cart.'
      );
      return;
    }

    setCoupon(selectedCoupon);
    setCouponMessage(`Coupon ${code} applied successfully.`);
    setOrderError('');
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponMessage('Coupon removed successfully.');
    setOrderError('');
  };

  const handleUpdateAmount = (item, amount) => {
    updateAmount(item, amount);
    setCouponMessage('');
    setOrderError('');
  };

  const handleQuantityChange = (item, quantity) => {
    updateQuantity(item, quantity);
    setCouponMessage('');
    setOrderError('');
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item);
    setCouponMessage('');
    setOrderError('');
  };

  const handlePlaceOrder = async (skipLoginCheck = false) => {
    if (placingOrder) {
      return;
    }

    let auth = getCustomerAuth();

    if (!skipLoginCheck) {
      if (!auth?.user?.id) {
        setOrderError(
          'Please login before placing your order.'
        );

        window.dispatchEvent(
          new CustomEvent('open-customer-login', {
            detail: { mode: 'login' },
          })
        );

        return;
      }

      setCustomerUser(auth.user);
    }

    if (!auth?.user?.id) {
      auth = getCustomerAuth();
    }

    if (!auth?.user?.id) {
      setOrderError(
        'Please login before placing your order.'
      );

      window.dispatchEvent(
        new CustomEvent('open-customer-login', {
          detail: { mode: 'login' },
        })
      );

      return;
    }

    setCustomerUser(auth.user);

    if (!checkoutItems.length) {
      setOrderError('Your cart is empty.');
      return;
    }

    if (hasMixedCurrencies) {
      setOrderError(
        'Please use the same currency for all cart items.'
      );
      return;
    }

    if (currencyCode !== 'INR') {
      setOrderError(
        'Razorpay payment is currently available only for INR orders.'
      );
      return;
    }

    if (checkoutTotal <= 0) {
      setOrderError('Order total must be greater than zero.');
      return;
    }

    if (!paymentMethod) {
      setOrderError('Please select a payment method.');
      return;
    }

    const selectedPaymentMethod =
      normalizePaymentMethod(paymentMethod);

    const razorpayMethodConfig = {
      upi: { method: 'upi' },
      card: { method: 'card' },
      wallet: { method: 'wallet' },
    };

    const selectedRazorpayMethod =
      razorpayMethodConfig[selectedPaymentMethod] || null;

    if (!selectedRazorpayMethod) {
      setOrderError('Please select a valid payment method.');
      return;
    }

    if (
      coupon &&
      !couponMatchesPayment(coupon, paymentMethod)
    ) {
      setOrderError(
        `The selected coupon is not valid for ${paymentMethod.toUpperCase()}.`
      );
      return;
    }

    const finalCouponCalculation = calculateCoupon(
      coupon,
      checkoutItems
    );

    if (
      coupon &&
      finalCouponCalculation.totalDiscount <= 0
    ) {
      setOrderError(
        'The selected coupon is no longer applicable to this cart.'
      );
      return;
    }

    setPlacingOrder(true);
    setOrderError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'NEXT_PUBLIC_API_URL is not configured.'
        );
      }

      const Razorpay = await loadRazorpay();

      if (!Razorpay) {
        throw new Error(
          'Razorpay Checkout is not available.'
        );
      }

      const orderItems = checkoutItems.map((item) => {
        const amount = getAmount(item);
        const quantity = getQuantity(item);
        const productId = getProductId(item);
        const cartKey = getCartKey(item);

        const originalSubtotal = Number(
          (amount * quantity).toFixed(2)
        );

        let itemDiscount = 0;

        if (finalCouponCalculation.type === 'percentage') {
          itemDiscount = Number(
            finalCouponCalculation.itemDiscounts[cartKey] || 0
          );
        }

        if (finalCouponCalculation.type === 'fixed') {
          itemDiscount = Number(
            finalCouponCalculation.itemDiscounts[cartKey] || 0
          );
        }

        const finalTotal = Math.max(
          0,
          Number((originalSubtotal - itemDiscount).toFixed(2))
        );

        return {
          cart_key: cartKey,
          product_id: productId,
          productId,
          sku:
            item?.sku ||
            item?.product_sku ||
            item?.product?.sku ||
            null,
          variant_id: item?.variant_id || item?.variantId || null,
          name: getProductName(item),
          product_name: getProductName(item),
          denomination: amount,
          amount,
          selected_amount: amount,
          quantity,
          currency: getCurrencyCode(item),
          price: amount,
          subtotal: originalSubtotal,
          discount: itemDiscount,
          total: finalTotal,
        };
      });

      const productIds = orderItems
        .map((item) => item.product_id)
        .filter(Boolean);

      const payload = {
        user_id: auth.user.id,
        customer_id: auth.user.id,
        items: orderItems,
        product_ids: productIds,
        coupon: coupon ? couponCode(coupon) : null,
        coupon_details: coupon || null,
        coupon_type: coupon ? getCouponType(coupon) : null,
        coupon_discount: checkoutDiscount,
        payment_method: selectedPaymentMethod,
        currency: currencyCode,
        subtotal: checkoutSubtotal,
        discount: checkoutDiscount,
        total: checkoutTotal,
        checkout_mode: 'cart',
      };

      console.log('CUSTOMER USER:', auth.user);
      console.log('SELECTED PAYMENT METHOD:', selectedPaymentMethod);
      console.log('AVAILABLE COUPONS:', availableCouponsFromCart);
      console.log('SELECTED COUPON:', coupon);
      console.log('COUPON CALCULATION:', finalCouponCalculation);
      console.log('ORDER PAYLOAD:', payload);

      const response = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(payload),
      });

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          'Unable to create order.'
        );
      }

      console.log('ORDER RESPONSE:', result);

      const localOrderId =
        result?.order_id ||
        result?.orderId ||
        result?.data?.order_id ||
        result?.data?.orderId ||
        null;

      const razorpayOrderId =
        result?.razorpay_order_id ||
        result?.razorpayOrderId ||
        result?.data?.razorpay_order_id ||
        result?.data?.razorpayOrderId ||
        null;

      const razorpayKey =
        result?.razorpay_key ||
        result?.razorpayKey ||
        result?.data?.razorpay_key ||
        result?.data?.razorpayKey ||
        null;

      const razorpayAmount =
        result?.razorpay_amount ||
        result?.razorpayAmount ||
        result?.amount ||
        result?.data?.razorpay_amount ||
        result?.data?.razorpayAmount ||
        result?.data?.amount ||
        Math.round(Number(checkoutTotal) * 100);

      const razorpayCurrency =
        result?.currency ||
        result?.data?.currency ||
        currencyCode ||
        'INR';

      if (!localOrderId) {
        throw new Error(
          'Order was created but order ID was not returned.'
        );
      }

      if (!razorpayOrderId) {
        throw new Error(
          'Razorpay order ID was not returned by the server.'
        );
      }

      if (!razorpayKey) {
        throw new Error(
          'Razorpay key was not returned by the server.'
        );
      }

      const paymentMethodLabels = {
        upi: 'UPI Payment',
        card: 'Card Payment',
        wallet: 'Wallet Payment',
      };

      const options = {
        key: razorpayKey,
        amount: razorpayAmount,
        currency: razorpayCurrency,
        name: 'Tranzift',
        description: `Gift Card Order ${localOrderId}`,
        order_id: razorpayOrderId,

        handler: async function (paymentResponse) {
          try {
            setPlacingOrder(true);
            setOrderError('');

            console.log(
              'RAZORPAY PAYMENT RESPONSE:',
              paymentResponse
            );

            if (!paymentResponse?.razorpay_payment_id) {
              throw new Error(
                'Razorpay payment ID was not received.'
              );
            }

            if (!paymentResponse?.razorpay_order_id) {
              throw new Error(
                'Razorpay order ID was not received.'
              );
            }

            if (!paymentResponse?.razorpay_signature) {
              throw new Error(
                'Razorpay payment signature was not received.'
              );
            }

            const verifyResponse = await fetch(
              `${apiUrl}/orders/payment-success`,
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                  order_id: localOrderId,
                  user_id: auth.user.id,
                  payment_method: selectedPaymentMethod,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            let verifyResult = null;

            try {
              verifyResult = await verifyResponse.json();
            } catch {
              verifyResult = null;
            }

            console.log(
              'PAYMENT VERIFY RESPONSE:',
              verifyResult
            );

            if (
              !verifyResponse.ok ||
              !verifyResult?.success
            ) {
              throw new Error(
                verifyResult?.message ||
                'Payment verification failed.'
              );
            }

            clearCart();

           window.location.href = `/dashboard?tab=orders&order_id=${encodeURIComponent(localOrderId)}`;
          } catch (error) {
            console.error(
              'PAYMENT VERIFICATION ERROR:',
              error
            );

            setOrderError(
              error?.message ||
              'Payment was received but verification failed. Please contact support.'
            );
          } finally {
            setPlacingOrder(false);
          }
        },

        prefill: {
          name: auth.user?.name || '',
          email: auth.user?.email || '',
          contact: auth.user?.mobile || '',
        },

        notes: {
          order_id: localOrderId,
          user_id: String(auth.user.id),
          payment_method: selectedPaymentMethod,
          coupon: coupon ? couponCode(coupon) : '',
        },

        config: {
          display: {
            blocks: {
              selected_payment: {
                name: paymentMethodLabels[selectedPaymentMethod],
                instruments: [selectedRazorpayMethod],
              },
            },
            sequence: ['block.selected_payment'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },

        theme: {
          color: THEME.primary,
        },

        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
            setOrderError(
              'Payment window was closed. Your order is still pending.'
            );
          },
        },
      };

      console.log('RAZORPAY OPTIONS:', options);

      const razorpay = new Razorpay(options);

      razorpay.on('payment.failed', function (paymentFailure) {
        console.error(
          'RAZORPAY PAYMENT FAILED:',
          paymentFailure
        );

        setOrderError(
          paymentFailure?.error?.description ||
          'Payment failed. Please try again.'
        );

        setPlacingOrder(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('PLACE ORDER ERROR:', error);

      setOrderError(
        error?.message ||
        'Unable to place order. Please try again.'
      );

      setPlacingOrder(false);
    }
  };

  placeOrderRef.current = handlePlaceOrder;

  useEffect(() => {
    const handleCustomerAuthSuccess = (event) => {
      const user = event.detail?.user;
      const auth = getCustomerAuth();
      const loggedInUser = user || auth?.user;

      if (!loggedInUser?.id) {
        return;
      }

      setCustomerUser(loggedInUser);
      setOrderError('');

      setTimeout(() => {
        placeOrderRef.current?.(true);
      }, 100);
    };

    window.addEventListener(
      'customer-auth-success',
      handleCustomerAuthSuccess
    );

    return () => {
      window.removeEventListener(
        'customer-auth-success',
        handleCustomerAuthSuccess
      );
    };
  }, []);

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f0dfad] border-t-[#d4a017]" />

          <p className="mt-3 text-xs font-bold text-slate-400">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  if (!checkoutItems.length) {
    return (
      <main className="min-h-screen bg-[#f4f7fb]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
          <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-xl">
            <div className="h-1.5 bg-[#d4a017]" />

            <div className="p-7 sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff5d6] text-[#b8890e]">
                <IconShoppingBag size={30} />
              </div>

              <h1 className="mt-5 text-2xl font-black text-[#0d1b2a]">
                Your cart is empty
              </h1>

              <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-5 text-slate-500">
                Looks like you have not added any gift cards yet.
              </p>

              <Link
                href="/gift-cards"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d4a017] px-5 py-3 text-xs font-black text-[#0d1b2a] shadow-lg transition hover:bg-[#e8b84b]"
              >
                Browse Gift Cards
                <IconChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[62px] items-center justify-between">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#b8890e]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition group-hover:bg-[#fff5d6]">
                <IconArrowLeft size={15} />
              </span>

              <span className="hidden sm:block">
                Back to Cart
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 text-[10px] font-bold text-slate-400 sm:flex">
                <IconShieldCheck
                  size={14}
                  className="text-emerald-500"
                />
                100% Secure Checkout
              </div>

              <div className="flex h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-[10px] font-black text-emerald-600">
                <IconLock size={12} />
                Secure
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#b8890e]">
                <IconShoppingBag size={12} />
                Checkout
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[#0d1b2a] sm:text-3xl">
                Complete your order
              </h1>

              <p className="mt-1 max-w-xl text-xs font-medium text-slate-500">
                Review your gift cards, choose your best offer and complete secure payment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4a017] text-[10px] font-black text-[#0d1b2a]">
                  1
                </span>

                <span className="hidden text-[10px] font-black text-[#0d1b2a] sm:block">
                  Cart
                </span>
              </div>

              <span className="h-px w-6 bg-slate-200" />

              <div className="flex items-center gap-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4a017] text-[10px] font-black text-[#0d1b2a]">
                  2
                </span>

                <span className="text-[10px] font-black text-[#0d1b2a]">
                  Checkout
                </span>
              </div>

              <span className="h-px w-6 bg-slate-200" />

              <div className="flex items-center gap-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-400">
                  3
                </span>

                <span className="hidden text-[10px] font-black text-slate-400 sm:block">
                  Payment
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {hasMixedCurrencies && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <IconX
              size={17}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <div>
              <p className="text-xs font-black text-red-600">
                Multiple currencies detected
              </p>

              <p className="mt-0.5 text-[10px] font-semibold leading-4 text-red-500">
                Please use the same currency for all cart items before placing your order.
              </p>
            </div>
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-4 sm:p-5">
                <SectionHeader
                  icon={<IconShoppingBag size={18} />}
                  title="Your Order"
                  description={`${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} selected for checkout`}
                  badge={currencyCode}
                />

                <div className="mt-4 space-y-3">
                  {checkoutItems.map((item) => {
                    const amount = getAmount(item);
                    const quantity = getQuantity(item);

                    const original = Number(
                      (amount * quantity).toFixed(2)
                    );

                    const itemDiscount =
                      calculatedCoupon.itemDiscounts[
                      getCartKey(item)
                      ] || 0;

                    const payable = Math.max(
                      0,
                      Number(
                        (original - itemDiscount).toFixed(2)
                      )
                    );

                    const currency = getCurrencyCode(item);

                    return (
                      <div
                        key={getCartKey(item)}
                        className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-[#e8b84b] hover:shadow-sm sm:p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                            <ProductImage item={item} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-black text-[#0d1b2a] sm:text-base">
                                  {getProductName(item)}
                                </h3>

                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-slate-500">
                                    {currency}
                                  </span>

                                  {item?.sku && (
                                    <span className="rounded-full bg-[#fff5d6] px-2 py-1 text-[8px] font-black text-[#b8890e]">
                                      SKU: {item.sku}
                                    </span>
                                  )}

                                  {itemDiscount > 0 && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-600">
                                      Coupon Applied
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                aria-label="Remove item"
                              >
                                <IconTrash size={14} />
                              </button>
                            </div>

                            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                              <div>
                                <p className="mb-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400">
                                  Amount & Quantity
                                </p>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <AmountInput
                                    item={item}
                                    onUpdateAmount={handleUpdateAmount}
                                  />

                                  <div className="flex h-10 w-fit items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                    <button
                                      type="button"
                                      disabled={quantity <= 1}
                                      onClick={() =>
                                        handleQuantityChange(
                                          item,
                                          quantity - 1
                                        )
                                      }
                                      className="flex h-10 w-8 items-center justify-center text-slate-500 transition hover:bg-white hover:text-[#b8890e] disabled:cursor-not-allowed disabled:opacity-30"
                                      aria-label="Decrease quantity"
                                    >
                                      <IconMinus size={13} />
                                    </button>

                                    <div className="flex h-10 min-w-10 items-center justify-center border-x border-slate-200 bg-white px-2">
                                      <span className="text-xs font-black text-[#0d1b2a]">
                                        {quantity}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuantityChange(
                                          item,
                                          quantity + 1
                                        )
                                      }
                                      className="flex h-10 w-8 items-center justify-center text-slate-500 transition hover:bg-white hover:text-[#b8890e]"
                                      aria-label="Increase quantity"
                                    >
                                      <IconPlus size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="lg:text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                  {itemDiscount > 0
                                    ? 'Payable'
                                    : 'Item Total'}
                                </p>

                                <p className="mt-0.5 text-lg font-black text-[#0d1b2a]">
                                  {formatPrice(payable, currency)}
                                </p>

                                {itemDiscount > 0 && (
                                  <p className="mt-0.5 text-[9px] font-black text-emerald-600">
                                    Save{' '}
                                    {formatPrice(
                                      itemDiscount,
                                      currency
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <SectionHeader
                icon={<IconTag size={18} />}
                title="Coupons & Offers"
                description="Choose one offer for your order."
                badge={
                  availableCouponsFromCart.length
                    ? `${availableCouponsFromCart.length} Available`
                    : null
                }
              />

              {availableCouponsFromCart.length > 0 && (
                <div className="mt-4">
                  <div className="relative">
                    <IconTag
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={couponSearch}
                      onChange={(event) =>
                        setCouponSearch(event.target.value)
                      }
                      placeholder="Search coupon by name or code"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs font-semibold text-[#0d1b2a] outline-none transition placeholder:text-slate-400 focus:border-[#d4a017] focus:bg-white focus:ring-4 focus:ring-[#fff5d6]"
                    />
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                      <div>
                        <p className="text-xs font-black text-[#0d1b2a]">
                          Available Coupons
                        </p>

                        <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                          Select one offer and save more
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 rounded-full bg-[#fff5d6] px-2.5 py-1.5">
                        <IconTag
                          size={11}
                          className="text-[#b8890e]"
                        />

                        <span className="text-[9px] font-black text-[#b8890e]">
                          {filteredCoupons.length} Offers
                        </span>
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto p-3">
                      {filteredCoupons.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                          {filteredCoupons.map(
                            (availableCoupon, index) => {
                              const code = couponCode(
                                availableCoupon
                              );

                              const selected =
                                Boolean(coupon) &&
                                couponCode(coupon).toUpperCase() ===
                                code.toUpperCase();

                              const type = getCouponType(
                                availableCoupon
                              );

                              const value = getCouponValue(
                                availableCoupon
                              );

                              const firstUser = isFirstUserCoupon(
                                availableCoupon
                              );

                              const paymentCompatible =
                                couponMatchesPayment(
                                  availableCoupon,
                                  paymentMethod
                                );

                              const productIds =
                                getCouponProductIds(
                                  availableCoupon
                                );

                              const eligible =
                                calculateCoupon(
                                  availableCoupon,
                                  checkoutItems
                                ).totalDiscount > 0;

                              return (
                                <div
                                  key={
                                    availableCoupon?.id ||
                                    availableCoupon?._id ||
                                    `${code}-${index}`
                                  }
                                  className={`relative overflow-hidden rounded-xl border bg-white transition-all ${selected
                                    ? 'border-[#d4a017] bg-[#fff9e8] shadow-md ring-2 ring-[#f5e7bc]'
                                    : !paymentCompatible || !eligible
                                      ? 'border-slate-200 opacity-50'
                                      : 'border-slate-200 hover:-translate-y-0.5 hover:border-[#e8b84b] hover:shadow-md'
                                    }`}
                                >
                                  <div className="absolute left-0 top-0 h-full w-1 bg-[#d4a017]" />

                                  <button
                                    type="button"
                                    disabled={
                                      !paymentCompatible || !eligible
                                    }
                                    onClick={() =>
                                      handleSelectCoupon(
                                        availableCoupon
                                      )
                                    }
                                    className="w-full p-3 pl-4 text-left"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex min-w-0 items-center gap-2.5">
                                        <div
                                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected
                                            ? 'bg-[#d4a017] text-[#0d1b2a]'
                                            : 'bg-[#fff5d6] text-[#b8890e]'
                                            }`}
                                        >
                                          {selected ? (
                                            <IconCheck
                                              size={16}
                                              stroke={3}
                                            />
                                          ) : (
                                            <IconTag size={16} />
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <p className="truncate text-[11px] font-black text-[#0d1b2a]">
                                            {couponName(
                                              availableCoupon
                                            )}
                                          </p>

                                          <span className="mt-1 inline-flex max-w-full truncate rounded-md border border-dashed border-[#e8b84b] bg-[#fff5d6] px-1.5 py-1 text-[8px] font-black uppercase tracking-wider text-[#b8890e]">
                                            {code}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="shrink-0 text-right">
                                        <p className="text-[7px] font-black uppercase tracking-wider text-emerald-500">
                                          SAVE
                                        </p>

                                        <p className="text-sm font-black text-emerald-600">
                                          {type === 'percentage'
                                            ? `${value}%`
                                            : formatPrice(
                                              value,
                                              currencyCode
                                            )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-2.5 flex flex-wrap gap-1">
                                      <span
                                        className={`rounded-full px-2 py-1 text-[7px] font-black ${productIds.length
                                          ? 'bg-purple-50 text-purple-600'
                                          : type === 'percentage'
                                            ? 'bg-purple-50 text-purple-600'
                                            : 'bg-[#fff5d6] text-[#b8890e]'
                                          }`}
                                      >
                                        {productIds.length
                                          ? 'Product Assigned'
                                          : type === 'percentage'
                                            ? 'Product Offer'
                                            : 'Total Order'}
                                      </span>

                                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-black text-slate-500">
                                        {getPaymentLabel(
                                          availableCoupon
                                        )}
                                      </span>

                                      {firstUser && (
                                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[7px] font-black text-amber-600">
                                          First User
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                                      <span className="text-[8px] font-semibold text-slate-400">
                                        {productIds.length
                                          ? 'Applied only to assigned product(s)'
                                          : type === 'fixed'
                                            ? 'Applied on total order'
                                            : 'Applied product-wise'}
                                      </span>

                                      {!paymentCompatible ? (
                                        <span className="rounded-full bg-red-50 px-2 py-1 text-[7px] font-black text-red-500">
                                          {getPaymentLabel(
                                            availableCoupon
                                          )}
                                        </span>
                                      ) : !eligible ? (
                                        <span className="rounded-full bg-red-50 px-2 py-1 text-[7px] font-black text-red-500">
                                          Not Eligible
                                        </span>
                                      ) : (
                                        <span
                                          className={`rounded-full px-2 py-1 text-[7px] font-black ${selected
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-[#fff5d6] text-[#b8890e]'
                                            }`}
                                        >
                                          {selected
                                            ? 'Applied'
                                            : 'Apply'}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
                          <div className="text-center">
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                              <IconTag size={18} />
                            </div>

                            <p className="mt-2.5 text-xs font-black text-slate-600">
                              No matching coupons
                            </p>

                            <p className="mt-1 text-[9px] font-semibold text-slate-400">
                              Try another coupon name or code.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!availableCouponsFromCart.length && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <IconTag size={18} />
                  </div>

                  <p className="mt-2.5 text-xs font-black text-slate-600">
                    No coupons available
                  </p>

                  <p className="mt-1 text-[9px] font-semibold text-slate-400">
                    Coupons assigned to products in your cart will appear here.
                  </p>
                </div>
              )}

              {coupon && (
                <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        <IconCheck size={16} stroke={3} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[7px] font-black uppercase tracking-widest text-emerald-600">
                          Coupon Applied
                        </p>

                        <p className="mt-0.5 truncate text-xs font-black text-emerald-700">
                          {couponName(coupon)}
                        </p>

                        <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600">
                          {couponCode(coupon)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="text-[7px] font-bold text-emerald-500">
                          YOU SAVE
                        </p>

                        <p className="text-xs font-black text-emerald-700">
                          {formatPrice(
                            checkoutDiscount,
                            currencyCode
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                        aria-label="Remove coupon"
                      >
                        <IconX size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {couponMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[9px] font-bold text-emerald-600">
                  <IconCheck size={12} />
                  {couponMessage}
                </div>
              )}

              <div className="mt-3 rounded-xl border border-[#f0dfad] bg-[#fff9e8] px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <IconSparkles
                    size={14}
                    className="mt-0.5 shrink-0 text-[#b8890e]"
                  />

                  <p className="text-[9px] font-semibold leading-4 text-[#8b6810]">
                    One coupon per order. Product-assigned coupons apply only to eligible products, while global fixed coupons apply once to the order.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <SectionHeader
                icon={<IconCreditCard size={18} />}
                title="Payment Method"
                description="Choose your preferred payment option."
              />

              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <PaymentOption
                  active={paymentMethod === 'upi'}
                  onClick={() => handlePaymentMethod('upi')}
                  icon={<IconDeviceMobile size={18} />}
                  title="UPI"
                  description="Google Pay, PhonePe, Paytm and more"
                  badge="Fast"
                />

                <PaymentOption
                  active={paymentMethod === 'card'}
                  onClick={() => handlePaymentMethod('card')}
                  icon={<IconCreditCard size={18} />}
                  title="Card"
                  description="Visa, Mastercard and other cards"
                />

                <PaymentOption
                  active={paymentMethod === 'wallet'}
                  onClick={() => handlePaymentMethod('wallet')}
                  icon={<IconWallet size={18} />}
                  title="Wallet"
                  description="Fast and secure online payment"
                />
              </div>

              <div className="mt-3 rounded-xl border border-[#f0dfad] bg-[#fff9e8] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <IconShieldCheck
                    size={14}
                    className="text-[#b8890e]"
                  />

                  <p className="text-[10px] font-bold text-[#8b6810]">
                    Coupons restricted to a specific payment method will only be available for that payment option.
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#f0dfad] bg-gradient-to-r from-[#fff9e8] to-white">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#b8890e] shadow-sm">
                  <IconShieldCheck size={20} />
                </div>

                <div>
                  <p className="text-xs font-black text-[#0d1b2a]">
                    Safe & Secure Payment
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold leading-4 text-slate-500">
                    Your transaction is protected with secure encryption and trusted payment partners.
                  </p>
                </div>

                <div className="ml-auto hidden sm:block">
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[8px] font-black text-emerald-600 shadow-sm">
                    <IconLock size={11} />
                    SSL SECURED
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-4 lg:h-fit">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="relative overflow-hidden bg-[#0d1b2a] p-5 text-white">
                <div className="absolute -right-10 -top-14 h-32 w-32 rounded-full bg-[#d4a017]/15" />

                <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-white/5" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#e8b84b]">
                        Order Summary
                      </p>

                      <h2 className="mt-1 text-base font-black">
                        Payment Details
                      </h2>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[#e8b84b]">
                      <IconShoppingBag size={18} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2">
                    <IconTruckDelivery
                      size={13}
                      className="text-[#e8b84b]"
                    />

                    <span className="text-[9px] font-bold text-white/90">
                      Digital gift card • Instant delivery
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="rounded-2xl bg-[#f4f7fb] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500">
                      Items
                    </span>

                    <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-[#0d1b2a] shadow-sm">
                      {totalQuantity}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">
                        Subtotal
                      </span>

                      <span className="font-black text-[#0d1b2a]">
                        {formatPrice(
                          checkoutSubtotal,
                          currencyCode
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                        <IconTag
                          size={12}
                          className="text-emerald-500"
                        />
                        Coupon Discount
                      </span>

                      <span className="font-black text-emerald-600">
                        -{formatPrice(checkoutDiscount, currencyCode)}
                      </span>
                    </div>
                  </div>
                </div>

                {coupon && (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                          <IconTag size={14} />
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">
                            Applied Coupon
                          </p>

                          <p className="mt-0.5 text-[10px] font-black text-emerald-700">
                            {couponCode(coupon)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[8px] font-bold text-emerald-500">
                          YOU SAVE
                        </p>

                        <p className="text-xs font-black text-emerald-700">
                          {formatPrice(
                            checkoutDiscount,
                            currencyCode
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {calculatedCoupon.type === 'fixed' && coupon && (
                  <div className="mt-3 rounded-xl border border-[#f0dfad] bg-[#fff9e8] p-3">
                    <div className="flex items-start gap-2">
                      <IconReceipt
                        size={14}
                        className="mt-0.5 text-[#b8890e]"
                      />

                      <p className="text-[9px] font-bold leading-4 text-[#8b6810]">
                        {calculatedCoupon.description}.
                      </p>
                    </div>
                  </div>
                )}

                {calculatedCoupon.type === 'percentage' && coupon && (
                  <div className="mt-3 rounded-xl border border-purple-100 bg-purple-50 p-3">
                    <div className="flex items-start gap-2">
                      <IconSparkles
                        size={14}
                        className="mt-0.5 text-purple-500"
                      />

                      <p className="text-[9px] font-bold leading-4 text-purple-600">
                        {calculatedCoupon.description}.
                      </p>
                    </div>
                  </div>
                )}

                {savingsPercent > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5">
                    <IconSparkles
                      size={13}
                      className="text-emerald-500"
                    />

                    <p className="text-[9px] font-black text-emerald-600">
                      You are saving approximately {savingsPercent}% on this order
                    </p>
                  </div>
                )}

                <div className="my-4 border-t border-dashed border-slate-200" />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Total Payable
                  </p>

                  <div className="mt-1 flex items-end justify-between gap-2">
                    <p className="text-2xl font-black tracking-tight text-[#0d1b2a]">
                      {formatPrice(checkoutTotal, currencyCode)}
                    </p>

                    <span className="mb-0.5 rounded-full bg-[#fff5d6] px-2 py-1 text-[8px] font-black uppercase tracking-wide text-[#b8890e]">
                      {currencyCode}
                    </span>
                  </div>
                </div>

                {customerUser?.id && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                    <IconCheck
                      size={14}
                      className="text-emerald-500"
                    />

                    <p className="text-[9px] font-black text-emerald-600">
                      Signed in as{' '}
                      {customerUser?.name || customerUser?.email}
                    </p>
                  </div>
                )}

                {orderError && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                    <div className="flex items-start gap-2">
                      <IconX
                        size={14}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <p className="text-[10px] font-bold leading-4 text-red-500">
                        {orderError}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handlePlaceOrder()}
                  disabled={
                    placingOrder ||
                    hasMixedCurrencies ||
                    checkoutTotal <= 0 ||
                    !paymentMethod
                  }
                  className="group mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#d4a017] px-4 text-xs font-black text-[#0d1b2a] shadow-lg shadow-[#b8890e]/20 transition hover:bg-[#e8b84b] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1b2a]/30 border-t-[#0d1b2a]" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay {formatPrice(checkoutTotal, currencyCode)}
                      <IconChevronRight
                        size={15}
                        className="transition group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                    <IconLock size={12} />
                  </div>

                  <p className="text-[8px] font-semibold leading-4 text-slate-400">
                    By placing this order, you agree to our terms and conditions. Your transaction is securely processed.
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1 border-t border-slate-100 pt-3">
                  <div className="text-center">
                    <IconShieldCheck
                      size={15}
                      className="mx-auto text-emerald-500"
                    />

                    <p className="mt-1 text-[8px] font-black text-slate-400">
                      Secure
                    </p>
                  </div>

                  <div className="text-center">
                    <IconCreditCard
                      size={15}
                      className="mx-auto text-[#b8890e]"
                    />

                    <p className="mt-1 text-[8px] font-black text-slate-400">
                      Trusted
                    </p>
                  </div>

                  <div className="text-center">
                    <IconGift
                      size={15}
                      className="mx-auto text-[#b8890e]"
                    />

                    <p className="mt-1 text-[8px] font-black text-slate-400">
                      Digital
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}