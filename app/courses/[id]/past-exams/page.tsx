"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Course = {
  id: number;
  name: string;
  canonical_name: string | null;
  professor: string | null;
  faculty: string | null;
};

type PastExam = {
  id: number;
  course_id: number;
  user_id: string;
  academic_year: number | null;
  exam_type: string | null;
  title: string | null;
  image_path: string;
  created_at: string;
};

export default function PastExamsPage() {
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [pastExams, setPastExams] = useState<PastExam[]>([]);

  const [userId, setUserId] = useState<string | null>(null);

  const [academicYear, setAcademicYear] = useState(
    new Date().getFullYear().toString()
  );
  const [examType, setExamType] = useState("期末試験");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!courseId || Number.isNaN(courseId)) return;

    loadPage();
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadPage() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id ?? null);

    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id, name, canonical_name, professor, faculty")
      .eq("id", courseId)
      .single();

    if (courseError) {
      console.error(courseError);
    } else {
      setCourse(courseData);
    }

    await loadPastExams();

    setLoading(false);
  }

  async function loadPastExams() {
    const { data, error } = await supabase
      .from("past_exams")
      .select(
        "id, course_id, user_id, academic_year, exam_type, title, image_path, created_at"
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setPastExams(data ?? []);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage("JPEG・PNG・WebP形式の画像を選択してください。");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage("画像は10MB以下にしてください。");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage("過去問を投稿するにはログインしてください。");
      return;
    }

    if (!file) {
      setMessage("画像を選択してください。");
      return;
    }

    if (!academicYear) {
      setMessage("年度を入力してください。");
      return;
    }

    const year = Number(academicYear);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > new Date().getFullYear() + 1
    ) {
      setMessage("年度を正しく入力してください。");
      return;
    }

    setUploading(true);
    setMessage("");

    let uploadedPath: string | null = null;

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeExtension =
        extension === "jpeg" || extension === "jpg"
          ? "jpg"
          : extension === "png"
          ? "png"
          : extension === "webp"
          ? "webp"
          : "jpg";

      const fileName = `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

      const imagePath = `${userId}/${courseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("past-exams")
        .upload(imagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPath = imagePath;

      const { error: insertError } = await supabase.from("past_exams").insert({
        course_id: courseId,
        user_id: userId,
        academic_year: year,
        exam_type: examType,
        title: title.trim() || null,
        image_path: imagePath,
      });

      if (insertError) {
        throw insertError;
      }

      setTitle("");
      setExamType("期末試験");
      setFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(null);

      const fileInput = document.getElementById(
        "past-exam-file"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setMessage("過去問を投稿しました。");

      await loadPastExams();
    } catch (error) {
      console.error(error);

      // DB登録に失敗した場合は、
      // 先にアップロードした画像をStorageから削除する
      if (uploadedPath) {
        await supabase.storage.from("past-exams").remove([uploadedPath]);
      }

      setMessage("投稿に失敗しました。もう一度試してください。");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(exam: PastExam) {
    if (!userId || exam.user_id !== userId) return;

    const confirmed = window.confirm(
      "この過去問を削除しますか？この操作は取り消せません。"
    );

    if (!confirmed) return;

    setMessage("");

    const { error: storageError } = await supabase.storage
      .from("past-exams")
      .remove([exam.image_path]);

    if (storageError) {
      console.error(storageError);
      setMessage("画像の削除に失敗しました。");
      return;
    }

    const { error: databaseError } = await supabase
      .from("past_exams")
      .delete()
      .eq("id", exam.id)
      .eq("user_id", userId);

    if (databaseError) {
      console.error(databaseError);
      setMessage(
        "投稿情報の削除に失敗しました。画像は削除されている可能性があります。"
      );
      return;
    }

    setMessage("過去問を削除しました.");

    await loadPastExams();
  }

  function getPublicImageUrl(imagePath: string) {
    const { data } = supabase.storage
      .from("past-exams")
      .getPublicUrl(imagePath);

    return data.publicUrl;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 text-slate-500">
          読み込み中...
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h1 className="text-2xl font-bold text-slate-900">
            授業が見つかりません
          </h1>

          <Link
            href="/courses"
            className="mt-6 inline-block font-semibold text-blue-600 hover:underline"
          >
            ← 授業一覧へ戻る
          </Link>
        </div>
      </main>
    );
  }

  const displayName = course.canonical_name || course.name;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-950"
          >
            慶應Wiki
          </Link>

          <Link
            href={`/courses/${courseId}`}
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            授業詳細へ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        {/* COURSE */}
        <section>
          <Link
            href={`/courses/${courseId}`}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← 授業詳細
          </Link>

          <p className="mt-7 text-xs font-bold tracking-widest text-blue-600">
            PAST EXAMS
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {displayName}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {course.professor && <span>{course.professor}</span>}
            {course.faculty && <span>{course.faculty}</span>}
          </div>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">過去問</h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            この授業の過去問を確認・共有できます。
          </p>
        </section>

        {/* NOTICE */}
        <section className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-900">投稿する前に</p>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            自分が共有する権利を持つ資料のみ投稿してください。
            著作権や授業・大学のルールに反する資料、個人情報が写っている画像は投稿しないでください。
          </p>
        </section>

        {/* UPLOAD */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                SHARE
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                過去問を投稿する
              </h2>
            </div>

            {!userId && (
              <Link
                href="/login"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                ログイン
              </Link>
            )}
          </div>

          {userId ? (
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* YEAR */}
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">年度</span>

                  <input
                    type="number"
                    value={academicYear}
                    onChange={(event) => setAcademicYear(event.target.value)}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                {/* TYPE */}
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    試験の種類
                  </span>

                  <select
                    value={examType}
                    onChange={(event) => setExamType(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="期末試験">期末試験</option>
                    <option value="中間試験">中間試験</option>
                    <option value="小テスト">小テスト</option>
                    <option value="その他">その他</option>
                  </select>
                </label>
              </div>

              {/* TITLE */}
              <label className="mt-5 block">
                <span className="text-sm font-bold text-slate-700">
                  タイトル
                  <span className="ml-2 font-normal text-slate-400">任意</span>
                </span>

                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={100}
                  placeholder="例：2025年度 期末試験"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              {/* FILE */}
              <div className="mt-5">
                <p className="text-sm font-bold text-slate-700">過去問の画像</p>

                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
                  <div>
                    <p className="font-bold text-slate-800">
                      写真を選択
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      JPEG / PNG / WebP・10MBまで
                    </p>
                  </div>

                  <input
                    id="past-exam-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* PREVIEW */}
              {previewUrl && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-bold text-slate-700">
                    プレビュー
                  </p>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={previewUrl}
                      alt="投稿する過去問のプレビュー"
                      className="max-h-[500px] w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {message && (
                <p className="mt-5 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "投稿中..." : "過去問を投稿する"}
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-lg bg-slate-50 p-5">
              <p className="text-sm leading-6 text-slate-600">
                過去問を投稿するにはログインが必要です。
              </p>
            </div>
          )}
        </section>

        {/* LIST */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400">
                ARCHIVE
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                投稿された過去問
              </h2>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              {pastExams.length}件
            </p>
          </div>

          {pastExams.length === 0 ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="font-bold text-slate-800">
                まだ過去問がありません
              </p>

              <p className="mt-2 text-sm text-slate-500">
                最初の過去問を共有してみましょう。
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pastExams.map((exam) => {
                const imageUrl = getPublicImageUrl(exam.image_path);

                return (
                  <article
                    key={exam.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-slate-100"
                    >
                      <img
                        src={imageUrl}
                        alt={exam.title || "過去問"}
                        loading="lazy"
                        className="h-64 w-full object-cover transition hover:opacity-90"
                      />
                    </a>

                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        {exam.academic_year && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                            {exam.academic_year}年度
                          </span>
                        )}

                        {exam.exam_type && (
                          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                            {exam.exam_type}
                          </span>
                        )}
                      </div>

                      {exam.title && (
                        <h3 className="mt-3 font-bold text-slate-900">
                          {exam.title}
                        </h3>
                      )}

                      <p className="mt-3 text-xs text-slate-400">
                        {new Date(exam.created_at).toLocaleDateString("ja-JP")}
                      </p>

                      <div className="mt-4 flex items-center gap-4">
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-blue-600 hover:underline"
                        >
                          大きく見る
                        </a>

                        {userId === exam.user_id && (
                          <button
                            type="button"
                            onClick={() => handleDelete(exam)}
                            className="text-sm font-bold text-red-500 hover:underline"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}