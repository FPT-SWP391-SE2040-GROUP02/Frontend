import { z } from "zod";

const date = z.string().datetime({ offset: true });

/** Một lời mời gửi tới email của tài khoản đang đăng nhập (GET /executor-invitations/mine). Không có token. */
export const myInvitationSchema = z.object({
  id: z.string().uuid(),
  ownerName: z.string(),
  inviteeEmail: z.string(),
  status: z.enum(["INVITED", "DECLINED", "EXPIRED", "REVOKED"]),
  invitedAt: date,
  expiresAt: date,
  endedAt: date.nullable(),
  /** Chủ kho đã ký biên bản phân chia nên xem và ký nhận vai được. */
  willReady: z.boolean().default(false),
  /** Phiên bản đang xem, gửi lại khi ký. */
  willVersionNo: z.number().int().positive().nullish(),
  willSignedAt: date.nullish(),
  /** Chỉ là số đếm, không có tên. */
  assetCount: z.number().int().nonnegative().default(0),
  recipientCount: z.number().int().nonnegative().default(0),
});

export const myInvitationsSchema = z.object({
  scopeVersion: z.string().min(1),
  scopeText: z.string(),
  /** Còn hạn, chưa trả lời; sắp hết hạn trước. */
  pending: z.array(myInvitationSchema),
  /** Đã từ chối, hết hạn hoặc bị thu hồi; mới nhất trước. */
  ended: z.array(myInvitationSchema),
});

export type MyInvitation = z.infer<typeof myInvitationSchema>;
export type MyInvitations = z.infer<typeof myInvitationsSchema>;
