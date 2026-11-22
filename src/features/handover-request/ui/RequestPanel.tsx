import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { emailMatchesMask } from "@/shared/lib/invitedEmail";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { handoverRequestService } from "../api/handoverRequestService";
import { filesError } from "../model/handoverRequest.schema";
import { handoverRequestKeys } from "../model/useHandoverRequest";
import { DocumentPicker } from "./DocumentPicker";

/** Độ dài tối đa của lời nhắn cho luật sư. */
const NOTE_MAX_LENGTH = 1000;

/** Ba bước người nhận đọc trước khi gửi yêu cầu. */
const REQUEST_STEPS = [
  "Đính kèm giấy tờ luật sư cần (ví dụ di chúc, văn bản phân chia, bản án).",
  "Hệ thống khóa kho và báo cho Chủ kho, Người thực thi. Chủ kho còn sống thì hủy được.",
  "Luật sư xét giấy tờ: chấp nhận, yêu cầu bổ sung hoặc từ chối có lý do.",
];

/**
 * Trang mở từ link riêng trong thư báo kích hoạt: người nhận gửi yêu cầu nhận tài sản kèm giấy tờ cho luật sư xét.
 * Chưa đăng nhập thì chỉ thấy tên Chủ kho và email đã che, kèm nút đăng nhập hoặc tạo tài khoản rồi quay lại đây.
 */
export function RequestPanel() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const client = useQueryClient();
  const requestId = useId();
  const submit = usePrivateAction();
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  // Không đưa token vào query key/cache bền vững.
  const query = useQuery({
    queryKey: ["handover-request-preview", requestId],
    queryFn: ({ signal }) => handoverRequestService.preview(token, signal),
    retry: false,
    gcTime: 0,
  });

  if (query.isPending) return <p role="status">Đang kiểm tra link…</p>;
  if (query.isError)
    return (
      <div role="alert" className="space-y-4">
        <h2 className="font-serif text-3xl text-heritage-primary">Link chưa dùng được</h2>
        <p className="text-sm text-heritage-muted">
          Link không đúng hoặc đã được thay bằng link mới trong thư gần nhất. Kiểm tra đã chép đủ
          link từ thư.
        </p>
        <button type="button" className={buttonStyles.dark} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );

  const preview = query.data;
  const back = `${ROUTES.REQUEST}?${new URLSearchParams({ token })}`;
  const heading = (
    <div className="space-y-2">
      <h2 className="font-serif text-3xl leading-tight text-heritage-primary">
        Gửi yêu cầu nhận tài sản
      </h2>
      <p className="text-sm leading-6 text-heritage-muted">
        {preview.ownerName} đã khai {preview.recipientName || "bạn"} là người nhận. Khi có việc xảy
        ra với Chủ kho, bạn gửi yêu cầu kèm giấy tờ để luật sư xét.
      </p>
    </div>
  );

  if (!authenticated) {
    return (
      <div className="space-y-5">
        {heading}
        <p className="text-sm">
          Đăng nhập bằng email <b className="break-all">{preview.invitedEmailMasked}</b> để gửi yêu
          cầu.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className={buttonStyles.dark}
            to={`${ROUTES.AUTH.LOGIN}?${new URLSearchParams({ redirect: back })}`}
          >
            Đăng nhập
          </Link>
          <Link
            className={buttonStyles.outline}
            to={`${ROUTES.AUTH.REGISTER}?${new URLSearchParams({ redirect: back })}`}
          >
            Tạo tài khoản bằng email này
          </Link>
        </div>
      </div>
    );
  }

  const accountEmail = user?.email ?? "";
  if (
    preview.invitedEmailMasked &&
    accountEmail &&
    !emailMatchesMask(accountEmail, preview.invitedEmailMasked)
  ) {
    return (
      <div className="space-y-4" role="alert">
        {heading}
        <p className="text-sm leading-6">
          Bạn đang dùng <b className="break-all">{accountEmail}</b>, còn link này dành cho{" "}
          <b className="break-all">{preview.invitedEmailMasked}</b>. Hãy đăng nhập bằng đúng email
          Chủ kho đã khai.
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Notice tone="success" title="Đã gửi yêu cầu" role="status">
          Luật sư sẽ xét giấy tờ và báo kết quả. Bạn theo dõi ở mục Yêu cầu nhận tài sản trong cổng
          người nhận.
        </Notice>
        <Link className={buttonStyles.dark} to={ROUTES.BENEFICIARY.CLAIM}>
          Mở cổng người nhận
        </Link>
      </div>
    );
  }

  if (!preview.canRequest) {
    return (
      <div className="space-y-4">
        {heading}
        <Notice tone="warning" title="Chưa gửi yêu cầu được">
          Kho này chưa kích hoạt kế hoạch bàn giao, hoặc việc bàn giao đã hoàn tất.
        </Notice>
      </div>
    );
  }

  const fileError = filesError(files);
  const send = () => {
    setTouched(true);
    if (fileError) return;
    void submit.execute(
      () => handoverRequestService.submit(token, note, files),
      () => {
        void client.invalidateQueries({ queryKey: handoverRequestKeys.mine });
        setSent(true);
      },
    );
  };
  return (
    <div className="space-y-6">
      {heading}
      <ol className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-sunken p-4 text-sm leading-6">
        {REQUEST_STEPS.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft text-xs font-semibold text-heritage-primary"
            >
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="space-y-2">
        <DocumentPicker files={files} onChange={setFiles} disabled={submit.pending} />
        {touched && fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
      </div>
      <label className="block space-y-2 text-sm font-semibold text-heritage-primary">
        <span className="block">
          Lời nhắn cho luật sư{" "}
          <span className="font-normal text-heritage-muted">(không bắt buộc)</span>
        </span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal text-heritage-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover"
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          disabled={submit.pending}
          placeholder="Ví dụ: Tôi gửi kèm di chúc và văn bản phân chia, bản sao có chứng thực."
          onChange={(event) => setNote(event.target.value)}
        />
        <span className="block text-right text-xs font-normal text-heritage-muted">
          {note.length}/{NOTE_MAX_LENGTH}
        </span>
      </label>
      <div className="space-y-3">
        <button
          type="button"
          className={`${buttonStyles.dark} w-full`}
          disabled={submit.pending}
          onClick={send}
        >
          {submit.pending ? "Đang gửi…" : "Gửi yêu cầu"}
        </button>
        {submit.error && (
          <p role="alert" className="text-sm text-destructive">
            {submit.error}
          </p>
        )}
        <p className="flex gap-2 text-xs leading-5 text-heritage-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Hệ thống chỉ lưu tệp, không kiểm từng ô giấy tờ. Luật sư xác minh ở ngoài hệ thống.
          </span>
        </p>
      </div>
    </div>
  );
}
