"use client";

import { useState } from "react";
import Link from "next/link";

type Review = {
  id: number;
  rating: number | null;
  easy_s: number | null;
  workload: number | null;
};

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
  reviews: Review[] | null;
};

type CourseListProps = {
  courses: Course[];
};

type SortType =
  | "default"
  | "reviews"
  | "rating"
  | "easy_s"
  | "workload_low"
  | "workload_high";

export default function CourseList({
  courses,
}: CourseListProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("すべて");
  const [selectedCampus, setSelectedCampus] = useState("すべて");
  const [selectedWeekday, setSelectedWeekday] = useState("すべて");
  const [selectedSemester, setSelectedSemester] = useState("すべて");
  const [selectedPeriod, setSelectedPeriod] = useState("すべて");

  const [sortType, setSortType] =
    useState<SortType>("default");

  const faculties = [
    ...new Set(
      courses
        .map((course) => course.faculty)
        .filter(
          (faculty): faculty is string =>
            Boolean(faculty)
        )
    ),
  ];

  const campuses = [
    ...new Set(
      courses
        .map((course) => course.campus)
        .filter(
          (campus): campus is string =>
            Boolean(campus)
        )
    ),
  ];

  /*
   * 検索・絞り込み
   */
  const filteredCourses = courses.filter(
    (course) => {
      const keyword = searchText
        .trim()
        .toLowerCase();

      const matchesSearch =
        course.name
          .toLowerCase()
          .includes(keyword) ||
        course.professor
          .toLowerCase()
          .includes(keyword);

      const matchesFaculty =
        selectedFaculty === "すべて" ||
        course.faculty === selectedFaculty;

      const matchesCampus =
        selectedCampus === "すべて" ||
        course.campus === selectedCampus;

      const matchesWeekday =
        selectedWeekday === "すべて" ||
        course.weekday === selectedWeekday;

      const matchesSemester =
        selectedSemester === "すべて" ||
        course.semester === selectedSemester;

      const matchesPeriod =
        selectedPeriod === "すべて" ||
        course.period ===
          Number(selectedPeriod);

      return (
        matchesSearch &&
        matchesFaculty &&
        matchesCampus &&
        matchesWeekday &&
        matchesSemester &&
        matchesPeriod
      );
    }
  );

  /*
   * 並び替え
   */
  const sortedCourses = [
    ...filteredCourses,
  ].sort((a, b) => {
    const aReviews = a.reviews ?? [];
    const bReviews = b.reviews ?? [];

    // レビュー数
    if (sortType === "reviews") {
      return (
        bReviews.length -
        aReviews.length
      );
    }

    // 単位の取りやすさ
    if (sortType === "rating") {
      return compareAverageHigh(
        aReviews.map(
          (review) => review.rating
        ),
        bReviews.map(
          (review) => review.rating
        )
      );
    }

    // Sの取りやすさ
    if (sortType === "easy_s") {
      return compareAverageHigh(
        aReviews.map(
          (review) => review.easy_s
        ),
        bReviews.map(
          (review) => review.easy_s
        )
      );
    }

    // 課題量が少ない順
    if (
      sortType === "workload_low"
    ) {
      return compareAverageLow(
        aReviews.map(
          (review) =>
            review.workload
        ),
        bReviews.map(
          (review) =>
            review.workload
        )
      );
    }

    // 課題量が多い順
    if (
      sortType === "workload_high"
    ) {
      return compareAverageHigh(
        aReviews.map(
          (review) =>
            review.workload
        ),
        bReviews.map(
          (review) =>
            review.workload
        )
      );
    }

    // 通常順
    return a.id - b.id;
  });

  function resetFilters() {
    setSearchText("");
    setSelectedFaculty("すべて");
    setSelectedCampus("すべて");
    setSelectedWeekday("すべて");
    setSelectedSemester("すべて");
    setSelectedPeriod("すべて");
    setSortType("default");
  }

  const selectClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <>
      {/* 検索 */}
      <div className="mt-8">
        <input
          type="text"
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
          placeholder="授業名や教員名で検索"
          className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {/* 絞り込み */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={selectedFaculty}
            onChange={(event) =>
              setSelectedFaculty(
                event.target.value
              )
            }
            className={selectClass}
          >
            <option value="すべて">
              すべての学部
            </option>

            {faculties.map(
              (faculty) => (
                <option
                  key={faculty}
                  value={faculty}
                >
                  {faculty}
                </option>
              )
            )}
          </select>

          <select
            value={selectedCampus}
            onChange={(event) =>
              setSelectedCampus(
                event.target.value
              )
            }
            className={selectClass}
          >
            <option value="すべて">
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

          <select
            value={selectedWeekday}
            onChange={(event) =>
              setSelectedWeekday(
                event.target.value
              )
            }
            className={selectClass}
          >
            <option value="すべて">
              すべての曜日
            </option>

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

          <select
            value={selectedSemester}
            onChange={(event) =>
              setSelectedSemester(
                event.target.value
              )
            }
            className={selectClass}
          >
            <option value="すべて">
              すべての学期
            </option>

            <option value="春学期">
              春学期
            </option>

            <option value="秋学期">
              秋学期
            </option>
          </select>

          <select
            value={selectedPeriod}
            onChange={(event) =>
              setSelectedPeriod(
                event.target.value
              )
            }
            className={selectClass}
          >
            <option value="すべて">
              すべての時限
            </option>

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

        {/* 並び替え */}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-semibold text-slate-700">
              並び替え
            </span>

            <select
              value={sortType}
              onChange={(event) =>
                setSortType(
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
              {sortedCourses.length}
            </span>
            件の授業
          </p>
        </div>

        {/* リセット */}
        <button
          type="button"
          onClick={resetFilters}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          <span>↻</span>
          絞り込み・並び替えをリセット
        </button>
      </div>

      {/* 0件 */}
      {sortedCourses.length === 0 && (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-800">
            該当する授業が見つかりません
          </p>

          <p className="mt-2 text-sm text-slate-500">
            検索条件を変更してみてください。
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 font-semibold text-blue-600 hover:text-blue-700"
          >
            条件をリセット
          </button>
        </div>
      )}

      {/* 授業一覧 */}
      {sortedCourses.length > 0 && (
        <div className="mt-8 grid gap-4">
          {sortedCourses.map(
            (course) => {
              const reviews =
                course.reviews ?? [];

              const ratingValues =
                reviews
                  .map(
                    (review) =>
                      review.rating
                  )
                  .filter(
                    (
                      value
                    ): value is number =>
                      value !== null
                  );

              const easySValues =
                reviews
                  .map(
                    (review) =>
                      review.easy_s
                  )
                  .filter(
                    (
                      value
                    ): value is number =>
                      value !== null
                  );

              const workloadValues =
                reviews
                  .map(
                    (review) =>
                      review.workload
                  )
                  .filter(
                    (
                      value
                    ): value is number =>
                      value !== null
                  );

              const averageRating =
                getAverage(
                  ratingValues
                );

              const averageEasyS =
                getAverage(
                  easySValues
                );

              const averageWorkload =
                getAverage(
                  workloadValues
                );

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    {/* 左側 */}
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {course.faculty && (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {
                              course.faculty
                            }
                          </span>
                        )}

                        {course.campus && (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {
                              course.campus
                            }
                          </span>
                        )}

                        {course.semester && (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {
                              course.semester
                            }
                          </span>
                        )}

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

                      <h2 className="text-xl font-bold tracking-tight text-slate-950 transition group-hover:text-blue-600">
                        {course.name}
                      </h2>

                      <p className="mt-1.5 text-sm text-slate-600">
                        {
                          course.professor
                        }
                      </p>

                      {course.description && (
                        <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
                          {
                            course.description
                          }
                        </p>
                      )}
                    </div>

                    {/* 評価 */}
                    <div className="flex flex-wrap items-stretch gap-2 lg:flex-nowrap">
                      <CourseStat
                        label="レビュー"
                        value={`${reviews.length}件`}
                      />

                      <CourseStat
                        label="単位"
                        value={
                          averageRating ===
                          null
                            ? "—"
                            : `${averageRating.toFixed(
                                1
                              )} / 5`
                        }
                      />

                      <CourseStat
                        label="Sの取りやすさ"
                        value={
                          averageEasyS ===
                          null
                            ? "—"
                            : `${averageEasyS.toFixed(
                                1
                              )} / 5`
                        }
                      />

                      <CourseStat
                        label="課題量"
                        value={
                          averageWorkload ===
                          null
                            ? "—"
                            : `${averageWorkload.toFixed(
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
              );
            }
          )}
        </div>
      )}
    </>
  );
}

/*
 * 平均値
 */
function getAverage(
  values: (number | null)[]
): number | null {
  const validValues =
    values.filter(
      (value): value is number =>
        value !== null
    );

  if (validValues.length === 0) {
    return null;
  }

  return (
    validValues.reduce(
      (total, value) =>
        total + value,
      0
    ) / validValues.length
  );
}

/*
 * 高い順
 * 評価がない授業は最後
 */
function compareAverageHigh(
  aValues: (number | null)[],
  bValues: (number | null)[]
) {
  const a = getAverage(aValues);
  const b = getAverage(bValues);

  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return b - a;
}

/*
 * 低い順
 * 評価がない授業は最後
 */
function compareAverageLow(
  aValues: (number | null)[],
  bValues: (number | null)[]
) {
  const a = getAverage(aValues);
  const b = getAverage(bValues);

  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return a - b;
}

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