import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CameraCheckPanel } from "@/features/ekyc/ui/CameraCheckPanel";
import { DocumentCheckPanel } from "@/features/ekyc/ui/DocumentCheckPanel";
import { IdentityReviewPanel } from "@/features/ekyc/ui/IdentityReviewPanel";
import { CAMERA_CHECK_CONTENT as content } from "@/features/ekyc/model/camera.content";
import { EKYC_REVIEW_CONTENT as review } from "@/features/ekyc/model/review.content";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";
import { ConfirmedIcon } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";

/** Luồng eKYC UI mẫu; URL chỉ điều hướng giao diện và không cấp quyền xác minh. */
export function CameraCheckPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const requested = params.get("step");
  const step = review.steps.find((item) => item.id === requested)?.id ?? "camera";
  const sampleSuccess = step === "result" && (!params.get("outcome") || params.get("outcome") === "success");
  const currentStep = step === "documents" ? 0 : step === "face" ? 1 : sampleSuccess ? 3 : 2;
  const title =
    step === "documents"
      ? content.documents.title
      : step === "face"
        ? review.faceTitle
        : step === "result"
          ? review.resultTitle
          : content.title;
  const description =
    step === "documents"
      ? content.documents.description
      : step === "face"
        ? review.faceDescription
        : step === "result"
          ? review.resultDescription
          : content.description;
  const preview = import.meta.env.DEV && location.pathname.startsWith("/preview/");
  const portal = preview ? ROUTES.PREVIEW.BENEFICIARY : ROUTES.BENEFICIARY.CLAIM;
  return (
    <RecipientLayout active="verify">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-heritage-muted sm:text-base">
          {description}
        </p>
        <p className="mt-2 text-xs text-heritage-muted">{review.preview}</p>
      </header>
      {preview && (
        <nav aria-label={review.demoNav} className="flex flex-wrap gap-2">
          {review.steps.map((item) => (
            <Link
              key={item.id}
              to={`?step=${item.id}`}
              aria-current={step === item.id ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-xl border px-4 text-sm ${step === item.id ? "border-heritage-primary bg-heritage-primary text-white" : "border-heritage-border bg-heritage-surface"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      <nav
        aria-label={content.progressLabel}
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-6"
      >
        <ol className="grid gap-6 sm:grid-cols-3 sm:gap-0">
          {content.steps.map((item, index) => (
            <li
              key={item.title}
              aria-current={index === currentStep ? "step" : undefined}
              className="relative flex items-center gap-4 sm:flex-col sm:text-center"
            >
              <span
                aria-hidden="true"
                className={`relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full ${index < currentStep ? "bg-emerald-700 text-white" : index === currentStep ? "bg-heritage-primary text-heritage-gold ring-4 ring-emerald-100" : "bg-heritage-canvas text-heritage-muted"}`}
              >
                {index < currentStep ? <ConfirmedIcon className="size-6" /> : index + 1}
              </span>
              {index < content.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-5 hidden h-0.5 w-full sm:block ${index < currentStep ? "bg-emerald-700" : "bg-heritage-border"}`}
                />
              )}
              <div>
                <p className="relative z-10 text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-xs leading-6 text-heritage-muted">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>
      {step === "documents" ? (
        <DocumentCheckPanel />
      ) : step === "face" || step === "result" ? (
        <IdentityReviewPanel result={step === "result"} portal={portal} />
      ) : (
        <CameraCheckPanel />
      )}
      <footer className="pb-4 text-xs leading-6 text-heritage-muted">{content.disclaimer}</footer>
    </RecipientLayout>
  );
}
