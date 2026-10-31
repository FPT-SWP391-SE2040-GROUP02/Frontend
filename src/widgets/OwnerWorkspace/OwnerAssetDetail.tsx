import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { isAxiosError } from "axios";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { vaultPinService } from "@/features/vault-pin/api/vaultPinService";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Chip, Notice } from "@/shared/ui/heritageKit";
import { useAssetDetail } from "@/features/assets/model/useAssetDetail";
import { AssetDetail } from "@/features/assets/ui/AssetDetail";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { OwnerWorkspace } from "./OwnerWorkspace";

const kindLabels = { FILE: "Tệp tải lên", TEXT: "Ghi chú bí mật" } as const;

/** Lối quay về danh sách kho, dùng cả khi đang tải hoặc lỗi. */
function BackToVault() {
  return (
    <Link to={ROUTES.DASHBOARD.ASSETS} className={buttonStyles.outline}>
      Quay lại kho
    </Link>
  );
}

/**
 * Trang chi tiết một mục trong kho. Quyền truy cập do Backend kiểm theo kho của người dùng.
 * `?edit=1` (nút "Sửa" ở danh sách) mở trang và hỏi mã PIN ngay; hỏi xong thì bỏ tham số khỏi URL.
 */
export function OwnerAssetDetail({ assetId }: { assetId: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editRequested = searchParams.get("edit") === "1";
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(authenticated && Boolean(accessTokenMemory.get()));
  const vaultId = vault.data?.id ?? "";
  const asset = useAssetDetail(vaultId, assetId);
  const missingVault = vault.isError && isOwnerVaultMissing(vault.error);
  const notFound =
    asset.isError && isAxiosError(asset.error) && asset.error.response?.status === 404;
  return (
    <OwnerWorkspace
      title={asset.data?.name ?? "Chi tiết mục"}
      description={
        asset.data
          ? `${kindLabels[asset.data.kind]} trong kho cá nhân của bạn`
          : "Thông tin và các phiên bản của mục trong kho."
      }
      headerAction={
        <div className="flex flex-wrap items-center gap-3">
          {asset.data && <Chip tone="success">Đã mã hóa</Chip>}
          <BackToVault />
        </div>
      }
    >
      {!authenticated ? (
        <p role="status">Vui lòng đăng nhập để xem kho.</p>
      ) : missingVault ? (
        <Notice tone="warning" title="Bạn chưa có kho di sản">
          Hãy tạo kho trước khi thêm mục.
        </Notice>
      ) : vault.isError ? (
        <div role="alert" className="space-y-3">
          <p>Không tải được dữ liệu. Vui lòng thử lại.</p>
          <button type="button" className={buttonStyles.dark} onClick={() => void vault.refetch()}>
            Thử lại
          </button>
        </div>
      ) : vault.isPending || asset.isPending ? (
        <p role="status" className="text-sm text-heritage-muted">
          Đang tải mục…
        </p>
      ) : notFound ? (
        <Notice tone="warning" title="Không tìm thấy mục này" role="alert">
          Mục có thể đã bị xóa hoặc không thuộc kho của bạn.
        </Notice>
      ) : asset.isError ? (
        <div role="alert" className="space-y-3">
          <p>Không tải được dữ liệu. Vui lòng thử lại.</p>
          <button type="button" className={buttonStyles.dark} onClick={() => void asset.refetch()}>
            Thử lại
          </button>
        </div>
      ) : (
        <AssetDetail
          vaultId={vault.data.id}
          asset={asset.data}
          onDeleted={() => navigate(ROUTES.DASHBOARD.ASSETS)}
          confirmPin={() => confirmVaultPin(vaultId, (pin) => vaultPinService.verify(vaultId, pin))}
          editRequested={editRequested}
          onEditRequestHandled={() => setSearchParams({}, { replace: true })}
        />
      )}
    </OwnerWorkspace>
  );
}
