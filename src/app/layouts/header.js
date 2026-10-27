
'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../auth/LoginModal';

import {
  IconAlertCircle,
  IconArrowRight,
  IconBalloon,
  IconBuildingStore,
  IconCake,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
  IconCoffee,
  IconCreditCard,
  IconDeviceGamepad2,
  IconGift,
  IconHeart,
  IconHelpCircle,
  IconLogin,
  IconLogout,
  IconMenu2,
  IconMinus,
  IconMovie,
  IconPackage,
  IconPlane,
  IconPlus,
  IconSearch,
  IconShieldCheck,
  IconShoppingBag,
  IconShoppingCart,
  IconSparkles,
  IconTag,
  IconUser,
  IconX,
} from '@tabler/icons-react';

const CURRENCIES = [
  { code: 'INR', label: 'India', symbol: '₹' },
  { code: 'USD', label: 'United States', symbol: '$' },
  { code: 'AED', label: 'United Arab Emirates', symbol: 'د.إ' },
  { code: 'GBP', label: 'United Kingdom', symbol: '£' },
  { code: 'EUR', label: 'Europe', symbol: '€' },
];

const MENU_DATA = {
  'Gift Cards': {
    title: 'Gift Cards',
    description: 'Discover the perfect gift for every moment.',
    featured: {
      title: 'Explore Gift Cards',
      description: 'Send thoughtful digital gifts instantly.',
      href: '/gift-cards',
      icon: IconGift,
    },
    items: [
      {
        title: 'Popular Gift Cards',
        description: 'Trending cards loved by everyone',
        href: '/gift-cards',
        icon: IconSparkles,
      },
      {
        title: 'Shopping',
        description: 'Fashion and lifestyle',
        href: '/gift-cards?category=shopping',
        icon: IconShoppingBag,
      },
      {
        title: 'Food & Dining',
        description: 'Restaurants and cafes',
        href: '/gift-cards?category=food',
        icon: IconCoffee,
      },
      {
        title: 'Entertainment',
        description: 'Movies and streaming',
        href: '/gift-cards?category=entertainment',
        icon: IconMovie,
      },
      {
        title: 'Gaming',
        description: 'Games and digital credits',
        href: '/gift-cards?category=gaming',
        icon: IconDeviceGamepad2,
      },
      {
        title: 'Travel',
        description: 'Trips and experiences',
        href: '/gift-cards?category=travel',
        icon: IconPlane,
      },
    ],
  },

  Brands: {
    title: 'Brands',
    description: 'Shop gift cards from popular brands.',
    featured: {
      title: 'All Brands',
      description: 'Explore our complete brand collection.',
      href: '/brands',
      icon: IconBuildingStore,
    },
    items: [
      {
        title: 'Top Brands',
        description: 'Discover customer favourites',
        href: '/brands',
        icon: IconSparkles,
      },
      {
        title: 'Shopping Brands',
        description: 'Fashion and lifestyle',
        href: '/brands?category=shopping',
        icon: IconShoppingBag,
      },
      {
        title: 'Food Brands',
        description: 'Food and restaurants',
        href: '/brands?category=food',
        icon: IconCoffee,
      },
      {
        title: 'Entertainment',
        description: 'Movies and streaming',
        href: '/brands?category=entertainment',
        icon: IconMovie,
      },
      {
        title: 'Gaming Brands',
        description: 'Gaming and digital credits',
        href: '/brands?category=gaming',
        icon: IconDeviceGamepad2,
      },
      {
        title: 'Travel Brands',
        description: 'Travel and experiences',
        href: '/brands?category=travel',
        icon: IconPlane,
      },
    ],
  },

  Occasions: {
    title: 'Occasions',
    description: 'Make every celebration memorable.',
    featured: {
      title: 'All Occasions',
      description: 'Find a gift for every special moment.',
      href: '/occasions',
      icon: IconGift,
    },
    items: [
      {
        title: 'Birthday',
        description: 'Make their birthday special',
        href: '/occasions/birthday',
        icon: IconCake,
      },
      {
        title: 'Anniversary',
        description: 'Celebrate special moments',
        href: '/occasions/anniversary',
        icon: IconHeart,
      },
      {
        title: 'Wedding',
        description: 'Thoughtful wedding gifts',
        href: '/occasions/wedding',
        icon: IconGift,
      },
      {
        title: 'Festivals',
        description: 'Celebrate together',
        href: '/occasions/festivals',
        icon: IconSparkles,
      },
      {
        title: 'Thank You',
        description: 'Show your appreciation',
        href: '/occasions/thank-you',
        icon: IconHeart,
      },
      {
        title: 'Congratulations',
        description: 'Celebrate achievements',
        href: '/occasions/congratulations',
        icon: IconBalloon,
      },
    ],
  },
};

