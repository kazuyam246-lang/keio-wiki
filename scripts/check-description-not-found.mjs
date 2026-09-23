import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: ".env.local",
});

const TEST_LIMIT = 20;
const WAIT_MS = 2000;
const MAX_RETRIES = 3;

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
      const wait =
        WAIT_MS * attempt;

      console.log(
        `⚠️ ${wait / 1000}秒後に再試行`
      );

      await sleep(wait);
    }
  }

  throw lastError;
}

// ========================================
// 「授業説明っぽい」場所を探す
// ========================================

function findCandidates(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const keywords = [
    "科目概要",
    "授業概要",
    "授業の概要",
    "授業内容",
    "授業の内容",
    "授業科目の内容",
    "目的",
    "到達目標",
    "Course Description",
    "COURSE DESCRIPTION",
    "Course Overview",
    "COURSE OVERVIEW",
    "Objectives",
    "OBJECTIVES",
    "Course Objectives",
  ];

  const results = [];

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    const line = lines[i];

    const lower =
      line.toLowerCase();

    const matched =
      keywords.some((keyword) =>
        lower.includes(
          keyword.toLowerCase()
        )
      );

    if (!matched) {
      continue;
    }

    const start =
      Math.max(0, i - 1);

    const end =
      Math.min(
        lines.length,
        i + 10
      );

    results.push(
      lines
        .slice(start, end)
        .join("\n")
    );
  }

  return [...new Set(results)];
}

// ========================================
// not_found の授業を取得
// ========================================

console.log("");
console.log(
  "================================"
);
console.log(
  "授業内容 not_found 調査"
);
console.log(
  "================================"
);

const {
  data: courses,
  error,
} = await supabase
  .from("courses")
  .select(`
    id,
    name,
    professor,
    academic_year,
    syllabus_id,
    syllabus_url,
    description_import_status
  `)
  .eq(
    "description_import_status",
    "not_found"
  )
  .not(
    "syllabus_id",
    "is",
    null
  )
  .limit(TEST_LIMIT);

if (error) {
  console.error(
    "❌ Supabase取得失敗:",
    error.message
  );

  process.exit(1);
}

if (!courses?.length) {
  console.log(
    "not_found の授業がありません。"
  );

  process.exit(0);
}

console.log(
  `調査対象: ${courses.length}件`
);

// ========================================
// 調査
// ========================================

let candidateFound = 0;
let noCandidate = 0;
let errorCount = 0;

for (
  let i = 0;
  i < courses.length;
  i++
) {
  const course = courses[i];

  const url =
    course.syllabus_url ||
    `https://gslbs.keio.jp/pub-syllabus/detail?entno=${encodeURIComponent(
      String(course.syllabus_id)
    )}&lang=jp&ttblyr=${encodeURIComponent(
      String(
        course.academic_year ??
          2026
      )
    )}`;

  console.log("");
  console.log(
    "================================"
  );

  console.log(
    `[${i + 1}/${courses.length}] ${course.name}`
  );

  console.log(
    `シラバスID: ${course.syllabus_id}`
  );

  try {
    const html =
      await fetchWithRetry(url);

    const text =
      htmlToText(html);

    const candidates =
      findCandidates(text);

    if (candidates.length === 0) {
      console.log("");
      console.log(
        "⚪ 授業説明らしい候補なし"
      );

      noCandidate++;
    } else {
      console.log("");
      console.log(
        `🔎 候補 ${candidates.length}件`
      );

      candidates.forEach(
        (candidate, index) => {
          console.log("");
          console.log(
            `----- 候補 ${index + 1} -----`
          );

          console.log(candidate);
        }
      );

      candidateFound++;
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.log(
      `❌ エラー: ${message}`
    );

    errorCount++;
  }

  if (
    i < courses.length - 1
  ) {
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
  "調査完了"
);
console.log(
  "================================"
);

console.log(
  `🔎 別候補あり: ${candidateFound}件`
);

console.log(
  `⚪ 候補なし: ${noCandidate}件`
);

console.log(
  `❌ エラー: ${errorCount}件`
);

console.log("");
console.log(
  "※ このスクリプトはSupabaseを変更していません。"
);
