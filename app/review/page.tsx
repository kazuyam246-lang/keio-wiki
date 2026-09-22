"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Course = {
  id: number;
  name: string;
  professor: string;
};

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-500">
            読み込んでいます...
          </p>
        </main>
      }
    >
      <ReviewForm />
    </Suspense>
  );
}

function ReviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCourseId =
    searchParams.get("courseId");

  const [courseName, setCourseName] =
    useState("");

  const [courseId, setCourseId] =
    useState("");

  const [professor, setProfessor] =
    useState("");

  const [rating, setRating] =
    useState("");

  const [easyS, setEasyS] =
    useState("");

  const [workload, setWorkload] =
    useState("");

  const [grade, setGrade] =
    useState("");

  const [comment, setComment] =
    useState("");

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [message, setMessage] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [user, setUser] =
    useState<any>(null);

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  // ログイン状態を確認
  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoadingUser(false);
    }

    checkUser();
  }, []);

  // 授業一覧を取得
  useEffect(() => {
    async function loadCourses() {
      const { data, error } =
        await supabase
          .from("courses")
          .select(
            "id, name, professor"
          )
          .order("id", {
            ascending: true,
          });

      if (error) {
        console.error(error);
        return;
      }

      const loadedCourses =
        data ?? [];

      setCourses(loadedCourses);

      // 授業詳細から来た場合は自動選択
      if (initialCourseId) {
        const selectedCourse =
          loadedCourses.find(
            (course) =>
              String(course.id) ===
              initialCourseId
          );

        if (selectedCourse) {
          setCourseId(
            String(
              selectedCourse.id
            )
          );

          setCourseName(
            selectedCourse.name
          );

          setProfessor(
            selectedCourse.professor
          );
        }
      }
    }

    loadCourses();
  }, [initialCourseId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !courseId ||
      !courseName ||
      !professor ||
      !rating ||
      !easyS ||
      !workload ||
      !grade ||
      !comment.trim()
    ) {
      setMessage(
        "すべての項目を入力してください。"
      );
      return;
    }

    if (!user) {
      setMessage(
        "ログインが必要です。"
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } =
      await supabase
        .from("reviews")
        .insert({
          course_name:
            courseName,

          course_id:
            Number(courseId),

          professor,

          rating:
            Number(rating),

          easy_s:
            Number(easyS),

          workload:
            Number(workload),

          grade,

          comment:
            comment.trim(),

          user_id:
            user.id,
        });

    if (error) {
      console.error(error);

      setMessage(
        `投稿できませんでした：${error.message}`
      );

      setIsSubmitting(false);
      return;
    }

    const submittedCourseId = courseId;

    setMessage(
      "体験記を投稿しました！"
    );

    setRating("");
    setEasyS("");
    setWorkload("");
    setGrade("");
    setComment("");

    setIsSubmitting(false);

    router.push(
  `/courses/${submittedCourseId}`
);

router.refresh();
  }

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          ログイン状態を確認中...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link
              href="/"
              className="text-lg font-bold"
            >
              慶應wiki
            </Link>

            <Link
              href="/courses"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              授業一覧へ戻る
            </Link>
          </div>
        </header>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold">
              体験記を書く
            </h1>

            <p className="mt-3 text-slate-600">
              体験記を投稿するには
              ログインが必要です。
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Googleでログイン
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* ヘッダー */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-bold"
          >
            慶應wiki
          </Link>

          <Link
            href="/courses"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← 授業一覧へ戻る
          </Link>
        </div>
      </header>

      <section className="px-6 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl">
          {/* タイトル */}
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-600">
              REVIEW
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              体験記を書く
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              実際に履修した授業の情報を共有してください。
              あなたの体験が、次に履修する学生の参考になります。
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-8"
          >
            {/* 授業 */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  COURSE
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  授業
                </h2>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="courseName"
                  className="block text-sm font-semibold"
                >
                  授業名
                </label>

                <select
                  id="courseName"
                  value={courseId}
                  onChange={(
                    event
                  ) => {
                    const selectedId =
                      event.target
                        .value;

                    const selectedCourse =
                      courses.find(
                        (course) =>
                          String(
                            course.id
                          ) ===
                          selectedId
                      );

                    setCourseId(
                      selectedId
                    );

                    setCourseName(
                      selectedCourse
                        ?.name ?? ""
                    );

                    setProfessor(
                      selectedCourse
                        ?.professor ??
                        ""
                    );
                  }}
                  className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    授業を選択してください
                  </option>

                  {courses.map(
                    (course) => (
                      <option
                        key={
                          course.id
                        }
                        value={
                          course.id
                        }
                      >
                        {
                          course.name
                        }
                        （
                        {
                          course.professor
                        }
                        ）
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* 選択中の授業 */}
              {courseId &&
                courseName && (
                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">
                      選択中の授業
                    </p>

                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-bold text-slate-900">
                        {
                          courseName
                        }
                      </p>

                      <p className="text-sm text-slate-500">
                        {
                          professor
                        }
                      </p>
                    </div>
                  </div>
                )}
            </section>

            {/* 評価 */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  RATING
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  授業を評価
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  実際に履修した感覚で
                  1〜5を選んでください。
                </p>
              </div>

              {/* 3評価 */}
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {/* 単位 */}
                <div>
                  <label
                    htmlFor="rating"
                    className="block text-sm font-semibold"
                  >
                    単位の取りやすさ
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    1 難しい → 5
                    取りやすい
                  </p>

                  <select
                    id="rating"
                    value={rating}
                    onChange={(
                      event
                    ) =>
                      setRating(
                        event.target
                          .value
                      )
                    }
                    className="mt-3 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      選択
                    </option>

                    <option value="1">
                      1 - とても難しい
                    </option>

                    <option value="2">
                      2 - 難しい
                    </option>

                    <option value="3">
                      3 - 普通
                    </option>

                    <option value="4">
                      4 - 取りやすい
                    </option>

                    <option value="5">
                      5 - とても取りやすい
                    </option>
                  </select>
                </div>

                {/* S */}
                <div>
                  <label
                    htmlFor="easyS"
                    className="block text-sm font-semibold"
                  >
                    Sの取りやすさ
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    1 難しい → 5
                    取りやすい
                  </p>

                  <select
                    id="easyS"
                    value={easyS}
                    onChange={(
                      event
                    ) =>
                      setEasyS(
                        event.target
                          .value
                      )
                    }
                    className="mt-3 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      選択
                    </option>

                    <option value="1">
                      1 - とても難しい
                    </option>

                    <option value="2">
                      2 - 難しい
                    </option>

                    <option value="3">
                      3 - 普通
                    </option>

                    <option value="4">
                      4 - 取りやすい
                    </option>

                    <option value="5">
                      5 - とても取りやすい
                    </option>
                  </select>
                </div>

                {/* 課題量 */}
                <div>
                  <label
                    htmlFor="workload"
                    className="block text-sm font-semibold"
                  >
                    課題量
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    1 少ない → 5 多い
                  </p>

                  <select
                    id="workload"
                    value={workload}
                    onChange={(
                      event
                    ) =>
                      setWorkload(
                        event.target
                          .value
                      )
                    }
                    className="mt-3 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      選択
                    </option>

                    <option value="1">
                      1 - とても少ない
                    </option>

                    <option value="2">
                      2 - 少ない
                    </option>

                    <option value="3">
                      3 - 普通
                    </option>

                    <option value="4">
                      4 - 多い
                    </option>

                    <option value="5">
                      5 - とても多い
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* 成績 */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div>
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  GRADE
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  最終成績
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  実際に取得した成績を選んでください。
                </p>
              </div>

              {/* S A B C D ボタン */}
              <div className="mt-5 grid grid-cols-5 gap-2 sm:max-w-lg sm:gap-3">
                {[
                  "S",
                  "A",
                  "B",
                  "C",
                  "D",
                ].map(
                  (gradeOption) => (
                    <button
                      key={
                        gradeOption
                      }
                      type="button"
                      onClick={() =>
                        setGrade(
                          gradeOption
                        )
                      }
                      className={
                        grade ===
                        gradeOption
                          ? "h-12 rounded-lg bg-blue-600 text-base font-bold text-white shadow-sm"
                          : "h-12 rounded-lg border border-slate-300 bg-white text-base font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                      }
                    >
                      {
                        gradeOption
                      }
                    </button>
                  )
                )}
              </div>

              {grade && (
                <p className="mt-3 text-sm text-slate-500">
                  選択中：
                  <span className="ml-1 font-bold text-blue-600">
                    {grade}
                  </span>
                </p>
              )}
            </section>

            {/* コメント */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div>
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  EXPERIENCE
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  体験記
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  試験・課題・出席・授業の雰囲気・勉強方法など、
                  次に履修する人が知りたいことを書いてください。
                </p>
              </div>

              <textarea
                id="comment"
                rows={9}
                value={comment}
                onChange={(
                  event
                ) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="例：毎週課題があります。試験は授業内容を理解していれば解ける問題が中心でした。出席は..."
                className="mt-5 w-full resize-none rounded-xl border border-slate-300 bg-white p-4 leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-2 flex justify-end">
                <span className="text-xs text-slate-400">
                  {comment.length}
                  文字
                </span>
              </div>
            </section>

            {/* メッセージ */}
            {message && (
              <div
                className={
                  message ===
                  "体験記を投稿しました！"
                    ? "rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
                    : "rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                }
              >
                {message}
              </div>
            )}

            {/* 投稿 */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={
                  courseId
                    ? `/courses/${courseId}`
                    : "/courses"
                }
                className="text-center text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                キャンセル
              </Link>

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="rounded-lg bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "投稿中..."
                  : "体験記を投稿する"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}