import { CreatePackageForm } from "@/features/vault-management/ui/CreatePackageForm";
import { Card } from "@/shared/ui/card";

/**
 * @description Trang xem trước form tạo gói, được AppRoutes đăng ký riêng trong dev.
 * @returns Form trong khung Heritage; chưa tạo gói trên máy chủ.
 */
export function CreatePackagePreviewPage() {
  return (
    <main className="min-h-screen bg-heritage-canvas px-4 py-8 text-heritage-text">
      <Card className="mx-auto max-w-xl border-heritage-border bg-heritage-surface p-6 shadow-none">
        <CreatePackageForm />
      </Card>
    </main>
  );
}
