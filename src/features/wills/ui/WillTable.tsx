import React, { useState, useMemo } from "react";
import { FileText, ShieldCheck, Eye, RotateCcw, AlertCircle, Plus, Search, X } from "lucide-react";
import { Button, Badge, Input } from "@/shared/ui";
import { useWills, useRevokeWill } from "../model/useWills";
import type { WillViewModel } from "../model/will.types";

/**
 * @file WillTable.tsx
 * @description Bảng danh sách các bản di chúc số đã niêm phong với đầy đủ 4 trạng thái theo Rule 5 & Rule 11.
 */

interface WillTableProps {
  onSelectWill: (will: WillViewModel) => void;
  onOpenCreateWizard: () => void;
}

export const WillTable: React.FC<WillTableProps> = ({ onSelectWill, onOpenCreateWizard }) => {
  const { data, isLoading, isError, refetch } = useWills();
  const { mutate: revokeWill, isPending: isRevoking } = useRevokeWill();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!data?.items || !Array.isArray(data.items)) return [];
    if (!searchTerm.trim()) return data.items;
    const term = searchTerm.trim().toLowerCase();

    return data.items.filter((w) => {
      if (!w) return false;
      const title = (w.title ?? "").toLowerCase();
      const notes = (w.declarationNotes ?? "").toLowerCase();
      return title.includes(term) || notes.includes(term);
    });
  }, [data, searchTerm]);

  // 1. Loading
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải danh sách di chúc"
        className="bg-heritage-surface border border-heritage-border rounded-[24px] p-6 space-y-4"
      >
        <div className="h-10 bg-heritage-canvas rounded-[14px] w-1/3 animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-heritage-canvas rounded-[16px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Error
  if (isError || !data) {
    return (
      <div
        role="alert"
        className="bg-heritage-surface border border-heritage-danger/30 rounded-[24px] p-8 text-center space-y-4 shadow-sm"
      >
        <AlertCircle className="w-10 h-10 text-heritage-danger mx-auto" />
        <div>
          <h3 className="text-base font-bold text-heritage-text">
            Không thể nạp danh sách di chúc số
          </h3>
          <p className="text-xs text-heritage-muted mt-1">
            Đã xảy ra lỗi kết nối với máy chủ quản lý di chúc.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          className="min-h-[44px] rounded-[16px] bg-heritage-sidebar text-white text-xs font-semibold px-6 shadow-sm focus-visible:ring-2 focus-visible:ring-heritage-gold"
        >
          Thử Lại Ngay
        </Button>
      </div>
    );
  }

  // 3. Empty
  if (data.items.length === 0) {
    return (
      <div className="bg-heritage-surface border border-heritage-border rounded-[24px] p-12 text-center space-y-4 shadow-[0_2px_12px_rgba(11,41,30,0.04)]">
        <div className="w-16 h-16 rounded-[20px] bg-heritage-primary-light text-heritage-primary flex items-center justify-center mx-auto shadow-sm">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-heritage-text">Chưa Có Bản Di Chúc Số Nào</h3>
          <p className="text-xs sm:text-sm text-heritage-muted max-w-md mx-auto mt-1 leading-relaxed">
            Hãy bắt đầu khởi tạo bản di chúc số đầu tiên để định đoạt tài sản và bảo vệ quyền lợi
            hợp pháp của con cháu theo Bộ Luật Dân Sự 2015.
          </p>
        </div>
        <Button
          onClick={onOpenCreateWizard}
          className="min-h-[44px] rounded-[20px] bg-heritage-sidebar hover:bg-heritage-sidebar/90 text-white font-bold text-xs px-6 py-3 shadow-[0_4px_16px_rgba(11,41,30,0.2)] flex items-center gap-2 mx-auto focus-visible:ring-2 focus-visible:ring-heritage-gold"
        >
          <Plus className="w-4 h-4 text-heritage-gold" />
          Lập Bản Di Chúc Đầu Tiên
        </Button>
      </div>
    );
  }

  // 4. Success
  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-heritage-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề di chúc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-10 pr-9 bg-heritage-surface border-heritage-border focus:border-heritage-gold rounded-[16px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-heritage-gold"
            aria-label="Tìm kiếm di chúc"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Xóa tìm kiếm"
              className="w-7 h-7 rounded-full flex items-center justify-center text-heritage-muted hover:text-heritage-text absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-heritage-muted font-medium">
          Hiển thị <span className="font-bold text-heritage-primary">{filteredItems.length}</span> /{" "}
          {data.items.length} bản di chúc
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-heritage-surface border border-heritage-border rounded-[24px] p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-heritage-text">
            Không tìm thấy bản di chúc phù hợp
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="min-h-[44px] rounded-[16px] text-xs font-semibold mt-2"
          >
            Xóa Tìm Kiếm
          </Button>
        </div>
      ) : (
        <div className="bg-heritage-surface border border-heritage-border rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(11,41,30,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Danh sách di chúc số">
              <thead>
                <tr className="border-b border-heritage-neutral-bg bg-heritage-canvas/70 text-heritage-muted text-[11px] font-bold uppercase tracking-wider">
                  <th scope="col" className="py-4 px-6">
                    Bản Di Chúc Số
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Trạng Thái Pháp Lý
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Tài Sản Gắn Kèm
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Người Thừa Kế
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Video Minh Mẫn
                  </th>
                  <th scope="col" className="py-4 px-6 text-right">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-neutral-bg text-xs font-medium">
                {filteredItems.map((will) => (
                  <tr
                    key={will.id}
                    className="hover:bg-[#FAF7EE]/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectWill(will)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectWill(will);
                      }
                    }}
                  >
                    {/* Title */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[12px] bg-heritage-canvas border border-heritage-border flex items-center justify-center shrink-0 group-hover:border-heritage-gold transition-colors">
                          <FileText className="w-5 h-5 text-heritage-primary" />
                        </div>
                        <div>
                          <span className="font-bold text-heritage-text text-sm block group-hover:text-heritage-primary">
                            {will.title}
                          </span>
                          <span className="text-[11px] text-heritage-muted truncate max-w-xs block">
                            {will.declarationNotes}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <Badge
                        className={`px-3 py-1 text-[11px] font-semibold rounded-full border ${
                          will.status === "SEALED"
                            ? "bg-heritage-primary-light text-heritage-primary border-[#A2C4AF]"
                            : will.status === "REVOKED"
                              ? "bg-heritage-danger-bg text-heritage-danger border-heritage-danger/30"
                              : "bg-heritage-gold-light text-heritage-gold border-heritage-gold-border"
                        }`}
                      >
                        {will.statusLabel}
                      </Badge>
                    </td>

                    {/* Asset count */}
                    <td className="py-4 px-4 font-semibold text-heritage-text">
                      <span className="text-heritage-primary font-bold">{will.assetCount}</span> tài
                      sản
                    </td>

                    {/* Beneficiaries */}
                    <td className="py-4 px-4 font-semibold text-heritage-text">
                      <span className="text-heritage-gold font-bold">{will.beneficiaryCount}</span>{" "}
                      người
                    </td>

                    {/* Video Affidavit Hash */}
                    <td className="py-4 px-4">
                      {will.hasAffidavit ? (
                        <div className="flex items-center gap-1.5 text-heritage-success">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span className="font-mono text-[10px]">
                            SHA: {will.affidavitHashShort}
                          </span>
                        </div>
                      ) : (
                        <span className="text-heritage-muted text-[11px]">Chưa có</span>
                      )}
                    </td>

                    {/* Actions (>= 44px Touch Target) */}
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => onSelectWill(will)}
                          aria-label={`Xem chi tiết di chúc ${will.title}`}
                          className="min-h-[44px] px-3.5 rounded-[12px] text-xs text-heritage-primary hover:bg-heritage-primary-light flex items-center gap-1.5 font-semibold focus-visible:ring-2 focus-visible:ring-heritage-gold"
                        >
                          <Eye className="w-4 h-4 text-heritage-gold" />
                          <span>Xem</span>
                        </Button>

                        {will.status === "SEALED" && (
                          <Button
                            variant="ghost"
                            disabled={isRevoking}
                            onClick={() => {
                              if (
                                confirm(
                                  `Bạn có chắc chắn muốn thu hồi bản di chúc "${will.title}"?`,
                                )
                              ) {
                                revokeWill(will.id);
                              }
                            }}
                            aria-label={`Thu hồi di chúc ${will.title}`}
                            className="min-h-[44px] px-3 rounded-[12px] text-xs text-heritage-danger hover:bg-heritage-danger-bg flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-heritage-danger"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Thu Hồi</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
