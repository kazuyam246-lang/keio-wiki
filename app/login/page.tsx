"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleLogin() {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(`ログインに失敗しました：${error.message}`);
        setLoading(false);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "不明なエラー";

      setErrorMessage(`ログインに失敗しました：${message}`);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          ログイン
        </h1>

        <p className="mt-3 text-slate-600">
          Googleアカウントでログインできます。
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-8 w-full rounded-full bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "ログイン中..." : "Googleでログイン"}
        </button>

        {errorMessage && (
          <p className="mt-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    </main>
  );
}