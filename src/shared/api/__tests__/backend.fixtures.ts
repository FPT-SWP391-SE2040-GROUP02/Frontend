/** Fixtures công khai theo DTO Backend; chỉ dùng tests. */
export const VAULT_ID = "11111111-1111-4111-8111-111111111111";
export const CONTAINER_ID = "22222222-2222-4222-8222-222222222222";
export const CREATED_AT = "2026-10-14T00:00:00Z";
export const vaultFixture = {
  id: VAULT_ID,
  name: "Kho thử nghiệm",
  description: null,
  status: "OPEN",
  closedAt: null,
  planStatus: "DRAFT",
  planConfigVersion: 1,
  planActivatedAt: null,
  serviceTier: "FREE",
  serviceStatus: "FREE",
  serviceExpiresAt: null,
  storageQuotaBytes: 1024,
  storageUsedBytes: 128,
  storageRemainingBytes: 896,
  beneficiarySlots: 1,
  includedBeneficiarySlots: 1,
  extraBeneficiarySlots: 0,
  usedBeneficiarySlots: 0,
  activeContainerCount: 1,
  createdAt: CREATED_AT,
  updatedAt: null,
  etag: "vault-v1",
} as const;
export const containerFixture = {
  id: CONTAINER_ID,
  vaultId: VAULT_ID,
  name: "Giấy tờ gia đình",
  description: null,
  status: "DRAFT",
  assetIds: [],
  beneficiaryIds: [],
  missingRequirements: ["NO_ASSET", "NO_DESIGNATION"],
  createdAt: CREATED_AT,
  updatedAt: null,
  removedAt: null,
  etag: "container-v1",
} as const;
/** Raw PaginatedList<T>. */
export const pageFixture = <T>(items: T[]) => ({
  items,
  totalCount: items.length,
  pageIndex: 1,
  pageSize: 20,
  totalPages: items.length ? 1 : 0,
  hasPreviousPage: false,
  hasNextPage: false,
});
