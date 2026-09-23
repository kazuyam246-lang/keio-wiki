"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type DescriptionNote = {
  id: number;
  course_id: number;
  user_id: string;
  comment: string;
  created_at: string;
};

type Props = {
  courseId: number;
};

export default function DescriptionNotes({
  courseId,
}: Props) {
  const [notes, setNotes] = useState<DescriptionNote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState("");

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id ?? null);

    const { data, error } = await supabase
      .from("course_description_notes")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    } else {
      setNotes(data ?? []);
    }

    setLoading(false);
  }

  async function handleSubmit() {
    const trimmed = comment.trim();

    if (!userId) {
      alert("投稿するにはログインが必要です。");
      return;
    }

    if (!trimmed) {
      alert("内容を入力してください。");
      return;
    }

    if (trimmed.length > 1000) {
      alert("1000文字以内で入力してください。");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("course_description_notes")
      .insert({
        course_id: courseId,
        user_id: userId,
        comment: trimmed,
      });

    if (error) {
      console.error(error);
      alert("投稿に失敗しました。");
      setSubmitting(false);
      return;
    }

    setComment("");
    await loadData();
    setSubmitting(false);
  }

  function startEdit(note: DescriptionNote) {
    setEditingId(note.id);
    setEditingComment(note.comment);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingComment("");
  }

  async function saveEdit(noteId: number) {
    if (!userId) {
      return;
    }

    const trimmed = editingComment.trim();

    if (!trimmed) {
      alert("内容を入力してください。");
      return;
    }

    if (trimmed.length > 1000) {
      alert("1000文字以内で入力してください。");
      return;
    }

    const { error } = await supabase
      .from("course_description_notes")
      .update({
        comment: trimmed,
      })
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      alert("編集に失敗しました。");
      return;
    }

    setEditingId(null);
    setEditingComment("");

    await loadData();
  }

  async function deleteNote(noteId: number) {
    if (!userId) {
      return;
    }

    const confirmed = window.confirm(
      "この投稿を削除しますか？"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("course_description_notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      alert("削除に失敗しました。");
      return;
    }

    await loadData();
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(new Date(value));
  }

  return (
    <div className="mt-7 border-t border-slate-200 pt-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            履修者からの情報
          </span>

          {notes.length > 0 && (
            <span className="text-xs text-slate-400">
              {notes.length}件
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          実際に履修した人から、授業の雰囲気や進め方などを補足できます。
        </p>
      </div>

      {loading ? (
        <div className="mt-5 rounded-lg bg-slate-50 px-5 py-6">
          <p className="text-sm text-slate-400">
            読み込み中...
          </p>
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-5 rounded-lg bg-slate-50 px-5 py-6">
          <p className="text-sm text-slate-500">
            まだ履修者からの情報はありません。
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {notes.map((note) => {
            const isOwner =
              userId === note.user_id;

            const isEditing =
              editingId === note.id;

            return (
              <div
                key={note.id}
                className="rounded-lg border border-slate-200 bg-white px-5 py-4"
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
                      rows={4}
                      className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        キャンセル
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveEdit(note.id)
                        }
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
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

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        {formatDate(
                          note.created_at
                        )}
                      </span>

                      {isOwner && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(note)
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
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        {userId ? (
          <>
            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              maxLength={1000}
              rows={4}
              placeholder="例：ディスカッション中心の授業です。毎週グループワークがありました。"
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                {comment.length} / 1000
              </span>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !comment.trim()
                }
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? "投稿中..."
                  : "情報を追加する"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-600">
              授業について書き込むにはログインしてください。
            </p>

            <Link
              href="/login"
              className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ログインする →
            </Link>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        履修者からの情報は公式情報ではありません。年度や担当教員によって授業内容が異なる場合があります。
      </p>
    </div>
  );
}