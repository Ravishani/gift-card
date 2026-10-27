'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconMail,
  IconPhone,
  IconMapPin,
  IconArrowUpRight,
  IconShieldCheck,
  IconGift,
  IconCreditCard,
  IconBolt,
  IconHeadset,
  IconArrowRight,
  IconCheck,
  IconSparkles,
  IconHeart,
  IconLock,
  IconSend,
} from '@tabler/icons-react';

const companyLinks = [
  { name: 'Home', href: '/' },
  { name: 'Gift Cards', href: '/gift-cards' },
  { name: 'Special Offers', href: '/offers' },
  { name: 'Corporate Gifting', href: '/corporate-gifts' },
  { name: 'About Tranzift', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
];

const giftLinks = [
  { name: 'Shopping & Fashion', href: '/gift-cards?category=shopping' },
  { name: 'Food & Dining', href: '/gift-cards?category=food' },
  { name: 'Entertainment', href: '/gift-cards?category=entertainment' },
  { name: 'Travel & Experiences', href: '/gift-cards?category=travel' },
  { name: 'Lifestyle', href: '/gift-cards?category=lifestyle' },
  { name: 'Corporate Gifts', href: '/corporate-gifts' },
];

const supportLinks = [
  { name: 'Help Center', href: '/help' },
  { name: 'Track My Order', href: '/orders' },
  { name: 'Refund Policy', href: '/refund-policy' },
  { name: 'Cancellation Policy', href: '/cancellation-policy' },
  { name: 'Terms & Conditions', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
];

const socials = [
  { name: 'Facebook', href: '#', icon: IconBrandFacebook },
  { name: 'Instagram', href: '#', icon: IconBrandInstagram },
  { name: 'LinkedIn', href: '#', icon: IconBrandLinkedin },
  { name: 'Twitter', href: '#', icon: IconBrandTwitter },
  { name: 'YouTube', href: '#', icon: IconBrandYoutube },
];

export default function Footer() {
  const handleSubscribe = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const email = new FormData(form).get('email');

    if (!email) return;

    form.reset();
  };

  return (
     <footer className="relative isolate overflow-hidden bg-[#06111f] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[var(--ve-gold,#d4a017)]/[0.10] blur-[120px]" />

        <div className="absolute -right-40 top-1/4 h-[400px] w-[400px] rounded-full bg-[var(--ve-gold2,#e8b84b)]/[0.08] blur-[130px]" />

        <div className="absolute bottom-0 left-1/3 h-[300px] w-[500px] rounded-full bg-[var(--ve-gold,#d4a017)]/[0.06] blur-[130px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-7 lg:px-12">
       

        <section className="grid gap-10 py-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-[1.35fr_0.85fr_1fr_0.9fr_1.3fr] lg:gap-9 lg:py-16">
          <div>
            <Link
              href="/"
              aria-label="Tranzift home"
              className="group inline-flex items-center"
            >
              <div className="relative h-12 w-40 transition-transform duration-300 group-hover:scale-[1.03]">
                <Image
                  src="/T4.webp"
                  alt="Tranzift"
                  fill
                  className="object-contain object-left"
                  sizes="160px"
                />
              </div>
            </Link>

            <p className="mt-5 max-w-[310px] text-[13px] leading-7 text-white/55">
              Your destination for delightful digital gifting. Discover
              meaningful gifts from your favourite brands and make every
              celebration count.
            </p>

            <div className="mt-6 space-y-3">
              <ContactRow
                icon={<IconMail size={18} stroke={1.6} />}
                title="Email us"
                text="support@tranzift.com"
                href="mailto:support@tranzift.com"
              />

              <ContactRow
                icon={<IconPhone size={18} stroke={1.6} />}
                title="Call us"
                text="+91 99999 99999"
                href="tel:+919999999999"
              />

              <ContactRow
                icon={<IconMapPin size={18} stroke={1.6} />}
                title="Our presence"
                text="India"
              />
            </div>

            <div className="mt-7">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Connect with us
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {socials.map((social) => {
                  const SocialIcon = social.icon;

                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      aria-label={social.name}
                      className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-white/55 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ve-gold,#d4a017)]/50 hover:bg-[var(--ve-gold,#d4a017)]/10 hover:text-[var(--ve-gold2,#e8b84b)]"
                    >
                      <SocialIcon
                        size={18}
                        stroke={1.7}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <FooterLinks title="Company" links={companyLinks} />

          <FooterLinks title="Explore Gifts" links={giftLinks} />

          <FooterLinks title="Customer Care" links={supportLinks} />

          <div className="sm:col-span-2 lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.055] to-white/[0.015] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--ve-gold,#d4a017)]/25 bg-[var(--ve-gold,#d4a017)]/10 text-[var(--ve-gold2,#e8b84b)]">
                  <IconSparkles size={22} stroke={1.6} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    The Gift Edit
                  </h3>

                  <p className="mt-1 text-[11px] text-white/45">
                    A little joy in your inbox.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[13px] leading-6 text-white/55">
                Get the latest gift cards, exclusive offers and inspiration
                for your next celebration.
              </p>

              <form onSubmit={handleSubscribe} className="mt-5">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>

                <div className="flex min-h-[49px] items-center gap-2 rounded-xl border border-white/[0.12] bg-black/20 p-1.5 transition duration-300 focus-within:border-[var(--ve-gold,#d4a017)]/60 focus-within:ring-4 focus-within:ring-[var(--ve-gold,#d4a017)]/[0.08]">
                  <IconMail
                    size={18}
                    stroke={1.6}
                    className="ml-2 shrink-0 text-[var(--ve-gold2,#e8b84b)]"
                  />

                  <input
                    id="footer-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email address"
                    className="min-w-0 flex-1 bg-transparent px-1 text-xs text-white outline-none placeholder:text-white/35"
                  />

                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ve-gold,#d4a017)] to-[var(--ve-gold2,#e8b84b)] px-3 text-xs font-bold text-[#171717] transition duration-300 hover:brightness-110"
                  >
                    Join
                    <IconSend size={14} />
                  </button>
                </div>
              </form>

              <div className="mt-3 flex items-start gap-2 text-[10px] leading-5 text-white/40">
                <IconCheck
                  size={14}
                  className="mt-0.5 shrink-0 text-[var(--ve-gold2,#e8b84b)]"
                />
                <span>Helpful updates only. Unsubscribe anytime.</span>
              </div>

              <div className="my-5 h-px bg-white/[0.08]" />

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-[var(--ve-gold2,#e8b84b)]">
                  <IconHeadset size={20} stroke={1.6} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-white/90">
                    Need a hand?
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-white/45">
                    Our support team is here to help.
                  </p>

                  <Link
                    href="/contact"
                    className="group mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--ve-gold2,#e8b84b)] transition hover:text-white"
                  >
                    Get in touch
                    <IconArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.08] py-8 lg:py-9">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ve-gold2,#e8b84b)]">
                The Tranzift promise
              </p>

              <p className="mt-2 text-sm font-semibold text-white/90">
                Thoughtful gifting. A smoother experience.
              </p>
            </div>

            <p className="max-w-md text-xs leading-6 text-white/40 sm:text-right">
              Discover gifts for the people who make every moment matter.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TrustItem
              icon={<IconShieldCheck size={21} stroke={1.6} />}
              title="Secure Shopping"
              text="A safer checkout experience"
            />

            <TrustItem
              icon={<IconBolt size={21} stroke={1.6} />}
              title="Digital Convenience"
              text="Simple and convenient gifting"
            />

            <TrustItem
              icon={<IconCreditCard size={21} stroke={1.6} />}
              title="Easy Checkout"
              text="A smooth payment experience"
            />

            <TrustItem
              icon={<IconHeart size={21} stroke={1.6} />}
              title="Gifts That Matter"
              text="Make every occasion memorable"
            />
          </div>
        </section>
      </div>

      <div className="border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/privacy-policy"
              className="text-[11px] text-white/45 transition hover:text-[var(--ve-gold2,#e8b84b)]"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="text-[11px] text-white/45 transition hover:text-[var(--ve-gold2,#e8b84b)]"
            >
              Terms & Conditions
            </Link>

            <Link
              href="/refund-policy"
              className="text-[11px] text-white/45 transition hover:text-[var(--ve-gold2,#e8b84b)]"
            >
              Refund Policy
            </Link>

            <Link
              href="/cancellation-policy"
              className="text-[11px] text-white/45 transition hover:text-[var(--ve-gold2,#e8b84b)]"
            >
              Cancellation Policy
            </Link>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:gap-5">
            <div className="flex items-center gap-2 text-[10px] text-white/40">
              <IconLock
                size={14}
                className="text-[var(--ve-gold2,#e8b84b)]"
              />
              Shop with confidence
            </div>

            <p className="text-[11px] text-white/40">
              © {new Date().getFullYear()} Tranzift. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--ve-gold,#d4a017)]/70 to-transparent" />
    </footer>
  );
}

function ContactRow({ icon, title, text, href }) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-[#f5ca69] transition duration-300 group-hover:border-[#e8b84b]/35 group-hover:bg-[#e8b84b]/10">
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-[10px] text-slate-400">
          {title}
        </span>

        <span className="mt-1 block break-words text-xs font-medium text-slate-200/85 transition-colors group-hover:text-white">
          {text}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="group flex min-w-0 items-center gap-3"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="group flex min-w-0 items-center gap-3">
      {content}
    </div>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
        {title}
      </h3>

      <div className="mt-3 h-[2px] w-9 rounded-full bg-gradient-to-r from-[var(--ve-gold,#d4a017)] to-[var(--ve-gold2,#e8b84b)]" />

      <ul className="mt-6 space-y-4">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="group inline-flex items-start gap-2.5 text-[12px] leading-5 text-white/50 transition-all duration-300 hover:translate-x-1 hover:text-white/95"
            >
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--ve-gold,#d4a017)]/70 transition-all duration-300 group-hover:scale-150 group-hover:bg-[var(--ve-gold2,#e8b84b)]" />

              <span>{link.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrustItem({ icon, title, text }) {
  return (
    <div className="group flex min-w-0 items-center gap-3.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--ve-gold,#d4a017)]/25 hover:bg-white/[0.05]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--ve-gold,#d4a017)]/20 bg-[var(--ve-gold,#d4a017)]/[0.08] text-[var(--ve-gold2,#e8b84b)] transition-all duration-300 group-hover:border-[var(--ve-gold,#d4a017)]/35 group-hover:bg-[var(--ve-gold,#d4a017)]/[0.16]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/90">{title}</p>

        <p className="mt-1 text-[11px] leading-5 text-white/45">
          {text}
        </p>
      </div>
    </div>
  );
}
