import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { adminService } from "../api/adminService";
import {
  INCIDENT_EVENT_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  RESPONSIBLE_ROLE_LABELS,
  defaultReviewLocal,
  formatDateTime,
  localDateTimeToIso,
} from "../model/admin.content";
import {
  INCIDENT_STATUSES,
  INCIDENT_TARGET_DEATH_CASE,
  INCIDENT_TYPES,
  type IncidentDetail,
  type IncidentStatus,
  type IncidentSummary,
} from "../model/admin.schema";
import { adminActionError } from "../model/adminError";
import {
  adminKeys,
  useAdminIncident,
  useAdminIncidents,
  useAdminUserOptions,
} from "../model/useAdmin";
import { useAdminIncidentParams } from "../model/useAdminListParams";
import { AdminActionDialog } from "./AdminActionDialog";
import {
  ListFilterBar,
  ListPill,
  ListSearchField,
  ListSegmentTabs,
  ListSelectField,
  ListTable,
  ListTableRow,
} from "@/shared/ui/listKit";
import { AdminPagination } from "./AdminPagination";
import { AdminErrorMessage } from "./AdminStateMessage";
import { IncidentHoldBox } from "./IncidentHoldBox";

const STATUS_STYLES: Record<IncidentStatus, string> = {
  OPEN: "bg-amber-50 text-amber-900 border-amber-300",
  IN_PROGRESS: "bg-sky-50 text-sky-900 border-sky-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {INCIDENT_STATUS_LABELS[status]}
    </span>
  );
}

/** Sự cố do người liên quan xử lý: Admin chỉ theo dõi nên hiện "Đang chờ …". */
function WaitingBadge({ role }: { role: keyof typeof RESPONSIBLE_ROLE_LABELS }) {
  return (
    <span className="inline-flex items-center rounded-full border border-stone-300 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-700">
      Đang chờ {RESPONSIBLE_ROLE_LABELS[role]}
    </span>
  );
}

function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      Quá hạn
    </span>
  );
}

/** Tên người phụ trách từ danh sách Admin/Verifier đang hoạt động; không có thì hiện mã rút gọn. */
function useAssigneeLabel(userId: string | null) {
  const admins = useAdminUserOptions("ADMIN");
  const verifiers = useAdminUserOptions("VERIFIER");
  if (!userId) return "Chưa có người phụ trách";
  const person = [...(admins.data?.items ?? []), ...(verifiers.data?.items ?? [])].find(
    (item) => item.id === userId,
  );
  return person ? person.fullName || person.email : `Tài khoản ${userId.slice(0, 8)}`;
}

/** Danh sách và chi tiết sự cố vận hành: bộ lọc và sự cố đang xem nằm trên URL. */
export function AdminIncidents() {
  const params = useAdminIncidentParams();
  if (params.selectedId)
    return (
      <IncidentDetailView incidentId={params.selectedId} onBack={() => params.select(undefined)} />
    );
  return <IncidentList params={params} />;
}

function IncidentList({ params }: { params: ReturnType<typeof useAdminIncidentParams> }) {
  const query = useAdminIncidents(params.query);
  return (
    <div className="mt-6 space-y-4">
      <ListSegmentTabs
        label="Trạng thái"
        value={params.filters.status ?? ""}
        options={[
          { value: "", label: "Tất cả" },
          ...INCIDENT_STATUSES.map((status) => ({
            value: status,
            label: INCIDENT_STATUS_LABELS[status],
          })),
        ]}
        onChange={(value) => params.setFilters({ status: value || undefined })}
      />
      <ListFilterBar onClear={params.hasFilters ? params.clearFilters : undefined}>
        <ListSearchField
          label="Tìm sự cố"
          placeholder="Tìm theo mã sự cố, mã hồ sơ hoặc nội dung"
          value={params.filters.search}
          onCommit={(value) => params.setFilters({ search: value })}
        />
        <ListPill
          pressed={params.filters.mine}
          onClick={() => params.setFilters({ mine: !params.filters.mine })}
        >
          Của tôi
        </ListPill>
        <ListPill
          pressed={params.filters.overdueOnly}
          onClick={() => params.setFilters({ overdueOnly: !params.filters.overdueOnly })}
        >
          Quá hạn
        </ListPill>
        <ListSelectField
          label="Loại sự cố"
          value={params.filters.type ?? ""}
          allLabel="Mọi loại"
          options={INCIDENT_TYPES.map((type) => ({
            value: type,
            label: INCIDENT_TYPE_LABELS[type],
          }))}
          onChange={(value) => params.setFilters({ type: value || undefined })}
        />
      </ListFilterBar>
      <section aria-labelledby="admin-incidents-heading" className="space-y-3">
        <h2 id="admin-incidents-heading" className="text-lg font-semibold">
          Danh sách sự cố
        </h2>
        <IncidentResult params={params} query={query} />
      </section>
    </div>
  );
}

