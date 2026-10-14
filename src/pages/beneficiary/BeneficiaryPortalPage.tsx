import { useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { FileText, LockKeyhole, Mail, Package, CircleAlert } from "lucide-react";
import { RecipientLayout, type RecipientSection } from "@/widgets/RecipientLayout/RecipientLayout";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { RECIPIENT_PORTAL_CONTENT as content } from "./model/portal.content";

/** Cổng người nhận UI: preview dùng dữ liệu mẫu, route bảo vệ chờ tích hợp dữ liệu thật. */
export function BeneficiaryPortalPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const [dialog, setDialog] = useState<"accept" | "reject">("accept");
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogTrigger = useRef<HTMLButtonElement | null>(null);
  const preview = import.meta.env.DEV && location.pathname.startsWith("/preview/");
  const requested = params.get("view");
  const view =
    requested && Object.hasOwn(content.views, requested)
      ? (requested as keyof typeof content.views)
      : location.pathname === ROUTES.BENEFICIARY.HANDOVER
        ? "handover"
        : "overview";
  const state = preview ? (params.get("state") ?? "success") : "empty";
  const active: RecipientSection = view === "handover" ? "content" : view;
  const verify = preview ? ROUTES.PREVIEW.EKYC_CAMERA : ROUTES.BENEFICIARY.EKYC_CAMERA;
  // TODO: [P2][HANDOVER-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Nối đầy đủ claim/video/nhận-từ chối/grant của từng người nhận.
  // 2. [INPUT & OUTPUT]: Phiên + invitation/claim/handover/grant IDs riêng -> DTO và allowedActions.
  // 3. [CÁC BƯỚC]: Sau AUTH-02/EKYC-03/DEATH-02 chốt API với BE4; model/service/hooks rồi portal; lịch/video token; quyết định sau xác nhận; nội dung qua grant endpoint.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, TanStack Query, RHF/Zod, Dialog; native media/provider đã duyệt.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không chia %, không chờ đồng thuận 100%; quyết định 7 ngày, grant mới 30 ngày từ commit theo BE; hạn cũ không reset; hold/quyền kiểm mỗi request, không optimistic hoặc Shamir.
  return (
    <RecipientLayout active={active}>
      <header>
        <p className="mb-2 text-sm font-medium text-heritage-muted">{content.views[view]}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {view === "overview" ? content.title : content.views[view]}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-heritage-muted">
          {content.description}
        </p>
        <p className="mt-2 text-xs leading-6 text-heritage-muted">
          {preview ? content.preview : content.unavailable}
        </p>
      </header>
      {preview && (
        <nav aria-label={content.variantsLabel} className="flex flex-wrap gap-2">
          {content.variants.map((item) => (
            <Link
              key={item.id}
              to={`?view=${view}&state=${item.id}`}
              aria-current={state === item.id ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-xl border px-4 text-sm ${state === item.id ? "border-heritage-primary bg-heritage-primary text-white" : "border-heritage-border bg-heritage-surface"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {state === "loading" ? (
        <section aria-busy="true" aria-label={content.loadingTitle} className="space-y-5">
          <p role="status" className="text-sm text-heritage-muted">
            {content.loadingTitle}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.summary.map((item) => (
              <Skeleton key={item.label} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </section>
      ) : state === "error" ? (
        <section
          role="alert"
          className="rounded-2xl border border-heritage-border bg-heritage-surface p-8"
        >
          <CircleAlert aria-hidden="true" className="size-12 text-heritage-gold" />
          <h2 className="mt-5 text-xl font-semibold">{content.errorTitle}</h2>
          <p className="mt-3 text-sm text-heritage-muted">{content.errorDetail}</p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-heritage-primary px-5 text-sm text-white"
            to={`?view=${view}`}
          >
            {content.retry}
          </Link>
        </section>
      ) : state === "empty" ? (
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-8">
          <Package aria-hidden="true" className="size-12 text-heritage-gold" />
          <h2 className="mt-5 text-xl font-semibold">{content.emptyTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-heritage-muted">{content.emptyDetail}</p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
            to={ROUTES.HOME}
          >
            {content.home}
          </Link>
        </section>
      ) : (
        <>
          {view === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {content.summary.map((item) => (
                  <section
                    key={item.label}
                    className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
                  >
                    <p className="text-sm text-heritage-muted">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                  </section>
                ))}
              </div>
              <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-xs text-heritage-muted">{content.profile}</p>
                    <h2 className="mt-2 text-xl font-semibold">{content.package}</h2>
                    <p className="mt-2 text-sm text-heritage-muted">
                      {content.sender} · {content.demoId}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-heritage-gold/15 px-4 py-2 text-xs font-medium">
                    {content.statuses[1]}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    className="flex min-h-11 items-center rounded-xl bg-heritage-primary px-5 text-sm text-white"
                    to={`${verify}?step=documents`}
                  >
                    {content.verify}
                  </Link>
                  <Link
                    className="flex min-h-11 items-center rounded-xl border border-heritage-border px-5 text-sm"
                    to="?view=handover"
                  >
                    {content.handover}
                  </Link>
                  <Link
                    className="flex min-h-11 items-center rounded-xl border border-heritage-border px-5 text-sm"
                    to="?view=messages"
                  >
                    {content.messages}
                  </Link>
                </div>
              </section>
              <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
                <h2 className="text-xl font-semibold">{content.journey}</h2>
                <ol className="mt-6 grid gap-6 md:grid-cols-3">
                  {content.steps.map((item, index) => (
                    <li key={item.title}>
                      <span className="flex size-10 items-center justify-center rounded-full bg-heritage-primary text-heritage-gold">
                        {index + 1}
                      </span>
                      <h3 className="mt-4 font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-heritage-muted">{item.detail}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
          {(view === "handover" || view === "content") && (
            <>
              <section className="flex gap-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6">
                <LockKeyhole aria-hidden="true" className="size-8 shrink-0 text-heritage-gold" />
                <div>
                  <h2 className="font-semibold">{content.lockTitle}</h2>
                  <p className="mt-2 text-sm leading-7 text-heritage-muted">{content.lockDetail}</p>
                </div>
              </section>
              <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6">
                <h2 className="text-xl font-semibold">{content.package}</h2>
                <ul className="mt-5 divide-y divide-heritage-border">
                  {content.assets.map((item) => (
                    <li
                      key={item.title}
                      className="flex flex-wrap items-center justify-between gap-4 py-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText
                          aria-hidden="true"
                          className="size-6 shrink-0 text-heritage-gold"
                        />
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="mt-1 text-xs text-heritage-muted">
                            {item.kind} · {content.locked}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="lg" disabled title={content.noDownload}>
                        {content.download}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
              {view === "handover" && (
                <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6">
                  <p className="text-xs text-heritage-muted">{content.schedule}</p>
                  <p className="mt-2 font-medium">{content.unscheduled}</p>
                  <h2 className="mt-6 text-xl font-semibold">{content.decision}</h2>
                  <p className="mt-3 text-sm leading-7 text-heritage-muted">
                    {content.decisionHint}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={(event) => {
                        dialogTrigger.current = event.currentTarget;
                        setDialog("accept");
                        setDialogOpen(true);
                      }}
                    >
                      {content.accept}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={(event) => {
                        dialogTrigger.current = event.currentTarget;
                        setDialog("reject");
                        setDialogOpen(true);
                      }}
                    >
                      {content.reject}
                    </Button>
                  </div>
                </section>
              )}
            </>
          )}
          {view === "messages" && (
            <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-10">
              <Mail aria-hidden="true" className="size-10 text-heritage-gold" />
              <p className="mt-5 text-xs font-medium text-heritage-muted">{content.messageTag}</p>
              <h2 className="mt-3 text-2xl font-semibold">{content.messageTitle}</h2>
              <blockquote className="mt-6 border-l-2 border-heritage-gold pl-5 text-base leading-8">
                {content.messageBody}
              </blockquote>
              <p className="mt-6 text-xs leading-6 text-heritage-muted">{content.noMessage}</p>
            </section>
          )}
        </>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent finalFocus={dialogTrigger} className="sm:max-w-lg" showCloseButton={false}>
          <DialogTitle className="pr-4 text-xl leading-7">
            {dialog === "accept" ? content.acceptTitle : content.rejectTitle}
          </DialogTitle>
          <DialogDescription className="leading-7">{content.dialogDescription}</DialogDescription>
          <p className="text-sm leading-7 text-heritage-muted">{content.dialogDetails}</p>
          <Button size="lg" disabled>
            {content.noCommit}
          </Button>
          <Button size="lg" variant="outline" onClick={() => setDialogOpen(false)}>
            {content.close}
          </Button>
        </DialogContent>
      </Dialog>
    </RecipientLayout>
  );
}
