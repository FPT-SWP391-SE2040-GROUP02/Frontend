import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { readCertificateRejection } from "../certificateCheck";

function failure(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("private transport detail", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

describe("readCertificateRejection", () => {
  it("reads AI result per page when BE blocks the submit", () => {
    const checks = readCertificateRejection(
      failure(409, {
        code: "DEATH_CASE_INCOMPLETE",
        missingRequirements: ["DEATH_CERTIFICATE_NOT_RECOGNIZED"],
        fileChecks: [
          {
            fileId: "f1",
            fileName: "cccd.jpg",
            status: "NOT_RECOGNIZED",
            documentType: "Căn cước công dân",
          },
          { fileId: "f2", fileName: "anh.png", status: "UNAVAILABLE", documentType: null },
        ],
      }),
    );
    expect(checks).toHaveLength(2);
    expect(checks?.[0]).toMatchObject({ fileId: "f1", documentType: "Căn cước công dân" });
  });

  it("ignores other incomplete errors and non-HTTP failures", () => {
    expect(
      readCertificateRejection(
        failure(409, { code: "DEATH_CASE_INCOMPLETE", missingRequirements: ["FILES"] }),
      ),
    ).toBeNull();
    expect(readCertificateRejection(new Error("x"))).toBeNull();
  });
});
