"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type EvaluationNote = {
  id: number;
  course_id: number;
  user_id: string;
  comment: string;
  created_at: string;
};

type Props = {
  courseId: number;
};

export default function EvaluationNotes({
  courseId,
}: Props) {
  const [notes, setNotes] = useState<EvaluationNote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(
    null
  );
  const [editingComment, setEditingComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id ?? null);

    const { data, error } = await supabase
      .from("course_evaluation_notes")
      .select(`
        id,
        course_id,
        user_id,
        comment,
        created_at
      `)
      .eq("course_id", courseId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setErrorMessage(
        "履修者からの情報を読み込めませんでした。"
      );
      setNotes([]);
    } else {
      setNotes((data ?? []) as EvaluationNote[]);
    }

    setLoading(false);
  }

  async function submitNote() {
    const trimmedComment = comment.trim();

    if (!userId) {
      setErrorMessage(
        "投稿するにはログインが必要です。"
      );
      return;
    }

    if (!trimmedComment) {
      setErrorMessage(
        "内容を入力してください。"
      );
      return;
    }

    if (trimmedComment.length > 1000) {
      setErrorMessage(
        "1000文字以内で入力してください。"
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("course_evaluation_notes")
      .insert({
        course_id: courseId,
        user_id: userId,
        comment: trimmedComment,
      });

    if (error) {
      console.error(error);
      setErrorMessage(
        "投稿できませんでした。もう一度お試しください。"
      );
      setSubmitting(false);
      return;
    }

    setComment("");
    await loadData();
    setSubmitting(false);
  }

  function startEditing(note: EvaluationNote) {
    setEditingId(note.id);
    setEditingComment(note.comment);
    setErrorMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingComment("");
  }

  async function saveEdit(noteId: number) {
    const trimmedComment = editingComment.trim();

    if (!trimmedComment) {
      setErrorMessage(
        "内容を入力してください。"
      );
      return;
    }

    if (trimmedComment.length > 1000) {
      setErrorMessage(
        "1000文字以内で入力してください。"
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("course_evaluation_notes")
      .update({
        comment: trimmedComment,
      })
      .eq("id", noteId);

    if (error) {
      console.error(error);
      setErrorMessage(
        "編集内容を保存できませんでした。"
      );
      setSubmitting(false);
      return;
    }

    setEditingId(null);
    setEditingComment("");

    await loadData();
    setSubmitting(false);
  }

  async function deleteNote(noteId: number) {
    const confirmed = window.confirm(
      "この投稿を削除しますか？"
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    const { error } = await supabase
      .from("course_evaluation_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      console.error(error);
      setErrorMessage(
        "投稿を削除できませんでした。"
      );
      return;
    }

    await loadData();
  }

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(new Date(dateString));
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-600">
            STUDENT NOTES
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-900">
            履修者からの情報
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            実際に履修した人から、評価方法についての補足情報を共有できます。
          </p>
        </div>

        {!loading && (
          <span className="text-sm text-slate-400">
            {notes.length}件
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="mt-5 rounded-lg bg-slate-50 px-5 py-6 text-sm text-slate-500">
          読み込んでいます...
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-5 rounded-lg bg-slate-50 px-5 py-6">
          <p className="text-sm font-semibold text-slate-700">
            まだ履修者からの情報はありません。
          </p>

          <p className="mt-1 text-sm text-slate-500">
            履修したことがある人は、評価方法についての情報を共有してみてください。
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {notes.map((note) => {
            const isOwner = userId === note.user_id;
            const isEditing = editingId === note.id;

            return (
              <article
                key={note.id}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                {isEditing ? (
                  <>
                    <textarea
                      value={editingComment}
                      onChange={(event) =>
                        setEditingComment(
                          event.target.value
                        )
                      }
                      maxLength={1000}
                      rows={5}
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <div className="mt-2 text-right text-xs text-slate-400">
                      {editingComment.length} / 1000
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={submitting}
                        className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        キャンセル
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveEdit(note.id)
                        }
                        disabled={submitting}
                        className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                      {note.comment}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-400">
                        {formatDate(note.created_at)}
                      </span>

                      {isOwner && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(note)
                            }
                            className="text-xs font-semibold text-slate-500 transition hover:text-blue-600"
                          >
                            編集
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteNote(note.id)
                            }
                            className="text-xs font-semibold text-slate-400 transition hover:text-red-600"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* 投稿欄 */}
      <div className="mt-6">
        {userId ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-sm font-bold text-slate-800">
              評価方法について補足する
            </label>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              試験、レポート、出席、持ち込み可否など、履修者に役立つ情報を書いてください。
            </p>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              maxLength={1000}
              rows={5}
              placeholder="例：昨年度は期末試験70%、レポート30%でした。期末試験は持ち込み不可でした。"
              className="mt-4 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                {comment.length} / 1000
              </span>

              <button
                type="button"
                onClick={submitNote}
                disabled={
                  submitting ||
                  !comment.trim()
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "投稿中..."
                  : "投稿する"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-sm font-semibold text-slate-700">
              情報を投稿するにはログインが必要です。
            </p>

            <Link
              href="/login"
              className="mt-3 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              ログイン
            </Link>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        履修者からの情報は公式情報ではありません。年度や担当教員によって評価方法が変更される場合があります。
      </p>
    </div>
  );
}