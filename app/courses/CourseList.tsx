"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Course = {
  id: number;
  name: string;
  professor: string;
  description: string | null;
  faculty: string | null;
  weekday: string | null;
  period: number | null;
  campus: string | null;
  semester: string | null;
  level: string | null;
  source: string | null;
  syllabus_url: string | null;
  review_count: number;
  avg_rating: number | null;
  avg_easy_s: number | null;
  avg_workload: number | null;
  total_count: number;
};

type SortType =
  | "default"
  | "reviews"
  | "rating"
  | "easy_s"
  | "workload_low"
  | "workload_high";

const PAGE_SIZE = 20;

const campuses = [
  "三田",
  "日吉",
  "湘南藤沢",
  "矢上",
  "信濃町",
  "芝共立",
];

const weekdays = [
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
];

const periods = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
];

const levels = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
];

const semesters = [
  "春",
  "秋",
  "通年",
  "春(学期前半)",
  "春(学期後半)",
  "秋(学期前半)",
  "秋(学期後半)",
  "春集中(特定期間集中)",
  "秋集中(特定期間集中)",
];

export default function CourseList() {
  const [courses, setCourses] =
    useState<Course[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
   * 検索
   */
  const [searchInput, setSearchInput] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  /*
   * 絞り込み
   */
  const [
    selectedFaculty,
    setSelectedFaculty,
  ] = useState("");

  const [
    selectedCampus,
    setSelectedCampus,
  ] = useState("");

  const [
    selectedWeekday,
    setSelectedWeekday,
  ] = useState("");

  const [
    selectedSemester,
    setSelectedSemester,
  ] = useState("");

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] = useState("");

  const [
    selectedLevel,
    setSelectedLevel,
  ] = useState("");

  /*
   * 並び替え
   */
  const [sortType, setSortType] =
    useState<SortType>("default");

  /*
   * ページ
   */
  const [page, setPage] =
    useState(1);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

  /*
   * Supabaseから授業を取得
   *
   * 25,000件すべてを取得せず、
   * 検索条件に合う20件だけ取得する。
   */
  const fetchCourses =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } =
        await supabase.rpc(
          "search_courses",
          {
            p_search: searchText,

            p_faculty:
              selectedFaculty,

            p_campus:
              selectedCampus,

            p_weekday:
              selectedWeekday,

            p_semester:
              selectedSemester,

            p_period:
              selectedPeriod
                ? Number(
                    selectedPeriod
                  )
                : null,

            p_level:
              selectedLevel,

            p_sort:
              sortType,

            p_page:
              page,

            p_page_size:
              PAGE_SIZE,
          }
        );

      if (error) {
        console.error(error);

        setCourses([]);
        setTotalCount(0);
        setErrorMessage(
          error.message
        );

        setLoading(false);
        return;
      }

      const rows =
        (data ?? []) as Course[];

      setCourses(rows);

      if (rows.length > 0) {
        setTotalCount(
          Number(
            rows[0].total_count ??
              0
          )
        );
      } else {
        setTotalCount(0);
      }

      setLoading(false);
    }, [
      searchText,
      selectedFaculty,
      selectedCampus,
      selectedWeekday,
      selectedSemester,
      selectedPeriod,
      selectedLevel,
      sortType,
      page,
    ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  /*
   * 検索欄
   *
   * 入力するたびに即検索せず、
   * 400ms待ってから検索する。
   */
  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setPage(1);

        setSearchText(
          searchInput.trim()
        );
      }, 400);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [searchInput]);

  /*
   * リセット
   */
  function resetFilters() {
    setSearchInput("");
    setSearchText("");

    setSelectedFaculty("");
    setSelectedCampus("");
    setSelectedWeekday("");
    setSelectedSemester("");
    setSelectedPeriod("");
    setSelectedLevel("");

    setSortType("default");

    setPage(1);
  }

  /*
   * 各フィルター変更
   */
  function changeFaculty(
    value: string
  ) {
    setSelectedFaculty(value);
    setPage(1);
  }

  function changeCampus(
    value: string
  ) {
    setSelectedCampus(value);
    setPage(1);
  }

  function changeWeekday(
    value: string
  ) {
    setSelectedWeekday(value);
    setPage(1);
  }

  function changeSemester(
    value: string
  ) {
    setSelectedSemester(value);
    setPage(1);
  }

  function changePeriod(
    value: string
  ) {
    setSelectedPeriod(value);
    setPage(1);
  }

  function changeLevel(
    value: string
  ) {
    setSelectedLevel(value);
    setPage(1);
  }

  function changeSort(
    value: SortType
  ) {
    setSortType(value);
    setPage(1);
  }

  /*
   * 総ページ数
   */
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount / PAGE_SIZE
      )
    );

  const selectClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <>
      {/* =========================
          検索・絞り込み
      ========================= */}
      <div className="mt-8">
        {/* 授業名・教員名検索 */}
        <input
          type="text"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(
              event.target.value
            )
          }
          placeholder="授業名や教員名で検索"
          className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {/* =========================
            絞り込み
        ========================= */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* 学部・研究科 */}
          <input
            type="text"
            value={
              selectedFaculty
            }
            onChange={(event) =>
              changeFaculty(
                event.target.value
              )
            }
            placeholder="学部・研究科"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {/* キャンパス */}
          <select
            value={
              selectedCampus
            }
            onChange={(event) =>
              changeCampus(
                event.target.value
              )
            }
            className={
              selectClass
            }
          >
            <option value="">
              すべてのキャンパス
            </option>

            {campuses.map(
              (campus) => (
                <option
                  key={campus}
                  value={campus}
                >
                  {campus}
                </option>
              )
            )}
          </select>

          {/* 学年 */}
          <select
            value={
              selectedLevel
            }
            onChange={(event) =>
              changeLevel(
                event.target.value
              )
            }
            className={
              selectClass
            }
          >
            <option value="">
              すべての学年
            </option>

            {levels.map(
              (level) => (
                <option
                  key={level}
                  value={level}
                >
                  {level}年
                </option>
              )
            )}
          </select>

          {/* 曜日 */}
          <select
            value={
              selectedWeekday
            }
            onChange={(event) =>
              changeWeekday(
                event.target.value
              )
            }
            className={
              selectClass
            }
          >
            <option value="">
              すべての曜日
            </option>

            {weekdays.map(
              (weekday) => (
                <option
                  key={weekday}
                  value={weekday}
                >
                  {weekday}曜日
                </option>
              )
            )}
          </select>

          {/* 学期 */}
          <select
            value={
              selectedSemester
            }
            onChange={(event) =>
              changeSemester(
                event.target.value
              )
            }
            className={
              selectClass
            }
          >
            <option value="">
              すべての学期
            </option>

            {semesters.map(
              (semester) => (
                <option
                  key={semester}
                  value={semester}
                >
                  {semester}
                </option>
              )
            )}
          </select>

          {/* 時限 */}
          <select
            value={
              selectedPeriod
            }
            onChange={(event) =>
              changePeriod(
                event.target.value
              )
            }
            className={
              selectClass
            }
          >
            <option value="">
              すべての時限
            </option>

            {periods.map(
              (period) => (
                <option
                  key={period}
                  value={period}
                >
                  {period}限
                </option>
              )
            )}
          </select>
        </div>

        {/* =========================
            並び替え
        ========================= */}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-semibold text-slate-700">
              並び替え
            </span>

            <select
              value={sortType}
              onChange={(event) =>
                changeSort(
                  event.target
                    .value as SortType
                )
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="default">
                通常順
              </option>

              <option value="reviews">
                レビュー数が多い順
              </option>

              <option value="rating">
                単位が取りやすい順
              </option>

              <option value="easy_s">
                Sが取りやすい順
              </option>

              <option value="workload_low">
                課題が少ない順
              </option>

              <option value="workload_high">
                課題が多い順
              </option>
            </select>
          </div>

          <p className="text-sm text-slate-500">
            <span className="font-bold text-slate-900">
              {totalCount.toLocaleString()}
            </span>
            件の授業
          </p>
        </div>

        {/* リセット */}
        <button
          type="button"
          onClick={
            resetFilters
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          <span>↻</span>
          絞り込み・並び替えをリセット
        </button>
      </div>

      {/* =========================
          エラー
      ========================= */}
      {errorMessage && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="font-semibold text-red-700">
            授業を取得できませんでした
          </p>

          <p className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>
        </div>
      )}

      {/* =========================
          読み込み中
      ========================= */}
      {loading && (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-700">
            授業を読み込んでいます...
          </p>
        </div>
      )}

      {/* =========================
          0件
      ========================= */}
      {!loading &&
        !errorMessage &&
        courses.length ===
          0 && (
          <div className="mt-10 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="font-semibold text-slate-800">
              該当する授業が見つかりません
            </p>

            <p className="mt-2 text-sm text-slate-500">
              検索条件を変更してみてください。
            </p>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="mt-5 font-semibold text-blue-600 hover:text-blue-700"
            >
              条件をリセット
            </button>
          </div>
        )}

      {/* =========================
          授業一覧
      ========================= */}
      {!loading &&
        !errorMessage &&
        courses.length >
          0 && (
          <>
            <div className="mt-8 grid gap-4">
              {courses.map(
                (course) => (
                  <Link
                    key={
                      course.id
                    }
                    href={`/courses/${course.id}`}
                    className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                      {/* 左側 */}
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap gap-2">
                          {/* 公式 */}
                          {course.source ===
                            "keio_syllabus" && (
                            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              公式シラバス
                            </span>
                          )}

                          {/* 学部 */}
                          {course.faculty && (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {
                                course.faculty
                              }
                            </span>
                          )}

                          {/* キャンパス */}
                          {course.campus && (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {
                                course.campus
                              }
                            </span>
                          )}

                          {/* 学年 */}
                          {course.level && (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {
                                course.level
                              }
                              年
                            </span>
                          )}

                          {/* 学期 */}
                          {course.semester && (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {
                                course.semester
                              }
                            </span>
                          )}

                          {/* 曜日・時限 */}
                          {course.weekday &&
                            course.period && (
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {
                                  course.weekday
                                }
                                曜{" "}
                                {
                                  course.period
                                }
                                限
                              </span>
                            )}
                        </div>

                        {/* 授業名 */}
                        <h2 className="text-xl font-bold tracking-tight text-slate-950 transition group-hover:text-blue-600">
                          {
                            course.name
                          }
                        </h2>

                        {/* 教員 */}
                        <p className="mt-1.5 text-sm text-slate-600">
                          {
                            course.professor
                          }
                        </p>

                        {/* 説明 */}
                        {course.description && (
                          <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
                            {
                              course.description
                            }
                          </p>
                        )}
                      </div>

                      {/* =====================
                          評価
                      ===================== */}
                      <div className="flex flex-wrap items-stretch gap-2 lg:flex-nowrap">
                        <CourseStat
                          label="レビュー"
                          value={`${course.review_count}件`}
                        />

                        <CourseStat
                          label="単位"
                          value={
                            course.avg_rating ===
                            null
                              ? "—"
                              : `${Number(
                                  course.avg_rating
                                ).toFixed(
                                  1
                                )} / 5`
                          }
                        />

                        <CourseStat
                          label="Sの取りやすさ"
                          value={
                            course.avg_easy_s ===
                            null
                              ? "—"
                              : `${Number(
                                  course.avg_easy_s
                                ).toFixed(
                                  1
                                )} / 5`
                          }
                        />

                        <CourseStat
                          label="課題量"
                          value={
                            course.avg_workload ===
                            null
                              ? "—"
                              : `${Number(
                                  course.avg_workload
                                ).toFixed(
                                  1
                                )} / 5`
                          }
                        />

                        <div className="flex min-w-10 items-center justify-center pl-2 text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
                          →
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>

            {/* =========================
                ページ送り
            ========================= */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
              <p className="text-sm text-slate-500">
                {totalCount.toLocaleString()}
                件中{" "}
                {(
                  (page - 1) *
                    PAGE_SIZE +
                  1
                ).toLocaleString()}
                〜
                {Math.min(
                  page *
                    PAGE_SIZE,
                  totalCount
                ).toLocaleString()}
                件を表示
              </p>

              <div className="flex items-center gap-2">
                {/* 前へ */}
                <button
                  type="button"
                  disabled={
                    page <= 1
                  }
                  onClick={() => {
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          1,
                          current -
                            1
                        )
                    );

                    window.scrollTo(
                      {
                        top: 0,
                        behavior:
                          "smooth",
                      }
                    );
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← 前へ
                </button>

                {/* ページ番号 */}
                <span className="px-3 text-sm font-semibold text-slate-700">
                  {page} /{" "}
                  {totalPages}
                </span>

                {/* 次へ */}
                <button
                  type="button"
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() => {
                    setPage(
                      (
                        current
                      ) =>
                        Math.min(
                          totalPages,
                          current +
                            1
                        )
                    );

                    window.scrollTo(
                      {
                        top: 0,
                        behavior:
                          "smooth",
                      }
                    );
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  次へ →
                </button>
              </div>
            </div>
          </>
        )}
    </>
  );
}

/*
 * 評価カード
 */
function CourseStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[105px] rounded-lg bg-slate-50 px-4 py-3 text-center">
      <p className="whitespace-nowrap text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 whitespace-nowrap text-base font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}