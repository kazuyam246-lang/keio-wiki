"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;

  const [name, setName] = useState("");
  const [professor, setProfessor] = useState("");
  const [faculty, setFaculty] = useState("");
  const [campus, setCampus] = useState("");
  const [semester, setSemester] = useState("");
  const [weekday, setWeekday] = useState("");
  const [period, setPeriod] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================
  // 授業情報を取得
  // =========================
  useEffect(() => {
    async function loadCourse() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, name, professor, faculty, campus, semester, weekday, period, description, user_id"
        )
        .eq("id", courseId)
        .single();

      if (error || !data) {
        alert("授業情報を取得できませんでした");
        window.location.href = "/courses";
        return;
      }

      // 自分が追加した授業か確認
      if (data.user_id !== user.id) {
        alert("この授業は編集できません");
        window.location.href = `/courses/${courseId}`;
        return;
      }

      setName(data.name ?? "");
      setProfessor(data.professor ?? "");
      setFaculty(data.faculty ?? "");
      setCampus(data.campus ?? "");
      setSemester(data.semester ?? "");
      setWeekday(data.weekday ?? "");
      setPeriod(
        data.period ? String(data.period) : ""
      );
      setDescription(data.description ?? "");

      setLoading(false);
    }

    loadCourse();
  }, [courseId]);

  // =========================
  // 変更を保存
  // =========================
  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedProfessor = professor.trim();
    const trimmedDescription = description.trim();

    if (
      !trimmedName ||
      !trimmedProfessor ||
      !faculty ||
      !campus ||
      !semester ||
      !weekday ||
      !period ||
      !trimmedDescription
    ) {
      alert("すべての項目を入力してください");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("ログインが必要です");
      window.location.href = "/login";
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("courses")
      .update({
        name: trimmedName,
        professor: trimmedProfessor,
        faculty,
        campus,
        semester,
        weekday,
        period: Number(period),
        description: trimmedDescription,
      })
      .eq("id", courseId)
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      alert(
        "更新に失敗しました：" +
          error.message
      );
      return;
    }

    alert("授業情報を更新しました！");

    window.location.href =
      `/courses/${courseId}`;
  }

  // =========================
  // ローディング
  // =========================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          授業情報を読み込んでいます...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* =========================
          HEADER
      ========================= */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="font-bold tracking-tight text-slate-950"
          >
            慶應wiki
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/mypage"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:block"
            >
              マイページ
            </Link>

            <Link
              href={`/courses/${courseId}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← 授業詳細へ
            </Link>
          </div>
        </div>
      </header>

      {/* =========================
          MAIN
      ========================= */}
      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-4xl">
          {/* タイトル */}
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-600">
              EDIT COURSE
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              授業を編集
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              登録した授業情報を修正できます。
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {/* =========================
                基本情報
            ========================= */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  BASIC
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  基本情報
                </h2>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* 授業名 */}
                <div>
                  <label
                    htmlFor="course-name"
                    className="block text-sm font-semibold"
                  >
                    授業名
                  </label>

                  <input
                    id="course-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* 教員名 */}
                <div>
                  <label
                    htmlFor="professor"
                    className="block text-sm font-semibold"
                  >
                    教員名
                  </label>

                  <input
                    id="professor"
                    type="text"
                    value={professor}
                    onChange={(event) =>
                      setProfessor(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </section>

            {/* =========================
                授業情報
            ========================= */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  COURSE INFO
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  授業情報
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  学部・キャンパス・開講時期を変更できます。
                </p>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* 学部 */}
                <div>
                  <label
                    htmlFor="faculty"
                    className="block text-sm font-semibold"
                  >
                    学部
                  </label>

                  <select
                    id="faculty"
                    value={faculty}
                    onChange={(event) =>
                      setFaculty(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="文学部">
                      文学部
                    </option>
                    <option value="経済学部">
                      経済学部
                    </option>
                    <option value="法学部">
                      法学部
                    </option>
                    <option value="商学部">
                      商学部
                    </option>
                    <option value="医学部">
                      医学部
                    </option>
                    <option value="理工学部">
                      理工学部
                    </option>
                    <option value="総合政策学部">
                      総合政策学部
                    </option>
                    <option value="環境情報学部">
                      環境情報学部
                    </option>
                    <option value="看護医療学部">
                      看護医療学部
                    </option>
                    <option value="薬学部">
                      薬学部
                    </option>
                  </select>
                </div>

                {/* キャンパス */}
                <div>
                  <label
                    htmlFor="campus"
                    className="block text-sm font-semibold"
                  >
                    キャンパス
                  </label>

                  <select
                    id="campus"
                    value={campus}
                    onChange={(event) =>
                      setCampus(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="日吉">
                      日吉
                    </option>
                    <option value="三田">
                      三田
                    </option>
                    <option value="矢上">
                      矢上
                    </option>
                    <option value="湘南藤沢">
                      湘南藤沢
                    </option>
                    <option value="信濃町">
                      信濃町
                    </option>
                    <option value="芝共立">
                      芝共立
                    </option>
                  </select>
                </div>

                {/* 学期 */}
                <div>
                  <label
                    htmlFor="semester"
                    className="block text-sm font-semibold"
                  >
                    学期
                  </label>

                  <select
                    id="semester"
                    value={semester}
                    onChange={(event) =>
                      setSemester(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="春学期">
                      春学期
                    </option>
                    <option value="秋学期">
                      秋学期
                    </option>
                  </select>
                </div>

                {/* 曜日 */}
                <div>
                  <label
                    htmlFor="weekday"
                    className="block text-sm font-semibold"
                  >
                    曜日
                  </label>

                  <select
                    id="weekday"
                    value={weekday}
                    onChange={(event) =>
                      setWeekday(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="月">
                      月曜日
                    </option>
                    <option value="火">
                      火曜日
                    </option>
                    <option value="水">
                      水曜日
                    </option>
                    <option value="木">
                      木曜日
                    </option>
                    <option value="金">
                      金曜日
                    </option>
                    <option value="土">
                      土曜日
                    </option>
                  </select>
                </div>

                {/* 時限 */}
                <div>
                  <label
                    htmlFor="period"
                    className="block text-sm font-semibold"
                  >
                    時限
                  </label>

                  <select
                    id="period"
                    value={period}
                    onChange={(event) =>
                      setPeriod(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="1">
                      1限
                    </option>
                    <option value="2">
                      2限
                    </option>
                    <option value="3">
                      3限
                    </option>
                    <option value="4">
                      4限
                    </option>
                    <option value="5">
                      5限
                    </option>
                    <option value="6">
                      6限
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* =========================
                授業説明
            ========================= */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  ABOUT
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  授業について
                </h2>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold"
                >
                  授業説明
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={6}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-sm leading-7 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-slate-400">
                    {description.length}文字
                  </span>
                </div>
              </div>
            </section>

            {/* =========================
                保存ボタン
            ========================= */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/courses/${courseId}`}
                className="text-center text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                キャンセル
              </Link>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "保存中..."
                  : "変更を保存"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}