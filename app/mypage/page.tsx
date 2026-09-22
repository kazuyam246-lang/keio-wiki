"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Review = {
  id: number;
  course_id: number | null;
  course_name: string;
  professor: string;
  rating: number;
  comment: string;
  grade: string | null;
  likes: number | null;
  created_at: string;
};

type Course = {
  id: number;
  name: string;
  professor: string;
  faculty: string | null;
  campus: string | null;
  semester: string | null;
  weekday: string | null;
  period: number | null;
};

export default function MyPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      // 自分が書いた体験記
      const {
        data: reviewData,
        error: reviewError,
      } = await supabase
        .from("reviews")
        .select(
          `
          id,
          course_id,
          course_name,
          professor,
          rating,
          comment,
          grade,
          likes,
          created_at
        `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (!reviewError) {
        setReviews(reviewData ?? []);
      }

      // 自分が追加した授業
      const {
        data: courseData,
        error: courseError,
      } = await supabase
        .from("courses")
        .select(
          `
          id,
          name,
          professor,
          faculty,
          campus,
          semester,
          weekday,
          period
        `
        )
        .eq("user_id", user.id)
        .order("id", {
          ascending: false,
        });

      if (!courseError) {
        setCourses(courseData ?? []);
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  // =========================
  // ログアウト
  // =========================

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // =========================
  // 授業削除
  // =========================

  async function handleDeleteCourse(
    courseId: number,
    courseName: string
  ) {
    const confirmed = window.confirm(
      `「${courseName}」を削除しますか？\nこの操作は取り消せません。`
    );

    if (!confirmed) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("ログインが必要です");
      return;
    }

    // この授業に体験記があるか確認
    const {
      count,
      error: reviewError,
    } = await supabase
      .from("reviews")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("course_id", courseId);

    if (reviewError) {
      alert(
        "体験記の確認に失敗しました：" +
          reviewError.message
      );
      return;
    }

    // 体験記がある授業は削除不可
    if ((count ?? 0) > 0) {
      alert(
        `この授業には${count}件の体験記があるため削除できません。`
      );
      return;
    }

    // 本人の授業だけ削除
    const { error: deleteError } =
      await supabase
        .from("courses")
        .delete()
        .eq("id", courseId)
        .eq("user_id", user.id);

    if (deleteError) {
      alert(
        "授業の削除に失敗しました：" +
          deleteError.message
      );
      return;
    }

    setCourses((currentCourses) =>
      currentCourses.filter(
        (course) => course.id !== courseId
      )
    );

    alert("授業を削除しました");
  }

  // =========================
  // ローディング
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
            <Link
              href="/"
              className="font-bold tracking-tight"
            >
              慶應wiki
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-sm text-slate-500">
            ログイン状態を確認中...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // 未ログイン
  // =========================

  if (!email) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="font-bold tracking-tight"
            >
              慶應wiki
            </Link>

            <Link
              href="/courses"
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              授業一覧へ
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-widest text-blue-600">
              MY PAGE
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              マイページ
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              マイページを見るにはログインが必要です。
            </p>

            <Link
              href="/login"
              className="mt-7 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Googleでログイン
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // =========================
  // マイページ
  // =========================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="font-bold tracking-tight"
          >
            慶應wiki
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/courses"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:block"
            >
              授業一覧へ
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {/* PAGE TITLE */}

        <section>
          <p className="text-xs font-bold tracking-widest text-blue-600">
            MY PAGE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            マイページ
          </h1>

          <p className="mt-3 text-slate-500">
            自分が追加した授業と投稿した体験記を確認できます。
          </p>
        </section>

        {/* ACCOUNT */}

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                ACCOUNT
              </p>

              <p className="mt-2 text-sm text-slate-500">
                ログイン中のGoogleアカウント
              </p>

              <p className="mt-1 break-all font-semibold text-slate-900">
                {email}
              </p>
            </div>

            <div className="flex gap-2">
              <StatBadge
                value={courses.length}
                label="追加授業"
              />

              <StatBadge
                value={reviews.length}
                label="体験記"
              />
            </div>
          </div>
        </section>

        {/* =====================
            MY COURSES
        ====================== */}

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                MY COURSES
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                自分が追加した授業
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {courses.length}件の授業
              </p>
            </div>

            <Link
              href="/add-course"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              ＋ 授業を追加
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-semibold text-slate-700">
                まだ授業を追加していません
              </p>

              <p className="mt-2 text-sm text-slate-500">
                授業情報を追加すると、ここに表示されます。
              </p>

              <Link
                href="/add-course"
                className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                授業を追加する
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    {/* 授業情報 */}

                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        {course.faculty && (
                          <CourseTag>
                            {course.faculty}
                          </CourseTag>
                        )}

                        {course.campus && (
                          <CourseTag>
                            {course.campus}
                          </CourseTag>
                        )}

                        {course.semester && (
                          <CourseTag>
                            {course.semester}
                          </CourseTag>
                        )}

                        {course.weekday &&
                          course.period && (
                            <CourseTag>
                              {course.weekday}曜{" "}
                              {course.period}限
                            </CourseTag>
                          )}
                      </div>

                      <h3 className="mt-4 text-xl font-bold tracking-tight">
                        {course.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {course.professor}
                      </p>
                    </div>

                    {/* 操作 */}

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/courses/${course.id}`}
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        授業詳細
                      </Link>

                      <Link
                        href={`/courses/${course.id}/edit`}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        編集
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteCourse(
                            course.id,
                            course.name
                          )
                        }
                        className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* =====================
            MY REVIEWS
        ====================== */}

        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                MY REVIEWS
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                自分の投稿
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {reviews.length}件の体験記
              </p>
            </div>

            <Link
              href="/review"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ＋ 体験記を書く
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-semibold text-slate-700">
                まだ体験記を投稿していません
              </p>

              <p className="mt-2 text-sm text-slate-500">
                履修した授業の体験を共有してみましょう。
              </p>

              <Link
                href="/review"
                className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                体験記を書く
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                  {/* 上 */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold sm:text-xl">
                        {review.course_name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {review.professor}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <ReviewScore
                        label="単位"
                        value={review.rating}
                      />

                      {review.grade && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">
                            最終成績
                          </span>

                          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-base font-bold text-white">
                            {review.grade}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* コメント */}

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">
                      {review.comment}
                    </p>
                  </div>

                  {/* 下 */}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>
                        👍 {review.likes ?? 0}
                      </span>

                      <span>
                        {formatDate(
                          review.created_at
                        )}
                      </span>
                    </div>

                    <Link
                      href={
                        review.course_id
                          ? `/courses/${review.course_id}`
                          : "/courses"
                      }
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      授業詳細を見る →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================
   COURSE TAG
========================= */

function CourseTag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
      {children}
    </span>
  );
}

/* =========================
   REVIEW SCORE
========================= */

function ReviewScore({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
      {label}{" "}
      <span className="text-slate-900">
        {value} / 5
      </span>
    </span>
  );
}

/* =========================
   STAT BADGE
========================= */

function StatBadge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-20 rounded-lg bg-slate-50 px-4 py-3 text-center">
      <p className="text-xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-0.5 text-xs text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* =========================
   DATE
========================= */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "ja-JP",
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }
  );
}