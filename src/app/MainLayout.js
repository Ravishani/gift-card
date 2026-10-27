'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from './layouts/header';
import Footer from './layouts/footer';
import { useAuth } from './context/AuthContext';

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    token,
    user,
    isReady,
  } = useAuth();

  const isDashboard =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/');

  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    if (!isReady || !isDashboard) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [
    isReady,
    isDashboard,
    isAuthenticated,
    router,
  ]);

  if (isDashboard && (!isReady || !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-purple-700" />

          <p className="text-sm font-medium text-gray-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!isDashboard && <Header />}

      <main className="flex-1">
        {children}
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
}
