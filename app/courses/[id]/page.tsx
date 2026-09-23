import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import ReviewList from "./ReviewList";
import EvaluationNotes from "./EvaluationNotes";
import DescriptionNotes from "./DescriptionNotes";

type Review = {
  id: number;
  course_name: string;
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

type CoursePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CoursePage({
  params,
}: CoursePageProps) {
  const { id } = await params;
  const courseId = Number(id);

  // =========================
  // 授業情報
  // =========================

  const {
    data: course,
    error: courseError,
  } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      canonical_name,
      professor,
      campus,
      faculty,
      credits,
      description,
      evaluation,
      official_evaluation,
      official_course_description,
      weekday,
      period,
      semester,
      user_id,
      academic_year,
      schedule_text,
      syllabus_id,
      syllabus_url,
      subtitle,
      language,
      lesson_mode,
      field_name,
      level,
      source
    `)
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-red-600">
            授業を取得できませんでした
          </h1>

          <p className="mt-3 text-slate-600">
            {courseError?.message ??
              "授業が見つかりませんでした"}
          </p>

          <Link
            href="/courses"
            className="mt-6 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← 授業一覧
          </Link>
        </div>
      </main>
    );
  }

  const displayName =
    course.canonical_name || course.name;

  const isOfficial =
    course.source === "keio_syllabus";

  // =========================
  // 体験記
  // =========================

  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .select(`
      id,
      course_name,
      professor,
      rating,
      easy_s,
      workload,
      comment,
      grade,
      likes,
      created_at,
      user_id
    `)
    .eq("course_id", courseId)
    .order("created_at", {
      ascending: false,
    });

  const reviews: Review[] = data ?? [];

  // =========================
  // 単位の取りやすさ
  // =========================
  const ratingReviews = reviews.filter(
    (review) =>
      review.rating !== null &&
      review.rating !== undefined
  );

  const averageRating =
    ratingReviews.length > 0
      ? ratingReviews.reduce(
          (total, review) =>
            total + review.rating,
          0
        ) / ratingReviews.length
      : null;

  // =========================
  // Sの取りやすさ
  // =========================
  const easySReviews = reviews.filter(
    (review) =>
      review.easy_s !== null &&
      review.easy_s !== undefined
  );

  const averageEasyS =
    easySReviews.length > 0
      ? easySReviews.reduce(
          (total, review) =>
            total + (review.easy_s ?? 0),
          0
        ) / easySReviews.length
      : null;

  // =========================
  // 課題量
  // =========================
  const workloadReviews = reviews.filter(
    (review) =>
      review.workload !== null &&
      review.workload !== undefined
  );

  const averageWorkload =
    workloadReviews.length > 0
      ? workloadReviews.reduce(
          (total, review) =>
            total +
            (review.workload ?? 0),
          0
        ) / workloadReviews.length
      : null;

  // =========================
  // 成績分布
  // =========================
  const gradeOrder = [
    "S",
    "A",
    "B",
    "C",
    "D",
  ];

  const gradeReviews =
    reviews.filter((review) => {
      if (!review.grade) {
        return false;
      }

      return gradeOrder.includes(
        review.grade
          .trim()
          .toUpperCase()
      );
    });

  const gradeCounts =
    gradeOrder.map((grade) => {
      const count =
        gradeReviews.filter(
          (review) =>
            review.grade
              ?.trim()
              .toUpperCase() ===
            grade
        ).length;

      const percentage =
        gradeReviews.length > 0
          ? (count /
              gradeReviews.length) *
            100
          : 0;

      return {
        grade,
        count,
        percentage,
      };
    });

  const mostCommonGrade =
    gradeReviews.length > 0
      ? [...gradeCounts].sort(
          (a, b) =>
            b.count - a.count
        )[0]
      : null;

  // =========================
  // 評価方法
  // =========================
  const evaluationItems =
    Array.isArray(course.evaluation)
      ? (course.evaluation as EvaluationItem[])
      : [];

  // =========================
  // 授業情報が存在するか
  // =========================
  const hasOfficialInfo =
    course.academic_year ||
    course.credits ||
    course.campus ||
    course.faculty ||
    course.level ||
    course.semester ||
    course.schedule_text ||
    course.language ||
    course.lesson_mode ||
    course.field_name ||
    course.subtitle;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* =========================
          HEADER
      ========================= */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-slate-950 sm:text-lg"
          >
            慶應Wiki
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="mr-1.5">
                ←
              </span>

              <span className="hidden sm:inline">
                授業一覧
              </span>

              <span className="sm:hidden">
                一覧
              </span>
            </Link>

            <Link
              href="/mypage"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              マイページ
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">

{/* どんな授業？ */}
<section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
  <p className="text-xs font-bold tracking-widest text-blue-600">
    COURSE OVERVIEW
  </p>

  <h2 className="mt-2 text-xl font-bold text-slate-900">
    どんな授業？
  </h2>

  <div className="mt-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          公式シラバス
        </span>

        {course.academic_year && (
          <span className="text-xs text-slate-400">
            {course.academic_year}年度
          </span>
        )}
      </div>

      {course.syllabus_url && (
        <a
          href={course.syllabus_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
        >
          公式シラバスを見る ↗
        </a>
      )}
    </div>

    {course.official_course_description ? (
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 px-5 py-4">
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
          {course.official_course_description}
        </p>
      </div>
    ) : (
      <div className="mt-4 rounded-lg bg-slate-50 px-5 py-5">
        <p className="text-sm text-slate-500">
          公式シラバスの授業概要はまだ取り込まれていません。
        </p>

        {course.syllabus_url && (
          <a
            href={course.syllabus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            公式シラバスで確認する ↗
          </a>
        )}
      </div>
    )}
  </div>

  <DescriptionNotes courseId={course.id} />
</section>


        {/* =========================
            COURSE HEADER
        ========================= */}
        <section>
          <div className="flex flex-wrap gap-2">
            {isOfficial && (
              <span className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                慶應義塾大学 公式シラバス
              </span>
            )}

            {course.academic_year && (
              <CourseTag>
                {course.academic_year}年度
              </CourseTag>
            )}

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

            {course.level && (
              <CourseTag>
                {course.level}年
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

            {course.credits !== null &&
              course.credits !==
                undefined && (
                <CourseTag>
                  {course.credits}単位
                </CourseTag>
              )}
          </div>

          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-4xl font-bold tracking-tight sm:text-5xl">
                {displayName}
              </h1>

              {course.subtitle &&
                course.subtitle !==
                  displayName && (
                  <p className="mt-3 text-base font-medium text-slate-500">
                    {course.subtitle}
                  </p>
                )}

              <p className="mt-3 text-lg text-slate-600">
                {course.professor}
              </p>
            </div>

            <Link
              href={`/review?courseId=${course.id}`}
              className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              体験記を書く
            </Link>
          </div>
        </section>

        {/* =========================
            RATINGS
        ========================= */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-bold tracking-widest text-blue-600">
              RATINGS
            </p>

            <h2 className="mt-1 text-xl font-bold">
              履修者の評価
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard
              title="単位の取りやすさ"
              score={averageRating}
              count={ratingReviews.length}
              scale="★が多いほど取りやすい"
            />

            <ScoreCard
              title="Sの取りやすさ"
              score={averageEasyS}
              count={easySReviews.length}
              scale="★が多いほど取りやすい"
            />

            <ScoreCard
              title="課題量"
              score={averageWorkload}
              count={
                workloadReviews.length
              }
              scale="★が多いほど課題が多い"
            />

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">
                体験記
              </p>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {reviews.length}
                </span>

                <span className="text-sm text-slate-400">
                  件
                </span>
              </div>

              <p className="mt-5 text-xs text-slate-400">
                投稿された体験記の数
              </p>
            </div>
          </div>
        </section>

        {/* =========================
    PAST EXAMS
========================= */}
<section className="mt-5">
  <Link
    href={`/courses/${course.id}/past-exams`}
    className="group block rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm sm:p-7"
  >
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-blue-600">
          PAST EXAMS
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          過去問
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          この授業の過去問を確認・共有できます。
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white">
        →
      </div>
    </div>
  </Link>
</section>

        {/* =========================
            OFFICIAL INFORMATION
        ========================= */}
        {hasOfficialInfo && (
          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-blue-600">
                  COURSE INFO
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  授業情報
                </h2>

                {isOfficial && (
                  <p className="mt-2 text-sm text-slate-500">
                    慶應義塾大学の公式シラバス情報をもとに表示しています。
                  </p>
                )}
              </div>

              {course.syllabus_url && (
                <a
                  href={
                    course.syllabus_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  公式シラバスを見る ↗
                </a>
              )}
            </div>

            <div className="mt-5 grid gap-x-8 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
              {course.academic_year && (
                <InfoRow
                  label="年度"
                  value={`${course.academic_year}年度`}
                />
              )}

              {course.faculty && (
                <InfoRow
                  label="学部・研究科"
                  value={course.faculty}
                />
              )}

              {course.campus && (
                <InfoRow
                  label="キャンパス"
                  value={course.campus}
                />
              )}

              {course.level && (
                <InfoRow
                  label="学年"
                  value={`${course.level}年`}
                />
              )}

              {course.credits !== null &&
                course.credits !==
                  undefined && (
                  <InfoRow
                    label="単位数"
                    value={`${course.credits}単位`}
                  />
                )}

              {course.semester && (
                <InfoRow
                  label="学期"
                  value={course.semester}
                />
              )}

              {course.schedule_text && (
                <InfoRow
                  label="曜日・時限"
                  value={
                    course.schedule_text
                  }
                />
              )}

              {!course.schedule_text &&
                course.weekday &&
                course.period && (
                  <InfoRow
                    label="曜日・時限"
                    value={`${course.weekday}曜 ${course.period}限`}
                  />
                )}

              {course.language && (
                <InfoRow
                  label="使用言語"
                  value={course.language}
                />
              )}

              {course.lesson_mode && (
                <InfoRow
                  label="授業形態"
                  value={
                    course.lesson_mode
                  }
                />
              )}

              {course.field_name && (
                <InfoRow
                  label="分野"
                  value={
                    course.field_name
                  }
                />
              )}

              {course.syllabus_id && (
                <InfoRow
                  label="シラバスID"
                  value={
                    course.syllabus_id
                  }
                />
              )}
            </div>
          </section>
        )}

        {/* =========================
            COURSE INFORMATION
        ========================= */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* 授業内容 */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
            <p className="text-xs font-bold tracking-widest text-blue-600">
              ABOUT
            </p>

            <h2 className="mt-2 text-xl font-bold">
              どんな授業？
            </h2>

            {course.description ? (
              <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-600">
                {course.description}
              </p>
            ) : (
              <p className="mt-5 text-slate-400">
                授業説明はまだ登録されていません。
              </p>
            )}
          </section>

          {/* 成績評価方法 */}
<section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
  <p className="text-xs font-bold tracking-widest text-blue-600">
    EVALUATION
  </p>

  <h2 className="mt-2 text-xl font-bold">
    成績評価方法
  </h2>

  {/* 公式シラバス */}
  <div className="mt-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          公式シラバス
        </span>

        {course.academic_year && (
          <span className="text-xs text-slate-400">
            {course.academic_year}年度
          </span>
        )}
      </div>

      {course.syllabus_url && (
        <a
          href={course.syllabus_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
        >
          公式シラバスを見る ↗
        </a>
      )}
    </div>

    {course.official_evaluation ? (
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 px-5 py-4">
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
          {course.official_evaluation}
        </p>
      </div>
    ) : (
      <div className="mt-4 rounded-lg bg-slate-50 px-5 py-5">
        <p className="text-sm text-slate-500">
          公式シラバスの成績評価方法はまだ取り込まれていません。
        </p>

        {course.syllabus_url && (
          <a
            href={course.syllabus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            公式シラバスで確認する ↗
          </a>
        )}
      </div>
    )}
  </div>

  {/* 履修者による補足 */}
  <EvaluationNotes
    courseId={course.id}
  />
</section>

        </div>

        {/* =========================
            GRADES
        ========================= */}
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                GRADES
              </p>

              <h2 className="mt-2 text-xl font-bold">
                成績分布
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                体験記に投稿された最終成績から集計しています。
              </p>
            </div>

            {gradeReviews.length >
              0 && (
              <p className="text-sm text-slate-500">
                {gradeReviews.length}
                件から集計
              </p>
            )}
          </div>

          {gradeReviews.length === 0 ? (
            <div className="mt-6 rounded-lg bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-500">
                まだ成績データがありません。
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-500">
                  最も多い成績
                </span>

                {mostCommonGrade && (
                  <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-blue-600 px-3 text-lg font-bold text-white">
                    {
                      mostCommonGrade.grade
                    }
                  </span>
                )}

                {mostCommonGrade && (
                  <span className="text-sm font-semibold text-slate-700">
                    {
                      mostCommonGrade.count
                    }
                    件・
                    {mostCommonGrade.percentage.toFixed(
                      0
                    )}
                    %
                  </span>
                )}
              </div>

              <div className="mt-7 space-y-4">
                {gradeCounts.map(
                  ({
                    grade,
                    count,
                    percentage,
                  }) => (
                    <div
                      key={grade}
                      className="grid grid-cols-[42px_1fr_90px] items-center gap-3 sm:gap-4"
                    >
                      <div
                        className={
                          count > 0
                            ? "flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white"
                            : "flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-400"
                        }
                      >
                        {grade}
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-700">
                          {count}件
                        </span>

                        <span className="ml-1 text-xs text-slate-400">
                          {percentage.toFixed(
                            0
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>

        {/* =========================
            REVIEWS
        ========================= */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                REVIEWS
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                履修者の体験記
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {reviews.length}
                件の体験記
              </p>
            </div>

            <Link
              href={`/review?courseId=${course.id}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ＋ 体験記を書く
            </Link>
          </div>

          {error && (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              体験記を読み込めませんでした：
              {error.message}
            </p>
          )}

          {!error &&
            reviews.length === 0 && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
                <p className="font-semibold text-slate-700">
                  この授業の体験記はまだありません
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  最初の体験記を投稿してみましょう。
                </p>

                <Link
                  href={`/review?courseId=${course.id}`}
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  体験記を書く
                </Link>
              </div>
            )}

          {!error &&
            reviews.length > 0 && (
              <ReviewList
                reviews={reviews}
              />
            )}
        </section>
      </div>
    </main>
  );
}

