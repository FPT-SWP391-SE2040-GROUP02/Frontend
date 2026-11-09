import { z } from "zod";

/** Cách liên lạc Backend nhận (ExecutorCheckInRequest.ContactMethod). */
export const PROXY_CONTACT_METHODS = [
  { value: "PHONE", label: "Gọi điện" },
  { value: "IN_PERSON", label: "Gặp trực tiếp" },
  { value: "MESSAGE", label: "Nhắn tin" },
  { value: "EMAIL", label: "Email" },
] as const;

/** Cho phép đồng hồ máy lệch nhẹ so với server, khớp dung sai 5 phút của Backend. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/** Form điểm danh thay: ai, lúc nào (ô datetime-local), cách nào. */
export const proxyCheckInFormSchema = z.object({
  contactedWho: z
    .string()
    .trim()
    .min(2, "Ghi rõ đã liên lạc với ai (ít nhất 2 ký tự).")
    .max(200, "Tối đa 200 ký tự."),
  contactedAt: z
    .string()
    .min(1, "Chọn lúc đã liên lạc.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Lúc liên lạc không hợp lệ.")
    .refine(
      (value) => new Date(value).getTime() <= Date.now() + FUTURE_TOLERANCE_MS,
      "Lúc liên lạc không được ở tương lai.",
    ),
  contactMethod: z.enum(["PHONE", "IN_PERSON", "MESSAGE", "EMAIL"], {
    message: "Chọn cách liên lạc.",
  }),
});
export type ProxyCheckInFormValues = z.infer<typeof proxyCheckInFormSchema>;

/** Body của POST /executor/vaults/{vaultId}/check-in. */
export const proxyCheckInRequestSchema = z.object({
  contactedWho: z.string().min(2).max(200),
  contactedAt: z.string().datetime({ offset: true }),
  contactMethod: z.enum(["PHONE", "IN_PERSON", "MESSAGE", "EMAIL"]),
});
export type ProxyCheckInRequest = z.infer<typeof proxyCheckInRequestSchema>;

/** Giờ hiện tại theo múi giờ máy, dạng "YYYY-MM-DDTHH:mm" cho ô datetime-local. */
export function nowForDateTimeInput(now: Date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Form → request: giờ ô datetime-local (giờ máy) đổi sang ISO có múi giờ. */
export function toProxyCheckInRequest(values: ProxyCheckInFormValues): ProxyCheckInRequest {
  return {
    contactedWho: values.contactedWho.trim(),
    contactedAt: new Date(values.contactedAt).toISOString(),
    contactMethod: values.contactMethod,
  };
}