function IncidentResult({
  params,
  query,
}: {
  params: ReturnType<typeof useAdminIncidentParams>;
  query: ReturnType<typeof useAdminIncidents>;
}) {
  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải danh sách sự cố"
        className="space-y-2"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  if (query.isError)
    return (
      <AdminErrorMessage
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        onResetFilters={params.clearFilters}
      />
    );
  const data = query.data;
  const refreshing = query.isPlaceholderData;
  if (data.totalPages > 0 && params.page > data.totalPages)
    return (
      <div role="status" className="space-y-3 rounded-xl border border-heritage-border p-4">
        <p className="text-sm">Trang {params.page} không tồn tại.</p>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => params.setPage(data.totalPages)}
        >
          Về trang cuối
        </Button>
      </div>
    );
  if (data.items.length === 0)
    return (
      <div role="status" className="space-y-3 rounded-xl border border-heritage-border p-4">
        <p className="text-sm text-heritage-muted">
          {params.hasFilters ? "Không có sự cố khớp bộ lọc." : "Hiện chưa có sự cố nào."}
        </p>
      </div>
    );
  return (
    <div
      aria-busy={refreshing}
      className={refreshing ? "opacity-60 transition-opacity" : undefined}
    >
      <p aria-live="polite" className="mb-3 text-sm text-heritage-muted">
        <b>{data.totalCount}</b> sự cố
      </p>
      <ListTable
        columns="minmax(220px,1.6fr) minmax(130px,.7fr) minmax(150px,.8fr) minmax(150px,.8fr)"
        headings={["Sự cố", "Trạng thái", "Hạn xử lý", "Người phụ trách"]}
      >
        {data.items.map((item) => (
          <IncidentRow key={item.id} item={item} onOpen={() => params.select(item.id)} />
        ))}
      </ListTable>
      <AdminPagination
        label="Phân trang sự cố"
        pageIndex={data.pageIndex}
        totalPages={data.totalPages}
        hasPreviousPage={data.hasPreviousPage}
        hasNextPage={data.hasNextPage}
        busy={refreshing}
        onPage={params.setPage}
      />
    </div>
  );
}

function IncidentRow({ item, onOpen }: { item: IncidentSummary; onOpen: () => void }) {
  const assignee = useAssigneeLabel(item.assigneeUserId);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block min-h-11 w-full text-left hover:bg-stone-50 focus-visible:bg-stone-50"
    >
      <ListTableRow>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-semibold">{INCIDENT_TYPE_LABELS[item.type]}</span>
          <span className="break-words text-sm text-heritage-muted">{item.summary}</span>
        </span>
        <span className="flex flex-wrap items-start gap-2">
          <StatusBadge status={item.status} />
          {item.overdue && item.status !== "RESOLVED" && <OverdueBadge />}
          {item.status !== "RESOLVED" && item.responsibleRole !== "ADMIN" && (
            <WaitingBadge role={item.responsibleRole} />
          )}
        </span>
        <span className="flex flex-col gap-1 text-sm tabular-nums">
          <b className="font-medium">{formatDateTime(item.dueAt)}</b>
          <small className="text-heritage-muted">
            Xem lại: {formatDateTime(item.nextReviewAt)}
          </small>
        </span>
        <span className="text-sm">
          {item.assigneeUserId ? (
            assignee
          ) : (
            <span className="font-semibold text-amber-900">Chưa có người phụ trách</span>
          )}
        </span>
      </ListTableRow>
    </button>
  );
}

type IncidentDialog = "assign" | "note" | "review" | "resolve" | "reassign" | "executor";

