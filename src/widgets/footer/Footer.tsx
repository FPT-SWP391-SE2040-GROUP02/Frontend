import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Footer component dùng chung cho toàn bộ website.
 */
export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30 py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8 text-center md:text-left">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} <span className="font-semibold text-foreground">SWP391 FPT University</span>. Dự án mẫu chuẩn FSD.
        </p>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to={ROUTES.HOME} className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
