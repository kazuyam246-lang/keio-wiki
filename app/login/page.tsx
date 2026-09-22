"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000",
      },
    });

    if (error) {
      console.error(error);
      alert(`ログインに失敗しました：${error.message}`);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">ログイン</h1>

        <p className="mt-3 text-slate-600">
          Googleアカウントでログインできます。
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-8 w-full rounded-full bg-slate-900 px-6 py-4 font-semibold text-white hover:bg-slate-700"
        >
          Googleでログイン
        </button>
      </div>
    </main>
  );
}