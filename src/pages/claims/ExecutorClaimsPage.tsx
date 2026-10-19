import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { ExecutorPortal } from "@/features/death-case/ui/ExecutorPortal";
/** Workspace Executor dùng quan hệ kho thực từ Backend, không dùng role UI hoặc claims fixture. */
export function ExecutorClaimsPage() {
  return (
    <OwnerWorkspace
      title="Nhiệm vụ Executor"
      description="Các kho được phân công và hồ sơ chứng tử bạn có quyền xử lý."
    >
      <ExecutorPortal />
    </OwnerWorkspace>
  );
}