const MOBILE_MENU_ITEMS = [
  {
    key: 'gift-cards',
    title: 'Gift Cards',
    icon: IconGift,
    menuKey: 'Gift Cards',
  },
  {
    key: 'brands',
    title: 'Brands',
    icon: IconBuildingStore,
    menuKey: 'Brands',
  },
  {
    key: 'occasions',
    title: 'Occasions',
    icon: IconGift,
    menuKey: 'Occasions',
  },
  {
    key: 'offers',
    title: 'Offers',
    icon: IconTag,
    href: '/offers',
  },
  {
    key: 'corporate',
    title: 'Corporate Gifting',
    icon: IconBuildingStore,
    href: '/corporate',
  },
];

function getCurrency() {
  if (typeof window === 'undefined') return 'INR';

  const stored = localStorage.getItem('currency');

  return CURRENCIES.some((item) => item.code === stored)
    ? stored
    : 'INR';
}

function getCurrencySymbol(currency) {
  return (
    CURRENCIES.find((item) => item.code === currency)?.symbol || currency
  );
}

function formatPrice(value, currency = 'INR') {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(currency)}${amount.toLocaleString('en-IN')}`;
  }
}

function getItemAmount(item) {
  return Number(
    item?.amount ??
      item?.selectedAmount ??
      item?.selected_amount ??
      item?.gift_card_amount ??
      item?.giftCardAmount ??
      item?.selling_price ??
      item?.price ??
      item?.denomination ??
      item?.value ??
      0
  );
}

function getItemQuantity(item) {
  const quantity = Number(item?.quantity);

  return Number.isFinite(quantity) && quantity >= 1
    ? Math.floor(quantity)
    : 1;
}

function getCustomerName(user) {
  return (
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.email?.split('@')?.[0] ||
    'My Account'
  );
}

function getInitials(name) {
  return (
    String(name || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'U'
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(onClose, 3500);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const success = toast.type === 'success';
  const error = toast.type === 'error';

  return (
    <div className="fixed right-4 top-5 z-[99999] w-[calc(100%-32px)] max-w-[390px]">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--ve-shadow)]">
        <div
          className="h-1"
          style={{
            background: success
              ? 'var(--success)'
              : error
                ? 'var(--danger)'
                : 'var(--primary)',
          }}
        />

        <div className="flex items-start gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: success
                ? '#dcfce7'
                : error
                  ? '#fee2e2'
                  : 'var(--accent-light)',
              color: success
                ? 'var(--success)'
                : error
                  ? 'var(--danger)'
                  : 'var(--primary-dark)',
            }}
          >
            {success ? (
              <IconCircleCheck size={21} />
            ) : error ? (
              <IconAlertCircle size={21} />
            ) : (
              <IconSparkles size={21} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-[var(--foreground)]">
              {success
                ? 'Success'
                : error
                  ? 'Something went wrong'
                  : 'Tranzift'}
            </div>

            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="rounded-lg p-1 text-slate-400 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            <IconX size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CurrencyDropdown({ currency, setCurrency }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selected =
    CURRENCIES.find((item) => item.code === currency) || CURRENCIES[0];

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleChange = (code) => {
    localStorage.setItem('currency', code);
    setCurrency(code);

    window.dispatchEvent(
      new CustomEvent('currency-changed', {
        detail: { currency: code },
      })
    );

    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-[11px] font-extrabold text-[var(--foreground)] transition hover:border-[var(--primary)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary-dark)]">
          {selected.symbol}
        </span>

        {selected.code}

        <IconChevronDown
          size={13}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[800] w-[215px] rounded-2xl border border-[var(--border)] bg-white p-1.5 shadow-[var(--ve-shadow)]">
          {CURRENCIES.map((item) => (
            <button
              type="button"
              key={item.code}
              onClick={() => handleChange(item.code)}
              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-[11px] font-bold transition ${
                currency === item.code
                  ? 'bg-[var(--accent-light)] text-[var(--primary-dark)]'
                  : 'text-[var(--muted)] hover:bg-[var(--background)]'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--background)]">
                {item.symbol}
              </span>

              <span className="flex-1">{item.label}</span>

              <span className="text-[9px] text-slate-400">
                {item.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CartQuantityInput({ item, updateQuantity }) {
  const quantity = getItemQuantity(item);

  const changeQuantity = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) return;

    updateQuantity(item, Math.max(1, Math.floor(number)));
  };

  return (
    <div className="flex h-9 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <button
        type="button"
        onClick={() => changeQuantity(quantity - 1)}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="flex h-full w-8 items-center justify-center text-[var(--muted)] hover:bg-[var(--accent-light)] disabled:opacity-30"
      >
        <IconMinus size={14} />
      </button>

      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(event) => {
          if (event.target.value !== '') {
            changeQuantity(event.target.value);
          }
        }}
        className="cart-number-input h-full w-10 border-x border-[var(--border)] text-center text-xs font-black text-[var(--foreground)] outline-none"
      />

      <button
        type="button"
        onClick={() => changeQuantity(quantity + 1)}
        aria-label="Increase quantity"
        className="flex h-full w-8 items-center justify-center text-[var(--muted)] hover:bg-[var(--accent-light)]"
      >
        <IconPlus size={14} />
      </button>
    </div>
  );
}

function CartPriceInput({ item, updateAmount, currency }) {
  const amount = getItemAmount(item);
  const [value, setValue] = useState(String(amount));

  useEffect(() => {
    setValue(String(amount));
  }, [amount]);

  const commitAmount = () => {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
      setValue(String(amount));
      return;
    }

    const nextAmount = Number(number.toFixed(2));

    updateAmount(item, nextAmount);
    setValue(String(nextAmount));
  };

  return (
    <div className="flex h-9 items-center overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <span className="flex h-full items-center border-r border-[var(--border)] bg-[var(--background)] px-2 text-[11px] font-black text-[var(--primary-dark)]">
        {getCurrencySymbol(currency)}
      </span>

      <input
        type="number"
        min="1"
        step="0.01"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commitAmount}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className="cart-number-input h-full w-[78px] px-2 text-center text-[11px] font-black text-[var(--foreground)] outline-none"
      />
    </div>
  );
}



function CartItemImage({ item }) {
  const image =
    item?.brandLogo ||
    item?.brand_logo ||
    item?.brand_logo_url ||
    item?.product?.brandLogo ||
    item?.product?.brand_logo ||
    item?.product?.brand_logo_url ||
    item?.product?.image ||
    item?.product?.image_url ||
    item?.product?.imageUrl ||
    item?.product?.logo ||
    item?.product?.logo_url ||
    item?.logo_url ||
    item?.logo ||
    item?.image ||
    item?.image_url ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.product_image ||
    '';

  if (!image) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
        <IconGift size={22} />
      </div>
    );
  }

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--background)]">
      <Image
        src={image}
        alt={item?.name || item?.product?.name || 'Gift Card'}
        fill
        sizes="56px"
        className="object-contain"
        unoptimized
      />
    </div>
  );
}



function CartDropdown({
  cartItems,
  updateQuantity,
  updateAmount,
  removeFromCart,
}) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const wrapperRef = useRef(null);

  useEffect(() => {
    setCurrency(getCurrency());

    const handleCurrencyChange = (event) => {
      setCurrency(event?.detail?.currency || getCurrency());
    };

    window.addEventListener('currency-changed', handleCurrencyChange);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const total = cartItems.reduce(
    (sum, item) => sum + getItemAmount(item) * getItemQuantity(item),
    0
  );

  const totalQuantity = cartItems.reduce(
    (sum, item) => sum + getItemQuantity(item),
    0
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Shopping cart"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--accent-light)]"
      >
        <IconShoppingCart size={19} />

        {totalQuantity > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[8px] font-black text-[var(--ve-dark)]">
            {totalQuantity > 99 ? '99+' : totalQuantity}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[410px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--ve-shadow)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <div>
                <div className="text-sm font-black text-[var(--foreground)]">
                  Your Cart
                </div>

                <div className="mt-0.5 text-[10px] text-[var(--muted)]">
                  {totalQuantity} item{totalQuantity !== 1 ? 's' : ''}
                </div>
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
                <IconShoppingCart size={18} />
              </span>
            </div>

            {cartItems.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
                  <IconGift size={25} />
                </div>

                <div className="mt-4 text-sm font-black text-[var(--foreground)]">
                  Your cart is empty
                </div>

                <div className="mt-1 text-[10px] text-[var(--muted)]">
                  Find the perfect gift and add it to your cart.
                </div>

                <Link
                  href="/gift-cards"
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary-dark)] px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
                >
                  Explore Gift Cards
                  <IconArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <>
                <div className="max-h-[420px] overflow-y-auto p-3">
                  {cartItems.map((item, index) => {
                    const amount = getItemAmount(item);
                    const quantity = getItemQuantity(item);

                    return (
                      <div
                        key={
                          item?.cart_key ||
                          item?.cartKey ||
                          item?.id ||
                          index
                        }
                        className="mb-2 rounded-xl bg-[var(--background)] p-3 last:mb-0"
                      >
                        <div className="flex gap-3">
                          <CartItemImage item={item} />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 truncate text-[11px] font-black text-[var(--foreground)]">
                                {item?.name ||
                                  item?.product?.name ||
                                  'Gift Card'}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item)}
                                aria-label="Remove item"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <IconX size={14} />
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div>
                                <div className="mb-1 text-[8px] font-black uppercase tracking-wider text-[var(--muted)]">
                                  Quantity
                                </div>

                                <CartQuantityInput
                                  item={item}
                                  updateQuantity={updateQuantity}
                                />
                              </div>

                              <div>
                                <div className="mb-1 text-[8px] font-black uppercase tracking-wider text-[var(--muted)]">
                                  Price
                                </div>

                                <CartPriceInput
                                  item={item}
                                  updateAmount={updateAmount}
                                  currency={currency}
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                              <span className="text-[9px] font-semibold text-[var(--muted)]">
                                {quantity} × {formatPrice(amount, currency)}
                              </span>

                              <span className="text-sm font-black text-[var(--primary-dark)]">
                                {formatPrice(amount * quantity, currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-[var(--border)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--muted)]">
                      Subtotal
                    </span>

                    <span className="text-lg font-black text-[var(--foreground)]">
                      {formatPrice(total, currency)}
                    </span>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary-dark)] text-xs font-black text-white transition hover:opacity-90"
                  >
                    Proceed to Checkout
                    <IconArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CompactMegaMenu({ menuKey }) {
  const [open, setOpen] = useState(false);
  const menu = MENU_DATA[menuKey];
  const wrapperRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!menu) return null;

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    setOpen(true);
  };

  const closeMenu = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 140);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onFocus={openMenu}
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-[11px] font-extrabold transition ${
          open
            ? 'text-[var(--primary-dark)]'
            : 'text-[var(--foreground)] hover:text-[var(--primary-dark)]'
        }`}
      >
        {menuKey}

        <IconChevronDown
          size={13}
          className={`transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-[600] -translate-x-1/2 pt-3">
          <div className="w-[min(560px,90vw)] rounded-2xl border border-[var(--border)] bg-white p-2 shadow-[var(--ve-shadow)]">
            <div className="flex gap-2">
              <Link
                href={menu.featured.href}
                onClick={() => setOpen(false)}
                className="group flex w-[175px] shrink-0 flex-col justify-between rounded-xl bg-[var(--ve-navy)] p-4 text-white transition hover:bg-[var(--ve-dark)]"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--ve-dark)]">
                    <menu.featured.icon size={18} />
                  </div>

                  <div className="mt-4 text-xs font-black">
                    {menu.featured.title}
                  </div>

                  <div className="mt-1.5 text-[9px] leading-4 text-slate-300">
                    {menu.featured.description}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-[9px] font-black text-[var(--primary-light)]">
                  Explore
                  <IconArrowRight size={13} />
                </div>
              </Link>

              <div className="grid min-w-0 flex-1 grid-cols-2 gap-1">
                {menu.items.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <Link
                      href={item.href}
                      key={item.title}
                      onClick={() => setOpen(false)}
                      className="group flex min-w-0 items-center gap-2 rounded-xl px-2 py-2.5 transition hover:bg-[var(--accent-light)]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--background)] text-[var(--primary-dark)] group-hover:bg-white">
                        <ItemIcon size={15} />
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-[10px] font-black text-[var(--foreground)]">
                          {item.title}
                        </span>

                        <span className="mt-0.5 block truncate text-[8px] text-[var(--muted)]">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl bg-[var(--background)] px-3 py-2">
              <span className="text-[8px] font-bold text-[var(--muted)]">
                {menu.description}
              </span>

              <Link
                href={menu.featured.href}
                onClick={() => setOpen(false)}
                className="flex shrink-0 items-center gap-1 text-[8px] font-black text-[var(--primary-dark)]"
              >
                View All
                <IconArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const displayName = getCustomerName(user);
  const initials = getInitials(displayName);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-2.5 py-2 transition hover:border-[var(--primary)] hover:bg-[var(--accent-light)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary-dark)] text-[10px] font-black text-white">
          {initials}
        </span>

        <span className="hidden max-w-[100px] truncate text-[11px] font-extrabold text-[var(--foreground)] xl:block">
          {displayName}
        </span>

        <IconChevronDown
          size={14}
          className={`text-slate-400 transition ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[800] w-[240px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-2 shadow-[var(--ve-shadow)]">
          <div className="mb-2 rounded-xl bg-[var(--accent-light)] p-3">
            <div className="truncate text-xs font-black text-[var(--foreground)]">
              {displayName}
            </div>

            <div className="mt-1 truncate text-[10px] text-[var(--muted)]">
              {user?.email || 'Welcome back'}
            </div>
          </div>

          {[
            { href: '/dashboard', label: 'My Account', icon: IconUser },
            { href: '/orders', label: 'My Orders', icon: IconPackage },
            { href: '/wishlist', label: 'Wishlist', icon: IconHeart },
          ].map((item) => {
            const ItemIcon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold text-[var(--muted)] transition hover:bg-[var(--accent-light)] hover:text-[var(--primary-dark)]"
              >
                <ItemIcon size={16} />
                {item.label}
              </Link>
            );
          })}

          <div className="my-2 h-px bg-[var(--border)]" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[11px] font-bold text-[var(--danger)] hover:bg-red-50"
          >
            <IconLogout size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function MobileSubmenu({ menu, onBack, onClose }) {
  return (
    <div className="absolute inset-0 flex h-full w-full flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent-light)]"
        >
          <IconChevronLeft size={19} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-[var(--foreground)]">
            {menu.title}
          </div>

          <div className="truncate text-[9px] text-[var(--muted)]">
            {menu.description}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Link
          href={menu.featured.href}
          onClick={onClose}
          className="mb-3 flex items-center gap-3 rounded-2xl bg-[var(--ve-navy)] p-4 text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--ve-dark)]">
            <menu.featured.icon size={19} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-xs font-black">
              {menu.featured.title}
            </span>

            <span className="mt-1 block text-[9px] leading-4 text-slate-300">
              {menu.featured.description}
            </span>
          </span>

          <IconArrowRight size={16} />
        </Link>

        <div className="space-y-1">
          {menu.items.map((item) => {
            const ItemIcon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.title}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[var(--accent-light)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--primary-dark)]">
                  <ItemIcon size={17} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-black text-[var(--foreground)]">
                    {item.title}
                  </span>

                  <span className="mt-0.5 block text-[9px] text-[var(--muted)]">
                    {item.description}
                  </span>
                </span>

                <IconChevronRight size={15} className="text-slate-400" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
  user,
  onLogin,
  onLogout,
}) {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) {
      setActiveSubmenu(null);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    setActiveSubmenu(null);
  }, [pathname]);

  if (!open) return null;

  const displayName = getCustomerName(user);
  const initials = getInitials(displayName);

  return (
    <div className="fixed inset-0 z-[7000] lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-[rgba(13,27,42,0.65)] backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-[92%] max-w-[390px] overflow-hidden bg-white shadow-[-20px_0_60px_rgba(13,27,42,0.2)]">
        <div
          className={`absolute inset-0 flex h-full flex-col bg-white transition-transform duration-300 ${
            activeSubmenu
              ? '-translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <Link href="/" onClick={onClose} className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ve-navy)] text-[var(--primary)]">
                <IconGift size={20} />
              </span>

              <span>
                <span className="block text-sm font-black text-[var(--foreground)]">
                  Tranzift
                </span>

                <span className="block text-[8px] font-bold uppercase tracking-widest text-[var(--primary-dark)]">
                  Digital Gift Cards
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent-light)]"
            >
              <IconX size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {user ? (
              <div className="mb-4 rounded-2xl bg-[var(--accent-light)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ve-navy)] text-xs font-black text-white">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-[var(--foreground)]">
                      {displayName}
                    </div>

                    <div className="truncate text-[10px] text-[var(--muted)]">
                      {user.email || ''}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogin();
                }}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-dark)] py-3.5 text-xs font-black text-white hover:opacity-90"
              >
                <IconLogin size={17} />
                Sign In / Create Account
              </button>
            )}

            <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">
              Explore
            </div>

            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent-light)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--primary-dark)]">
                <IconGift size={17} />
              </span>
              Home
            </Link>

            <div className="space-y-1">
              {MOBILE_MENU_ITEMS.map((item) => {
                const ItemIcon = item.icon;

                if (item.menuKey) {
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() =>
                        setActiveSubmenu(MENU_DATA[item.menuKey])
                      }
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[var(--accent-light)]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--primary-dark)]">
                        <ItemIcon size={17} />
                      </span>

                      <span className="flex-1 text-xs font-bold text-[var(--foreground)]">
                        {item.title}
                      </span>

                      <IconChevronRight size={17} className="text-slate-400" />
                    </button>
                  );
                }

                return (
                  <Link
                    href={item.href}
                    key={item.key}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-[var(--accent-light)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--primary-dark)]">
                      <ItemIcon size={17} />
                    </span>

                    <span className="flex-1 text-xs font-bold text-[var(--foreground)]">
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </div>

            {user && (
              <>
                <div className="my-4 h-px bg-[var(--border)]" />

                {[
                  { href: '/dashboard', label: 'My Account', icon: IconUser },
                  { href: '/orders', label: 'My Orders', icon: IconPackage },
                  { href: '/wishlist', label: 'Wishlist', icon: IconHeart },
                ].map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent-light)]"
                    >
                      <ItemIcon size={17} />
                      {item.label}
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-[var(--danger)] hover:bg-red-50"
                >
                  <IconLogout size={17} />
                  Logout
                </button>
              </>
            )}

            <div className="mt-5 rounded-xl bg-[var(--background)] p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted)]">
                <IconShieldCheck size={15} className="text-[var(--success)]" />
                Secure & trusted digital gifting
              </div>

              <div className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
                Instant delivery, secure payments and trusted gift cards.
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 h-full w-full transition-transform duration-300 ${
            activeSubmenu ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {activeSubmenu && (
            <MobileSubmenu
              menu={activeSubmenu}
              onBack={() => setActiveSubmenu(null)}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    token,
    user,
    isReady,
    loginOpen,
    loginMode,
    setLoginMode,
    openLogin,
    closeLogin,
    handleAuthSuccess,
    logout,
  } = useAuth();

  const {
    cartItems = [],
    updateQuantity,
    updateAmount,
    removeFromCart,
  } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({
      id: Date.now(),
      type,
      message,
    });
  }, []);

  useEffect(() => {
    setCurrency(getCurrency());

    const handleCurrencyChanged = (event) => {
      setCurrency(event?.detail?.currency || getCurrency());
    };

    const handleOpenLogin = (event) => {
      const mode = event?.detail?.mode === 'register'
        ? 'register'
        : 'login';

      openLogin(mode);
    };

    window.addEventListener('currency-changed', handleCurrencyChanged);
    window.addEventListener('open-customer-login', handleOpenLogin);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChanged);
      window.removeEventListener('open-customer-login', handleOpenLogin);
    };
  }, [openLogin]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleOpenLogin = useCallback(
    (mode = 'login') => {
      openLogin(mode);
    },
    [openLogin]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();

      showToast('success', 'You have been logged out successfully.');

      if (pathname.startsWith('/dashboard')) {
        router.replace('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('error', 'Unable to complete logout. Please try again.');
    }
  }, [logout, pathname, router, showToast]);

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchValue.trim();

    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLoginSuccess = useCallback(
    async (auth) => {
      const success = await handleAuthSuccess(auth);

      if (success === false) {
        showToast('error', 'Unable to save your login session.');
        return false;
      }

      closeLogin();
      showToast('success', 'You are now logged in successfully.');
      router.replace('/dashboard');

      return true;
    },
    [handleAuthSuccess, closeLogin, router, showToast]
  );

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="sticky top-0 z-[500] w-full bg-[var(--surface)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="hidden bg-[var(--ve-dark)] text-white lg:block">
          <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between px-5 xl:px-8">
            <div className="flex items-center gap-6 text-[9px] font-bold tracking-wide">
              <span className="flex items-center gap-1.5">
                <IconShieldCheck
                  size={13}
                  className="text-[var(--primary-light)]"
                />
                100% Genuine Gift Cards
              </span>

              <span className="flex items-center gap-1.5">
                <IconClock
                  size={13}
                  className="text-[var(--primary-light)]"
                />
                Instant Digital Delivery
              </span>

              <span className="flex items-center gap-1.5">
                <IconCreditCard
                  size={13}
                  className="text-[var(--primary-light)]"
                />
                Secure Payments
              </span>
            </div>

            <div className="flex items-center gap-5 text-[9px] font-bold">
              <Link
                href="/help"
                className="flex items-center gap-1.5 text-slate-200 transition hover:text-[var(--primary-light)]"
              >
                <IconHelpCircle size={13} />
                Help & Support
              </Link>

              <Link
                href="/corporate"
                className="flex items-center gap-1.5 text-slate-200 transition hover:text-[var(--primary-light)]"
              >
                <IconBuildingStore size={13} />
                Corporate Gifting
              </Link>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-5 lg:px-6 xl:px-8">
            <div className="flex items-center gap-3 lg:gap-5">
              <Link href="/" className="flex shrink-0 items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ve-navy)] text-[var(--primary)] shadow-[var(--ve-shadow)]">
                  <IconGift size={21} />
                </span>

                <span className="hidden sm:block">
                  <span className="block text-[15px] font-black tracking-tight text-[var(--foreground)]">
                    Tranzift
                  </span>

                  <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--primary-dark)]">
                    Digital Gift Cards
                  </span>
                </span>
              </Link>

              <nav className="hidden items-center gap-5 xl:flex">
                <Link
                  href="/"
                  className={`text-[11px] font-extrabold transition hover:text-[var(--primary-dark)] ${
                    pathname === '/'
                      ? 'text-[var(--primary-dark)]'
                      : 'text-[var(--foreground)]'
                  }`}
                >
                  Home
                </Link>

                <CompactMegaMenu menuKey="Gift Cards" />
                <CompactMegaMenu menuKey="Brands" />
                <CompactMegaMenu menuKey="Occasions" />

                <Link
                  href="/offers"
                  className="flex items-center gap-1 text-[11px] font-extrabold text-[var(--primary-dark)]"
                >
                  <IconTag size={13} />
                  Offers
                </Link>

                <Link
                  href="/corporate"
                  className="text-[11px] font-extrabold text-[var(--foreground)] transition hover:text-[var(--primary-dark)]"
                >
                  Corporate
                </Link>
              </nav>

              <form
                onSubmit={handleSearch}
                className="hidden min-w-0 flex-1 md:block"
              >
                <div className="relative">
                  <IconSearch
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search gift cards, brands & occasions..."
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-[11px] font-semibold text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-light)]"
                  />
                </div>
              </form>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <div className="hidden lg:block">
                  <CurrencyDropdown
                    currency={currency}
                    setCurrency={setCurrency}
                  />
                </div>

                <Link
                  href="/wishlist"
                  aria-label="Wishlist"
                  className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--accent-light)] lg:flex"
                >
                  <IconHeart size={19} />
                </Link>

                <CartDropdown
                  cartItems={cartItems}
                  updateQuantity={updateQuantity}
                  updateAmount={updateAmount}
                  removeFromCart={removeFromCart}
                />

                {isReady && (
                  user && token ? (
                    <div className="hidden lg:block">
                      <UserDropdown
                        user={user}
                        onLogout={handleLogout}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenLogin('login')}
                      className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--primary)] px-3.5 text-[11px] font-black text-[var(--primary-dark)] transition hover:bg-[var(--primary)] hover:text-[var(--ve-dark)] lg:flex"
                    >
                      <IconUser size={16} />
                      Sign In
                    </button>
                  )
                )}

                <Link
                  href="/gift-cards"
                  className="hidden h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-[10px] font-black text-[var(--ve-dark)] shadow-[var(--ve-shadow)] transition hover:bg-[var(--primary-light)] lg:flex"
                >
                  <IconGift size={16} />
                  Buy Gift Card
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--accent-light)] lg:hidden"
                >
                  <IconMenu2 size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="mt-3 md:hidden">
              <div className="relative">
                <IconSearch
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search gift cards & brands..."
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-[11px] font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--accent-light)]"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="hidden border-b border-[var(--border)] bg-white lg:block">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-2.5 xl:px-8">
            <div className="flex items-center gap-7">
              {[
                { icon: IconClock, label: 'Instant Delivery' },
                { icon: IconGift, label: 'Digital Gift Cards' },
                { icon: IconTag, label: 'Exclusive Offers' },
                { icon: IconShieldCheck, label: 'Secure Payments' },
              ].map((item) => {
                const ItemIcon = item.icon;

                return (
                  <span
                    key={item.label}
                    className="flex items-center gap-2 text-[9px] font-bold text-[var(--muted)]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary-dark)]">
                      <ItemIcon size={13} />
                    </span>

                    {item.label}
                  </span>
                );
              })}
            </div>

            <Link
              href="/corporate"
              className="flex items-center gap-1.5 text-[9px] font-black text-[var(--primary-dark)]"
            >
              Corporate Gifting
              <IconArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <LoginModal
        open={loginOpen}
        mode={loginMode}
        setMode={setLoginMode}
        onClose={closeLogin}
        onAuthSuccess={handleLoginSuccess}
        onToast={showToast}
      />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={isReady && token ? user : null}
        onLogin={() => handleOpenLogin('login')}
        onLogout={handleLogout}
      />
    </>
  );
}
