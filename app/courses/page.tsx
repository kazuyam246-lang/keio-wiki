import Link from "next/link";
import { supabase } from "../../lib/supabase";
import CourseList from "./CourseList";

export default async function CoursesPage() {
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      professor,
      description,
      faculty,
      weekday,
      period,
      campus,
      semester,
      reviews (
        id,
        rating,
        easy_s,
        workload
      )
    `)
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-red-600">
            授業一覧を取得できませんでした
          </h1>

          <p className="mt-2 text-slate-600">
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* =========================
          ヘッダー
      ========================= */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          {/* サイト名 */}
          <Link
            href="/"
            className="shrink-0 font-bold tracking-tight text-slate-950"
          >
            慶應wiki
          </Link>

          {/* 右側メニュー */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {/* マイページ */}
            <Link
              href="/mypage"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-4"
            >
              マイページ
            </Link>

            {/* 授業追加 */}
            <Link
              href="/add-course"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-4"
            >
              授業を追加
            </Link>

            {/* 体験記投稿 */}
            <Link
              href="/review"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:px-4"
            >
              体験記を書く
            </Link>
          </div>
        </div>
      </header>

      {/* =========================
          メイン
      ========================= */}
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          {/* ページタイトル */}
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-600">
              COURSES
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              授業を探す
            </h1>

            <p className="mt-4 text-slate-600">
              気になる授業を選んで、履修者の体験記を確認できます。
            </p>
          </div>

          {/* 授業一覧 */}
          <CourseList courses={courses ?? []} />
        </div>
      </section>
    </main>
  );
}