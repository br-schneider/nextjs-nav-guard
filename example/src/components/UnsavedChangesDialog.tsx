"use client";

import { useEffect, useId, useRef } from "react";
import { useNavigationGuard } from "nextjs-nav-guard";

export function UnsavedChangesDialog({
  guard,
}: {
  guard: ReturnType<typeof useNavigationGuard>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (guard.active && !dialog.open) dialog.showModal();
    if (!guard.active && dialog.open) dialog.close();
  }, [guard.active]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        guard.reject();
      }}
    >
      <h2 id={titleId}>Leave without saving?</h2>
      <p>Your latest edits have not been saved.</p>
      <div className="demo-actions">
        <button onClick={guard.reject}>Keep editing</button>
        <button onClick={guard.accept}>Discard and leave</button>
      </div>
    </dialog>
  );
}
