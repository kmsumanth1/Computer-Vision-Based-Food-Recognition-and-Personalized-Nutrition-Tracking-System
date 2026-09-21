import type { ReactNode } from 'react';
import Logo from '../common/Logo';
import MeterDial from '../common/MeterDial';

function PlateIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <circle cx="60" cy="60" r="50" fill="#F3F7F4" />
      <circle cx="60" cy="60" r="39" fill="#FFFFFF" stroke="#DCE4DF" strokeWidth="1.5" />
      <ellipse cx="47" cy="66" rx="17" ry="13" fill="#F2EEDC" />
      <g fill="#DCD3AE">
        <circle cx="42" cy="62" r="1.6" />
        <circle cx="49" cy="60" r="1.6" />
        <circle cx="53" cy="67" r="1.6" />
        <circle cx="43" cy="70" r="1.6" />
      </g>
      <path d="M62 50c9-6 22-3 25 6s-3 20-13 20-20-12-12-26Z" fill="#D9A066" />
      <path d="M68 55c5-2 10 0 12 4" stroke="#B8793C" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="58" cy="44" r="6.5" fill="#5FB37F" />
      <circle cx="66" cy="42" r="5" fill="#3F9C7A" />
      <circle cx="74" cy="82" r="5" fill="#E5484D" />
    </svg>
  );
}

function ScanFrame() {
  const corner = 'absolute h-5 w-5 border-volt';
  return (
    <div className="relative h-[46%] w-[46%]">
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <PlateIllustration />
        <div className="absolute inset-x-0 top-0 h-full">
          <div className="h-0.5 w-full animate-scan-sweep bg-volt shadow-[0_0_14px_2px_rgba(205,245,100,0.7)]" />
        </div>
      </div>
      <span className={`${corner} left-0 top-0 rounded-tl-lg border-l-[3px] border-t-[3px]`} />
      <span className={`${corner} right-0 top-0 rounded-tr-lg border-r-[3px] border-t-[3px]`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-lg border-b-[3px] border-l-[3px]`} />
      <span className={`${corner} bottom-0 right-0 rounded-br-lg border-b-[3px] border-r-[3px]`} />
    </div>
  );
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Shown above the form card, e.g. the Login / Sign up tabs */
  tabs?: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer, tabs }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-pine-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo tone="dark" />
        <div className="mx-auto w-full max-w-md">
          {/* Decorative dial: illustrates the product, not real data */}
          <MeterDial progress={0.68} tone="dark" className="w-full">
            <ScanFrame />
          </MeterDial>
        </div>
        <div className="max-w-md">
          <h2 className="text-[2rem] font-semibold leading-[1.15] text-white">Point at your plate. See what’s in it.</h2>
          <p className="mt-3 text-white/70">
            Snap a photo, upload one, or scan a barcode. Set the weight and your calories and macros follow.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:min-h-0">
        <div className="w-full max-w-[26rem]">
          <Logo className="mb-8 lg:hidden" />
          {tabs}
          <div className="card p-6 sm:p-8">
            <h1 className="text-[1.625rem] font-semibold leading-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-ink-mute">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer && <p className="mt-5 text-center text-sm text-ink-soft">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
