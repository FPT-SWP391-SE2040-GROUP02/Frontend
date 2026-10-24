import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { avatarService } from "../../api/avatarService";
import { UserAvatar, type UserAvatarSubject } from "../UserAvatar";

const BASE: UserAvatarSubject = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "nguyễn an",
  email: "an@example.test",
  hasAvatar: false,
};

let create: ReturnType<typeof vi.fn>;
let revoke: ReturnType<typeof vi.fn>;
beforeEach(() => {
  create = vi.fn(() => "blob:avatar-1");
  revoke = vi.fn();
  Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("UserAvatar", () => {
  it("shows the capitalised first letter and never calls the Backend without an avatar", () => {
    const download = vi.spyOn(avatarService, "download");
    const { container } = render(<UserAvatar user={BASE} className="size-10" />);
    expect(container).toHaveTextContent("N");
    expect(container.querySelector("img")).toBeNull();
    expect(download).not.toHaveBeenCalled();
  });

  it("falls back to the given letter when there is no user yet", () => {
    const { container } = render(<UserAvatar user={null} fallbackLetter="T" />);
    expect(container).toHaveTextContent("T");
  });

  it("loads the image through the Bearer API and shows it as a decorative object URL", async () => {
    const download = vi
      .spyOn(avatarService, "download")
      .mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const { container } = render(
      <UserAvatar user={{ ...BASE, hasAvatar: true, avatarUpdatedAt: "2026-10-24T06:00:00Z" }} />,
    );
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:avatar-1");
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(download).toHaveBeenCalledTimes(1);
  });

  it("keeps the letter when the image cannot be loaded", async () => {
    const download = vi.spyOn(avatarService, "download").mockRejectedValue(new Error("404"));
    const { container } = render(
      <UserAvatar user={{ ...BASE, hasAvatar: true, avatarUpdatedAt: "2026-10-24T06:00:00Z" }} />,
    );
    await waitFor(() => expect(download).toHaveBeenCalled());
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("N");
  });

  it("revokes the temporary URL when the component is removed", async () => {
    vi.spyOn(avatarService, "download").mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const { container, unmount } = render(
      <UserAvatar user={{ ...BASE, hasAvatar: true, avatarUpdatedAt: "2026-10-24T06:00:00Z" }} />,
    );
    await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:avatar-1");
    expect(screen.queryByRole("img")).toBeNull();
  });
});