/* =========================
   SCORE CARD
========================= */

function ScoreCard({
  title,
  score,
  count,
  scale,
}: {
  title: string;
  score: number | null;
  count: number;
  scale: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      {score !== null ? (
        <>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {score.toFixed(1)}
            </span>

            <span className="text-sm font-medium text-slate-400">
              / 5
            </span>
          </div>

          <div
            className="mt-3 flex items-center gap-1"
            aria-label={`${score.toFixed(
              1
            )} / 5`}
          >
            {[1, 2, 3, 4, 5].map(
              (star) => {
                const fillPercentage =
                  Math.max(
                    0,
                    Math.min(
                      100,
                      (score -
                        (star - 1)) *
                        100
                    )
                  );

                return (
                  <span
                    key={star}
                    className="relative inline-block text-2xl leading-none"
                  >
                    <span
                      className="text-slate-200"
                      aria-hidden="true"
                    >
                      ★
                    </span>

                    <span
                      className="absolute left-0 top-0 overflow-hidden text-blue-600"
                      style={{
                        width: `${fillPercentage}%`,
                      }}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  </span>
                );
              }
            )}
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {scale}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {count}件の体験記から算出
          </p>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <span
                  key={star}
                  className="text-2xl leading-none text-slate-200"
                  aria-hidden="true"
                >
                  ★
                </span>
              )
            )}
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-400">
            まだ評価がありません
          </p>
        </>
      )}
    </div>
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
    <span className="rounded-md bg-slate-200/70 px-3 py-1.5 text-xs font-semibold text-slate-600">
      {children}
    </span>
  );
}

/* =========================
   INFO ROW
========================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 py-3.5">
      <span className="shrink-0 text-sm text-slate-500">
        {label}
      </span>

      <span className="break-words text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}