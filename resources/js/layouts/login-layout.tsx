import { Link, usePage } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

export default function LoginLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name, setting } = usePage().props as any;
    const logo = setting?.light_logo
        ? `/${setting.light_logo}`
        : '/backend/assets/images/logo-placeholder.png';

    return (
        <main className="min-h-svh bg-[#f4f1eb] text-[#18232a]">
            <div className="login-shell">
                <section
                    className="login-hero relative isolate flex flex-col justify-between overflow-hidden bg-[#102d35] px-7 py-7 text-white sm:px-12 sm:py-10 lg:px-16 lg:py-12"
                    style={{
                        backgroundImage:
                            'linear-gradient(135deg, rgba(9, 31, 38, .94), rgba(17, 61, 66, .82)), url("/backend/assets/images/photo3.jpg")',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                    }}
                >
                    <div className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <Link href={home()} className="flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-white no-underline uppercase">
                            <img
                                src={logo}
                                alt={name || 'Pink House'}
                                style={{
                                    width: '150px',
                                    height: '62px',
                                    objectFit: 'contain',
                                    objectPosition: 'left center',
                                }}
                            />
                        </Link>
                        <span className="rounded-full border border-white/25 px-3 py-1.5 text-[10px] font-medium tracking-[0.18em] text-white/75 uppercase">Private access</span>
                    </div>

                    <div className="relative z-10 max-w-xl py-14 lg:py-0">
                        <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] text-[#d5b477] uppercase"><span className="h-px w-8 bg-[#d5b477]" />Property operations</p>
                        <h1 className="max-w-lg text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-white sm:text-6xl">A calmer way to run every stay.</h1>
                        <p className="mt-6 max-w-md text-sm leading-7 text-white/70 sm:text-base">Keep your properties, guests, and daily details moving beautifully from one considered workspace.</p>
                    </div>

                    <div className="relative z-10 flex items-end justify-between border-t border-white/20 pt-5 text-[11px] tracking-[0.12em] text-white/55 uppercase">
                        <span>Trusted property workspace</span>
                        <span>01 / 04</span>
                    </div>
                </section>

                <section className="login-form-panel">
                    <div className="login-form-inner">
                        <div className="mb-10 flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-[#718087] uppercase">
                            <span>Welcome back</span>
                            <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#b18b50]" />Secure sign in</span>
                        </div>
                        <div className="mb-9">
                            <h2 className="text-4xl leading-tight font-medium tracking-[-0.04em] text-[#18232a]">{title}</h2>
                            <p className="mt-3 max-w-sm text-sm leading-6 text-[#718087]">{description}</p>
                        </div>
                        {children}
                        <p className="mt-10 text-center text-[11px] leading-5 text-[#8b9699]">Your account is protected with encrypted authentication.<br />© {new Date().getFullYear()} {name || 'Pink House'}</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
