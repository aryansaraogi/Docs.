import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Card from "./Card";

const plain = {
  id: 7,
  title: "Plan",
  desc: "Roadmap",
  filesize: "1.2mb",
  cardColor: "zinc",
  tag: { isOpen: false, tagTitle: "Download Now", tagColor: "green" },
};
const withFile = {
  ...plain,
  file: { name: "plan.pdf", type: "application/pdf", size: 12345 },
  tag: { ...plain.tag, isOpen: true },
};

function setup(data = plain) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onDownload: vi.fn(), onOpen: vi.fn() };
  render(<Card data={data} isMobile={false} {...handlers} />);
  return { user: userEvent.setup(), ...handlers };
}

describe("Card", () => {
  it("shows the typed size and no download button without a file", () => {
    setup();
    expect(screen.getByText("1.2mb")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^download/i })).not.toBeInTheDocument();
  });

  it("shows the file type and real size, and downloads from the button and banner", async () => {
    const { user, onDownload } = setup(withFile);
    expect(screen.getByText("PDF · 12 KB")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Download plan.pdf" }));
    await user.click(screen.getByRole("button", { name: "Download Now: download plan.pdf" }));
    expect(onDownload).toHaveBeenCalledTimes(2);
    expect(onDownload).toHaveBeenCalledWith(7, "plan.pdf");
  });

  it("Escape cancels an edit without saving", async () => {
    const { user, onEdit } = setup();
    await user.click(screen.getByRole("button", { name: "Edit Plan" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Changed");
    await user.click(screen.getByRole("button", { name: "rose" }));
    await user.keyboard("{Escape}");
    expect(await screen.findByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("Enter saves only the editable fields", async () => {
    const { user, onEdit } = setup();
    await user.click(screen.getByRole("button", { name: "Edit Plan" }));
    await user.click(screen.getByRole("button", { name: "rose" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "New plan{Enter}");
    expect(onEdit).toHaveBeenCalledWith(7, { title: "New plan", desc: "Roadmap", filesize: "1.2mb", cardColor: "rose" });
  });

  it("a blank title keeps the previous one", async () => {
    const { user, onEdit } = setup();
    await user.click(screen.getByRole("button", { name: "Edit Plan" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "   {Enter}");
    expect(onEdit).toHaveBeenCalledWith(7, expect.objectContaining({ title: "Plan" }));
  });

  it("hides the manual size field when the card has a file", async () => {
    const { user } = setup(withFile);
    await user.click(screen.getByRole("button", { name: "Edit Plan" }));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("File size")).not.toBeInTheDocument();
  });

  it("opens the preview from the title button or a click on the card", async () => {
    const { user, onOpen } = setup(withFile);
    await user.click(screen.getByRole("button", { name: "Plan" }));
    await user.click(screen.getByText("Roadmap"));
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledWith(7);
  });

  it("doesn't open a preview from its buttons, while editing, or without a file", async () => {
    const { user, onOpen } = setup(withFile);
    await user.click(screen.getByRole("button", { name: "Download plan.pdf" }));
    await user.click(screen.getByRole("button", { name: "Edit Plan" }));
    await user.click(screen.getByLabelText("Description"));
    await user.click(screen.getByText("Color")); // not a control — only the editing guard stops it
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("a card without a file has a plain title and doesn't open", async () => {
    const { user, onOpen } = setup();
    expect(screen.queryByRole("button", { name: "Plan" })).not.toBeInTheDocument();
    await user.click(screen.getByText("Roadmap"));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("deletes", async () => {
    const { user, onDelete } = setup();
    await user.click(screen.getByRole("button", { name: "Delete Plan" }));
    expect(onDelete).toHaveBeenCalledWith(7);
  });
});
