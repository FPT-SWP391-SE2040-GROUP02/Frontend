import React from "react";
import type { AssetType, EncryptedPayload } from "../asset.types";

/**
 * @file assetStrategy.interface.ts
 * @description Design Pattern 1: Strategy Pattern Interface xử lý nghiệp vụ các loại tài sản số.
 * Tuân thủ quy tắc 9 trong AGENTS.md: Tuyệt đối không dùng switch (assetType) lồng nhau trong UI.
 */
export interface AssetStrategy {
  /** Định danh loại tài sản */
  readonly type: AssetType;
  /** Tên hiển thị người dùng (Tiếng Việt) */
  readonly label: string;
  /** Mô tả chi tiết loại tài sản */
  readonly description: string;
  /** Màu sắc nhận diện và icon */
  readonly badgeBg: string;
  readonly badgeText: string;

  /**
   * Kiểm tra tính hợp lệ của dữ liệu đặc thù
   * @param data Dữ liệu nhập từ form
   */
  validate(data: unknown): boolean;

  /**
   * Chuẩn bị gói tin mã hóa đầu cuối (Zero-Knowledge Client Encryption)
   * @param data Dữ liệu bản rõ cần mã hóa
   */
  preparePayload(data: unknown): EncryptedPayload;

  /**
   * Render các trường nhập liệu động của Form theo từng Strategy
   */
  renderFormFields(props: {
    data: Record<string, unknown>;
    onChange: (field: string, value: unknown) => void;
    errors?: Record<string, string>;
  }): React.ReactNode;

  /**
   * Render giao diện hiển thị chi tiết (Giải mã an toàn) trong Modal
   */
  renderDetails(props: {
    rawPayload: EncryptedPayload;
    metadata?: Record<string, unknown>;
  }): React.ReactNode;
}
