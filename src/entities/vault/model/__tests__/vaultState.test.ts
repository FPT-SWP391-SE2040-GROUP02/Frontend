import { describe, it, expect } from "vitest";
import {
  VAULT_LIFECYCLE_STATES,
  canTransitionVault,
  transitionVault,
  type VaultLifecycleState,
} from "../vaultState";

/**
 * @file vaultState.test.ts
 * @description Bộ kiểm thử Máy trạng thái Két Di Sản tuân thủ chuẩn ISTQB v4.0:
 * - Kỹ thuật Kiểm thử Chuyển trạng thái (State Transition Testing - K3)
 * - Độ phủ Nhánh & Câu lệnh Hộp trắng (Statement & Branch Coverage - K3: 100% Branch Coverage)
 */
describe("[ISTQB v4.0] Vault Lifecycle State Machine Testing", () => {
  describe("[ISTQB-STATE-TRANSITION] Valid Transitions (0-Switch Coverage)", () => {
    it("should allow DRAFT -> ACTIVE when vault setup is finalized", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.DRAFT, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toBe(true);
      expect(
        transitionVault(VAULT_LIFECYCLE_STATES.DRAFT, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toBe(VAULT_LIFECYCLE_STATES.ACTIVE);
    });

    it("should allow DRAFT -> CLOSED when creator discards draft", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.DRAFT, VAULT_LIFECYCLE_STATES.CLOSED)
      ).toBe(true);
      expect(
        transitionVault(VAULT_LIFECYCLE_STATES.DRAFT, VAULT_LIFECYCLE_STATES.CLOSED)
      ).toBe(VAULT_LIFECYCLE_STATES.CLOSED);
    });

    it("should allow ACTIVE -> GRACE_PERIOD when heartbeat ping is missed", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.GRACE_PERIOD)
      ).toBe(true);
      expect(
        transitionVault(VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.GRACE_PERIOD)
      ).toBe(VAULT_LIFECYCLE_STATES.GRACE_PERIOD);
    });

    it("should allow ACTIVE -> CLOSED when owner explicitly destroys vault while alive", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.CLOSED)
      ).toBe(true);
      expect(
        transitionVault(VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.CLOSED)
      ).toBe(VAULT_LIFECYCLE_STATES.CLOSED);
    });

    it("should allow GRACE_PERIOD -> ACTIVE (Revive Cycle) when owner sends alive heartbeat", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.GRACE_PERIOD, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toBe(true);
      expect(
        transitionVault(VAULT_LIFECYCLE_STATES.GRACE_PERIOD, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toBe(VAULT_LIFECYCLE_STATES.ACTIVE);
    });

    it("should allow GRACE_PERIOD -> AWAITING_LEGAL_PROOF when grace timer expires", () => {
      expect(
        canTransitionVault(
          VAULT_LIFECYCLE_STATES.GRACE_PERIOD,
          VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF
        )
      ).toBe(true);
    });

    it("should allow AWAITING_LEGAL_PROOF -> ACTIVE when owner returns and verifies presence", () => {
      expect(
        canTransitionVault(
          VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF,
          VAULT_LIFECYCLE_STATES.ACTIVE
        )
      ).toBe(true);
    });

    it("should allow AWAITING_LEGAL_PROOF -> CLAIM_PENDING when executor files death certificate", () => {
      expect(
        canTransitionVault(
          VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF,
          VAULT_LIFECYCLE_STATES.CLAIM_PENDING
        )
      ).toBe(true);
    });

    it("should allow CLAIM_PENDING -> APPROVED when legal notary verifies death extract", () => {
      expect(
        canTransitionVault(
          VAULT_LIFECYCLE_STATES.CLAIM_PENDING,
          VAULT_LIFECYCLE_STATES.APPROVED
        )
      ).toBe(true);
    });

    it("should allow CLAIM_PENDING -> AWAITING_LEGAL_PROOF when notary rejects invalid claim", () => {
      expect(
        canTransitionVault(
          VAULT_LIFECYCLE_STATES.CLAIM_PENDING,
          VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF
        )
      ).toBe(true);
    });

    it("should allow APPROVED -> CLOSED when assets are completely distributed to beneficiaries", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.APPROVED, VAULT_LIFECYCLE_STATES.CLOSED)
      ).toBe(true);
    });
  });

  describe("[ISTQB-STATE-TRANSITION] Sequential Happy Path (1-Switch Coverage)", () => {
    it("should traverse complete handover lifecycle smoothly", () => {
      let state: VaultLifecycleState = VAULT_LIFECYCLE_STATES.DRAFT;

      // 1. DRAFT -> ACTIVE
      state = transitionVault(state, VAULT_LIFECYCLE_STATES.ACTIVE);
      expect(state).toBe(VAULT_LIFECYCLE_STATES.ACTIVE);

      // 2. ACTIVE -> GRACE_PERIOD
      state = transitionVault(state, VAULT_LIFECYCLE_STATES.GRACE_PERIOD);
      expect(state).toBe(VAULT_LIFECYCLE_STATES.GRACE_PERIOD);

      // 3. GRACE_PERIOD -> AWAITING_LEGAL_PROOF
      state = transitionVault(state, VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF);
      expect(state).toBe(VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF);

      // 4. AWAITING_LEGAL_PROOF -> CLAIM_PENDING
      state = transitionVault(state, VAULT_LIFECYCLE_STATES.CLAIM_PENDING);
      expect(state).toBe(VAULT_LIFECYCLE_STATES.CLAIM_PENDING);

      // 5. CLAIM_PENDING -> APPROVED
      state = transitionVault(state, VAULT_LIFECYCLE_STATES.APPROVED);
      expect(state).toBe(VAULT_LIFECYCLE_STATES.APPROVED);

      // 6. APPROVED -> CLOSED
      state = transitionVault(state, VAULT_LIFECYCLE_STATES.CLOSED);
      expect(state).toBe(VAULT_LIFECYCLE_STATES.CLOSED);
    });
  });

  describe("[ISTQB-STATE-TRANSITION] Negative / Invalid State Transitions", () => {
    it("should disallow transitioning from any state to itself", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.DRAFT, VAULT_LIFECYCLE_STATES.DRAFT)
      ).toBe(false);
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toBe(false);
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.CLOSED, VAULT_LIFECYCLE_STATES.CLOSED)
      ).toBe(false);
    });

    it("should reject direct shortcut DRAFT -> APPROVED (skipping DMS & Notary submission)", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.DRAFT, VAULT_LIFECYCLE_STATES.APPROVED)
      ).toBe(false);
      expect(() =>
        transitionVault(VAULT_LIFECYCLE_STATES.DRAFT, VAULT_LIFECYCLE_STATES.APPROVED)
      ).toThrowError(/Không được phép chuyển trạng thái/);
    });

    it("should reject direct shortcut ACTIVE -> APPROVED (violating Article 611 Civil Code)", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.APPROVED)
      ).toBe(false);
      expect(() =>
        transitionVault(VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.APPROVED)
      ).toThrowError(/LỖI MÁY TRẠNG THÁI/);
    });

    it("should strictly disallow reviving or modifying a CLOSED vault", () => {
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.CLOSED, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toBe(false);
      expect(
        canTransitionVault(VAULT_LIFECYCLE_STATES.CLOSED, VAULT_LIFECYCLE_STATES.DRAFT)
      ).toBe(false);
      expect(() =>
        transitionVault(VAULT_LIFECYCLE_STATES.CLOSED, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toThrowError(/Không được phép chuyển trạng thái/);
    });
  });

  describe("[ISTQB-BRANCH-COVERAGE] Full White-box Coverage Verification", () => {
    it("should handle unknown or invalid state gracefully in canTransitionVault", () => {
      const invalidUnknownState = "NON_EXISTENT_STATE" as VaultLifecycleState;
      expect(
        canTransitionVault(invalidUnknownState, VAULT_LIFECYCLE_STATES.ACTIVE)
      ).toBe(false);
    });
  });
});
