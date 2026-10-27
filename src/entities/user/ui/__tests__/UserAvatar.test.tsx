import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { avatarService } from "../../api/avatarService";
import { UserAvatar, type UserAvatarSubject } from "../UserAvatar";

const BASE: UserAvatarSubject = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "nguyễn an",
  email: "an@example.test",
  hasAvatar: false,
};

const AVATAR_USER: UserAvatarSubject = {
  ...BASE,
  hasAvatar: true,
  avatarUpdatedAt: "2026-10-24T06:00:00Z",
};

let create: ReturnType<typeof vi.fn>;
let revoke: ReturnType<typeof vi.fn>;
let client: QueryClient;

function withClient(ui: ReactNode) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  let sequence = 0;
  create = vi.fn(() => `blob:avatar-${++sequence}`);
  revoke = vi.fn();
  Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

describe("UserAvatar", () => {
  it("shows the capitalised first letter and never calls the Backend without an avatar", () => {
    const download = vi.spyOn(avatarService, "download");
    const { container } = withClient(<UserAvatar user={BASE} className="size-10" />);
    expect(container).toHaveTextContent("N");
    expect(container.querySelector("img")).toBeNull();
    expect(download).not.toHaveBeenCalled();
  });

  it("falls back to the given letter when there is no user yet", () => {
    const { container } = withClient(<UserAvatar user={null} fallbackLetter="T" />);
    expect(container).toHaveTextContent("T");
  });

  it("loads the image through the Bearer API and shows it as a decorative object URL", async () => {
    const download = vi
      .spyOn(avatarService, "download")
      .mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const { container } = withClient(<UserAvatar user={AVATAR_USER} />);
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:avatar-1");
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(download).toHaveBeenCalledTimes(1);
  });

  it("deduplicates: two avatars on screen send a single request", async () => {
    const download = vi
      .spyOn(avatarService, "download")
      .mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const { container } = withClient(
      <>
        <UserAvatar user={AVATAR_USER} />
        <UserAvatar user={AVATAR_USER} />
      </>,
    );
    await waitFor(() => expect(container.querySelectorAll("img")).toHaveLength(2));
    // Query cache theo key: 2 component chỉ phát đúng 1 request /me/avatar.
    expect(download).toHaveBeenCalledTimes(1);
    const [first, second] = Array.from(container.querySelectorAll("img"));
    // Mỗi component giữ object URL riêng tạo từ cùng một blob, đều hiển thị ảnh.
    expect(first.getAttribute("src")).toBe("blob:avatar-1");
    expect(second.getAttribute("src")).toBe("blob:avatar-2");
  });

  it("does not refetch when the avatar is remounted or the window refocuses", async () => {
    const download = vi
      .spyOn(avatarService, "download")
      .mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const { unmount } = withClient(<UserAvatar user={AVATAR_USER} />);
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    unmount();
    // staleTime Infinity + refetchOnWindowFocus false: mount lại dùng cache, không gọi lại API.
    withClient(<UserAvatar user={AVATAR_USER} />);
    expect(download).toHaveBeenCalledTimes(1);
  });

  it("refetches and revokes the old URL when avatarUpdatedAt changes", async () => {
    const download = vi
      .spyOn(avatarService, "download")
      .mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const { container, rerender } = withClient(<UserAvatar user={AVATAR_USER} />);
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
    expect(create).toHaveBeenCalledTimes(1);

    rerender(
      <QueryClientProvider client={client}>
        <UserAvatar user={{ ...AVATAR_USER, avatarUpdatedAt: "2026-10-25T06:00:00Z" }} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    expect(download).toHaveBeenCalledTimes(2);
    // URL cũ (blob trước đó) được thu hồi đúng khi blob mới thay thế.
    expect(revoke).toHaveBeenCalledWith("blob:avatar-1");
  });

  it("keeps the letter when the image cannot be loaded", async () => {
    const download = vi.spyOn(avatarService, "download").mockRejectedValue(new Error("404"));
    const { container } = withClient(<UserAvatar user={AVATAR_USER} />);
    await waitFor(() => expect(download).toHaveBeenCalled());
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("N");
  });

  it("revokes the temporary URL when the component is removed", async () => {
    vi.spyOn(avatarService, "download").mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const { container, unmount } = withClient(<UserAvatar user={AVATAR_USER} />);
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:avatar-1");
    expect(screen.queryByRole("img")).toBeNull();
  });
});
