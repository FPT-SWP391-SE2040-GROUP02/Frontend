import { LegacyVaultMark } from "./LegacyVaultArtwork";
import { buttonVariants } from "./button";
import { ROUTES } from "@/shared/config/routes.config";
import { ERROR_PAGE_CONTENT as content } from "@/shared/constants/errorPages";
import guilloche from "@/shared/assets/legacyvault-guilloche.svg";

/** Nội dung và hành động của một màn hình lỗi; hoạt động cả ngoài Router. */
export interface ErrorScreenProps {
  code: string;
  title: string;
  description: string;
  retry?: boolean;
  login?: boolean;
}

/** Màn hình lỗi Heritage dùng chung cho HTTP và ErrorBoundary. */
export function ErrorScreen({ code, title, description, retry, login }: ErrorScreenProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-heritage-surface text-heritage-text">
      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 sm:px-10">
        <a href={ROUTES.HOME} className="inline-flex min-h-11 items-center gap-3 font-semibold">
          <LegacyVaultMark className="size-10 text-heritage-primary" />
          {content.brand}
        </a>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="font-heading text-8xl font-semibold tracking-tight text-heritage-gold sm:text-9xl">
          {code}
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-heritage-muted sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={ROUTES.HOME} className={buttonVariants({ size: "lg" })}>
            {content.home}
          </a>
          {login && (
            <a
              href={ROUTES.AUTH.LOGIN}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {content.login}
            </a>
          )}
          {retry && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {content.reload}
            </button>
          )}
        </div>
      </main>
      <img
        src={guilloche}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 size-[480px] opacity-10"
      />
      <footer className="relative z-10 px-6 py-6 text-center text-xs leading-6 text-heritage-muted">
        {content.note}
      </footer>
    </div>
  );
}
