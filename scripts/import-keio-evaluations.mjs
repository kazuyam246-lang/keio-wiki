import fs from "node:fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: ".env.local",
});

// ========================================
// 設定
// ========================================

const FILE = "./scripts/keio-courses-2026.json";

// 1回の実行で最大500件
const BATCH_SIZE = 500;

// 公式サイトへのアクセス間隔
const WAIT_MS = 2000;

// 通信エラー時の最大試行回数
const MAX_RETRIES = 3;

// 明らかに抽出がおかしい長文は保存しない
const MAX_EVALUATION_LENGTH = 10000;
const MAX_DESCRIPTION_LENGTH = 20000;

// ========================================
// 環境変数
// ========================================

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ Supabase URL がありません");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY がありません"
  );
  process.exit(1);
}

// ========================================
// Supabase
// ========================================

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ========================================
// JSON
// ========================================

if (!fs.existsSync(FILE)) {
  console.error(
    `❌ JSONが見つかりません: ${FILE}`
  );
  process.exit(1);
}

const raw = fs.readFileSync(FILE, "utf8");
const json = JSON.parse(raw);

const allCourses = Array.isArray(json)
  ? json
  : json.courses;

if (!Array.isArray(allCourses)) {
  console.error(
    "❌ courses配列が見つかりません"
  );
  process.exit(1);
}

// ========================================
// Utility
// ========================================

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style\b[^>]*>[\s\S]*?<\/style>/gi,
        " "
      )
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(
        /<\/(?:p|div|tr|td|th|li|dt|dd|h1|h2|h3|h4)>/gi,
        "\n"
      )
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ========================================
// 成績評価方法を抽出
// ========================================

function extractEvaluation(text) {
  const heading = "成績評価方法";

  const startIndex =
    text.indexOf(heading);

  if (startIndex === -1) {
    return null;
  }

  const contentStart =
    startIndex + heading.length;

  const remaining =
    text.slice(contentStart);

  const nextHeadings = [
    "授業における生成AIの利用可否・利用方針",
    "テキスト（教科書）",
    "参考書",
    "担当教員から履修者へのコメント",
    "質問・相談",
  ];

  let endIndex = remaining.length;

  for (const nextHeading of nextHeadings) {
    const index =
      remaining.indexOf(nextHeading);

    if (
      index !== -1 &&
      index < endIndex
    ) {
      endIndex = index;
    }
  }

  const evaluation =
    remaining
      .slice(0, endIndex)
      .trim();

  if (!evaluation) {
    return null;
  }

  return evaluation;
}

// ========================================
// 「どんな授業？」を抽出
// ========================================

function extractDescription(text) {
  // ========================================
  // 共通：指定した見出しから次の見出しまで取得
  // ========================================

  function extractSection(
    startHeading,
    nextHeadings
  ) {
    const startIndex =
      text.indexOf(startHeading);

    if (startIndex === -1) {
      return null;
    }

    const contentStart =
      startIndex + startHeading.length;

    const remaining =
      text.slice(contentStart);

    let endIndex =
      remaining.length;

    for (const nextHeading of nextHeadings) {
      const index =
        remaining.indexOf(nextHeading);

      if (
        index !== -1 &&
        index < endIndex
      ) {
        endIndex = index;
      }
    }

    const result =
      remaining
        .slice(0, endIndex)
        .trim();

    return result || null;
  }

  // ========================================
  // 優先1
  // 通常の学部シラバス
  // ========================================

  const standardDescription =
    extractSection(
      "授業科目の内容・目的・方法・到達目標",
      [
        "実務経験のある教員による授業科目",
        "能動的学修形式 説明",
        "準備学修（予習・復習等）",
        "関連する科目との関係",
        "授業の方法",
        "授業の計画",
        "成績評価方法",
        "成績評価",
      ]
    );

  if (standardDescription) {
    return standardDescription;
  }

  // ========================================
  // 優先2
  // 法務研究科などで使われている形式
  // ========================================

  const objectiveDescription =
    extractSection(
      "授業の目的と到達目標",
      [
        "実務経験のある教員による授業科目",
        "能動的学修形式 説明",
        "準備学修（予習・復習等）",
        "関連する科目との関係",
        "授業の方法",
        "授業の計画",
        "成績評価方法",
        "成績評価",
      ]
    );

  if (objectiveDescription) {
    return objectiveDescription;
  }

  // ========================================
  // 優先3
  // 詳細説明がない場合は「科目概要」
  // ========================================

  const summaryDescription =
    extractSection(
      "科目概要",
      [
        "K-Number",
        "科目設置",
        "学部・研究科",
      ]
    );

  if (summaryDescription) {
    return summaryDescription;
  }

  return null;
}

// ========================================
// シラバス取得
// ========================================

