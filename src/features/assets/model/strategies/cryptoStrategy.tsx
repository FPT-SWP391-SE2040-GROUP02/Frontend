import React from "react";
import type { AssetStrategy } from "./assetStrategy.interface";
import type { EncryptedPayload } from "../asset.types";
import { cryptoDataSchema } from "../asset.schema";
import { MaskedKeyViewer } from "../../ui/MaskedKeyViewer";
import { SeedPhraseGrid } from "../../ui/SeedPhraseGrid";
import { Input } from "@/shared/ui";

/**
 * @file cryptoStrategy.tsx
 * @description Triển khai Strategy cho tài sản tiền mã hóa (Crypto Wallets, Private Keys, BIP-39 Seed Phrases).
 */
export const cryptoStrategy: AssetStrategy = {
  type: "CRYPTO",
  label: "Ví Tiền Mã Hóa (Crypto)",
  description: "Khóa riêng tư (Private Key) và Cụm từ khôi phục 12/24 từ (Seed Phrase) bảo vệ Bitcoin, Ethereum, Solana.",
  badgeBg: "bg-[#FBF7EE]",
  badgeText: "text-[#B88E4C]",

  validate(data: unknown): boolean {
    return cryptoDataSchema.safeParse(data).success;
  },

  preparePayload(data: unknown): EncryptedPayload {
    // TODO: [Developer Step]
    // 1. Nhận mật khẩu Master Password của User để suy biến Master DEK (PBKDF2 / Argon2id)
    // 2. Mã hóa đối xứng AES-GCM-256 đối với JSON.stringify(data)
    // 3. Trả về ciphertext, iv, authTag, keyDerivationSalt
    return {
      ciphertext: btoa(JSON.stringify(data)),
      iv: "iv_sample_aes_gcm_12bytes",
      authTag: "tag_sample_16bytes",
      keyDerivationSalt: "salt_sample_32bytes",
    };
  },

  renderFormFields({ data, onChange }) {
    const networks = [
      { label: "Ethereum (ERC-20)", value: "ETHEREUM" },
      { label: "Bitcoin (BTC)", value: "BITCOIN" },
      { label: "Solana (SOL)", value: "SOLANA" },
      { label: "Binance Smart Chain (BEP-20)", value: "BINANCE_SMART_CHAIN" },
      { label: "Khác", value: "OTHER" },
    ];

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Mạng Lưới Blockchain *
          </label>
          <select
            value={(data.network as string) || "ETHEREUM"}
            onChange={(e) => onChange("network", e.target.value)}
            className="w-full h-11 px-3 bg-[#FAF9F5] border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-medium text-[#14241C] outline-none"
          >
            {networks.map((net) => (
              <option key={net.value} value={net.value}>
                {net.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Địa Chỉ Ví Công Khai (Public Wallet Address) *
          </label>
          <Input
            type="text"
            placeholder="0x71C... hoặc bc1q..."
            value={(data.walletAddress as string) || ""}
            onChange={(e) => onChange("walletAddress", e.target.value)}
            className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            12 Từ Khôi Phục (Seed Phrase / Mnemonic)
          </label>
          <textarea
            rows={3}
            placeholder="Nhập 12 từ bí mật cách nhau bằng khoảng trắng (ví dụ: apple banana cat dog elephant...)"
            value={(data.seedPhrase as string) || ""}
            onChange={(e) => onChange("seedPhrase", e.target.value)}
            className="w-full p-3 bg-[#FAF9F5] border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-mono outline-none"
          />
          <p className="text-[11px] text-[#66786E] mt-1">
            Hệ thống mã hóa đầu cuối tại máy khách (Zero-Knowledge) trước khi truyền tải.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14241C] mb-1.5">
            Khóa Riêng Tư (Private Key thô - Tùy chọn)
          </label>
          <Input
            type="password"
            placeholder="0x..."
            value={(data.privateKey as string) || ""}
            onChange={(e) => onChange("privateKey", e.target.value)}
            className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-mono"
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

    const defaultSeed =
      decoded.seedPhrase ||
      "abandon amount liar amount expire adjust cage candy arch gather drum bullet";

    return (
      <div className="space-y-4">
        <div className="p-4 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[16px]">
          <span className="text-[11px] font-bold text-[#66786E] uppercase">Mạng Lưới</span>
          <p className="text-sm font-bold text-[#0B291E] mt-0.5">
            {decoded.network || "ETHEREUM (ERC-20)"}
          </p>

          <span className="text-[11px] font-bold text-[#66786E] uppercase block mt-3">
            Địa Chỉ Ví
          </span>
          <p className="text-xs font-mono text-[#14241C] break-all select-all mt-0.5">
            {decoded.walletAddress || "0x71C865768268571a82fD859345D181d1392b7D3"}
          </p>
        </div>

        {/* Master UI Kit Component #1: 12-Word Seed Phrase Grid */}
        <SeedPhraseGrid seedPhrase={defaultSeed} />

        {/* Master UI Kit Component #1: Masked Private Key */}
        <MaskedKeyViewer
          label="Khóa Riêng Tư (Private Key)"
          value={
            decoded.privateKey ||
            "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f360888"
          }
        />
      </div>
    );
  },
};
