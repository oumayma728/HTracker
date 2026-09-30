"use client";

import { deleteAccount } from "@/lib/actions";

/** Submits its own Server Action, but only after the person confirms. */
export function DeleteAccountButton() {
  return (
    <button
      type="submit"
      formAction={deleteAccount}
      formNoValidate
      className="btn btn-danger"
      onClick={(e) => {
        if (!window.confirm("Delete your account and all of your habit data? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      Delete account
    </button>
  );
}
