import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddCardForm from "./AddCardForm";

function setup(onAdd = vi.fn().mockResolvedValue()) {
  const onClose = vi.fn();
  render(<AddCardForm onAdd={onAdd} onClose={onClose} />);
  return { user: userEvent.setup(), onAdd, onClose };
}
const notes = () => new File(["hello"], "notes.final.txt", { type: "text/plain" });

describe("AddCardForm", () => {
  it("choosing a file fills the title, hides the size field and turns the banner on", async () => {
    const { user } = setup();
    expect(screen.getByLabelText("Show tag banner")).not.toBeChecked();
    await user.upload(screen.getByLabelText(/choose a file/i), notes());
    expect(screen.getByLabelText("Title *")).toHaveValue("notes.final");
    expect(screen.queryByLabelText("File Size")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Show tag banner")).toBeChecked();
    expect(screen.getByText("notes.final.txt")).toBeInTheDocument();
  });

  it("doesn't overwrite a title you already typed", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("Title *"), "Mine");
    await user.upload(screen.getByLabelText(/choose a file/i), notes());
    expect(screen.getByLabelText("Title *")).toHaveValue("Mine");
  });

  it("removing the file brings the size field back", async () => {
    const { user } = setup();
    await user.upload(screen.getByLabelText(/choose a file/i), notes());
    await user.click(screen.getByRole("button", { name: "Remove file" }));
    expect(screen.getByLabelText("File Size")).toBeInTheDocument();
  });

  it("submits the card with its file", async () => {
    const { user, onAdd } = setup();
    const file = notes();
    await user.upload(screen.getByLabelText(/choose a file/i), file);
    await user.click(screen.getByRole("button", { name: "Add Document" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "notes.final", file }));
  });

  it("shows an error and stays open when saving fails", async () => {
    const { user, onClose } = setup(vi.fn().mockRejectedValue(new Error("QuotaExceededError")));
    await user.upload(screen.getByLabelText(/choose a file/i), notes());
    await user.click(screen.getByRole("button", { name: "Add Document" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save the file");
    expect(screen.getByRole("button", { name: "Add Document" })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("doesn't submit without a title", async () => {
    const { user, onAdd } = setup();
    await user.click(screen.getByRole("button", { name: "Add Document" }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("Escape closes", async () => {
    const { user, onClose } = setup();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
