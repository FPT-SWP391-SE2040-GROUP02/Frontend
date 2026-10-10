import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RoleGuard } from "../RoleGuard";
afterEach(cleanup);
describe("RoleGuard scope", () => {
  it("ADMIN không được bypass quyền OWNER", () => {
    render(
      <RoleGuard currentUserRole="ADMIN" allowedRoles={["OWNER"]} fallback="denied">
        private
      </RoleGuard>,
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
    expect(screen.queryByText("private")).toBeNull();
  });
  it("cho phép vai trò được khai báo", () => {
    render(
      <RoleGuard currentUserRole="OWNER" allowedRoles={["OWNER"]}>
        private
      </RoleGuard>,
    );
    expect(screen.getByText("private")).toBeInTheDocument();
  });
  it("thiếu vai trò thì đóng quyền", () => {
    render(
      <RoleGuard allowedRoles={["OWNER"]} fallback="denied">
        private
      </RoleGuard>,
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
  });
});
