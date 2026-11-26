import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Check, Copy, Vault } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";

/** Chữ "Đã sao chép" giữ bao lâu (ms) trước khi nút trở lại như cũ. */
const COPIED_MS = 2000;

type CopyState = "idle" | "done" | "failed";

/** Email Chủ tài sản cần khai để kho hiện ở trang này, kèm trạng thái xác minh và nút sao chép. */
function ReceiveEmailCard({ email, verified }: { email: string; verified: boolean }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    if (copyState !== "done") {
      return;
    }
    const timer = window.setTimeout(() => setCopyState("idle"), COPIED_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copyState]);

  async function copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(email);
      setCopyState("done");
    } catch {
      // Trình duyệt chặn bộ nhớ tạm: email vẫn hiện trên màn hình để người dùng tự chép.
      setCopyState("failed");
    }
  }

  let buttonContent = (
    <>
      <Copy className="size-4" aria-hidden="true" />
      Sao chép email
    </>
  );
  if (copyState === "done") {
    buttonContent = (
      <>
        <Check className="receive-pop size-4" aria-hidden="true" />
        Đã sao chép
      </>
    );
  }

  return (
    <div className="w-full max-w-xl space-y-2 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-heritage-border bg-heritage-surface px-4 py-3.5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-heritage-muted">Email nhận tài sản của bạn</p>
          <p className="break-all font-semibold text-heritage-primary">{email}</p>
          {verified && <Chip tone="success">Đã xác minh</Chip>}
          {!verified && <Chip tone="warning">Chưa xác minh</Chip>}
        </div>
        <button
          type="button"
          className={`${buttonStyles.outline} receive-press`}
          onClick={() => void copyEmail()}
        >
          {buttonContent}
        </button>
      </div>
      <span role="status" className="sr-only">
        {copyState === "done" ? "Đã sao chép email." : ""}
      </span>
      {copyState === "failed" && (
        <p role="alert" className="text-sm text-heritage-danger">
          Không sao chép được. Hãy bôi đen email ở trên rồi chép.
        </p>
      )}
    </div>
  );
}

/** Trạng thái chưa có kho: nói khi nào kho hiện ra và đưa sẵn email để gửi cho Chủ tài sản. */
export function ReceiveEmptyState() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  return (
    <section className="receive-rise flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-heritage-border-strong px-3 py-10 text-center sm:px-5">
      <span className="flex size-16 items-center justify-center rounded-full border border-heritage-gold-border bg-heritage-gold-light">
        <Vault className="size-8 text-heritage-gold" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="max-w-[46ch] space-y-1.5">
        <h2 className="text-lg font-semibold text-heritage-primary">
          Hiện tại bạn chưa là người nhận của tài sản nào
        </h2>
        <p className="text-sm leading-6 text-heritage-muted">
          Một tài sản sẽ hiện ở đây khi Chủ tài sản khai đúng email đã xác minh của bạn làm người
          nhận và kích hoạt kế hoạch bàn giao.
        </p>
      </div>
      {user && (
        <>
          <ReceiveEmailCard email={user.email} verified={user.emailVerified === true} />
          <p className="text-sm text-heritage-muted">
            Gửi email này cho Chủ tài sản để họ khai bạn làm người nhận.
          </p>
        </>
      )}
    </section>
  );
}