async function fetchWithRetry(url) {
  let lastError;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

          "Accept-Language":
            "ja,en-US;q=0.9,en;q=0.8",
        },

        redirect: "follow",
      });

      if (response.ok) {
        return await response.text();
      }

      lastError = new Error(
        `HTTP ${response.status}`
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < MAX_RETRIES) {
      const retryWait =
        WAIT_MS * attempt;

      console.log(
        `⚠️ ${retryWait / 1000}秒後に再試行 (${attempt}/${MAX_RETRIES})`
      );

      await sleep(retryWait);
    }
  }

  throw lastError;
}

// ========================================
// DBの授業を確認
// ========================================

async function getDatabaseCourse(
  academicYear,
  syllabusId
) {
  const {
    data,
    error,
  } = await supabase
    .from("courses")
    .select(`
      id,
      official_evaluation,
      evaluation_import_status,
      official_course_description,
      description_import_status
    `)
    .eq(
      "academic_year",
      academicYear
    )
    .eq(
      "syllabus_id",
      syllabusId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function isFinished(status) {
  return (
    status === "success" ||
    status === "not_found"
  );
}

// ========================================
// 対象を探す
// ========================================

console.log("");
console.log(
  "================================"
);
console.log(
  "慶應Wiki シラバス情報インポート"
);
console.log(
  "================================"
);

console.log(
  `全授業: ${allCourses.length}件`
);
console.log(
  `今回の上限: ${BATCH_SIZE}件`
);

console.log("");
console.log(
  "未処理の授業を探しています..."
);

const targets = [];

for (const course of allCourses) {
  if (targets.length >= BATCH_SIZE) {
    break;
  }

  if (course.syllabus_id == null) {
    continue;
  }

  const syllabusId =
    String(course.syllabus_id);

  const academicYear =
    course.academic_year ?? 2026;

  try {
    const dbCourse =
      await getDatabaseCourse(
        academicYear,
        syllabusId
      );

    if (!dbCourse) {
      continue;
    }

    let evaluationStatus =
      dbCourse.evaluation_import_status;

    let descriptionStatus =
      dbCourse.description_import_status;

    // ====================================
    // 既に本文が入っている場合は
    // successとして扱う
    // ====================================

    if (
      !isFinished(evaluationStatus) &&
      dbCourse.official_evaluation &&
      dbCourse.official_evaluation.trim()
    ) {
      const { error } =
        await supabase
          .from("courses")
          .update({
            evaluation_import_status:
              "success",
          })
          .eq("id", dbCourse.id);

      if (error) {
        throw error;
      }

      evaluationStatus = "success";
    }

    if (
      !isFinished(descriptionStatus) &&
      dbCourse.official_course_description &&
      dbCourse.official_course_description.trim()
    ) {
      const { error } =
        await supabase
          .from("courses")
          .update({
            description_import_status:
              "success",
          })
          .eq("id", dbCourse.id);

      if (error) {
        throw error;
      }

      descriptionStatus = "success";
    }

    // 両方とも処理済みならアクセス不要
    if (
      isFinished(evaluationStatus) &&
      isFinished(descriptionStatus)
    ) {
      continue;
    }

    targets.push({
      ...course,
      _databaseId: dbCourse.id,
      _evaluationStatus:
        evaluationStatus,
      _descriptionStatus:
        descriptionStatus,
    });
  } catch (error) {
    console.log(
      `⚠️ DB確認失敗: ${course.name}`
    );
  }
}

console.log(
  `今回処理する授業: ${targets.length}件`
);

if (targets.length === 0) {
  console.log("");
  console.log(
    "🎉 未処理の授業はありません。"
  );

  process.exit(0);
}

// ========================================
// 集計
// ========================================

let pageSuccessCount = 0;
let pageErrorCount = 0;

let evaluationSuccessCount = 0;
let evaluationNotFoundCount = 0;
let evaluationSuspiciousCount = 0;

let descriptionSuccessCount = 0;
let descriptionNotFoundCount = 0;
let descriptionSuspiciousCount = 0;

// ========================================
// メイン
// ========================================

for (
  let i = 0;
  i < targets.length;
  i++
) {
  const course = targets[i];

  const academicYear =
    course.academic_year ?? 2026;

  const syllabusId =
    String(course.syllabus_id);

  const url =
    course.syllabus_url ||
    `https://gslbs.keio.jp/pub-syllabus/detail?entno=${encodeURIComponent(
      syllabusId
    )}&lang=jp&ttblyr=${encodeURIComponent(
      academicYear
    )}`;

  console.log("");
  console.log(
    "--------------------------------"
  );

  console.log(
    `[${i + 1}/${targets.length}] ${course.name}`
  );

  console.log(
    `シラバスID: ${syllabusId}`
  );

  try {
    // ====================================
    // 1回だけ公式ページを取得
    // ====================================

    const html =
      await fetchWithRetry(url);

    const text =
      htmlToText(html);

    const updateData = {};

    // ====================================
    // 成績評価方法
    // ====================================

    if (
      !isFinished(
        course._evaluationStatus
      )
    ) {
      const evaluation =
        extractEvaluation(text);

      if (!evaluation) {
        updateData.evaluation_import_status =
          "not_found";

        evaluationNotFoundCount++;

        console.log(
          "⚪ 成績評価方法: なし"
        );
      } else if (
        evaluation.length >
        MAX_EVALUATION_LENGTH
      ) {
        updateData.evaluation_import_status =
          "error";

        evaluationSuspiciousCount++;

        console.log(
          `⚠️ 成績評価方法: 長すぎるため保存しません (${evaluation.length}文字)`
        );
      } else {
        updateData.official_evaluation =
          evaluation;

        updateData.evaluation_import_status =
          "success";

        evaluationSuccessCount++;

        const preview =
          evaluation.length > 100
            ? `${evaluation.slice(
                0,
                100
              )}...`
            : evaluation;

        console.log(
          `✅ 成績評価方法: ${evaluation.length}文字`
        );

        console.log(
          `   ${preview.replace(
            /\n/g,
            " / "
          )}`
        );
      }
    } else {
      console.log(
        "⏭️ 成績評価方法: 処理済み"
      );
    }

    // ====================================
    // どんな授業？
    // ====================================

    if (
      !isFinished(
        course._descriptionStatus
      )
    ) {
      const description =
        extractDescription(text);

      if (!description) {
        updateData.description_import_status =
          "not_found";

        descriptionNotFoundCount++;

        console.log(
          "⚪ 授業内容: なし"
        );
      } else if (
        description.length >
        MAX_DESCRIPTION_LENGTH
      ) {
        updateData.description_import_status =
          "error";

        descriptionSuspiciousCount++;

        console.log(
          `⚠️ 授業内容: 長すぎるため保存しません (${description.length}文字)`
        );
      } else {
        updateData.official_course_description =
          description;

        updateData.description_import_status =
          "success";

        descriptionSuccessCount++;

        const preview =
          description.length > 100
            ? `${description.slice(
                0,
                100
              )}...`
            : description;

        console.log(
          `✅ 授業内容: ${description.length}文字`
        );

        console.log(
          `   ${preview.replace(
            /\n/g,
            " / "
          )}`
        );
      }
    } else {
      console.log(
        "⏭️ 授業内容: 処理済み"
      );
    }

    // ====================================
    // Supabaseへ1回で保存
    // ====================================

    if (
      Object.keys(updateData).length > 0
    ) {
      const {
        error: updateError,
      } = await supabase
        .from("courses")
        .update(updateData)
        .eq(
          "id",
          course._databaseId
        );

      if (updateError) {
        throw updateError;
      }
    }

    console.log(
      "💾 Supabase保存完了"
    );

    pageSuccessCount++;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.log(
      `❌ ページ処理エラー: ${message}`
    );

    // ====================================
    // 未処理だった項目だけ error にする
    // ====================================

    const errorUpdate = {};

    if (
      !isFinished(
        course._evaluationStatus
      )
    ) {
      errorUpdate.evaluation_import_status =
        "error";
    }

    if (
      !isFinished(
        course._descriptionStatus
      )
    ) {
      errorUpdate.description_import_status =
        "error";
    }

    try {
      if (
        Object.keys(errorUpdate).length > 0
      ) {
        await supabase
          .from("courses")
          .update(errorUpdate)
          .eq(
            "id",
            course._databaseId
          );
      }
    } catch {
      // 状態記録に失敗しても継続
    }

    pageErrorCount++;
  }

  // ====================================
  // 公式サイトへの連続アクセスを避ける
  // ====================================

  if (i < targets.length - 1) {
    await sleep(WAIT_MS);
  }
}

// ========================================
// 結果
// ========================================

console.log("");
console.log(
  "================================"
);
console.log(
  "今回の処理完了"
);
console.log(
  "================================"
);

console.log("");
console.log("【ページ】");

console.log(
  `✅ 正常処理: ${pageSuccessCount}件`
);

console.log(
  `❌ エラー: ${pageErrorCount}件`
);

console.log("");
console.log("【成績評価方法】");

console.log(
  `✅ 保存成功: ${evaluationSuccessCount}件`
);

console.log(
  `⚪ なし: ${evaluationNotFoundCount}件`
);

console.log(
  `⚠️ 要確認: ${evaluationSuspiciousCount}件`
);

console.log("");
console.log("【どんな授業？】");

console.log(
  `✅ 保存成功: ${descriptionSuccessCount}件`
);

console.log(
  `⚪ なし: ${descriptionNotFoundCount}件`
);

console.log(
  `⚠️ 要確認: ${descriptionSuspiciousCount}件`
);

console.log("");

console.log(
  "もう一度実行すると、両方処理済みの授業を飛ばして続きを取得します。"
);