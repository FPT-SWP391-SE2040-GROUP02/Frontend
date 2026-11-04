import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { type AuthState } from "@/entities/user/model/authSlice";
import { ROLES, type Role } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/config/routes.config";
import { ProtectedRoute } from "../ProtectedRoute";

function renderAs(role: Role, wrongRoleGoesHome: boolean) {
  const auth: AuthState = {
    isAuthenticated: true,
    isHydrating: false,
    user: {
      id: "u1",
      email: "fixture@example.invalid",
      fullName: "Fixture",
      role,
    } as AuthState["user"],
  };
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[ROUTES.EXECUTOR.ROOT]}>
        <Routes>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.USER, ROLES.EXECUTOR]}
                wrongRoleGoesHome={wrongRoleGoesHome}
              />
            }
          >
            <Route path={ROUTES.EXECUTOR.ROOT} element={<p>Khu Người thực hiện</p>} />
          </Route>
          <Route path={ROUTES.ADMIN.ROOT} element={<p>Trang Admin</p>} />
          <Route path={ROUTES.NOTARY.WORKSPACE} element={<p>Trang Verifier</p>} />
          <Route path={ROUTES.ERROR.FORBIDDEN} element={<p>Trang 403</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("ProtectedRoute", () => {
  it("tài khoản thường vào được khu Người thực hiện", () => {
    renderAs(ROLES.USER, true);
    expect(screen.getByText("Khu Người thực hiện")).toBeInTheDocument();
  });

  it("Admin mở khu Người thực hiện thì về trang Admin", () => {
    renderAs(ROLES.ADMIN, true);
    expect(screen.getByText("Trang Admin")).toBeInTheDocument();
  });

  it("Verifier mở khu Người thực hiện thì về trang Verifier", () => {
    renderAs(ROLES.VERIFIER, true);
    expect(screen.getByText("Trang Verifier")).toBeInTheDocument();
  });

  it("không bật wrongRoleGoesHome thì sai vai trò vẫn về /403", () => {
    renderAs(ROLES.ADMIN, false);
    expect(screen.getByText("Trang 403")).toBeInTheDocument();
  });
});
