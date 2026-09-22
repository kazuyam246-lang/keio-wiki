"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
    }

    checkUser();
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-base font-bold tracking-tight sm:text-lg"
          >
            慶應wiki
          </Link>

          <nav className="flex items-center gap-2 sm:gap-6">
            <Link
              href="/courses"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block"
            >
              授業を探す
            </Link>

            <Link
              href="/review"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block"
            >
              体験記を書く
            </Link>

            {isLoggedIn ? (
              <Link
                href="/mypage"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                マイページ
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="mb-5 text-sm font-semibold text-blue-600">
              慶應生のための授業情報サイト
            </p>

            <h1 className="mt-6 font-bold tracking-tight text-slate-950">
  <span className="text-6xl sm:text-7xl lg:text-8xl">
    慶應wiki
  </span>

  <span className="ml-6 text-3xl font-semibold sm:text-4xl lg:text-5xl">
    ～履修は団体戦～
  </span>
</h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              実際に履修した学生の体験記から、
              単位の取りやすさ、Sの取りやすさ、課題量、成績分布を確認できます。
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                授業を探す
              </Link>

              <Link
                href="/review"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                体験記を書く
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divider / Features */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl divide-y divide-slate-200 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
          <Feature
            title="授業を絞り込む"
            text="学部、キャンパス、曜日、時限、学期から授業を検索。"
          />

          <Feature
            title="履修者の評価を見る"
            text="単位・Sの取りやすさや課題量を5段階で確認。"
          />

          <Feature
            title="成績分布を確認"
            text="投稿された最終成績から、授業ごとの分布を自動集計。"
          />
        </div>
      </section>

      {/* Main CTA */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                COURSE REVIEWS
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                先輩の体験を、
                <br />
                次の履修選びへ。
              </h2>
            </div>

            <div>
              <p className="max-w-xl leading-8 text-slate-600">
                シラバスだけでは分からない授業の雰囲気や負担を、
                実際に履修した学生の情報から確認できます。
              </p>

              <Link
                href="/courses"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-600 transition hover:gap-3 hover:text-blue-700"
              >
                授業一覧を見る
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-semibold text-slate-800">
            慶應wiki
          </p>

          <p>慶應生の授業選びを、もっとわかりやすく。</p>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="py-8 md:px-8 md:py-10 first:md:pl-0 last:md:pr-0">
      <h2 className="font-bold text-slate-950">
        {title}
      </h2>

      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}