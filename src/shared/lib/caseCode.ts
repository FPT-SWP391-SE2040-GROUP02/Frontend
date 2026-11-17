/** Mã hồ sơ chứng tử 8 ký tự giống BE (DeathCaseRules.CaseCode): 8 ký tự cuối của id, bỏ "-", in hoa. Mọi vai trò hiển thị cùng một mã. */
export function caseCode(id: string): string {
  return id.replace(/-/g, "").slice(-8).toUpperCase();
}
