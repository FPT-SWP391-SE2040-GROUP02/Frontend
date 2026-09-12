import React from "react";
import type { AssetStrategy } from "./assetStrategy.interface";
import type { EncryptedPayload } from "../asset.types";
import { documentDataSchema } from "../asset.schema";
import { FileText, ShieldCheck } from "lucide-react";
import { Input } from "@/shared/ui";

/**
 * @file documentStrategy.tsx
 * @description Triển khai Strategy cho tài liệu mật số (Bất động sản, Giấy chứng nhận cổ phần, Hợp đồng bảo hiểm).
 */
export const documentStrategy: AssetStrategy = {
  type: "DOCUMENT",
  label: "Tài Liệu Số (Documents)",
  description: "Hợp đồng bảo hiểm nhân thọ, sổ đỏ số, giấy chứng nhận cổ phần và di chúc đính kèm.",
  badgeBg: "bg-[#EFECE6]",
  badgeText: "text-[#14241C]",

  validate(data: unknown): boolean {
    return documentDataSchema.safeParse(data).success;
  },

  preparePayload(data: unknown): EncryptedPayload {
    // TODO: [Developer Step] Mã hóa AES-GCM-256 đối với file đính kèm & thông tin giấy tờ
    return {
      ciphertext: btoa(JSON.stringify(data)),
      iv: "iv_sample_doc_12bytes",
      authTag: "tag_sample_doc_16bytes",
      keyDerivationSalt: "salt_sample_32bytes",
    };
  },

  renderFormFields({ data, onChange }) {
    const categories = [
      { label: "Giấy Chứng Nhận Quyền Sử Dụng Đất (Sổ Đỏ Số)", value: "REAL_ESTATE_CERTIFICATE" },
      { label: "Hợp Đồng Bảo Hiểm Nhân Thọ", value: "INSURANCE_POLICY" },
      { label: "Cổ Phần / Trái Phiếu Doanh Nghiệp", value: "SHARE_CERTIFICATE" },
      { label: "Sở Hữu Trí Tuệ & Bằng Sáng Chế", value: "INTELLECTUAL_PROPERTY" },
      { label: "Tài Liệu Pháp Lý Khác", value: "OTHER_DOCUMENT" },
    ];

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Phân Loại Tài Liệu Pháp Lý *
          </label>
          <select
            value={(data.documentCategory as string) || "REAL_ESTATE_CERTIFICATE"}
            onChange={(e) => onChange("documentCategory", e.target.value)}
            className="w-full h-11 px-3 bg-[#FAF9F5] border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-medium text-[#14241C] outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Số Hiệu Giấy Tờ / Mã Hợp Đồng *
          </label>
          <Input
            type="text"
            placeholder="Ví dụ: GCN-QD-2024-889123 / HDBH-PRU-9901"
            value={(data.identifierNumber as string) || ""}
            onChange={(e) => onChange("identifierNumber", e.target.value)}
            className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Ghi Chú Vị Trí Lưu Trữ Bản Gốc / Hướng Dẫn Pháp Lý
          </label>
          <textarea
            rows={4}
            placeholder="Vị trí két sắt vật lý tại gia đình, số liên hệ văn phòng công chứng quản lý bản sao y..."
            value={(data.notes as string) || ""}
            onChange={(e) => onChange("notes", e.target.value)}
            className="w-full p-3 bg-[#FAF9F5] border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-sans outline-none"
          />
        </div>
      </div>
    );
  },

  renderDetails({ rawPayload, metadata }) {
    let decoded: Record<string, string> = {};
    try {
      decoded = JSON.parse(decodeURIComponent(atob(rawPayload.ciphertext)));
    } catch {
      try {
        decoded = JSON.parse(atob(rawPayload.ciphertext));
      } catch {
        decoded = (metadata as Record<string, string>) || {};
      }
    }

    return (
      <div className="space-y-4">
        <div className="p-5 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[16px] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#EFECE6] border border-[#DCD9D0] flex items-center justify-center text-[#0B291E]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#66786E] uppercase">Số Hiệu Giấy Tờ</span>
              <p className="text-sm font-bold font-mono text-[#0B291E]">
                {decoded.identifierNumber || "GCN-QSDD-BT-2024-9912"}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E5DD]">
            <span className="text-[11px] font-bold text-[#66786E] uppercase">
              Chỉ Dẫn Lưu Trữ & Thừa Kế
            </span>
            <p className="text-xs text-[#14241C] mt-1 leading-relaxed whitespace-pre-line">
              {decoded.notes ||
                "Bản gốc lưu tại Két sắt ngân hàng Vietcombank chi nhánh Tân Bình. Hợp đồng ủy quyền công chứng số 102/2025/CC."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-[#059669] font-medium border-t border-[#E8E5DD]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Đã băm lưu trữ SHA-256
            </span>
            <span className="text-[#66786E]">Điều 612 BLDS</span>
          </div>
        </div>
      </div>
    );
  },
};
