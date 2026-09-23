import Link from "next/link";
import CourseList from "./CourseList";

export default function CoursesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="shrink-0 font-bold tracking-tight text-slate-950"
          >
            慶應Wiki
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/mypage"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-4"
            >
              マイページ
            </Link>

            <Link
              href="/add-course"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-4"
            >
              授業を追加
            </Link>

            <Link
              href="/review"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:px-4"
            >
              体験記を書く
            </Link>
          </div>
        </div>
      </header>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-600">
              COURSES
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              授業を探す
            </h1>

            <p className="mt-4 text-slate-600">
              慶應義塾大学の授業を検索して、履修者の体験記を確認できます。
            </p>
          </div>

          <CourseList />
        </div>
      </section>
    </main>
  );
}