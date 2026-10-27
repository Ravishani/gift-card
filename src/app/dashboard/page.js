
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  IconAlertCircle,
  IconArrowRight,
  IconBell,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconCreditCard,
  IconExternalLink,
  IconGift,
  IconHistory,
  IconLayoutDashboard,
  IconLoader2,
  IconLock,
  IconLogout,
  IconMenu2,
  IconPackage,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconShoppingBag,
  IconSparkles,
  IconTrendingUp,
  IconUser,
  IconWallet,
  IconX,
} from '@tabler/icons-react';

import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ORDERS_ENDPOINT =
  process.env.NEXT_PUBLIC_ORDERS_API_ENDPOINT ||
  '/customer/orders';

const VALID_TABS = [
  'rewards',
  'gift-cards',
  'add-card',
  'check-balance',
  'orders',
  'profile',
];

const NAVIGATION = [
  {
    heading: 'OVERVIEW',
    items: [
      {
        id: 'rewards',
        label: 'Dashboard',
        icon: IconLayoutDashboard,
      },
      {
        id: 'gift-cards',
        label: 'My Gift Cards',
        icon: IconGift,
      },
    ],
  },
  {
    heading: 'GIFT CARDS',
    items: [
      {
        id: 'add-card',
        label: 'Add New Card',
        icon: IconPlus,
      },
      {
        id: 'check-balance',
        label: 'Check Balance',
        icon: IconWallet,
      },
      {
        id: 'orders',
        label: 'Order History',
        icon: IconHistory,
      },
    ],
  },
  {
    heading: 'PREFERENCES',
    items: [
      {
        id: 'profile',
        label: 'My Profile',
        icon: IconUser,
      },
      {
        id: 'logout',
        label: 'Sign Out',
        icon: IconLogout,
      },
    ],
  },
];

function getUserName(user) {
  return (
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.full_name ||
    'My Account'
  );
}

function getRole(user) {
  return typeof user?.role === 'object'
    ? user.role?.name
    : user?.role;
}

function getInitials(name) {
  return (
    String(name || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U'
  );
}

function formatMoney(amount, currency = 'INR') {
  const value = Number(amount ?? 0);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency} ${value.toLocaleString('en-IN')}`;
  }
}

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getOrderId(order) {
  return String(order?.order_id || order?.id || order?._id || '');
}

function getOrderStatus(order) {
  return (
    order?.woohoo_order_status ||
    order?.order_status ||
    order?.status ||
    'Processing'
  );
}

function getPaymentStatus(order) {
  return (
    order?.payment_status ||
    order?.transaction?.status ||
    'Pending'
  );
}

function getOrderAmount(order) {
  return Number(
    order?.total ??
      order?.transaction?.total ??
      order?.transaction?.amount ??
      0
  );
}

function getCurrency(order) {
  return typeof order?.currency === 'object'
    ? order.currency?.code || 'INR'
    : order?.currency || 'INR';
}

function StatusBadge({ value }) {
  const status = String(value || 'Pending').replaceAll('_', ' ');
  const normalized = status.toLowerCase();

  const variants = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    captured: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    processing: 'border-amber-200 bg-amber-50 text-amber-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    created: 'border-slate-200 bg-slate-50 text-slate-700',
    failed: 'border-red-200 bg-red-50 text-red-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
    refunded: 'border-purple-200 bg-purple-50 text-purple-700',
  };

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-md border px-2 py-1 text-[9px] font-bold capitalize ${
        variants[normalized] ||
        'border-[var(--border)] bg-[var(--background)] text-[var(--ve-text)]'
      }`}
    >
      {status}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]/50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon: StatIcon,
  tone = 'purple',
}) {
  const iconColor =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'orange'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-[var(--accent-light)] text-[var(--primary-dark)]';

  return (
    <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--primary-light)] hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold text-[var(--ve-text)]">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
        >
          <StatIcon size={18} stroke={1.8} />
        </div>
      </div>

      <p className="mt-4 break-words text-[23px] font-bold leading-tight tracking-tight text-[var(--foreground)]">
        {value}
      </p>

      <p className="mt-2 text-[10px] leading-5 text-[var(--ve-text)]">
        {caption}
      </p>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.17em] text-[var(--primary-dark)]">
          {eyebrow}
        </p>

        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.04em] text-[var(--foreground)] sm:text-[28px]">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl text-[11px] leading-5 text-[var(--ve-text)]">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function MessageBanner({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[11px] leading-5 text-[var(--ve-text)]"
    >
      <IconAlertCircle
        size={17}
        className="mt-0.5 shrink-0 text-[var(--primary)]"
      />

      <p className="min-w-0 flex-1">{message}</p>

      <button
        type="button"
        aria-label="Dismiss message"
        onClick={onClose}
        className="shrink-0 text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <IconX size={15} />
      </button>
    </div>
  );
}

