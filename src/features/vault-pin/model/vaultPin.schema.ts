import { z } from "zod";
import { isWeakPin } from "./pinRules";

/** Trạng thái PIN của kho (BE mục 6.20). Không bao giờ có PIN hay hash. */
export const vaultPinStatusSchema = z.object({
  isSet: z.boolean(),
  isRequired: z.boolean(),
  lockedUntil: z.string().nullable(),
  attemptsRemaining: z.number().int().nullable(),
});

export type VaultPinStatus = z.infer<typeof vaultPinStatusSchema>;

export const PIN_FORMAT_MESSAGE = "Mã PIN gồm đúng 6 chữ số.";
export const PIN_WEAK_MESSAGE =
  "Mã PIN quá dễ đoán. Không dùng các số giống nhau hoặc dãy số liên tiếp.";
export const PIN_MISMATCH_MESSAGE = "Mã PIN nhập lại chưa khớp.";

const pinDigits = z.string().regex(/^\d{6}$/, PIN_FORMAT_MESSAGE);

const newPinFields = {
  newPin: pinDigits,
  confirmPin: z.string(),
};

function checkNewPin(
  value: { newPin: string; confirmPin: string },
  ctx: z.RefinementCtx,
  pinField = "newPin",
) {
  if (isWeakPin(value.newPin)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [pinField], message: PIN_WEAK_MESSAGE });
  }
  if (value.newPin !== value.confirmPin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPin"],
      message: PIN_MISMATCH_MESSAGE,
    });
  }
}

/** Nhập PIN trước một thao tác được bảo vệ. */
export const enterPinFormSchema = z.object({ pin: pinDigits });
export type EnterPinFormValues = z.infer<typeof enterPinFormSchema>;

/** Đặt PIN lần đầu. */
export const setPinFormSchema = z
  .object({ pin: pinDigits, confirmPin: z.string() })
  .superRefine((value, ctx) =>
    checkNewPin({ newPin: value.pin, confirmPin: value.confirmPin }, ctx, "pin"),
  );
export type SetPinFormValues = z.infer<typeof setPinFormSchema>;

/** Đổi PIN khi còn nhớ PIN cũ. */
export const changePinFormSchema = z
  .object({ currentPin: pinDigits, ...newPinFields })
  .superRefine((value, ctx) => checkNewPin(value, ctx));
export type ChangePinFormValues = z.infer<typeof changePinFormSchema>;

/** Quên PIN: mật khẩu tài khoản và PIN mới. */
export const resetPinFormSchema = z
  .object({
    password: z.string().min(1, "Vui lòng nhập mật khẩu tài khoản."),
    ...newPinFields,
  })
  .superRefine((value, ctx) => checkNewPin(value, ctx));
export type ResetPinFormValues = z.infer<typeof resetPinFormSchema>;
