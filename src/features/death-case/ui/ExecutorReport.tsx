import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { deathCaseService } from "../api/deathCaseService";
import type { ExecutorVault } from "../model/deathCase.schema";
import { executorVaultsKey } from "../model/useExecutorVaults";
import { useActiveCaseId, useDeathCase } from "../model/useDeathCase";
import { DeathCaseEditor } from "./DeathCaseEditor";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { ReviewFeedback } from "./ReviewFeedback";

const nextSteps = [
  { title: "Phản đối 72 giờ", text: "Chủ kho còn cơ hội dừng lại." },
  { title: "Xét duyệt", text: "Người xét duyệt xem hồ sơ." },
  { title: "Xác minh và đồng ý nhận", text: "Người nhận xác minh eKYC rồi đồng ý hoặc từ chối." },
];

/** Nút mở hồ sơ chứng tử mới cho kho; chỉ gọi Backend khi bấm, không tự tạo hồ sơ. */
function OpenCaseButton({ vault, label }: { vault: ExecutorVault; label: string }) {
  const [, setParams] = useSearchParams();
  const client = useQueryClient();
  const action = usePrivateAction();
  return (
    <div className="space-y-2">
      <button
        type="button"
        className={buttonStyles.gold}
        disabled={action.pending}
        onClick={() =>
          void action.execute(
            () => deathCaseService.open(vault.vaultId),
            (record) => {
              client.setQueryData(["death-case", record.id], record);
              void client.invalidateQueries({ queryKey: executorVaultsKey });
              const next = new URLSearchParams();
              next.set("vault", vault.vaultId);
              next.set("caseId", record.id);
              setParams(next);
            },
          )
        }
      >
        {label}
      </button>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}

/** Chưa có hồ sơ: lời nhắc chắc chắn trước khi báo tin và nút mở hồ sơ (thiết kế "Báo tin"). */
function ReportIntro({
  vault,
  onViewRejected,
}: {
  vault: ExecutorVault;
  onViewRejected: () => void;
}) {
  return (
    <div className="space-y-6">
      <Notice tone="danger" title="Hãy chắc chắn trước khi báo tin">
        Nếu {vault.ownerFullName} còn khỏe, họ có thể dừng bằng “Tôi còn sống”.
      </Notice>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Mở hồ sơ báo tin">
          <p className="mb-4 text-sm leading-6 text-heritage-muted">
            Bạn sẽ nhập họ tên Chủ kho, ngày mất, thông tin giấy chứng tử và tải giấy tờ lên. Hồ sơ
            được lưu nháp, chỉ gửi đi khi bạn xác nhận.
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <OpenCaseButton vault={vault} label="Mở hồ sơ chứng tử" />
            {vault.lastRejectedDeathCaseId && (
              <button type="button" className={buttonStyles.outline} onClick={onViewRejected}>
                Xem hồ sơ bị từ chối gần nhất
              </button>
            )}
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Điều gì xảy ra tiếp">
            <ol className="divide-y divide-heritage-border">
              {nextSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-semibold text-[#0A281E]"
                  >
                    {index + 2}
                  </span>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-heritage-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Lưu ý">
            <p className="text-sm leading-6 text-heritage-muted">
              Báo sai có thể bị xem xét lại. Mọi thao tác đều được ghi nhật ký.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Nội dung trang Báo tin của một kho: mở hồ sơ, soạn nháp, nộp bản bổ sung. */
export function ExecutorReport({ vault }: { vault: ExecutorVault }) {
  const [params, setParams] = useSearchParams();
  const caseId = useActiveCaseId(vault);
  const query = useDeathCase(caseId);
  if (!caseId) {
    return (
      <ReportIntro
        vault={vault}
        onViewRejected={() => {
          const next = new URLSearchParams(params);
          next.set("caseId", vault.lastRejectedDeathCaseId!);
          setParams(next);
        }}
      />
    );
  }
  if (query.isPending) return <p role="status">Đang tải hồ sơ…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không đọc được hồ sơ hoặc bạn không có quyền trong kho này.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const record = query.data;
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm font-medium text-heritage-muted underline underline-offset-4"
          onClick={() => window.location.reload()}
        >
          Tải lại hồ sơ và bỏ thay đổi chưa lưu
        </button>
      </div>
      <ReviewFeedback record={record} />
      <DeathCaseEditor record={record} />
      {record.status === "REJECTED" && !vault.openDeathCaseId && (
        <Panel title="Mở hồ sơ mới">
          <p className="mb-4 text-sm leading-6 text-heritage-muted">
            Hồ sơ này đã đóng. Nếu có giấy tờ đúng, bạn có thể mở một hồ sơ mới.
          </p>
          <OpenCaseButton vault={vault} label="Mở hồ sơ chứng tử" />
        </Panel>
      )}
    </div>
  );
}
