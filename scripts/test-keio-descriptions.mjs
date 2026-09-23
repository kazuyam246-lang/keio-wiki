import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const FILE = "./scripts/keio-courses-2026.json";
const TEST_LIMIT = 10;
const WAIT_MS = 2000;

if (!fs.existsSync(FILE)) {
  console.error(`❌ JSONが見つかりません: ${FILE}`);
  process.exit(1);
}

const raw = fs.readFileSync(FILE, "utf8");
const json = JSON.parse(raw);

const courses = Array.isArray(json)
  ? json
  : json.courses;

if (!Array.isArray(courses)) {
  console.error("❌ courses配列が見つかりません");
  process.exit(1);
}

const targets = courses
  .filter(
    (course) =>
      course.syllabus_url ||
      course.syllabus_id
  )
  .slice(0, TEST_LIMIT);

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
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

// 今回はまだ「授業概要を保存」しません。
// シラバスにどんな見出しが存在するか確認します。
function showRelevantSections(text) {
  const keywords = [
    "授業の目的",
    "授業概要",
    "授業の概要",
    "授業内容",
    "授業の内容",
    "目的",
    "概要",
    "到達目標",
    "授業計画",
  ];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const matched = keywords.some(
      (keyword) =>
        line.includes(keyword)
    );

    if (!matched) {
      continue;
    }

    // 見出し周辺を確認できるように、
    // その行から後ろ12行まで表示
    const context = lines
      .slice(i, i + 13)
      .join("\n");

    matches.push(context);
  }

  return matches;
}

console.log("");
console.log("================================");
console.log("慶應シラバス 授業概要テスト");
console.log("================================");
console.log(`対象: ${targets.length}件`);

let successCount = 0;
let noMatchCount = 0;
let errorCount = 0;

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
  console.log("================================");
  console.log(
    `[${i + 1}/${targets.length}] ${course.name}`
  );
  console.log("================================");
  console.log(`シラバスID: ${syllabusId}`);

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

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const html =
      await response.text();

    const text =
      htmlToText(html);

    const sections =
      showRelevantSections(text);

    if (sections.length === 0) {
      console.log(
        "⚠️ 関連する見出しを発見できませんでした"
      );

      noMatchCount++;
    } else {
      console.log("");
      console.log(
        "【見つかった候補】"
      );

      sections.forEach(
        (section, index) => {
          console.log("");
          console.log(
            `--- 候補 ${index + 1} ---`
          );
          console.log(section);
        }
      );

      successCount++;
    }
  } catch (error) {
    console.log(
      "❌ エラー:",
      error instanceof Error
        ? error.message
        : error
    );

    errorCount++;
  }

  if (i < targets.length - 1) {
    await sleep(WAIT_MS);
  }
}

console.log("");
console.log("================================");
console.log("テスト完了");
console.log("================================");
console.log(
  `候補発見: ${successCount}件`
);
console.log(
  `候補なし: ${noMatchCount}件`
);
console.log(
  `エラー: ${errorCount}件`
);