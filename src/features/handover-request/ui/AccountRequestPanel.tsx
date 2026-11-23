import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { handoverRequestService } from "../api/handoverRequestService";
import type { AvailableHandover } from "../model/handoverRequest.schema";
import { handoverRequestKeys, useAvailableHandovers } from "../model/useHandoverRequest";
import { RequestForm, RequestSentNotice } from "./RequestForm";

/** Tìm kho theo vaultId trong danh sách kho được để lại cho tài khoản; null khi không có. */
function findVault(rows: AvailableHandover[], vaultId: string): AvailableHandover | null {
  for (const row of rows) {
    if (row.vaultId === vaultId) {
      return row;
    }
  }
  return null;
}

/**
 * Trang gửi yêu cầu mở từ trang "Nhận tài sản" (?vaultId=): gửi bằng tài khoản đang đăng nhập,
 * không cần link riêng. Backend kiểm lại email đã xác minh và quyền người nhận của kho.
 */
export function AccountRequestPanel({ vaultId }: { vaultId: string }) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const client = useQueryClient();
  const available = useAvailableHandovers();
  const [sent, setSent] = useState(false);

  if (!authenticated) {
    const back = `${ROUTES.REQUEST}?${new URLSearchParams({ vaultId })}`;
    return (
      <div className="space-y-5">
        <h2 className="font-serif text-3xl text-heritage-primary">Gửi yêu cầu nhận tài sản</h2>
        <p className="text-sm">Đăng nhập bằng email Chủ kho đã khai cho bạn để gửi yêu cầu.</p>
        <Link
          className={buttonStyles.dark}
          to={`${ROUTES.AUTH.LOGIN}?${new URLSearchParams({ redirect: back })}`}
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (sent) {
    return <RequestSentNotice />;
  }
  if (available.isPending) {
    return <p role="status">Đang kiểm tra kho…</p>;
  }
  if (available.isError) {
    return (
      <div role="alert" className="space-y-4">
        <h2 className="font-serif text-3xl text-heritage-primary">Chưa tải được kho</h2>
        <p className="text-sm text-heritage-muted">
          Không tải được thông tin kho. Kiểm tra kết nối rồi thử lại.
        </p>
        <button
          type="button"
          className={buttonStyles.dark}
          onClick={() => void available.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const vault = findVault(available.data, vaultId);
  if (vault === null) {
    return (
      <div className="space-y-4" role="alert">
        <h2 className="font-serif text-3xl text-heritage-primary">Không thấy kho này</h2>
        <p className="text-sm leading-6 text-heritage-muted">
          Kho chỉ hiện khi Chủ kho khai đúng email đã xác minh của bạn và kích hoạt kế hoạch.
        </p>
        <Link className={buttonStyles.outline} to={ROUTES.DASHBOARD.RECEIVE_ASSETS}>
          Về trang Nhận tài sản
        </Link>
      </div>
    );
  }

  const heading = (
    <div className="space-y-2">
      <h2 className="font-serif text-3xl leading-tight text-heritage-primary">
        Gửi yêu cầu nhận tài sản
      </h2>
      <p className="text-sm leading-6 text-heritage-muted">
        {vault.ownerName} đã khai bạn là người nhận. Khi có việc xảy ra với Chủ kho, bạn gửi yêu cầu
        kèm giấy tờ để luật sư xét.
      </p>
    </div>
  );

  if (!vault.canRequest) {
    return (
      <div className="space-y-4">
        {heading}
        <Notice tone="warning" title="Chưa gửi yêu cầu được">
          Kho này đã có yêu cầu của bạn, chưa kích hoạt kế hoạch bàn giao, hoặc việc bàn giao đã
          hoàn tất.
        </Notice>
        <Link className={buttonStyles.outline} to={ROUTES.DASHBOARD.RECEIVE_ASSETS}>
          Về trang Nhận tài sản
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {heading}
      <p className="flex items-center gap-2 text-sm font-medium text-heritage-success">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        Email đã xác minh, khớp email Chủ kho khai
      </p>
      <RequestForm
        send={(note, files) => handoverRequestService.submitByAccount(vaultId, note, files)}
        onSent={() => {
          void client.invalidateQueries({ queryKey: handoverRequestKeys.mine });
          void client.invalidateQueries({ queryKey: handoverRequestKeys.available });
          setSent(true);
        }}
      />
    </div>
  );
}
