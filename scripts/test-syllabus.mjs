const url =
  "https://gslbs.keio.jp/pub-syllabus/detail?entno=21721&lang=jp&ttblyr=2026";

console.log("取得中:", url);

const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0",
  },
});

if (!response.ok) {
  throw new Error(`取得失敗: HTTP ${response.status}`);
}

const html = await response.text();

/*
 * HTMLタグを消して普通の文字列にする
 */
function cleanHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * <title> から授業名を取得
 */
function getCourseName(html) {
  const match = html.match(/<title[^>]*>(.*?)\|\s*シラバス・時間割<\/title>/is);

  if (!match) {
    return null;
  }

  return cleanHtml(match[1]);
}

/*
 * 表の「項目名 → 値」を取得
 */
function getField(html, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `<th[^>]*>\\s*${escapedLabel}\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
      "i"
    ),

    new RegExp(
      `<dt[^>]*>\\s*${escapedLabel}\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`,
      "i"
    ),

    new RegExp(
      `<[^>]+>\\s*${escapedLabel}\\s*<\\/[^>]+>\\s*<[^>]+>([\\s\\S]*?)<\\/[^>]+>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match) {
      return cleanHtml(match[1]);
    }
  }

  return null;
}

const name = getCourseName(html);

const professor = getField(html, "担当者名");
const credits = getField(html, "単位");
const yearSemester = getField(html, "年度・学期");
const schedule = getField(html, "曜日時限");
const campus = getField(html, "キャンパス");
const syllabusId = getField(html, "登録番号");
const faculty = getField(html, "設置学部・研究科");
const description = getField(html, "科目概要");

const yearMatch = yearSemester?.match(/\d{4}/);

const academicYear = yearMatch
  ? Number(yearMatch[0])
  : null;

const semester = yearSemester
  ?.replace(/\d{4}/, "")
  .trim() || null;

const weekdayMatch = schedule?.match(/[月火水木金土日]/);

const weekday = weekdayMatch
  ? weekdayMatch[0]
  : null;

const periodMatch = schedule?.match(/\d+/);

const period = periodMatch
  ? Number(periodMatch[0])
  : null;

const course = {
  name,
  professor,
  credits: credits ? Number(credits) : null,

  academic_year: academicYear,
  semester,

  schedule_text: schedule,
  weekday,
  period,

  campus,
  faculty,
  description,

  syllabus_id: syllabusId,
  syllabus_url: url,

  source: "keio_syllabus",
};

console.log("\n==============================");
console.log("取得結果");
console.log("==============================");

console.log(JSON.stringify(course, null, 2));