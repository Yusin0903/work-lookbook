"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions";

type State = { error?: string } | undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prevState, formData) => login(formData),
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">帳號</label>
        <input
          name="username"
          type="text"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">密碼</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 text-white py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "登入中..." : "登入"}
      </button>
    </form>
  );
}
