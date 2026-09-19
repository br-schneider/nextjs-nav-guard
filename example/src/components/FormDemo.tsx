"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { NavigationGuardLink, useNavigationGuard } from "nextjs-nav-guard";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

export function FormDemo() {
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [status, setStatus] = useState("Nothing saved yet.");
  const router = useRouter();
  const dirty = note !== savedNote;
  const guard = useNavigationGuard({ enabled: dirty });

  const save = () => {
    try {
      localStorage.setItem("nextjs-nav-guard-demo", note);
      flushSync(() => setSavedNote(note));
      setStatus("Saved in this browser.");
      return true;
    } catch {
      setStatus("This browser could not save the note. Your edits are still here.");
      return false;
    }
  };

  return (
    <main className="demo">
      <a href="https://nextjs-nav-guard.vercel.app/">Documentation</a>
      <h1>Try nextjs-nav-guard</h1>
      <p>Write a note, then try leaving. You can keep editing, discard your changes, or save before navigating.</p>
      <label htmlFor="note">Your note</label>
      <textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} rows={6} />
      <p role="status">{dirty ? "You have unsaved changes." : status}</p>
      <div className="demo-actions">
        <button onClick={save}>Save note</button>
        <button onClick={() => { if (save()) router.push("/page1"); }}>Save and leave</button>
        <NavigationGuardLink href="/page1">Leave this page</NavigationGuardLink>
      </div>
      <p>Saving writes only to this browser's local storage. The demo does not send your note to a server.</p>
      <p>Maintained by <a href="https://github.com/br-schneider">Brett Schneider</a>. Originally created by <a href="https://github.com/LayerXcom">LayerX</a>.</p>
      <UnsavedChangesDialog guard={guard} />
    </main>
  );
}
