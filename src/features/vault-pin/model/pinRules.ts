/** Số chữ số của mã PIN kho (BE: VaultPinRules.PinLength). */
export const PIN_LENGTH = 6;

/** Số lần nhập sai liên tiếp trước khi BE khóa tạm. Chỉ dùng để hiển thị; BE quyết định. */
export const PIN_MAX_ATTEMPTS = 5;

/** Đúng 6 chữ số 0-9. */
export function isWellFormedPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Quá dễ đoán: 6 chữ số giống nhau, hoặc dãy tăng/giảm liên tiếp (123456, 654321, 012345...).
 * Cùng luật với BE (VaultPinRules.IsTooWeak); BE vẫn là nơi quyết định, FE chỉ báo sớm.
 */
export function isWeakPin(pin: string): boolean {
  if (pin.length < 2) return false;
  let allSame = true;
  let ascending = true;
  let descending = true;
  for (let i = 1; i < pin.length; i += 1) {
    const step = pin.charCodeAt(i) - pin.charCodeAt(i - 1);
    allSame &&= step === 0;
    ascending &&= step === 1;
    descending &&= step === -1;
  }
  return allSame || ascending || descending;
}
