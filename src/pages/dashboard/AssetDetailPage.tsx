import { useParams } from "react-router-dom";
import { OwnerAssetDetail } from "@/widgets/OwnerWorkspace/OwnerAssetDetail";

/** Chi tiết một mục trong kho; mã mục lấy từ đường dẫn, Backend kiểm quyền theo kho. */
export function AssetDetailPage() {
  const { assetId = "" } = useParams();
  return <OwnerAssetDetail key={assetId} assetId={assetId} />;
}
