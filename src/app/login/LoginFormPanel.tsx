import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export type AuthMode = "login" | "signup";

interface LoginFormPanelProps {
  mode: AuthMode;
  message: string;
  isError: boolean;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onSwitchMode: () => void;
}

export function LoginFormPanel({ mode, message, isError, isPending, onSubmit, onSwitchMode }: LoginFormPanelProps) {
  return (
    <div className="rounded-3xl border border-white/90 bg-white/90 p-6 shadow-[0_12px_36px_rgb(39_90_150/0.12)] backdrop-blur-sm sm:p-8">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {mode === "login" ? "Sign in to continue learning." : "Start building your vocabulary today."}
      </p>

      <form action={onSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
            placeholder="Enter your password"
            className="focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        {message && (
          <div
            role={isError ? "alert" : "status"}
            className={`rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-[0_5px_14px_rgb(37_99_235/0.22)] transition hover:bg-blue-700 hover:shadow-[0_7px_18px_rgb(37_99_235/0.28)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={onSwitchMode}
          disabled={isPending}
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          {mode === "login" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
