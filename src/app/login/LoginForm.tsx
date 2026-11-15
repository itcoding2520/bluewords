"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";

import { login, signup } from "./actions";
import { LoginFormPanel, type AuthMode } from "./LoginFormPanel";

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");
    setIsError(false);

    startTransition(async () => {
      const result = mode === "login"
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
    setMode((current) => current === "login" ? "signup" : "login");
    setMessage("");
    setIsError(false);
  }

  return (
    <main className="login-shell flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="BlueWords home">
            <Image src="/logo.webp" alt="BlueWords" width={640} height={225} sizes="240px" loading="eager" className="h-[84px] w-60 object-contain" />
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Build your vocabulary, one word at a time.
          </p>
        </div>

        <LoginFormPanel
          mode={mode}
          message={message}
          isError={isError}
          isPending={isPending}
          onSubmit={handleSubmit}
          onSwitchMode={switchMode}
        />
      </div>
    </main>
  );
}
