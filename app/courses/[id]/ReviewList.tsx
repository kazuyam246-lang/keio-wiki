"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";
import { supabase } from "../../../lib/supabase";

type Review = {
  id: number;
  professor: string;
  rating: number;
  easy_s: number | null;
  workload: number | null;
  comment: string;
  grade: string | null;
  created_at: string;
  likes: number;
  user_id: string | null;
};

type ReviewListProps = {
  reviews: Review[];
};

type SortType =
  | "new"
  | "popular"
  | "rating"
  | "easy_s"
  | "workload_low";

const gradeFilters = [
  "すべて",
  "S",
  "A",
  "B",
  "C",
  "D",
];

export default function ReviewList({
  reviews,
}: ReviewListProps) {
  const [selectedGrade, setSelectedGrade] =
    useState("すべて");

  const [sortType, setSortType] =
    useState<SortType>("new");

  const [searchText, setSearchText] =
    useState("");

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(null);

  const [
    editingReviewId,
    setEditingReviewId,
  ] = useState<number | null>(null);

  // 編集用
  const [editRating, setEditRating] =
    useState("");

  const [editEasyS, setEditEasyS] =
    useState("");

  const [
    editWorkload,
    setEditWorkload,
  ] = useState("");

  const [editGrade, setEditGrade] =
    useState("");

  const [
    editComment,
    setEditComment,
  ] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(
        user?.id ?? null
      );
    }

    loadUser();
  }, []);

  // 編集開始
  function startEditing(
    review: Review
  ) {
    setEditingReviewId(review.id);

    setEditRating(
      String(review.rating)
    );

    setEditEasyS(
      review.easy_s !== null
        ? String(review.easy_s)
        : ""
    );

    setEditWorkload(
      review.workload !== null
        ? String(review.workload)
        : ""
    );

    setEditGrade(
      review.grade ?? ""
    );

    setEditComment(
      review.comment
    );
  }

  // 削除
  async function handleDelete(
    reviewId: number
  ) {
    const ok = window.confirm(
      "この体験記を削除しますか？"
    );

    if (!ok) return;

    if (!currentUserId) {
      alert("ログインが必要です");
      return;
    }

    const { error } =
      await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq(
          "user_id",
          currentUserId
        );

    if (error) {
      alert(
        "削除できませんでした：" +
          error.message
      );
      return;
    }

    window.location.reload();
  }

  // 更新
  async function handleUpdate(
    reviewId: number
  ) {
    if (
      !editRating ||
      !editEasyS ||
      !editWorkload ||
      !editGrade ||
      !editComment.trim()
    ) {
      alert(
        "すべての項目を入力してください"
      );
      return;
    }

    if (!currentUserId) {
      alert("ログインが必要です");
      return;
    }

    const { error } =
      await supabase
        .from("reviews")
        .update({
          rating:
            Number(editRating),

          easy_s:
            Number(editEasyS),

          workload:
            Number(editWorkload),

          grade:
            editGrade,

          comment:
            editComment.trim(),
        })
        .eq("id", reviewId)
        .eq(
          "user_id",
          currentUserId
        );

    if (error) {
      alert(
        "更新できませんでした：" +
          error.message
      );
      return;
    }

    setEditingReviewId(null);

    window.location.reload();
  }

  // フィルター・検索
  const filteredReviews =
    reviews.filter((review) => {
      const matchesGrade =
        selectedGrade === "すべて" ||
        review.grade ===
          selectedGrade;

      const keyword =
        searchText
          .trim()
          .toLowerCase();

      const matchesSearch =
        keyword === "" ||
        review.professor
          .toLowerCase()
          .includes(keyword) ||
        review.comment
          .toLowerCase()
          .includes(keyword);

      return (
        matchesGrade &&
        matchesSearch
      );
    });

  // 並び替え
  const sortedReviews = [
    ...filteredReviews,
  ].sort((a, b) => {
    // 人気順
    if (sortType === "popular") {
      return (
        (b.likes ?? 0) -
        (a.likes ?? 0)
      );
    }

    // 単位が取りやすい順
    if (sortType === "rating") {
      return (
        b.rating -
        a.rating
      );
    }

    // Sが取りやすい順
    if (sortType === "easy_s") {
      if (
        a.easy_s === null &&
        b.easy_s === null
      ) {
        return 0;
      }

      if (a.easy_s === null) {
        return 1;
      }

      if (b.easy_s === null) {
        return -1;
      }

      return (
        b.easy_s -
        a.easy_s
      );
    }

    // 課題が少ない順
    if (
      sortType ===
      "workload_low"
    ) {
      if (
        a.workload === null &&
        b.workload === null
      ) {
        return 0;
      }

      if (
        a.workload === null
      ) {
        return 1;
      }

      if (
        b.workload === null
      ) {
        return -1;
      }

      return (
        a.workload -
        b.workload
      );
    }

    // 新着順
    return (
      new Date(
        b.created_at
      ).getTime() -
      new Date(
        a.created_at
      ).getTime()
    );
  });

  return (
    <>
      {/* 検索 */}
      <div className="mt-6">
        <input
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
          placeholder="体験記を検索"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* 成績フィルター */}
      <div className="mt-4 flex flex-wrap gap-2">
        {gradeFilters.map(
          (grade) => (
            <button
              key={grade}
              type="button"
              onClick={() =>
                setSelectedGrade(
                  grade
                )
              }
              className={
                selectedGrade ===
                grade
                  ? "rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              }
            >
              {grade}
            </button>
          )
        )}
      </div>

      {/* 並び替え */}
      <div className="mt-4 flex flex-wrap gap-2">
        <SortButton
          active={
            sortType === "new"
          }
          onClick={() =>
            setSortType("new")
          }
        >
          新着順
        </SortButton>

        <SortButton
          active={
            sortType ===
            "popular"
          }
          onClick={() =>
            setSortType(
              "popular"
            )
          }
        >
          人気順
        </SortButton>

        <SortButton
          active={
            sortType ===
            "rating"
          }
          onClick={() =>
            setSortType(
              "rating"
            )
          }
        >
          単位が取りやすい順
        </SortButton>

        <SortButton
          active={
            sortType ===
            "easy_s"
          }
          onClick={() =>
            setSortType(
              "easy_s"
            )
          }
        >
          Sが取りやすい順
        </SortButton>

        <SortButton
          active={
            sortType ===
            "workload_low"
          }
          onClick={() =>
            setSortType(
              "workload_low"
            )
          }
        >
          課題が少ない順
        </SortButton>
      </div>

      {/* 件数 */}
      <p className="mt-4 text-sm text-slate-500">
        {sortedReviews.length}
        件の体験記を表示
      </p>

      {/* 0件 */}
      {sortedReviews.length ===
        0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          条件に一致する体験記はありません。
        </div>
      )}

      {/* 体験記一覧 */}
      <div className="mt-5 space-y-4">
        {sortedReviews.map(
          (review) => {
            const isEditing =
              editingReviewId ===
              review.id;

            return (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                {!isEditing ? (
                  <>
                    {/* 先生名・日付 */}
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-slate-900">
                        {
                          review.professor
                        }
                      </p>

                      <time className="shrink-0 text-sm text-slate-400">
                        {new Date(
                          review.created_at
                        ).toLocaleDateString(
                          "ja-JP"
                        )}
                      </time>
                    </div>

                    {/* 評価 + 最終成績 */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ReviewScore
                        label="単位"
                        value={
                          review.rating
                        }
                      />

                      {review.easy_s !==
                        null && (
                        <ReviewScore
                          label="S"
                          value={
                            review.easy_s
                          }
                        />
                      )}

                      {review.workload !==
                        null && (
                        <ReviewScore
                          label="課題"
                          value={
                            review.workload
                          }
                        />
                      )}

                      {/* 最終成績を強調 */}
                      {review.grade && (
                        <div className="ml-1 flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">
                            最終成績
                          </span>

                          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-base font-bold text-white">
                            {
                              review.grade
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {/* コメント */}
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="whitespace-pre-wrap text-base leading-7 text-slate-800">
                        {
                          review.comment
                        }
                      </p>
                    </div>

                    {/* 下部 */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      {/* いいね */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            !currentUserId
                          ) {
                            alert(
                              "いいねするにはログインが必要です"
                            );
                            return;
                          }

                          const {
                            error,
                          } =
                            await supabase.rpc(
                              "toggle_review_like",
                              {
                                p_review_id:
                                  review.id,
                              }
                            );

                          if (error) {
                            alert(
                              "いいねに失敗しました：" +
                                error.message
                            );
                            return;
                          }

                          window.location.reload();
                        }}
                        className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        👍{" "}
                        {review.likes ??
                          0}
                      </button>

                      {/* 自分の投稿 */}
                      {currentUserId ===
                        review.user_id && (
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                review
                              )
                            }
                            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                          >
                            編集
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                review.id
                              )
                            }
                            className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* 編集フォーム */
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-bold text-slate-900">
                        体験記を編集
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingReviewId(
                            null
                          )
                        }
                        className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                      >
                        キャンセル
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {/* 単位 */}
                      <div>
                        <label className="text-sm font-semibold text-slate-700">
                          単位の取りやすさ
                        </label>

                        <select
                          value={
                            editRating
                          }
                          onChange={(
                            event
                          ) =>
                            setEditRating(
                              event
                                .target
                                .value
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            選択してください
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
                        <label className="text-sm font-semibold text-slate-700">
                          Sの取りやすさ
                        </label>

                        <select
                          value={
                            editEasyS
                          }
                          onChange={(
                            event
                          ) =>
                            setEditEasyS(
                              event
                                .target
                                .value
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            選択してください
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

                      {/* 課題 */}
                      <div>
                        <label className="text-sm font-semibold text-slate-700">
                          課題量
                        </label>

                        <select
                          value={
                            editWorkload
                          }
                          onChange={(
                            event
                          ) =>
                            setEditWorkload(
                              event
                                .target
                                .value
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            選択してください
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

                      {/* 最終成績 */}
                      <div>
                        <label className="text-sm font-semibold text-slate-700">
                          最終成績
                        </label>

                        <select
                          value={
                            editGrade
                          }
                          onChange={(
                            event
                          ) =>
                            setEditGrade(
                              event
                                .target
                                .value
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            選択してください
                          </option>

                          <option value="S">
                            S
                          </option>

                          <option value="A">
                            A
                          </option>

                          <option value="B">
                            B
                          </option>

                          <option value="C">
                            C
                          </option>

                          <option value="D">
                            D
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* コメント */}
                    <div className="mt-4">
                      <label className="text-sm font-semibold text-slate-700">
                        体験記
                      </label>

                      <textarea
                        value={
                          editComment
                        }
                        onChange={(
                          event
                        ) =>
                          setEditComment(
                            event
                              .target
                              .value
                          )
                        }
                        rows={5}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdate(
                            review.id
                          )
                        }
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        変更を保存
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingReviewId(
                            null
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          }
        )}
      </div>
    </>
  );
}

// 評価バッジ
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

// 並び替えボタン
function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      }
    >
      {children}
    </button>
  );
}