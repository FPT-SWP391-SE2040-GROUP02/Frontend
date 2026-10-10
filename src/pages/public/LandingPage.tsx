import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, buttonVariants } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import { LANDING_CONTENT as content } from "./model/landing.content";
import { LegacyVaultMark, VaultIcon } from "@/shared/ui/LegacyVaultArtwork";
import guilloche from "@/shared/assets/legacyvault-guilloche.svg";

/** Landing công khai, dùng nội dung chọn lọc từ prototype và điều hướng thật của client. */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-heritage-surface text-heritage-text">
      <a
        href="#landing-content"
        className="sr-only z-50 rounded-lg bg-heritage-surface p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {content.skip}
      </a>
      <header className="sticky top-0 z-20 border-b border-heritage-border bg-heritage-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link
            to={ROUTES.HOME}
            className="flex min-h-11 items-center gap-2 text-lg font-semibold sm:text-xl"
          >
            <LegacyVaultMark className="size-10 text-heritage-primary" />
            {content.brand}
          </Link>
          <nav
            aria-label={content.navLabel}
            className="order-3 flex w-full gap-5 overflow-x-auto text-sm text-heritage-muted lg:order-none lg:w-auto"
          >
            {content.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 shrink-0 items-center hover:text-heritage-primary focus-visible:outline-2 focus-visible:outline-heritage-gold"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className={`${buttonVariants({ variant: "ghost", size: "lg" })} px-3`}
            >
              {content.login}
            </Link>
            <Link
              to={ROUTES.AUTH.REGISTER}
              className={`${buttonVariants({ size: "lg" })} hidden rounded-xl sm:inline-flex`}
            >
              {content.register}
            </Link>
          </div>
        </div>
      </header>
      <main id="landing-content">
        <section className="relative overflow-hidden border-b border-heritage-border">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-24">
            <div>
              <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-heritage-muted">
                <span className="h-px w-8 bg-heritage-gold" />
                {content.eyebrow}
              </p>
              <h1 className="font-heading font-semibold text-5xl leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
                {content.title}
                <br />
                <span className="text-heritage-primary">{content.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-heritage-muted sm:text-lg">
                {content.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={ROUTES.AUTH.REGISTER}
                  className={`${buttonVariants({ size: "lg" })} min-h-12 rounded-xl`}
                >
                  {content.start}
                  <ArrowRight aria-hidden="true" />
                </Link>
                <a
                  href="#cach-hoat-dong"
                  className={`${buttonVariants({ variant: "outline", size: "lg" })} min-h-12 rounded-xl`}
                >
                  {content.explore}
                </a>
              </div>
              <p className="mt-5 max-w-lg text-xs leading-6 text-heritage-muted">{content.note}</p>
            </div>
            <div className="relative rounded-[32px] bg-heritage-primary p-5 text-heritage-surface sm:p-8">
              <img
                src={guilloche}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 size-64 opacity-20"
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <VaultIcon className="size-5 text-heritage-gold" />
                  {content.vault}
                </span>
                <span className="rounded-full border border-heritage-surface/20 px-3 py-1 text-[11px] text-heritage-surface/75">
                  {content.sample}
                </span>
              </div>
              <p className="relative my-8 max-w-xs font-heading font-semibold text-3xl leading-tight sm:text-4xl">
                {content.organized}
              </p>
              <ul className="relative space-y-3">
                {content.files.map(({ title, recipient, icon: Icon }) => (
                  <li
                    key={title}
                    className="flex items-center gap-4 rounded-2xl border border-heritage-surface/15 bg-heritage-surface/5 p-4"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-heritage-gold/15 text-heritage-gold">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs text-heritage-surface/65">{recipient}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="relative mt-6 border-t border-heritage-surface/15 pt-5 text-xs leading-6 text-heritage-surface/70">
                {content.vaultFooter}
              </p>
            </div>
          </div>
        </section>
        <section
          className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-8 md:grid-cols-3"
          aria-label={content.eyebrow}
        >
          {content.benefits.map(({ title, description, icon: Icon }) => (
            <div key={title} className="flex gap-4">
              <Icon className="mt-1 size-6 shrink-0 text-heritage-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-heritage-muted">{description}</p>
              </div>
            </div>
          ))}
        </section>
        <section
          id="cach-hoat-dong"
          className="scroll-mt-40 border-y border-heritage-border bg-heritage-primary-light/40 px-4 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-heritage-muted">
              {content.processEyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl font-heading font-semibold text-3xl leading-tight sm:text-4xl">
              {content.processTitle}
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {content.steps.map((step) => (
                <li key={step.number}>
                  <span className="font-heading font-semibold text-4xl text-heritage-muted">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-heritage-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section
          id="vai-tro"
          className="mx-auto max-w-7xl scroll-mt-40 px-4 py-16 sm:px-8 sm:py-20"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-heritage-muted">
            {content.rolesEyebrow}
          </p>
          <h2 className="mt-4 max-w-2xl font-heading font-semibold text-3xl leading-tight sm:text-4xl">
            {content.rolesTitle}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.roles.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="gap-0 rounded-2xl border-heritage-border bg-heritage-surface p-6 shadow-none"
              >
                <Icon className="size-7 text-heritage-primary" aria-hidden="true" />
                <h3 className="mt-6 font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-heritage-muted">{description}</p>
              </Card>
            ))}
          </div>
        </section>
        <section
          id="bao-mat"
          className="scroll-mt-40 bg-heritage-primary px-4 py-16 text-heritage-surface sm:px-8 sm:py-20"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <div>
              <ShieldCheck className="mb-6 size-10 text-heritage-gold" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-widest text-heritage-surface/65">
                {content.securityEyebrow}
              </p>
              <h2 className="mt-4 max-w-md font-heading font-semibold text-3xl leading-tight sm:text-4xl">
                {content.securityTitle}
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-heritage-surface/75">
                {content.securityDescription}
              </p>
              <p className="mt-6 max-w-lg rounded-xl border border-heritage-surface/15 p-4 text-xs leading-6 text-heritage-surface/65">
                {content.securityNote}
              </p>
            </div>
            <ul className="divide-y divide-heritage-surface/15">
              {content.security.map((item) => (
                <li key={item.title} className="py-5 first:pt-0">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-heritage-surface/75">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section
          id="hoi-dap"
          className="mx-auto grid max-w-7xl scroll-mt-40 gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.8fr_1.2fr]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-heritage-muted">
              {content.faqEyebrow}
            </p>
            <h2 className="mt-4 max-w-sm font-heading font-semibold text-3xl leading-tight sm:text-4xl">
              {content.faqTitle}
            </h2>
          </div>
          <div className="divide-y divide-heritage-border border-y border-heritage-border">
            {content.faq.map((item) => (
              <details key={item.question} className="group py-1">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold focus-visible:outline-2 focus-visible:outline-heritage-gold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <Plus
                    className="size-5 shrink-0 text-heritage-muted transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-2xl pb-5 pr-8 text-sm leading-7 text-heritage-muted">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-heritage-border bg-heritage-primary-light/40 p-6 sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">{content.pricingTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-heritage-muted">
                {content.pricingDescription}
              </p>
            </div>
            <Link
              to={ROUTES.BILLING.PLANS}
              className={`${buttonVariants({ variant: "outline", size: "lg" })} rounded-xl`}
            >
              {content.pricingAction}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="border-t border-heritage-border px-4 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="font-heading font-semibold text-3xl sm:text-5xl">
            {content.closingTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-heritage-muted">
            {content.closingDescription}
          </p>
          <Link
            to={ROUTES.AUTH.REGISTER}
            className={`${buttonVariants({ size: "lg" })} mt-7 min-h-12 rounded-xl`}
          >
            {content.start}
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="border-t border-heritage-border px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{content.footer}</p>
            <p className="mt-2 text-xs leading-6 text-heritage-muted">{content.note}</p>
          </div>
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
          >
            {content.login}
          </Link>
        </div>
      </footer>
    </div>
  );
}
