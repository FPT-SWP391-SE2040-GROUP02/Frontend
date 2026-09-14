import React from "react";
import { useSearchParams } from "react-router-dom";
import { FileCheck, Plus, History, ShieldAlert, Scale } from "lucide-react";
import { AppHeader } from "@/widgets";
import { Button, Card, Skeleton } from "@/shared/ui";
import { 
  ClaimSubmitForm, 
  ClaimStatusCard, 
  useExecutorClaims 
} from "@/features/claims";

/**
 * @file ExecutorClaimsPage.tsx
 * @description Màn hình Cổng Người Thi Hành Di Chúc (Executor Claims Portal).
 * Cho phép nộp hồ sơ mở thừa kế (Trích lục khai tử / Quyết định Tòa án) và theo dõi tiến độ thẩm định.
 * Áp dụng URL State qua useSearchParams thay cho useState cục bộ.
 */
export const ExecutorClaimsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "history";

  const { data: claimsData, isLoading, isError, refetch } = useExecutorClaims();

  const handleTabChange = (tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#14241C] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner tiêu đề */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold mb-2">
              <FileCheck className="w-3.5 h-3.5 text-[#0B291E]" />
              <span>Thẩm quyền thi hành di sản số (Điều 562 & 611 BLDS 2015)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B291E] tracking-tight">
              Cổng Người Thi Hành Di Chúc (Executor Portal)
            </h1>
            <p className="text-xs sm:text-sm text-[#66786E] mt-1 max-w-2xl leading-relaxed">
              Quản lý và nộp chứng từ pháp lý tử tuất hoặc quyết định tuyên bố mất tích/đã chết của Tòa án để kích hoạt quy trình thẩm định mở thừa kế.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleTabChange("submit")}
              className={`min-h-[44px] px-5 rounded-[18px] text-xs font-bold flex items-center gap-2 transition-all ${
                currentTab === "submit"
                  ? "bg-[#0B291E] text-white shadow-md"
                  : "bg-[#FAF9F5] text-[#14241C] border border-[#DCD9D0] hover:border-[#B88E4C]"
              }`}
            >
              <Plus className="w-4 h-4 text-[#B88E4C]" />
              <span>Nộp Hồ Sơ Mới</span>
            </Button>
            <Button
              onClick={() => handleTabChange("history")}
              className={`min-h-[44px] px-5 rounded-[18px] text-xs font-bold flex items-center gap-2 transition-all ${
                currentTab === "history"
                  ? "bg-[#0B291E] text-white shadow-md"
                  : "bg-[#FAF9F5] text-[#14241C] border border-[#DCD9D0] hover:border-[#B88E4C]"
              }`}
            >
              <History className="w-4 h-4 text-[#B88E4C]" />
              <span>Lịch Sử Hồ Sơ</span>
            </Button>
          </div>
        </div>

        {/* Nội dung theo Tab */}
        {currentTab === "submit" ? (
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF9F5] border border-[#DCD9D0] shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0B291E]">Nộp Chứng Từ Pháp Lý Mở Thừa Kế</h2>
              <p className="text-xs text-[#66786E] mt-0.5">
                Vui lòng điền chính xác thông tin hộ tịch và tải lên bản scan có dấu mộc đỏ hợp lệ.
              </p>
            </div>
            <ClaimSubmitForm onSuccess={() => handleTabChange("history")} />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0B291E] flex items-center gap-2">
              <span>Hồ Sơ Yêu Cầu Đã Gửi</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5EDE8] text-[#0B291E] font-bold">
                {claimsData?.totalCount || 0}
              </span>
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-[20px]" />
                <Skeleton className="h-28 w-full rounded-[20px]" />
              </div>
            ) : isError ? (
              <Card className="p-6 text-center bg-[#FAF9F5] border-red-200 text-xs text-red-700 space-y-3">
                <p>Không thể tải danh sách hồ sơ thi hành di sản.</p>
                <Button onClick={() => refetch()} className="mx-auto rounded-[16px]">
                  Thử lại
                </Button>
              </Card>
            ) : claimsData?.items && claimsData.items.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {claimsData.items.map((claim) => (
                  <ClaimStatusCard key={claim.id} claim={claim} />
                ))}
              </div>
            ) : (
              <Card className="p-10 text-center bg-[#FAF9F5] border-[#DCD9D0] rounded-[24px] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EFECE6] text-[#66786E] flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#0B291E]">Chưa Có Hồ Sơ Nào Được Nộp</h3>
                <p className="text-xs text-[#66786E] max-w-sm mx-auto">
                  Hiện bạn chưa có hồ sơ mở thừa kế nào đang thụ lý. Bấm "Nộp Hồ Sơ Mới" để bắt đầu.
                </p>
                <Button
                  onClick={() => handleTabChange("submit")}
                  className="rounded-[18px] bg-[#0B291E] text-white text-xs font-bold px-5"
                >
                  Nộp Hồ Sơ Mới Ngay
                </Button>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