function IncidentDetailView({ incidentId, onBack }: { incidentId: string; onBack: () => void }) {
  const query = useAdminIncident(incidentId);
  const back = (
    <Button variant="outline" className="min-h-11" onClick={onBack}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Về danh sách
    </Button>
  );
  if (query.isPending)
    return (
      <div role="status" aria-busy="true" aria-label="Đang tải sự cố" className="mt-6 space-y-3">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  if (query.isError) {
    const specific = adminActionError(query.error);
    return (
      <div className="mt-6 space-y-3">
        {back}
        {specific ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {specific}
          </p>
        ) : (
          <AdminErrorMessage
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        )}
      </div>
    );
  }
  return <IncidentDetailBody detail={query.data} back={back} refreshing={query.isFetching} />;
}

function IncidentDetailBody({
  detail,
  back,
  refreshing,
}: {
  detail: IncidentDetail;
  back: ReactNode;
  refreshing: boolean;
}) {
  const client = useQueryClient();
  const [dialog, setDialog] = useState<IncidentDialog | null>(null);
  const assignee = useAssigneeLabel(detail.assigneeUserId);
  const open = detail.status !== "RESOLVED";
  // Sự cố báo còn sống đi theo hồ sơ: người phụ trách luôn là Verifier giữ hồ sơ và tự đóng khi Verifier kết luận,
  // nên không giao hay đóng tay; đổi người bằng giao lại người xét duyệt của hồ sơ (BE chặn INCIDENT_FOLLOWS_CASE).
  const followsCase = detail.type === "OWNER_ALIVE";
  const canReassign =
    open &&
    (detail.type === "NO_VERIFIER" || followsCase) &&
    detail.targetType === INCIDENT_TARGET_DEATH_CASE &&
    detail.targetId !== null;
  // Kho bị kẹt không còn Người thực thi hoạt động: Admin giao người mới; người này phải chấp nhận lời mời.
  const canAssignExecutor = open && detail.type === "NO_EXECUTOR" && detail.vaultId !== null;
  const close = () => setDialog(null);
  const done = () => void client.invalidateQueries({ queryKey: adminKeys.all });
  const dialogKey = `${detail.id}:${detail.etag}`;

  return (
    <div className="mt-6 space-y-6" aria-busy={refreshing}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <Button
          variant="outline"
          className="min-h-11"
          disabled={refreshing}
          onClick={() => void client.invalidateQueries({ queryKey: adminKeys.incident(detail.id) })}
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          Tải lại
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          <section
            aria-labelledby="incident-title"
            className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="incident-title" className="text-lg font-semibold">
                {INCIDENT_TYPE_LABELS[detail.type]}
              </h2>
              <StatusBadge status={detail.status} />
              {detail.overdue && open && <OverdueBadge />}
              {open && detail.responsibleRole !== "ADMIN" && (
                <WaitingBadge role={detail.responsibleRole} />
              )}
            </div>
            <p className="break-words text-sm">{detail.summary}</p>
          </section>

          {open ? (
            <section aria-label="Thao tác" className="flex flex-wrap gap-3">
              {canAssignExecutor && (
                <Button className="min-h-11" onClick={() => setDialog("executor")}>
                  Giao Người thực thi
                </Button>
              )}
              {!followsCase && (
                <Button
                  className="min-h-11"
                  variant={canAssignExecutor ? "outline" : "default"}
                  onClick={() => setDialog("assign")}
                >
                  Giao người phụ trách
                </Button>
              )}
              {canReassign && (
                <Button
                  className="min-h-11"
                  variant={followsCase ? "default" : "outline"}
                  onClick={() => setDialog("reassign")}
                >
                  Giao người xét duyệt
                </Button>
              )}
              <Button className="min-h-11" variant="outline" onClick={() => setDialog("note")}>
                Ghi chú
              </Button>
              <Button className="min-h-11" variant="outline" onClick={() => setDialog("review")}>
                Hẹn xem lại
              </Button>
              {!followsCase && (
                <Button className="min-h-11" variant="outline" onClick={() => setDialog("resolve")}>
                  Đóng sự cố
                </Button>
              )}
              {followsCase && (
                <p role="note" className="basis-full text-sm text-heritage-muted">
                  Sự cố này đi theo hồ sơ: người phụ trách là người xét duyệt đang giữ hồ sơ, và sự
                  cố tự đóng khi người đó kết luận lời báo. Muốn đổi người, dùng Giao người xét
                  duyệt.
                </p>
              )}
            </section>
          ) : (
            <p role="status" className="text-sm text-heritage-muted">
              Sự cố đã được xử lý nên không còn thao tác.
            </p>
          )}

          <section aria-labelledby="incident-events" className="space-y-3">
            <h3 id="incident-events" className="text-base font-semibold">
              Lịch sử
            </h3>
            {detail.events.length === 0 ? (
              <p className="text-sm text-heritage-muted">Chưa có sự kiện nào.</p>
            ) : (
              <ol className="space-y-2">
                {[...detail.events]
                  .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                  .map((event, index) => (
                    <li
                      key={`${event.at}-${index}`}
                      className="rounded-lg border border-heritage-border p-3 text-sm"
                    >
                      <p className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{INCIDENT_EVENT_LABELS[event.kind]}</span>
                        <time
                          dateTime={event.at}
                          className="text-xs text-heritage-muted tabular-nums"
                        >
                          {formatDateTime(event.at)}
                        </time>
                      </p>
                      {event.note && <p className="mt-1 break-words">{event.note}</p>}
                    </li>
                  ))}
              </ol>
            )}
          </section>
        </div>
        <div className="space-y-4">
          <aside className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-4">
            <h3 className="text-base font-semibold">Thông tin</h3>
            <dl className="space-y-3 text-sm">
              <Fact label="Người phụ trách" value={assignee} />
              <Fact label="Hạn xử lý" value={formatDateTime(detail.dueAt)} />
              <Fact label="Lần xem lại tiếp theo" value={formatDateTime(detail.nextReviewAt)} />
              <Fact label="Phát sinh lúc" value={formatDateTime(detail.createdAt)} />
              <Fact label="Số lần đã nhắc" value={String(detail.remindedCount)} />
              {detail.escalatedAt && (
                <Fact label="Đã báo quản trị viên lúc" value={formatDateTime(detail.escalatedAt)} />
              )}
              {detail.vaultId && <Fact label="Mã kho" value={detail.vaultId} mono />}
              {detail.targetId && (
                <Fact label={`Đối tượng (${detail.targetType})`} value={detail.targetId} mono />
              )}
              {detail.resolvedAt && (
                <Fact label="Xử lý xong lúc" value={formatDateTime(detail.resolvedAt)} />
              )}
              {detail.resolutionNote && (
                <Fact label="Kết quả xử lý" value={detail.resolutionNote} />
              )}
            </dl>
            <p className="text-xs text-heritage-muted">
              Chỉ hiện thông tin vận hành. Quản trị viên không đọc được nội dung kho hay giấy tờ.
            </p>
          </aside>
          {detail.vaultId && <IncidentHoldBox vaultId={detail.vaultId} />}
        </div>
      </div>

      {dialog === "assign" && (
        <AdminActionDialog
          key={dialogKey}
          title="Giao người phụ trách"
          description="Chỉ giao được cho quản trị viên hoặc người xét duyệt đang hoạt động, và không phải chủ kho hay người thực hiện của kho này."
          submitLabel="Giao"
          fields={[
            {
              name: "assigneeUserId",
              label: "Người phụ trách",
              kind: "user",
              roles: ["ADMIN", "VERIFIER"],
            },
            { name: "reason", label: "Lý do", kind: "textarea", maxLength: 1000 },
          ]}
          defaultValues={{ assigneeUserId: detail.assigneeUserId ?? "", reason: "" }}
          submit={(values) =>
            adminService.assignIncident(detail.id, {
              assigneeUserId: values.assigneeUserId,
              reason: values.reason,
              etag: detail.etag,
            })
          }
          onClose={close}
          onDone={done}
        />
      )}
      {dialog === "executor" && detail.vaultId && (
        <AdminActionDialog
          key={dialogKey}
          title="Giao Người thực thi cho kho"
          description="Kho không còn Người thực thi hoạt động. Chọn người hiểu luật sẽ nhận kho; người này nhận lời mời qua email và phải chấp nhận mới có hiệu lực. Không giao được cho chủ kho, quản trị viên hay người xét duyệt."
          submitLabel="Giao Người thực thi"
          fields={[
            {
              name: "userId",
              label: "Người thực thi mới",
              kind: "user",
              roles: ["EXECUTOR", "USER"],
            },
            { name: "reason", label: "Lý do", kind: "textarea", maxLength: 500 },
          ]}
          defaultValues={{ userId: "", reason: "" }}
          confirmLabel="Tôi xác nhận việc giao này, có ghi nhật ký."
          submit={(values) =>
            adminService.assignExecutor(detail.vaultId as string, {
              userId: values.userId,
              reason: values.reason,
            })
          }
          onClose={close}
          onDone={done}
        />
      )}
      {dialog === "reassign" && detail.targetId && (
        <AdminActionDialog
          key={dialogKey}
          title="Giao người xét duyệt cho hồ sơ"
          description={
            followsCase
              ? "Hồ sơ, lời báo còn sống và sự cố cùng chuyển sang người được chọn; người cũ mất quyền xem hồ sơ. Hạn kết luận được tính lại, hạn selfie của chủ kho giữ nguyên."
              : "Chọn người xét duyệt thay thế. Người được chọn không được có xung đột lợi ích với hồ sơ."
          }
          submitLabel="Giao người xét duyệt"
          fields={[
            { name: "verifierUserId", label: "Người xét duyệt", kind: "user", roles: ["VERIFIER"] },
            { name: "reason", label: "Lý do", kind: "textarea", maxLength: 500 },
          ]}
          defaultValues={{ verifierUserId: "", reason: "" }}
          confirmLabel="Tôi xác nhận giao hồ sơ này cho người xét duyệt đã chọn."
          submit={(values) =>
            adminService.reassignVerifier(detail.targetId as string, {
              verifierUserId: values.verifierUserId,
              reason: values.reason,
            })
          }
          onClose={close}
          onDone={done}
        />
      )}
      {dialog === "note" && (
        <AdminActionDialog
          key={dialogKey}
          title="Ghi chú sự cố"
          description="Ghi chú được lưu vào lịch sử sự cố. Không ghi mật khẩu, mã xác thực hay dữ liệu cá nhân."
          submitLabel="Lưu ghi chú"
          fields={[{ name: "note", label: "Ghi chú", kind: "textarea", maxLength: 1000 }]}
          defaultValues={{ note: "" }}
          submit={(values) => adminService.addIncidentNote(detail.id, { note: values.note })}
          onClose={close}
          onDone={done}
        />
      )}
      {dialog === "review" && (
        <AdminActionDialog
          key={dialogKey}
          title="Hẹn xem lại"
          description="Ghi kết quả lần xem lại này và hẹn lần xem lại tiếp theo, tối đa 7 ngày."
          submitLabel="Ghi nhận"
          fields={[
            { name: "note", label: "Kết quả xem lại", kind: "textarea", maxLength: 1000 },
            { name: "nextReviewAt", label: "Lần xem lại tiếp theo", kind: "datetime" },
          ]}
          defaultValues={{ note: "", nextReviewAt: defaultReviewLocal() }}
          submit={(values) =>
            adminService.reviewIncident(detail.id, {
              note: values.note,
              nextReviewAt: localDateTimeToIso(values.nextReviewAt),
              etag: detail.etag,
            })
          }
          onClose={close}
          onDone={done}
        />
      )}
      {dialog === "resolve" && (
        <AdminActionDialog
          key={dialogKey}
          title="Đóng sự cố"
          description="Ghi kết quả xử lý. Sau khi đóng, sự cố không còn thao tác."
          submitLabel="Đóng sự cố"
          fields={[{ name: "note", label: "Kết quả xử lý", kind: "textarea", maxLength: 1000 }]}
          defaultValues={{ note: "" }}
          confirmLabel="Tôi xác nhận sự cố này đã được xử lý."
          submit={(values) =>
            adminService.resolveIncident(detail.id, { note: values.note, etag: detail.etag })
          }
          onClose={close}
          onDone={done}
        />
      )}
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-heritage-muted">{label}</dt>
      <dd className={`break-words ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
