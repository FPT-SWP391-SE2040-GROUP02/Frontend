import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { emailMatchesMask } from "@/shared/lib/invitedEmail";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { handoverRequestService } from "../api/handoverRequestService";
import { handoverRequestKeys } from "../model/useHandoverRequest";
import { AccountRequestPanel } from "./AccountRequestPanel";
import { RequestForm, RequestSentNotice } from "./RequestForm";

/**
 * Trang mở từ link riêng trong thư báo kích hoạt: người nhận gửi yêu cầu nhận tài sản kèm giấy tờ cho luật sư xét.
 * Chưa đăng nhập thì chỉ thấy tên Chủ kho và email đã che, kèm nút đăng nhập hoặc tạo tài khoản rồi quay lại đây.
 */
function TokenRequestPanel({ token }: { token: string }) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const client = useQueryClient();
  const requestId = useId();
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
    return <RequestSentNotice />;
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

  return (
    <div className="space-y-6">
      {heading}
      <RequestForm
        send={(note, wills, files) => handoverRequestService.submit(token, note, wills, files)}
        onSent={() => {
          void client.invalidateQueries({ queryKey: handoverRequestKeys.mine });
          void client.invalidateQueries({ queryKey: handoverRequestKeys.available });
          setSent(true);
        }}
      />
    </div>
  );
}

/**
 * Điểm vào của trang gửi yêu cầu: có ?token= (link riêng trong thư) thì dùng link riêng như cũ;
 * chỉ có ?vaultId= (từ trang Nhận tài sản trong app) thì gửi bằng tài khoản đang đăng nhập.
 */
export function RequestPanel() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const vaultId = params.get("vaultId") ?? "";
  if (token === "" && vaultId !== "") {
    return <AccountRequestPanel vaultId={vaultId} />;
  }
  return <TokenRequestPanel token={token} />;
}
