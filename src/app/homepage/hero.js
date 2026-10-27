'use client';

import Link from 'next/link';
import {
  IconArrowRight,
  IconGift,
  IconBolt,
  IconShieldCheck,
  IconSparkles,
  IconShoppingBag,
  IconHeart,
  IconStar,
} from '@tabler/icons-react';

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[var(--ve-dark)] via-[var(--ve-dark2)] to-[var(--ve-navy)]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[var(--ve-gold)]/15 blur-3xl sm:-left-40 sm:-top-40 sm:h-[420px] sm:w-[420px]" />

      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-[var(--ve-navy)]/80 blur-3xl sm:-bottom-48 sm:-right-32 sm:h-[500px] sm:w-[500px]" />

      <div className="hero-pulse pointer-events-none absolute left-1/2 top-20 h-32 w-32 -translate-x-1/2 rounded-full bg-[var(--ve-gold2)]/10 blur-3xl sm:h-40 sm:w-40" />

      <div className="hero-sparkle pointer-events-none absolute left-[8%] top-[25%] hidden h-2 w-2 rounded-full bg-[var(--ve-gold2)] shadow-[0_0_20px_var(--ve-gold)] lg:block" />

      <div
        className="hero-sparkle pointer-events-none absolute right-[12%] top-[20%] hidden h-2 w-2 rounded-full bg-[var(--ve-white)] shadow-[0_0_20px_var(--ve-white)] lg:block"
        style={{ animationDelay: '0.7s' }}
      />

      <div
        className="hero-sparkle pointer-events-none absolute bottom-[20%] left-[42%] hidden h-2 w-2 rounded-full bg-[var(--ve-gold2)] shadow-[0_0_20px_var(--ve-gold)] lg:block"
        style={{ animationDelay: '1.2s' }}
      />

      <div className="relative mx-auto w-full max-w-[1380px] px-4 py-10 sm:px-6 sm:py-12 md:px-8 lg:px-10 lg:py-16">
        <div className="grid min-w-0 items-center gap-8 sm:gap-10 lg:min-h-[500px] lg:grid-cols-[1fr_0.95fr] lg:gap-6">
          <div className="relative z-10 mx-auto w-full min-w-0 max-w-2xl lg:mx-0">
            <div className="hero-fade-1 hero-badge mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--ve-gold2)]/25 bg-[var(--ve-white)]/5 px-3 py-2 text-[10px] font-medium text-[var(--ve-white)] shadow-lg backdrop-blur-md sm:px-4 sm:text-xs">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ve-gold)]/20">
                <IconSparkles size={14} className="text-[var(--ve-gold2)]" />
              </span>

              <span>Perfect Gifts. Instant Delivery.</span>

              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ve-gold2)]" />
            </div>

            <h1 className="hero-fade-2 text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1.08] tracking-tight text-[var(--ve-white)]">
              Gift Cards That
              <span className="mt-1 block bg-gradient-to-r from-[var(--ve-gold)] via-[var(--ve-gold2)] to-[var(--accent-light)] bg-clip-text text-transparent">
                Make Every Moment
              </span>
              Special
            </h1>

            <p className="hero-fade-3 mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:mt-6 sm:text-base sm:leading-7">
              Discover gift cards from your favourite brands and send the
              perfect gift instantly. Easy, secure and made for every occasion.
            </p>

            <div className="hero-fade-4 mt-6 flex w-full flex-col gap-3 min-[420px]:flex-row sm:mt-8">
              <Link
                href="/gift-cards"
                className="group relative inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-[var(--ve-radius)] bg-gradient-to-r from-[var(--ve-gold)] to-[var(--ve-gold2)] px-4 py-3 text-center text-sm font-bold text-[var(--ve-dark)] shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:brightness-110 hover:shadow-2xl min-[420px]:w-auto min-[420px]:flex-1 sm:px-6"
              >
                <span className="relative z-10">Explore Gift Cards</span>

                <IconArrowRight
                  size={18}
                  className="relative z-10 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                />

                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[var(--ve-white)]/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>

              <Link
                href="/offers"
                className="group inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 rounded-[var(--ve-radius)] border border-[var(--ve-gold2)]/35 bg-[var(--ve-white)]/5 px-4 py-3 text-center text-sm font-semibold text-[var(--ve-white)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--ve-gold2)]/70 hover:bg-[var(--ve-gold)]/10 min-[420px]:w-auto min-[420px]:flex-1 sm:px-6"
              >
                <IconStar
                  size={17}
                  className="shrink-0 text-[var(--ve-gold2)] transition-transform group-hover:rotate-12"
                />
                View Offers
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:mt-9 sm:grid-cols-3 sm:gap-4">
              <Feature icon={<IconBolt size={17} />} text="Instant Delivery" />

              <Feature
                icon={<IconShieldCheck size={17} />}
                text="Secure Payment"
              />

              <Feature icon={<IconGift size={17} />} text="Best Offers" />
            </div>
          </div>

          <div className="relative mx-auto mt-2 h-[340px] w-full min-w-0 max-w-[600px] sm:mt-0 sm:h-[430px] md:h-[460px] lg:h-[500px]">
            <div className="hero-pulse pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ve-gold)]/10 blur-3xl sm:h-[380px] sm:w-[380px]" />

            <div className="hero-spin pointer-events-none absolute left-1/2 top-1/2 hidden h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--ve-gold2)]/25 lg:block" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--ve-white)]/10 min-[380px]:h-[260px] min-[380px]:w-[260px] sm:h-[340px] sm:w-[340px]" />

            <div className="hero-float-main absolute left-1/2 top-1/2 h-[210px] w-[min(76vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-gradient-to-br from-[var(--accent-light)] via-[var(--ve-gold2)] to-[var(--ve-gold)] p-[2px] shadow-[0_30px_80px_rgba(0,0,0,0.4)] min-[380px]:h-[225px] sm:h-[280px] sm:w-[410px] sm:rounded-[28px]">
              <div className="relative h-full overflow-hidden rounded-[20px] bg-gradient-to-br from-[var(--ve-navy)] via-[var(--ve-dark2)] to-[var(--ve-dark)] sm:rounded-[26px]">
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--ve-gold)]/20 blur-3xl" />

                <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[var(--ve-gold2)]/10 blur-2xl" />

                <div className="hero-shine pointer-events-none absolute -left-1/2 top-0 h-[150%] w-20 bg-[var(--ve-white)]/15 blur-xl" />

                <div className="relative flex h-full flex-col justify-between p-4 min-[380px]:p-5 sm:p-8">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-[var(--ve-white)] sm:gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ve-gold)]/30 to-[var(--ve-gold2)]/10 shadow-inner sm:h-10 sm:w-10 sm:rounded-xl">
                        <IconGift
                          size={21}
                          className="text-[var(--ve-gold2)]"
                        />
                      </div>

                      <span className="text-xs font-bold tracking-[0.1em] sm:text-sm sm:tracking-[0.12em]">
                        GIFT CARD
                      </span>
                    </div>

                    <span className="shrink-0 rounded-full border border-[var(--ve-gold2)]/30 bg-[var(--ve-gold)]/15 px-2 py-1 text-[8px] font-bold tracking-wider text-[var(--accent-light)] backdrop-blur-sm sm:px-3 sm:text-[10px]">
                      PREMIUM
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-300 sm:text-sm">
                      Give the gift of
                    </p>

                    <h3 className="mt-1 text-2xl font-black tracking-tight text-[var(--ve-white)] min-[380px]:text-3xl sm:text-4xl">
                      Happiness
                    </h3>

                    <div className="mt-3 flex items-center gap-2 sm:mt-4">
                      <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[var(--ve-gold)] to-[var(--ve-gold2)] sm:w-12" />

                      <span className="h-1.5 w-5 rounded-full bg-[var(--ve-gold2)]/50" />

                      <span className="h-1.5 w-2 rounded-full bg-[var(--ve-white)]/20" />
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-[var(--ve-gold2)] sm:text-[9px] sm:tracking-[0.2em]">
                        Gift Value
                      </p>

                      <p className="mt-1 text-lg font-black text-[var(--ve-white)] sm:text-xl">
                        ₹1,000
                      </p>
                    </div>

                    <div className="hero-sparkle flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--ve-gold2)]/20 bg-[var(--ve-gold)]/10 sm:h-11 sm:w-11">
                      <IconSparkles
                        size={21}
                        className="text-[var(--ve-gold2)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-float-left absolute left-0 top-3 z-10 w-[142px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-2xl shadow-black/30 min-[380px]:w-[158px] min-[380px]:p-3 sm:left-2 sm:top-8 sm:w-[245px] sm:rounded-2xl sm:p-5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--primary-dark)] sm:h-9 sm:w-9">
                  <IconShoppingBag size={17} />
                </div>

                <span className="text-[8px] font-bold tracking-wider text-[var(--primary-dark)] sm:text-[10px]">
                  SHOPPING
                </span>
              </div>

              <div className="mt-3 sm:mt-7">
                <div className="h-1.5 w-14 rounded-full bg-[var(--ve-gold)] sm:h-2 sm:w-20" />

                <div className="mt-2 h-1.5 w-9 rounded-full bg-[var(--ve-gold2)] sm:h-2 sm:w-12" />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[10px] font-semibold sm:mt-5 sm:text-xs">
                <span className="text-[var(--muted)]">₹500</span>

                <span className="rounded-full bg-[var(--accent-light)] px-1.5 py-1 text-[7px] font-bold text-[var(--primary-dark)] sm:px-2 sm:text-[9px]">
                  READY TO GIFT
                </span>
              </div>
            </div>

            <div className="hero-float-right absolute bottom-3 right-0 z-10 w-[145px] rounded-xl border border-[var(--ve-gold2)]/30 bg-gradient-to-br from-[var(--accent-light)] to-[var(--ve-white)] p-3 shadow-2xl shadow-black/30 min-[380px]:w-[165px] min-[380px]:p-3.5 sm:bottom-5 sm:right-2 sm:w-[245px] sm:rounded-2xl sm:p-5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[8px] font-black tracking-wider text-[var(--primary-dark)] sm:text-[10px]">
                  SPECIAL OFFER
                </span>

                <span className="rounded-full bg-gradient-to-r from-[var(--ve-gold)] to-[var(--ve-gold2)] px-2 py-1 text-[8px] font-bold text-[var(--ve-dark)] sm:text-[9px]">
                  SAVE
                </span>
              </div>

              <div className="mt-3 sm:mt-7">
                <p className="text-3xl font-black text-[var(--ve-dark)] sm:text-4xl">
                  10%
                </p>

                <p className="mt-1 text-[10px] leading-4 text-[var(--muted)] sm:text-xs sm:leading-5">
                  Extra value on selected gift cards
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 sm:mt-4">
                <IconHeart
                  size={13}
                  className="shrink-0 text-[var(--primary-dark)]"
                  fill="currentColor"
                />

                <span className="text-[9px] font-semibold text-[var(--primary-dark)] sm:text-[10px]">
                  Make someone smile
                </span>
              </div>
            </div>

            <div className="hero-float-slow absolute right-2 top-0 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ve-gold2)]/25 bg-[var(--ve-white)]/10 text-[var(--ve-gold2)] shadow-xl backdrop-blur-md min-[380px]:right-4 sm:right-16 sm:h-14 sm:w-14 sm:rounded-2xl">
              <IconSparkles size={21} className="hero-sparkle sm:hidden" />
              <IconSparkles
                size={24}
                className="hero-sparkle hidden sm:block"
              />
            </div>

            <div
              className="hero-float-slow absolute bottom-20 left-2 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ve-gold2)]/20 bg-[var(--ve-white)]/10 text-[var(--ve-gold2)] backdrop-blur-md min-[380px]:left-4 sm:bottom-24 sm:left-16 sm:h-11 sm:w-11"
              style={{ animationDelay: '-1s' }}
            >
              <IconGift size={18} />
            </div>

            <div
              className="hero-float-slow absolute right-[20%] top-[27%] hidden h-8 w-8 items-center justify-center rounded-lg bg-[var(--ve-gold)]/20 text-[var(--ve-gold2)] backdrop-blur-md sm:flex"
              style={{ animationDelay: '-2s' }}
            >
              <IconStar size={14} />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--ve-gold)]/60 to-transparent" />
    </section>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-slate-300 sm:text-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--ve-white)]/10 bg-[var(--ve-white)]/5">
        <span className="text-[var(--ve-gold2)]">{icon}</span>
      </span>

      <span className="leading-5">{text}</span>
    </div>
  );
}