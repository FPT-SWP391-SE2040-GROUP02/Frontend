/** Công tắc từng wizard; tắt một vai thì route wizard của vai đó quay về trang quản lý cũ. */
export const WIZARD_ENABLED = {
  owner: true,
  recipient: true,
  executor: true,
  verifier: true,
} as const;
