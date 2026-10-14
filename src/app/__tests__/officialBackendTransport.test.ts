import { afterEach, describe, expect, it } from "vitest";
import { AxiosHeaders, AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/shared/api";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { backendAssetService } from "@/features/assets/api/backendAssetService";
import { beneficiaryService } from "@/features/beneficiaries/api/beneficiaryService";
import { checkInService } from "@/features/dms/api/checkInService";
import { ekycService } from "@/features/ekyc/api/ekycService";
import { updatePackageSchema, createPackageSchema } from "@/entities/package/model/package.schema";
import {
  vaultFixture,
  containerFixture,
  pageFixture,
  VAULT_ID,
  CONTAINER_ID,
  CREATED_AT,
} from "@/shared/api/__tests__/backend.fixtures";
const originalAdapter = apiClient.defaults.adapter;
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});
function respond(body: unknown, inspect?: (config: InternalAxiosRequestConfig) => void) {
  apiClient.defaults.adapter = async (config) => {
    inspect?.(config);
    return { data: body, status: 200, statusText: "OK", headers: new AxiosHeaders(), config };
  };
}
const asset = {
  id: CONTAINER_ID,
  vaultId: VAULT_ID,
  kind: "TEXT",
  name: "Ghi chú",
  description: null,
  currentVersion: {
    versionNumber: 1,
    fileName: null,
    contentType: "text/plain",
    sizeBytes: 20,
    createdAt: CREATED_AT,
  },
  createdAt: CREATED_AT,
  updatedAt: null,
  etag: "asset-v1",
};
const beneficiary = {
  id: CONTAINER_ID,
  citizenIdLast4: "1234",
  fullName: "Người nhận",
  dateOfBirth: "2000-01-01",
  email: null,
  phone: null,
  isMinor: false,
  minorAcknowledgedAt: null,
  containerIds: [],
  createdAt: CREATED_AT,
  updatedAt: null,
  etag: "beneficiary-v1",
};
const checkIn = {
  status: "NOT_STARTED",
  planStatus: "DRAFT",
  serverTime: CREATED_AT,
  lastCheckInAt: null,
  nextCheckInDueAt: null,
  graceEndsAt: null,
  settings: {
    cycleDays: 30,
    graceDays: 7,
    pendingCycleDays: null,
    pendingGraceDays: null,
    etag: "settings-v1",
  },
  history: pageFixture([]),
};

