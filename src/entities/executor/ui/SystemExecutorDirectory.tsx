import { useId, useState } from "react";
import { Search } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import type { SystemExecutor } from "../model/systemExecutor.schema";
import { useSystemExecutors } from "../model/useSystemExecutors";
import { SystemExecutorCard } from "./SystemExecutorCard";

export interface SystemExecutorDirectoryProps {
  /** Email của người đang được chọn (so không phân biệt hoa thường); chưa chọn ai thì null. */
  selectedEmail: string | null;
  onSelect: (executor: SystemExecutor) => void;
  /** Trả câu lý do nếu không được chọn người này; null là chọn được. */
  getDisabledReason?: (executor: SystemExecutor) => string | null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matches(executor: SystemExecutor, keyword: string): boolean {
  if (keyword === "") {
    return true;
  }
  const fields = [
    executor.fullName,
    executor.email,
    executor.executorRoleTitle,
    executor.legalVerification.organization ?? "",
  ];
  return fields.some((field) => normalize(field).includes(keyword));
}

/**
 * Danh bạ Người thực thi hệ thống: Chủ kho tìm và chọn một người thay cho việc gõ email tự do.
 * Danh sách, hồ sơ pháp lý và quyền mời đều do Backend quyết định; ở đây chỉ hiển thị và lọc theo chữ.
 */
export function SystemExecutorDirectory({
  selectedEmail,
  onSelect,
  getDisabledReason,
}: SystemExecutorDirectoryProps) {
  const query = useSystemExecutors();
  const searchId = useId();
  const [keyword, setKeyword] = useState("");

  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải danh bạ Người thực thi…
      </p>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm">Không tải được danh bạ Người thực thi hệ thống.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (query.data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-heritage-border p-4 text-sm leading-6 text-heritage-muted">
        Hiện chưa có Người thực thi hệ thống nào sẵn sàng. Vui lòng liên hệ ban quản trị để được hỗ
        trợ phân công.
      </p>
    );
  }

  let selected: string | null = null;
  if (selectedEmail !== null) {
    selected = normalize(selectedEmail);
  }
  const term = normalize(keyword);
  const visible = query.data.filter((executor) => matches(executor, term));

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Tìm Người thực thi theo tên, email hoặc chuyên môn
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
          aria-hidden="true"
        />
        <input
          id={searchId}
          type="search"
          value={keyword}
          placeholder="Tìm theo tên, email hoặc chuyên môn"
          className="min-h-11 w-full rounded-xl border border-heritage-border bg-white pl-9 pr-3 text-sm"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>
      {visible.length === 0 && (
        <p role="status" className="text-sm text-heritage-muted">
          Không có Người thực thi nào khớp với từ khóa đang tìm.
        </p>
      )}
      <ul aria-label="Danh bạ Người thực thi hệ thống" className="space-y-3">
        {visible.map((executor) => (
          <SystemExecutorCard
            key={executor.id}
            executor={executor}
            selected={selected !== null && normalize(executor.email) === selected}
            disabledReason={getDisabledReason ? getDisabledReason(executor) : null}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}
