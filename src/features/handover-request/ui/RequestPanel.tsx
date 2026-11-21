import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { emailMatchesMask } from "@/shared/lib/invitedEmail";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { handoverRequestService } from "../api/handoverRequestService";
import { filesError } from "../model/handoverRequest.schema";
import { handoverRequestKeys } from "../model/useHandoverRequest";
import { DocumentPicker } from "./DocumentPicker";

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
    <div className="space-y-5">
      {heading}
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-6">
        <li>Đính kèm giấy tờ luật sư cần (ví dụ di chúc, văn bản phân chia, bản án).</li>
        <li>
          Hệ thống khóa kho và báo cho Chủ kho, Người thực thi. Chủ kho còn sống thì hủy được.
        </li>
        <li>Luật sư xét giấy tờ: chấp nhận, yêu cầu bổ sung hoặc từ chối có lý do.</li>
      </ol>
      <DocumentPicker files={files} onChange={setFiles} disabled={submit.pending} />
      {touched && fileError && (
        <p role="alert" className="text-sm text-destructive">
          {fileError}
        </p>
      )}
      <label className="block space-y-1 text-sm font-semibold">
        Lời nhắn cho luật sư (không bắt buộc)
        <textarea
          className="min-h-24 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
          maxLength={1000}
          value={note}
          disabled={submit.pending}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button type="button" className={buttonStyles.gold} disabled={submit.pending} onClick={send}>
        {submit.pending ? "Đang gửi…" : "Gửi yêu cầu"}
      </button>
      {submit.error && (
        <p role="alert" className="text-sm text-destructive">
          {submit.error}
        </p>
      )}
      <p className="text-sm text-heritage-muted">
        Hệ thống chỉ lưu tệp, không kiểm từng ô giấy tờ. Luật sư xác minh ở ngoài hệ thống.
      </p>
    </div>
  );
}