function EmptyState({
  icon: EmptyIcon = IconPackage,
  title,
  description,
  action,
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center sm:py-16">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
        <EmptyIcon size={24} stroke={1.7} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[var(--foreground)]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[var(--ve-text)]">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Sidebar({
  user,
  activeTab,
  onNavigate,
  ordersCount,
}) {
  const userName = getUserName(user);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-3 px-1"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
          <IconGift size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-[16px] font-extrabold tracking-tight text-[var(--foreground)]">
            Tranzift
          </p>

          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--ve-text)]">
            Gift card wallet
          </p>
        </div>
      </Link>

      <div className="mt-7 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
            <IconUser size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-[var(--foreground)]">
              {userName}
            </p>

            <p className="mt-1 truncate text-[10px] text-[var(--ve-text)]">
              {user?.email || user?.mobile || 'Customer account'}
            </p>
          </div>

          <IconShieldCheck
            size={17}
            className="shrink-0 text-[var(--success)]"
          />
        </div>

        <p className="mt-3 truncate text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {getRole(user) || 'Customer'}
        </p>
      </div>

      <div className="mt-4 shrink-0 overflow-hidden rounded-xl bg-[var(--ve-dark)] p-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-white/70">
            Your account
          </span>

          <IconSparkles
            size={17}
            className="text-[var(--ve-gold2)]"
          />
        </div>

        <p className="mt-3 text-[16px] font-bold">
          Welcome to Tranzift
        </p>

        <p className="mt-1 text-[10px] leading-5 text-white/60">
          Manage your purchases and gift card activity in one place.
        </p>

        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-white transition hover:text-[var(--ve-gold2)]"
        >
          View purchases
          <IconArrowRight size={14} />
        </button>
      </div>

      <nav className="mt-7 min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1 pb-3 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
        {NAVIGATION.map((section) => (
          <div key={section.heading}>
            <p className="mb-2.5 px-2 text-[9px] font-extrabold tracking-[0.16em] text-[var(--muted)]">
              {section.heading}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const ItemIcon = item.icon;
                const active = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[11px] transition ${
                      active
                        ? 'bg-[var(--accent-light)] font-bold text-[var(--primary-dark)]'
                        : 'font-medium text-[var(--ve-text)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <ItemIcon
                      size={17}
                      stroke={1.8}
                      className={
                        active
                          ? 'text-[var(--primary-dark)]'
                          : 'text-[var(--muted)] group-hover:text-[var(--primary)]'
                      }
                    />

                    <span className="min-w-0 flex-1">
                      {item.label}
                    </span>

                    {item.id === 'orders' && ordersCount > 0 && (
                      <span className="rounded-md bg-[var(--background)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--ve-text)]">
                        {ordersCount}
                      </span>
                    )}

                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-3 shrink-0 rounded-xl border border-[var(--border)] p-3">
        <div className="flex items-center gap-2">
          <IconLock
            size={16}
            className="text-[var(--success)]"
          />

          <span className="text-[10px] font-bold text-[var(--foreground)]">
            Secure account
          </span>
        </div>

        <p className="mt-1.5 text-[10px] leading-5 text-[var(--ve-text)]">
          Keep your account credentials private.
        </p>
      </div>

      <p className="mt-3 shrink-0 px-1 pb-1 text-[9px] text-[var(--muted)]">
        © 2026 Tranzift
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, token, isReady, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('rewards');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [cardNumber, setCardNumber] = useState('');
  const [cardPin, setCardPin] = useState('');

  const userName = getUserName(user);
  const userInitials = getInitials(userName);

  const requestedTab = searchParams.get('tab');
  const requestedOrderId = searchParams.get('order_id');

  const fetchOrders = useCallback(
    async (signal) => {
      if (!token || !user) {
        setOrders([]);
        setOrdersLoading(false);
        return;
      }

      if (!API_URL) {
        setOrdersError(
          'API URL is not configured. Please check NEXT_PUBLIC_API_URL in .env.local.'
        );
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);
      setOrdersError('');

      try {
        const baseUrl = API_URL.replace(/\/+$/, '');

        const endpoint = ORDERS_ENDPOINT.startsWith('/')
          ? ORDERS_ENDPOINT
          : `/${ORDERS_ENDPOINT}`;

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          signal,
        });

        if (response.status === 401) {
          setOrders([]);
          setOrdersError('Your session has expired. Please sign in again.');
          router.replace('/');
          return;
        }

        const result = await response.json();

        if (!response.ok || result?.status === false) {
          throw new Error(
            result?.message ||
              `Unable to load orders. HTTP ${response.status}.`
          );
        }

        if (!Array.isArray(result?.data)) {
          throw new Error(
            'The orders API did not return the expected data array.'
          );
        }

        setOrders(result.data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Customer orders API error:', error);
          setOrdersError(error.message || 'Unable to load orders.');
        }
      } finally {
        if (!signal?.aborted) {
          setOrdersLoading(false);
        }
      }
    },
    [token, user, router]
  );

  useEffect(() => {
    if (!isReady) return;

    if (!token || !user) {
      router.replace('/');
    }
  }, [isReady, token, user, router]);

  useEffect(() => {
    if (!isReady || !token || !user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const controller = new AbortController();

    fetchOrders(controller.signal);

    return () => controller.abort();
  }, [isReady, token, user, fetchOrders]);

  useEffect(() => {
    if (requestedTab && VALID_TABS.includes(requestedTab)) {
      setActiveTab(requestedTab);
      setMobileMenuOpen(false);
    } else if (!requestedTab) {
      setActiveTab('rewards');
    }
  }, [requestedTab]);

  useEffect(() => {
    if (!requestedOrderId || !orders.length) return;

    const order = orders.find(
      (item) => getOrderId(item) === String(requestedOrderId)
    );

    if (order) {
      setExpandedOrderId(getOrderId(order));
      setActiveTab('orders');
    }
  }, [requestedOrderId, orders]);

  const successfulOrders = useMemo(
    () =>
      orders.filter((order) =>
        ['paid', 'success', 'captured'].includes(
          String(getPaymentStatus(order)).toLowerCase()
        )
      ),
    [orders]
  );

  const totalSpent = useMemo(
    () =>
      successfulOrders.reduce(
        (sum, order) => sum + getOrderAmount(order),
        0
      ),
    [successfulOrders]
  );

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = String(getPaymentStatus(order)).toLowerCase();

      const matchesFilter =
        filter === 'All' ||
        (filter === 'Successful' &&
          ['paid', 'success', 'captured'].includes(status)) ||
        (filter === 'Pending' &&
          ['pending', 'processing', 'created'].includes(status)) ||
        (filter === 'Failed' &&
          ['failed', 'cancelled', 'declined'].includes(status));

      const matchesSearch =
        !query ||
        getOrderId(order).toLowerCase().includes(query) ||
        String(order?.order_id || '').toLowerCase().includes(query) ||
        String(order?.transaction?.transaction_id || '')
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  const navigate = useCallback(
    (id) => {
      setMobileMenuOpen(false);
      setMessage('');

      if (id === 'logout') {
        handleLogout();
        return;
      }

      setActiveTab(id);

      if (id === 'rewards') {
        router.replace('/dashboard');
      } else {
        router.replace(`/dashboard?tab=${encodeURIComponent(id)}`);
      }
    },
    [router]
  );

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setMessage('');

    try {
      await logout();
      router.replace('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setMessage('Unable to sign out. Please try again.');
      setLoggingOut(false);
    }
  }

  function submitGiftCard(event) {
    event.preventDefault();

    setMessage('');

    if (!cardNumber.trim()) {
      setMessage('Please enter your gift card number.');
      return;
    }

    setMessage(
      'Gift card verification is not connected to a provider API yet. No card has been saved.'
    );
  }

  function renderOverview() {
    const recentOrders = [...orders]
      .sort((a, b) => {
        const first = new Date(a.created_at || a.createdAt || 0).getTime();
        const second = new Date(b.created_at || b.createdAt || 0).getTime();

        return second - first;
      })
      .slice(0, 5);

    return (
      <>
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-[var(--ve-dark)] p-5 text-white sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[30px] border-white/[0.04]" />

          <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-[var(--primary)]/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-semibold text-white/80">
              <IconSparkles
                size={13}
                className="text-[var(--ve-gold2)]"
              />
              YOUR TRANZIFT ACCOUNT
            </div>

            <h1 className="mt-5 text-[25px] font-bold tracking-tight sm:text-[32px]">
              Welcome back, {userName.split(' ')[0]}!
            </h1>

            <p className="mt-2 max-w-lg text-[11px] leading-6 text-white/65 sm:text-[12px]">
              Manage your gift card purchases, review your order history and
              keep track of your account in one convenient place.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-4 py-2 text-[10px] font-bold text-[var(--ve-dark)] transition hover:bg-white/90"
              >
                <IconShoppingBag size={15} />
                Explore gift cards
                <IconArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => navigate('orders')}
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold text-white transition hover:bg-white/10"
              >
                <IconHistory size={15} />
                View orders
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-5 right-6 hidden h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] lg:flex">
            <IconGift
              size={56}
              stroke={1.1}
              className="text-[var(--ve-gold2)]"
            />
          </div>
        </div>

        <MessageBanner
          message={message}
          onClose={() => setMessage('')}
        />

        <PageHeader
          eyebrow="ACCOUNT OVERVIEW"
          title="Your dashboard"
          description="A quick overview of your account and recent purchases."
          action={
            <PrimaryButton
              onClick={() => fetchOrders()}
              disabled={ordersLoading}
            >
              <IconRefresh
                size={15}
                className={ordersLoading ? 'animate-spin' : ''}
              />
              Refresh activity
            </PrimaryButton>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total orders"
            value={orders.length}
            caption="Purchases in your account"
            icon={IconShoppingBag}
          />

          <StatCard
            label="Successful payments"
            value={successfulOrders.length}
            caption="Orders marked as paid"
            icon={IconCircleCheck}
            tone="green"
          />

          <StatCard
            label="Successful order value"
            value={formatMoney(totalSpent)}
            caption="Based on successful orders"
            icon={IconWallet}
            tone="orange"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-[12px] font-bold text-[var(--foreground)]">
                  Recent orders
                </h2>

                <p className="mt-1 text-[10px] text-[var(--ve-text)]">
                  Your latest purchase activity
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('orders')}
                className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-[var(--primary-dark)] hover:underline"
              >
                View all
                <IconArrowRight size={13} />
              </button>
            </div>

            {ordersLoading && orders.length === 0 ? (
              <div className="flex justify-center py-12">
                <IconLoader2
                  size={24}
                  className="animate-spin text-[var(--primary)]"
                />
              </div>
            ) : ordersError && orders.length === 0 ? (
              <div className="p-5">
                <p className="text-[11px] leading-5 text-red-600">
                  {ordersError}
                </p>

                <button
                  type="button"
                  onClick={() => fetchOrders()}
                  className="mt-3 text-[10px] font-bold text-[var(--primary-dark)]"
                >
                  Try again
                </button>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={IconShoppingBag}
                  title="No purchases yet"
                  description="Your orders will appear here when the customer orders API returns your purchases."
                  action={
                    <PrimaryButton onClick={() => router.push('/')}>
                      Explore gift cards
                      <IconArrowRight size={14} />
                    </PrimaryButton>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {recentOrders.map((order, index) => {
                  const id = getOrderId(order) || `order-${index}`;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setExpandedOrderId(id);
                        navigate('orders');
                      }}
                      className="flex w-full min-w-0 items-center gap-3 px-4 py-4 text-left transition hover:bg-[var(--background)] sm:px-5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
                        <IconPackage size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-[var(--foreground)]">
                          Order #{id}
                        </p>

                        <p className="mt-1 text-[9px] text-[var(--ve-text)]">
                          {formatDate(order.created_at || order.createdAt)}
                        </p>

                        <div className="mt-2">
                          <StatusBadge value={getPaymentStatus(order)} />
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[12px] font-bold text-[var(--foreground)]">
                          {formatMoney(getOrderAmount(order), getCurrency(order))}
                        </p>

                        <IconChevronRight
                          size={15}
                          className="ml-auto mt-2 text-[var(--muted)]"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <h2 className="text-[12px] font-bold text-[var(--foreground)]">
              Quick actions
            </h2>

            <p className="mt-1 text-[10px] leading-5 text-[var(--ve-text)]">
              Access the main sections of your account.
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  label: 'Browse gift cards',
                  description: 'Discover available products',
                  icon: IconGift,
                  action: () => router.push('/'),
                },
                {
                  label: 'Order history',
                  description: 'Review your purchases',
                  icon: IconHistory,
                  action: () => navigate('orders'),
                },
                {
                  label: 'My profile',
                  description: 'Review your account details',
                  icon: IconUser,
                  action: () => navigate('profile'),
                },
              ].map((item) => {
                const ItemIcon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-left transition hover:border-[var(--primary-light)] hover:bg-[var(--accent-light)]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--primary-dark)]">
                      <ItemIcon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-[var(--foreground)]">
                        {item.label}
                      </p>

                      <p className="mt-1 text-[9px] text-[var(--ve-text)]">
                        {item.description}
                      </p>
                    </div>

                    <IconChevronRight
                      size={15}
                      className="shrink-0 text-[var(--muted)]"
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
              <div className="flex items-center gap-2">
                <IconShieldCheck
                  size={17}
                  className="text-[var(--success)]"
                />

                <p className="text-[10px] font-bold text-[var(--foreground)]">
                  Account protection
                </p>
              </div>

              <p className="mt-2 text-[10px] leading-5 text-[var(--ve-text)]">
                Never share your password, login token or gift card PIN with
                anyone.
              </p>
            </div>
          </section>
        </div>
      </>
    );
  }

  function renderOrders() {
    return (
      <>
        <PageHeader
          eyebrow="PURCHASE ACTIVITY"
          title="Order history"
          description="Review your purchases, payment statuses and order details."
          action={
            <div className="flex flex-wrap gap-2">
              <PrimaryButton
                onClick={() => fetchOrders()}
                disabled={ordersLoading}
              >
                <IconRefresh
                  size={15}
                  className={ordersLoading ? 'animate-spin' : ''}
                />
                Refresh
              </PrimaryButton>

              <PrimaryButton onClick={() => router.push('/')}>
                <IconShoppingBag size={15} />
                Shop
              </PrimaryButton>
            </div>
          }
        />

        <MessageBanner
          message={message}
          onClose={() => setMessage('')}
        />

        {ordersError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-[11px] font-bold text-red-700">
              Unable to load orders
            </p>

            <p className="mt-1.5 break-words text-[10px] leading-5 text-red-600">
              {ordersError}
            </p>

            <button
              type="button"
              onClick={() => fetchOrders()}
              className="mt-3 text-[10px] font-bold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total orders"
            value={orders.length}
            caption="Retrieved purchase records"
            icon={IconShoppingBag}
          />

          <StatCard
            label="Successful payments"
            value={successfulOrders.length}
            caption="Paid or captured orders"
            icon={IconCircleCheck}
            tone="green"
          />

          <StatCard
            label="Successful order value"
            value={formatMoney(totalSpent)}
            caption="Combined successful orders"
            icon={IconWallet}
            tone="orange"
          />
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[12px] font-bold text-[var(--foreground)]">
                All purchases
              </h2>

              <p className="mt-1 text-[10px] text-[var(--ve-text)]">
                Search and filter your order history.
              </p>
            </div>

            <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 lg:max-w-xs">
              <IconSearch
                size={15}
                className="shrink-0 text-[var(--muted)]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order ID..."
                className="w-full bg-transparent text-[11px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] px-4 py-3 sm:px-5">
            {['All', 'Successful', 'Pending', 'Failed'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold transition ${
                  filter === item
                    ? 'bg-[var(--accent-light)] text-[var(--primary-dark)]'
                    : 'bg-[var(--background)] text-[var(--ve-text)] hover:text-[var(--foreground)]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {ordersLoading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <IconLoader2
                size={27}
                className="animate-spin text-[var(--primary)]"
              />

              <p className="mt-3 text-[10px] text-[var(--ve-text)]">
                Loading your orders...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={IconPackage}
                title="No orders yet"
                description="Your purchases will appear here when they are available from the customer orders API."
                action={
                  <PrimaryButton onClick={() => router.push('/')}>
                    Explore gift cards
                    <IconArrowRight size={14} />
                  </PrimaryButton>
                }
              />
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={IconSearch}
                title="No matching orders"
                description="Try another order reference or select a different status filter."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setFilter('All');
                    }}
                    className="text-[10px] font-bold text-[var(--primary-dark)] hover:underline"
                  >
                    Clear filters
                  </button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {visibleOrders.map((order, index) => {
                const orderId = getOrderId(order) || `order-${index}`;
                const isExpanded = expandedOrderId === orderId;
                const isHighlighted =
                  Boolean(requestedOrderId) &&
                  String(requestedOrderId) === orderId;

                const transaction = order.transaction || {};
                const items = parseArray(order.items);
                const products = parseArray(order.products);
                const currency = getCurrency(order);

                return (
                  <article
                    key={orderId}
                    className={
                      isHighlighted
                        ? 'bg-[var(--accent-light)]/30'
                        : 'bg-[var(--surface)]'
                    }
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
                            <IconPackage size={21} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="break-all text-[11px] font-bold text-[var(--foreground)]">
                              Order #{order.order_id || orderId}
                            </h3>

                            <p className="mt-1.5 text-[10px] text-[var(--ve-text)]">
                              {formatDate(order.created_at || order.createdAt)}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <StatusBadge value={getPaymentStatus(order)} />
                              <StatusBadge value={getOrderStatus(order)} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <div className="sm:text-right">
                            <p className="text-[9px] text-[var(--ve-text)]">
                              Order total
                            </p>

                            <p className="mt-1 text-[19px] font-bold text-[var(--foreground)]">
                              {formatMoney(getOrderAmount(order), currency)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId(
                                isExpanded ? null : orderId
                              )
                            }
                            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] font-bold text-[var(--foreground)] transition hover:border-[var(--primary-light)] hover:bg-[var(--accent-light)]"
                          >
                            {isExpanded ? 'Hide details' : 'Order details'}

                            <IconChevronRight
                              size={14}
                              className={`transition ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {items.map((item, itemIndex) => {
                            const productId =
                              item.product_id || item.productId;

                            const product = products.find((entry) => {
                              const savedId = entry.id || entry._id;

                              return (
                                productId &&
                                savedId &&
                                String(productId) === String(savedId)
                              );
                            });

                            const name =
                              item.product_name ||
                              item.name ||
                              product?.name ||
                              'Gift card';

                            const quantity = Number(item.quantity || 1);

                            const unitPrice = Number(
                              item.selected_amount ??
                                item.denomination ??
                                item.price ??
                                item.amount ??
                                0
                            );

                            const lineTotal = Number(
                              item.total ??
                                item.subtotal ??
                                unitPrice * quantity
                            );

                            return (
                              <div
                                key={String(
                                  item.cart_key ||
                                    item.product_id ||
                                    itemIndex
                                )}
                                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--primary-dark)]">
                                  <IconGift size={19} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-[var(--foreground)]">
                                    {name}
                                  </p>

                                  <p className="mt-1 text-[9px] text-[var(--ve-text)]">
                                    Qty: {quantity} · Unit price:{' '}
                                    {formatMoney(unitPrice, currency)}
                                  </p>
                                </div>

                                <p className="shrink-0 text-[10px] font-bold text-[var(--foreground)]">
                                  {formatMoney(lineTotal, currency)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isExpanded && (
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                          <h4 className="text-[11px] font-bold text-[var(--foreground)]">
                            Payment and order information
                          </h4>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {[
                              ['Order reference', order.order_id || orderId],
                              ['Payment method', order.payment_method || 'N/A'],
                              ['Currency', currency],
                              ['Subtotal', formatMoney(order.subtotal, currency)],
                              ['Discount', formatMoney(order.discount, currency)],
                              ['Order total', formatMoney(getOrderAmount(order), currency)],
                              ['Transaction ID', transaction.transaction_id || 'N/A'],
                              ['Transaction status', transaction.status || 'N/A'],
                              ['Payment gateway', transaction.payment_gateway || 'N/A'],
                              ['Razorpay payment ID', order.razorpay_payment_id || 'N/A'],
                              ['Razorpay order ID', order.razorpay_order_id || 'N/A'],
                              ['Woohoo reference', order.woohoo_refno || 'N/A'],
                              ['Woohoo order ID', order.woohoo_response?.orderId || 'N/A'],
                              ['Woohoo status', order.woohoo_order_status || order.woohoo_response?.status || 'N/A'],
                              ['Created at', formatDate(order.created_at || order.createdAt)],
                              ['Updated at', formatDate(order.updated_at || order.updatedAt)],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                              >
                                <p className="text-[9px] font-semibold text-[var(--ve-text)]">
                                  {label}
                                </p>

                                <p className="mt-1.5 break-all text-[10px] font-bold text-[var(--foreground)]">
                                  {String(value)}
                                </p>
                              </div>
                            ))}
                          </div>

                          {products.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-[10px] font-bold text-[var(--foreground)]">
                                Product information
                              </h4>

                              <div className="mt-2 space-y-2">
                                {products.map((product, productIndex) => (
                                  <div
                                    key={String(
                                      product.id ||
                                        product._id ||
                                        product.sku ||
                                        productIndex
                                    )}
                                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                                  >
                                    <p className="text-[10px] font-bold text-[var(--foreground)]">
                                      {product.name || 'Gift card product'}
                                    </p>

                                    <p className="mt-1 text-[9px] text-[var(--ve-text)]">
                                      SKU: {product.sku || 'N/A'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderGiftCards() {
    return (
      <>
        <PageHeader
          eyebrow="YOUR COLLECTION"
          title="My Gift Cards"
          description="Manage your registered gift cards and view their verified balances."
          action={
            <PrimaryButton onClick={() => navigate('add-card')}>
              <IconPlus size={15} />
              Add new card
            </PrimaryButton>
          }
        />

        <MessageBanner
          message={message}
          onClose={() => setMessage('')}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="Registered gift cards"
            value="0"
            caption="Cards verified in your wallet"
            icon={IconGift}
          />

          <StatCard
            label="Verified balance"
            value={formatMoney(0)}
            caption="No verified card balance available"
            icon={IconWallet}
            tone="green"
          />
        </div>

        <div className="mt-6">
          <EmptyState
            icon={IconGift}
            title="Your wallet is ready"
            description="Gift cards will appear here after the gift card provider verification and wallet APIs are connected."
            action={
              <PrimaryButton onClick={() => navigate('add-card')}>
                <IconPlus size={14} />
                Register a gift card
              </PrimaryButton>
            }
          />
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <IconShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-[var(--success)]"
          />

          <div>
            <p className="text-[10px] font-bold text-[var(--foreground)]">
              Keep your gift cards safe
            </p>

            <p className="mt-1.5 text-[10px] leading-5 text-[var(--ve-text)]">
              Never share gift card PINs or redemption codes. Only use a
              verified provider to check balances.
            </p>
          </div>
        </div>
      </>
    );
  }

  function renderProfile() {
    const profileDetails = [
      ['Full name', userName],
      ['Email address', user?.email || 'Not provided'],
      ['Mobile number', user?.mobile || user?.phone || 'Not provided'],
      ['Account type', getRole(user) || 'Customer'],
      ['Account status', user?.status === 1 || user?.status === '1' ? 'Active' : 'Signed in'],
    ];

    return (
      <>
        <PageHeader
          eyebrow="ACCOUNT MANAGEMENT"
          title="My Profile"
          description="Review the account information associated with your current session."
        />

        <MessageBanner
          message={message}
          onClose={() => setMessage('')}
        />

        <section className="max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="flex items-center gap-4 border-b border-[var(--border)] pb-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-lg font-bold text-white">
              {userInitials}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[14px] font-bold text-[var(--foreground)]">
                {userName}
              </h2>

              <p className="mt-1 break-all text-[10px] text-[var(--ve-text)]">
                {user?.email || 'Email not provided'}
              </p>

              <div className="mt-2">
                <StatusBadge value="Active session" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profileDetails.map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3.5"
              >
                <p className="text-[9px] font-semibold text-[var(--ve-text)]">
                  {label}
                </p>

                <p className="mt-1.5 break-words text-[11px] font-bold text-[var(--foreground)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-[var(--background)] p-3.5">
            <IconLock
              size={16}
              className="mt-0.5 shrink-0 text-[var(--success)]"
            />

            <p className="text-[10px] leading-5 text-[var(--ve-text)]">
              Your profile is displayed using the authenticated user returned
              by AuthContext. Profile editing can be connected to your API
              separately.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-5 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3.5 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            {loggingOut ? (
              <IconLoader2 size={15} className="animate-spin" />
            ) : (
              <IconLogout size={15} />
            )}

            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </section>
      </>
    );
  }

  function renderAddCard() {
    return (
      <>
        <PageHeader
          eyebrow="GIFT CARD WALLET"
          title="Add a gift card"
          description="Register a card through a supported provider verification service."
        />

        <MessageBanner
          message={message}
          onClose={() => setMessage('')}
        />

        <section className="max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
            <IconCreditCard size={22} />
          </div>

          <h2 className="mt-4 text-[14px] font-bold text-[var(--foreground)]">
            Register your gift card
          </h2>

          <p className="mt-2 text-[11px] leading-5 text-[var(--ve-text)]">
            Enter your card details only when a secure provider verification
            endpoint is available.
          </p>

          <form onSubmit={submitGiftCard} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="gift-card-number"
                className="mb-1.5 block text-[10px] font-bold text-[var(--foreground)]"
              >
                Gift card number
              </label>

              <input
                id="gift-card-number"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                placeholder="Enter your gift card number"
                autoComplete="off"
                required
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-[11px] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="gift-card-pin"
                className="mb-1.5 block text-[10px] font-bold text-[var(--foreground)]"
              >
                Card PIN (if required)
              </label>

              <input
                id="gift-card-pin"
                value={cardPin}
                onChange={(event) => setCardPin(event.target.value)}
                placeholder="Enter PIN if required"
                type="password"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-[11px] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
              <IconShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-[var(--success)]"
              />

              <p className="text-[10px] leading-5 text-[var(--ve-text)]">
                Card registration is not active until a provider verification
                API is configured. This form does not save your card or PIN.
              </p>
            </div>

            <PrimaryButton type="submit">
              <IconCheck size={15} />
              Verify card
            </PrimaryButton>
          </form>
        </section>
      </>
    );
  }

  function renderBalance() {
    return (
      <>
        <PageHeader
          eyebrow="GIFT CARD WALLET"
          title="Check balance"
          description="Check your gift card balance through a supported provider service."
        />

        <MessageBanner
          message={message}
          onClose={() => setMessage('')}
        />

        <section className="max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
            <IconWallet size={22} />
          </div>

          <h2 className="mt-4 text-[14px] font-bold text-[var(--foreground)]">
            Verify available balance
          </h2>

          <p className="mt-2 text-[11px] leading-5 text-[var(--ve-text)]">
            A real balance can only be displayed after the gift card provider
            API confirms it.
          </p>

          <form onSubmit={submitGiftCard} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="balance-card-number"
                className="mb-1.5 block text-[10px] font-bold text-[var(--foreground)]"
              >
                Gift card number
              </label>

              <input
                id="balance-card-number"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                placeholder="Enter your gift card number"
                autoComplete="off"
                required
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-[11px] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <PrimaryButton type="submit">
              <IconSearch size={15} />
              Verify balance
            </PrimaryButton>
          </form>
        </section>
      </>
    );
  }

  if (!isReady || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-light)]">
            <IconGift
              size={24}
              className="text-[var(--primary-dark)]"
            />
          </div>

          <IconLoader2
            size={23}
            className="animate-spin text-[var(--primary)]"
          />

          <p className="text-[11px] font-medium text-[var(--ve-text)]">
            Verifying your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--background)] text-[var(--foreground)] antialiased">
      <div className="mx-auto flex h-full max-w-[1600px] overflow-hidden">
        <aside className="hidden h-full w-[250px] shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 lg:block xl:w-[285px] xl:px-5">
          <Sidebar
            user={user}
            activeTab={activeTab}
            onNavigate={navigate}
            ordersCount={orders.length}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="relative z-30 flex h-[64px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--background)] lg:hidden"
              >
                {mobileMenuOpen ? (
                  <IconX size={17} />
                ) : (
                  <IconMenu2 size={17} />
                )}
              </button>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[var(--foreground)] sm:text-[12px]">
                  Welcome back, {userName}
                </p>

                <p className="mt-0.5 hidden text-[9px] text-[var(--ve-text)] sm:block">
                  Manage your account and purchases.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-2 text-[9px] font-semibold text-[var(--ve-text)] sm:flex">
                <IconShieldCheck
                  size={14}
                  className="text-[var(--success)]"
                />
                Secure account
              </span>

              <button
                type="button"
                onClick={() => navigate('orders')}
                aria-label="View order history"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ve-text)] transition hover:bg-[var(--background)]"
              >
                <IconBell size={17} />
                {orders.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('profile')}
                aria-label="Open profile"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ve-dark)] text-[10px] font-bold text-white transition hover:opacity-90"
              >
                {userInitials}
              </button>
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="absolute inset-0 z-40 bg-black/30 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute inset-0 h-full w-full cursor-default"
              />

              <aside className="relative flex h-full w-[min(300px,86vw)] flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 shadow-xl">
                <div className="mb-4 flex shrink-0 items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    Navigation
                  </p>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]"
                  >
                    <IconX size={16} />
                  </button>
                </div>

                <div className="min-h-0 flex-1">
                  <Sidebar
                    user={user}
                    activeTab={activeTab}
                    onNavigate={navigate}
                    ordersCount={orders.length}
                  />
                </div>
              </aside>
            </div>
          )}

          <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
            <div className="mx-auto min-w-0 max-w-[1320px] px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 xl:px-10">
              {activeTab === 'rewards' && renderOverview()}

              {activeTab === 'gift-cards' && renderGiftCards()}

              {activeTab === 'orders' && renderOrders()}

              {activeTab === 'profile' && renderProfile()}

              {activeTab === 'add-card' && renderAddCard()}

              {activeTab === 'check-balance' && renderBalance()}

              <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-[var(--border)] pt-4 text-[9px] text-[var(--muted)] sm:flex-row sm:items-center">
                <p>© 2026 Tranzift. All rights reserved.</p>

                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1">
                    <IconLock size={12} />
                    Secure account
                  </span>

                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 transition hover:text-[var(--primary-dark)]"
                  >
                    Help & Support
                    <IconExternalLink size={11} />
                  </Link>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>

      {loggingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
          <div className="flex w-full max-w-xs flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
            <IconLoader2
              size={28}
              className="animate-spin text-[var(--primary)]"
            />

            <p className="mt-3 text-[12px] font-bold text-[var(--foreground)]">
              Signing you out
            </p>

            <p className="mt-1 text-center text-[10px] text-[var(--ve-text)]">
              Please wait while your session is closed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
