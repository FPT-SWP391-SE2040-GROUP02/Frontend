import React from "react";
import type { AssetStrategy } from "./assetStrategy.interface";
import type { EncryptedPayload } from "../asset.types";
import { credentialDataSchema } from "../asset.schema";
import { MaskedKeyViewer } from "../../ui/MaskedKeyViewer";
import { Input } from "@/shared/ui";

/**
 * @file credentialStrategy.tsx
 * @description Triển khai Strategy cho tài khoản số (Web Accounts, Cloud Passwords, 2FA Backup Codes).
 */
export const credentialStrategy: AssetStrategy = {
  type: "CREDENTIAL",
  label: "Tài Khoản Số (Credentials)",
  description: "Mật khẩu dịch vụ đám mây, mạng xã hội, cổng giao dịch và mã phục hồi 2FA.",
  badgeBg: "bg-[#E5EDE8]",
  badgeText: "text-[#0B291E]",

  validate(data: unknown): boolean {
    return credentialDataSchema.safeParse(data).success;
  },

  preparePayload(data: unknown): EncryptedPayload {
    // TODO: [Developer Step] Mã hóa AES-GCM-256 đối với data credentials
    return {
      ciphertext: btoa(JSON.stringify(data)),
      iv: "iv_sample_credential_12bytes",
      authTag: "tag_sample_credential_16bytes",
      keyDerivationSalt: "salt_sample_32bytes",
    };
  },

  renderFormFields({ data, onChange }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Tên Dịch Vụ / Nền Tảng *
          </label>
          <Input
            type="text"
            placeholder="Ví dụ: Google Workspace, AWS Root, Binance..."
            value={(data.serviceName as string) || ""}
            onChange={(e) => onChange("serviceName", e.target.value)}
            className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Đường Dẫn Đăng Nhập (URL)
          </label>
          <Input
            type="url"
            placeholder="https://accounts.google.com"
            value={(data.serviceUrl as string) || ""}
            onChange={(e) => onChange("serviceUrl", e.target.value)}
            className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Tên Đăng Nhập / Email Quản Trị *
          </label>
          <Input
            type="text"
            placeholder="admin@mycompany.com"
            value={(data.username as string) || ""}
            onChange={(e) => onChange("username", e.target.value)}
            className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Mật Khẩu Đăng Nhập *
          </label>
          <Input
            type="password"
            placeholder="••••••••••••"
            value={(data.password as string) || ""}
            onChange={(e) => onChange("password", e.target.value)}
            className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Mã Khôi Phục 2FA / Khóa Bí Mật TOTP
          </label>
          <textarea
            rows={3}
            placeholder="Nhập danh sách mã dự phòng 2FA (backup codes) hoặc Secret Key để tạo mã OTP"
            value={(data.twoFactorBackupCodes as string) || ""}
            onChange={(e) => onChange("twoFactorBackupCodes", e.target.value)}
            className="w-full p-3 bg-[#FAF9F5] border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-mono outline-none"
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
        <div className="p-4 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[16px] space-y-3">
          <div>
            <span className="text-[11px] font-bold text-[#66786E] uppercase">Dịch Vụ</span>
            <p className="text-sm font-bold text-[#0B291E] mt-0.5">
              {decoded.serviceName || "Google Workspace Admin"}
            </p>
          </div>

          {decoded.serviceUrl && (
            <div>
              <span className="text-[11px] font-bold text-[#66786E] uppercase">Website</span>
              <p className="text-xs text-[#0B291E] hover:underline mt-0.5">
                <a href={decoded.serviceUrl} target="_blank" rel="noreferrer">
                  {decoded.serviceUrl}
                </a>
              </p>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold text-[#66786E] uppercase">Tài Khoản</span>
            <p className="text-xs font-medium text-[#14241C] mt-0.5">
              {decoded.username || "founder@legacyvault.vn"}
            </p>
          </div>
        </div>

        {/* Master Component #1: Masked Password */}
        <MaskedKeyViewer
          label="Mật Khẩu Quản Trị"
          value={decoded.password || "SuperSecretAdminPass2026!@#"}
        />

        {/* Master Component #1: Masked 2FA Codes */}
        {decoded.twoFactorBackupCodes && (
          <MaskedKeyViewer
            label="Mã Dự Phòng 2FA (Backup Codes)"
            value={decoded.twoFactorBackupCodes}
            warningText="Mỗi mã dự phòng chỉ sử dụng được 1 lần khi đăng nhập khẩn cấp."
          />
        )}
      </div>
    );
  },
};
