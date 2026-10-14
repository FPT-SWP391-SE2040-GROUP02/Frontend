import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu";

afterEach(cleanup);

describe("DropdownMenu labels", () => {
  it("opens a flat labelled menu, closes with Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Profile</DropdownMenuLabel>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Account" });
    await user.click(trigger);
    expect(await screen.findByRole("group", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Logout" })).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("preserves explicit groups and menu item actions", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Roles</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuItem onClick={onClick}>Owner</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole("button", { name: "Roles" }));
    expect(await screen.findByRole("group", { name: "Workspace" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Owner" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