describe("official Backend transport through real Axios interceptors", () => {
  it("reads raw eKYC status from the merged Backend", async () => {
    const status = {
      status: "NOT_STARTED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: null,
      matchThreshold: 0.363,
      spoofCheckPassed: null,
      createdAt: null,
      completedAt: null,
    };
    respond(status, (config) => expect(config.url).toBe("/ekyc/me"));
    expect(await ekycService.getStatus()).toEqual(status);
  });
  it("uses file multipart for document and preserves canMatchFace without fabricating success", async () => {
    const document = {
      verificationId: null,
      idNumber: "",
      fullName: "",
      dateOfBirth: "",
      residenceAddress: "",
      canMatchFace: false,
      expiresAt: null,
      warnings: ["No face found"],
    };
    respond(document, (config) => {
      expect(config.url).toBe("/ekyc/document");
      expect(config.data).toBeInstanceOf(FormData);
      expect((config.data as FormData).get("file")).toBeInstanceOf(File);
    });
    expect(
      (
        await ekycService.submitDocument(
          new File(["public-test-fixture"], "test.png", { type: "image/png" }),
        )
      ).canMatchFace,
    ).toBe(false);
  });
  it("rejects eKYC unsupported images before HTTP", async () => {
    let calls = 0;
    respond({}, () => {
      calls++;
    });
    await expect(
      ekycService.matchFace(new File(["test"], "test.txt", { type: "text/plain" })),
    ).rejects.toThrow();
    await expect(
      ekycService.submitDocument(new File([], "test.png", { type: "image/png" })),
    ).rejects.toThrow();
    expect(calls).toBe(0);
  });
  it("reads raw vault and keeps independent vault/plan/service states", async () => {
    respond(vaultFixture, (config) => expect(config.url).toBe("/vaults/me"));
    expect(await ownerVaultService.getMine()).toEqual(vaultFixture);
  });
  it("rejects the old envelope instead of returning undefined or empty", async () => {
    respond({ data: vaultFixture });
    await expect(ownerVaultService.getMine()).rejects.toThrow();
  });
  it("scopes containers by vault and sends official pagination", async () => {
    respond(pageFixture([containerFixture]), (config) => {
      expect(config.url).toBe(`/vaults/${VAULT_ID}/containers`);
      expect(config.params).toEqual({
        pageIndex: 2,
        pageSize: 20,
        searchTerm: "gia đình",
        sortBy: "name",
        isAscending: false,
        includeArchived: false,
      });
    });
    expect(
      (
        await ownerVaultService.listPackages(VAULT_ID, {
          pageIndex: 2,
          pageSize: 20,
          searchTerm: "gia đình",
          sortBy: "name",
          isAscending: false,
        })
      ).items,
    ).toEqual([containerFixture]);
  });
  it("rejects old data/meta pagination", async () => {
    respond({ data: [], meta: { totalItems: 0 } });
    await expect(ownerVaultService.listPackages(VAULT_ID)).rejects.toThrow();
  });
  it("uses PUT with etag, preserving null fields", async () => {
    respond(containerFixture, (config) => {
      expect(config.method).toBe("put");
      expect(config.url).toBe(`/vaults/${VAULT_ID}/containers/${CONTAINER_ID}`);
      expect(JSON.parse(config.data)).toEqual({
        etag: "container-v1",
        name: null,
        description: "",
      });
    });
    await ownerVaultService.updatePackage(VAULT_ID, CONTAINER_ID, {
      etag: "container-v1",
      name: null,
      description: "",
    });
    expect(updatePackageSchema.safeParse({ name: "Missing etag" }).success).toBe(false);
  });
  it("accepts the official 200-character container name and rejects 201", () => {
    expect(createPackageSchema.safeParse({ name: "a".repeat(200) }).success).toBe(true);
    expect(createPackageSchema.safeParse({ name: "a".repeat(201) }).success).toBe(false);
  });
  it("archives with DELETE and requires explicit plan-impact confirmation", async () => {
    respond({ ...containerFixture, status: "ARCHIVED", archivedAt: CREATED_AT }, (config) => {
      expect(config.method).toBe("delete");
      expect(config.params).toEqual({ confirmPlanDeactivation: false });
    });
    expect((await ownerVaultService.archivePackage(VAULT_ID, CONTAINER_ID)).status).toBe(
      "ARCHIVED",
    );
    respond({ ...containerFixture, status: "ARCHIVED", archivedAt: CREATED_AT }, (config) =>
      expect(config.params).toEqual({ confirmPlanDeactivation: true }),
    );
    await ownerVaultService.archivePackage(VAULT_ID, CONTAINER_ID, true);
  });
  it("does not retry a 409 mutation or turn it into success", async () => {
    let calls = 0;
    apiClient.defaults.adapter = async (config) => {
      calls++;
      throw new AxiosError("conflict", undefined, config, undefined, {
        data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" },
        status: 409,
        statusText: "Conflict",
        headers: {},
        config,
      });
    };
    await expect(ownerVaultService.archivePackage(VAULT_ID, CONTAINER_ID)).rejects.toMatchObject({
      response: { status: 409 },
    });
    expect(calls).toBe(1);
  });
  it("reads asset metadata and rejects missing version fields", async () => {
    respond(pageFixture([asset]), (config) =>
      expect(config.url).toBe(`/vaults/${VAULT_ID}/assets`),
    );
    expect((await backendAssetService.list(VAULT_ID)).items[0].kind).toBe("TEXT");
    respond({ ...asset, currentVersion: {} });
    await expect(backendAssetService.get(VAULT_ID, CONTAINER_ID)).rejects.toThrow();
  });
  it("uploads FormData with browser-managed boundary", async () => {
    respond(asset, (config) => {
      expect(config.data).toBeInstanceOf(FormData);
      const form = config.data as FormData;
      expect(form.get("file")).toBeInstanceOf(File);
      expect(form.get("name")).toBe("Tài liệu");
      expect(config.headers.getContentType()).not.toBe("application/json");
    });
    await backendAssetService.upload(VAULT_ID, new File(["fixture"], "fixture.txt"), "Tài liệu");
  });
  it("sends text content only in the request; response holds metadata", async () => {
    respond({ ...asset, content: "unexpected-content" }, (config) =>
      expect(config.url).toBe(`/vaults/${VAULT_ID}/assets/text`),
    );
    const result = await backendAssetService.createText(VAULT_ID, {
      name: "Ghi chú",
      content: "public-test-fixture",
    });
    expect(result).not.toHaveProperty("content");
  });
  it("strips full citizenId from public beneficiary response", async () => {
    respond(pageFixture([{ ...beneficiary, citizenId: "public-test-id" }]));
    expect((await beneficiaryService.list(VAULT_ID)).items[0]).toEqual(beneficiary);
  });
  it("does not allow changing citizenId in beneficiary PUT", async () => {
    respond(beneficiary, (config) => {
      expect(config.method).toBe("put");
      expect(JSON.parse(config.data)).toEqual({ etag: "beneficiary-v1", email: "" });
    });
    const input = { etag: "beneficiary-v1", email: "", citizenId: "public-test-id" };
    await beneficiaryService.update(VAULT_ID, CONTAINER_ID, input);
  });
  it("accepts empty 204 deletion", async () => {
    respond(undefined);
    await expect(beneficiaryService.remove(VAULT_ID, CONTAINER_ID)).resolves.toBeUndefined();
  });
  it("reads check-in with GET and embedded history", async () => {
    respond(checkIn, (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/check-ins/me");
    });
    expect((await checkInService.get()).status).toBe("NOT_STARTED");
  });
  it("PATCHes etag settings and rejects missing changes or invalid cycle", async () => {
    respond(checkIn, (config) => {
      expect(config.method).toBe("patch");
      expect(config.url).toBe("/vaults/me/check-in-settings");
      expect(JSON.parse(config.data)).toEqual({ etag: "settings-v1", cycleDays: 60 });
    });
    await checkInService.updateSettings({ etag: "settings-v1", cycleDays: 60 });
    await expect(checkInService.updateSettings({ etag: "settings-v1" })).rejects.toThrow();
  });
  it("blocks malformed scope IDs before HTTP", async () => {
    let calls = 0;
    respond({}, () => {
      calls++;
    });
    await expect(ownerVaultService.listPackages("../other")).rejects.toThrow();
    await expect(backendAssetService.get(VAULT_ID, "../other")).rejects.toThrow();
    expect(calls).toBe(0);
  });
});
