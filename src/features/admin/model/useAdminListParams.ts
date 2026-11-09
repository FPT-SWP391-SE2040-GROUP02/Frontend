import { useSearchParams } from "react-router-dom";
import {
  ADMIN_LIST_PAGE_SIZE,
  holdStatusSchema,
  incidentStatusSchema,
  incidentTypeSchema,
  paymentFilterStatusSchema,
  type HoldsQuery,
  type IncidentsQuery,
  type PaymentTransactionsQuery,
} from "./admin.schema";

const MAX_PAGE = 1_000_000;

function readPage(value: string | null) {
  const page = Number(value ?? 1);
  return Number.isSafeInteger(page) && page > 0 && page <= MAX_PAGE ? page : 1;
}

/** Ghi các khoá đổi vào URL hiện tại, giữ `view` và các khoá khác; đổi bộ lọc thì về trang 1. */
function useParamWriter() {
  const [params, setParams] = useSearchParams();
  const write = (patch: Record<string, string | undefined>, resetPage = true) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) next.delete("page");
      return next;
    });
  return { params, write };
}

/**
 * Bộ lọc Sự cố nằm trên URL (`status`, `type`, `overdue`, `page`) cùng `incident` là sự cố đang xem.
 * Giá trị ngoài enum bị bỏ qua thay vì gửi lên Backend.
 */
export function useAdminIncidentParams() {
  const { params, write } = useParamWriter();
  const status = incidentStatusSchema.safeParse(params.get("status"));
  const type = incidentTypeSchema.safeParse(params.get("type"));
  const filters = {
    status: status.success ? status.data : undefined,
    type: type.success ? type.data : undefined,
    overdueOnly: params.get("overdue") === "1" || params.get("overdue") === "true",
    mine: params.get("mine") === "1",
    search: (params.get("iq") ?? "").trim().slice(0, 100),
  };
  const page = readPage(params.get("page"));
  const query: IncidentsQuery = {
    status: filters.status,
    type: filters.type,
    overdueOnly: filters.overdueOnly || undefined,
    mine: filters.mine || undefined,
    search: filters.search || undefined,
    pageIndex: page,
    pageSize: ADMIN_LIST_PAGE_SIZE,
  };
  const selectedId = params.get("incident") || params.get("incidentId");
  return {
    filters,
    page,
    query,
    selectedId,
    hasFilters: Boolean(
      filters.status || filters.type || filters.overdueOnly || filters.mine || filters.search,
    ),
    setFilters: (patch: {
      status?: string;
      type?: string;
      overdueOnly?: boolean;
      mine?: boolean;
      search?: string;
    }) =>
      write({
        ...("mine" in patch ? { mine: patch.mine ? "1" : undefined } : {}),
        ...("search" in patch ? { iq: patch.search || undefined } : {}),
        ...("status" in patch ? { status: patch.status } : {}),
        ...("type" in patch ? { type: patch.type } : {}),
        ...("overdueOnly" in patch ? { overdue: patch.overdueOnly ? "1" : undefined } : {}),
      }),
    clearFilters: () =>
      write({
        status: undefined,
        type: undefined,
        overdue: undefined,
        mine: undefined,
        iq: undefined,
      }),
    setPage: (next: number) => write({ page: next > 1 ? String(next) : undefined }, false),
    select: (id: string | undefined) => write({ incident: id }, false),
  };
}

/** Bộ lọc Tạm giữ trên URL (`hstatus`, `page`) cùng `hold` là hold đang xem. */
export function useAdminHoldParams() {
  const { params, write } = useParamWriter();
  const status = holdStatusSchema.safeParse(params.get("hstatus"));
  const filters = { status: status.success ? status.data : undefined };
  const page = readPage(params.get("page"));
  const query: HoldsQuery = {
    status: filters.status,
    pageIndex: page,
    pageSize: ADMIN_LIST_PAGE_SIZE,
  };
  return {
    filters,
    page,
    query,
    selectedId: params.get("hold"),
    hasFilters: Boolean(filters.status),
    setStatus: (value: string | undefined) => write({ hstatus: value }),
    clearFilters: () => write({ hstatus: undefined }),
    setPage: (next: number) => write({ page: next > 1 ? String(next) : undefined }, false),
    select: (id: string | undefined) => write({ hold: id }, false),
  };
}

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Bộ lọc Giao dịch thanh toán trên URL (`pstatus`, `pq`, `penv`, `pfrom`, `pto`, `page`);
 * giá trị ngoài enum hoặc sai định dạng ngày bị bỏ qua.
 */
export function useAdminPaymentParams() {
  const { params, write } = useParamWriter();
  const status = paymentFilterStatusSchema.safeParse(params.get("pstatus"));
  const env = params.get("penv");
  const from = params.get("pfrom");
  const to = params.get("pto");
  const filters = {
    status: status.success ? status.data : undefined,
    search: (params.get("pq") ?? "").trim().slice(0, 60),
    environment: (env === "Live" || env === "Test" ? env : undefined) as
      "Live" | "Test" | undefined,
    from: from && DATE_PARAM.test(from) ? from : undefined,
    to: to && DATE_PARAM.test(to) ? to : undefined,
  };
  const page = readPage(params.get("page"));
  const query: PaymentTransactionsQuery = {
    status: filters.status,
    search: filters.search || undefined,
    environment: filters.environment,
    from: filters.from,
    to: filters.to,
    pageIndex: page,
    pageSize: ADMIN_LIST_PAGE_SIZE,
  };
  return {
    filters,
    page,
    query,
    hasFilters: Boolean(
      filters.status || filters.search || filters.environment || filters.from || filters.to,
    ),
    setStatus: (value: string | undefined) => write({ pstatus: value }),
    setSearch: (value: string) => write({ pq: value || undefined }),
    setEnvironment: (value: string | undefined) => write({ penv: value }),
    setFrom: (value: string | undefined) => write({ pfrom: value }),
    setTo: (value: string | undefined) => write({ pto: value }),
    clearFilters: () =>
      write({
        pstatus: undefined,
        pq: undefined,
        penv: undefined,
        pfrom: undefined,
        pto: undefined,
      }),
    setPage: (next: number) => write({ page: next > 1 ? String(next) : undefined }, false),
  };
}
