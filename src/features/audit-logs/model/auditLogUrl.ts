import { auditActionValues, type AuditAction } from "./auditLog.schema";
import { isCalendarDateString } from "./auditLogDate";
import type { AuditLogFilterState } from "./auditLog.types";

/** Page size cố định cho màn nhật ký; nằm trong khoảng Backend chấp nhận (1..100). */
export const AUDIT_LOG_PAGE_SIZE = 20;

const PAGE_INDEX_KEY = "page";
const PAGE_SIZE_KEY = "size";
const ACTION_KEY = "action";
const FROM_KEY = "from";
const TO_KEY = "to";

const actionSet = new Set<string>(auditActionValues);

/**
 * @description Parse URL filters without throwing; invalid paging/action uses safe defaults.
 * Keep real calendar dates even in reversed ranges so the UI can display and correct them.
 * Caller checks auditLogDateError against the original URL before enabling the request.
 */
export function parseAuditLogFilter(
  params: URLSearchParams,
  fallback: AuditLogFilterState,
): AuditLogFilterState {
  const pageIndex = parsePageIndex(params.get(PAGE_INDEX_KEY), fallback.pageIndex);
  const pageSize = parsePageSize(params.get(PAGE_SIZE_KEY), fallback.pageSize);
  const action = parseAction(params.get(ACTION_KEY));
  const fromDate = parseDate(params.get(FROM_KEY));
  const toDate = parseDate(params.get(TO_KEY));
  return { pageIndex, pageSize, action, fromDate, toDate };
}

/**
 * @description Build URLSearchParams mới giữ nguyên giá trị không thuộc filter.
 * Khi filter thay đổi (action/from/to) caller phải set pageIndex=1 riêng.
 */
export function buildAuditLogSearch(
  current: URLSearchParams,
  state: AuditLogFilterState,
): URLSearchParams {
  const next = new URLSearchParams(current);
  setOrDelete(next, PAGE_INDEX_KEY, state.pageIndex);
  setOrDelete(next, PAGE_SIZE_KEY, state.pageSize);
  setOrDelete(next, ACTION_KEY, state.action);
  setOrDelete(next, FROM_KEY, state.fromDate);
  setOrDelete(next, TO_KEY, state.toDate);
  return next;
}

function parsePageIndex(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 1_000_000 ? parsed : fallback;
}

function parsePageSize(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 100 ? parsed : fallback;
}

function parseAction(raw: string | null): AuditAction | undefined {
  if (!raw) return undefined;
  return actionSet.has(raw) ? (raw as AuditAction) : undefined;
}

function parseDate(raw: string | null): string | undefined {
  return raw && isCalendarDateString(raw) ? raw : undefined;
}

function setOrDelete(target: URLSearchParams, key: string, value: number | string | undefined) {
  if (value === undefined || value === "" || value === null) {
    target.delete(key);
    return;
  }
  target.set(key, String(value));
}
