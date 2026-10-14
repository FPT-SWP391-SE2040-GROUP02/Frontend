import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { PreviewWorkspace } from "../PreviewWorkspace";

/** Khóa cache riêng của phiên thật để kiểm tra ranh giới provider. */
const PRIVATE_QUERY_KEY = ["preview-isolation-test"] as const;

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("PreviewWorkspace", () => {
  it("blocks the request and feature optimistic updates before they execute", async () => {
    const sendRequest = vi.fn().mockResolvedValue("saved");
    const optimisticUpdate = vi.fn();

    /** Fixture gọi mutation thực để xác minh lớp chặn của preview. */
    function MutationProbe() {
      const mutation = useMutation({ mutationFn: sendRequest, onMutate: optimisticUpdate });
      return (
        <>
          <button onClick={() => mutation.mutate()}>Attempt write</button>
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
        </>
      );
    }

    render(
      <MemoryRouter>
        <PreviewWorkspace>
          <MutationProbe />
        </PreviewWorkspace>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Attempt write" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Thao tác chưa được gửi");
    expect(sendRequest).not.toHaveBeenCalled();
    expect(optimisticUpdate).not.toHaveBeenCalled();
  });

  it("does not expose the session query cache to preview children", () => {
    const sessionClient = new QueryClient();
    sessionClient.setQueryData(PRIVATE_QUERY_KEY, "private-session-data");

    /** Fixture đọc cache từ provider gần nhất, không truy cập phiên bên ngoài. */
    function CacheProbe() {
      const client = useQueryClient();
      return <p>{client.getQueryData<string>(PRIVATE_QUERY_KEY) ?? "preview-empty"}</p>;
    }

    render(
      <QueryClientProvider client={sessionClient}>
        <MemoryRouter>
          <PreviewWorkspace>
            <CacheProbe />
          </PreviewWorkspace>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText("preview-empty")).toBeInTheDocument();
    expect(screen.queryByText("private-session-data")).not.toBeInTheDocument();
    expect(sessionClient.getQueryData(PRIVATE_QUERY_KEY)).toBe("private-session-data");
    sessionClient.clear();
  });

  it("keeps navigation in preview and marks the current screen", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.PREVIEW.ASSETS]}>
        <PreviewWorkspace>
          <p>Preview child</p>
        </PreviewWorkspace>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Tài sản" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Wizard cũ" })).toHaveAttribute(
      "href",
      ROUTES.PREVIEW.PLAN_WIZARD,
    );
    expect(screen.getByRole("link", { name: "Kế hoạch" })).not.toHaveAttribute("aria-current");
  });

  it("does not render its child outside development", () => {
    vi.stubEnv("DEV", false);
    render(
      <MemoryRouter>
        <PreviewWorkspace>
          <p>Private child</p>
        </PreviewWorkspace>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Private child")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
