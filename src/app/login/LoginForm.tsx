
"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { login, signup } from "./actions";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/Input";

type AuthMode = "login" | "signup";

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");
    setIsError(false);

    startTransition(async () => {
      const result =
        mode === "login"
          ? await login(formData)
          : await signup(formData);

        if (result && "error" in result && result.error) {
            setMessage(result.error);
            setIsError(true);
        } else if (result && "success" in result && result.success) {
            setMessage(result.success);
        }
    });
  }

  function switchMode() {
    setMode((current) =>
      current === "login" ? "signup" : "login"
    );
    setMessage("");
    setIsError(false);
  }

  return (
    <main className="login-shell flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="BlueWords home">
            <Image src="/logo.png" alt="BlueWords" width={640} height={225} sizes="240px" loading="eager" unoptimized className="h-[84px] w-60 object-contain" />
          </Link>

          <p className="mt-2 text-sm text-slate-500">
            Build your vocabulary, one word at a time.
          </p>
        </div>

        <div className="rounded-3xl border border-white/90 bg-white/90 p-6 shadow-[0_12px_36px_rgb(39_90_150/0.12)] backdrop-blur-sm sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Sign in to continue learning."
              : "Start building your vocabulary today."}
          </p>

          <form action={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

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
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                minLength={6}
                required
                placeholder="Enter your password"
                className="focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            {message && (
              <div
                role={isError ? "alert" : "status"}
                className={`rounded-xl px-4 py-3 text-sm ${
                  isError
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-[0_5px_14px_rgb(37_99_235/0.22)] transition hover:bg-blue-700 hover:shadow-[0_7px_18px_rgb(37_99_235/0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              disabled={isPending}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
