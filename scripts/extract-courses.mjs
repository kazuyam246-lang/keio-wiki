import fs from "node:fs";

const INPUT = "./scripts/syllabus-result.json";
const OUTPUT = "./scripts/courses-2026.json";

console.log("シラバスJSONを読み込み中...");

const raw = fs.readFileSync(INPUT, "utf8");
const data = JSON.parse(raw);

if (!Array.isArray(data.searchResultDs)) {
  throw new Error("searchResultDs が見つかりません。");
}

const allCourses = [];

// 曜日・時限グループを展開
for (const group of data.searchResultDs) {
  if (!Array.isArray(group.sbjtDs)) continue;

  for (const subject of group.sbjtDs) {
    allCourses.push(subject);
  }
}

console.log("抽出件数（重複込み）:", allCourses.length);

// ENTNO + 年度で重複除去
const uniqueMap = new Map();

for (const course of allCourses) {
  const year = course.TTBLYR ?? 2026;
  const entno = course.ENTNO;

  if (!entno) continue;

  const key = `${year}-${entno}`;

  // 同じ授業が複数の曜日時限に存在する場合
  if (uniqueMap.has(key)) {
    const existing = uniqueMap.get(key);

    const schedules = new Set([
      ...(existing.schedule_text
        ? existing.schedule_text.split(" / ")
        : []),
      course.DOWPD,
    ]);

    existing.schedule_text = [...schedules]
      .filter(Boolean)
      .join(" / ");

    continue;
  }

  const weekdayMatch =
    typeof course.DOWPD === "string"
      ? course.DOWPD.match(/[月火水木金土日]/)
      : null;

  const periodMatch =
    typeof course.DOWPD === "string"
      ? course.DOWPD.match(/\d+/)
      : null;

  const syllabusUrl = course.SYLLABUS_DETAIL_URL
    ? `https://gslbs.keio.jp/pub-syllabus/${course.SYLLABUS_DETAIL_URL}`
    : `https://gslbs.keio.jp/pub-syllabus/detail?ttblyr=${year}&entno=${entno}&lang=jp`;

  uniqueMap.set(key, {
    name: course.SBJTNM ?? null,
    professor: course.LCTNM ?? null,

    credits: course.CREDIT
      ? Number(course.CREDIT)
      : null,

    campus: course.AREANM ?? null,
    faculty: course.ESTB ?? null,

    academic_year: Number(year),
    semester: course.SMS ?? null,

    schedule_text: course.DOWPD ?? null,

    weekday: weekdayMatch
      ? weekdayMatch[0]
      : null,

    period: periodMatch
      ? Number(periodMatch[0])
      : null,

    syllabus_id: String(entno),
    syllabus_url: syllabusUrl,

    subtitle: course.SUBTITLE ?? null,
    language: course.KNLESSONLANGNM ?? null,
    lesson_mode: course.KNLESSONMODENM ?? null,

    field_name: course.FLDNM ?? null,
    level: course.LVL ?? null,

    source: "keio_syllabus",
  });
}

const courses = [...uniqueMap.values()];

// 授業名がない異常データを除外
const validCourses = courses.filter(
  (course) =>
    course.name &&
    course.syllabus_id
);

validCourses.sort((a, b) =>
  String(a.name).localeCompare(String(b.name), "ja")
);

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(validCourses, null, 2),
  "utf8"
);

console.log("------------------------------");
console.log("重複除去後:", courses.length);
console.log("有効授業数:", validCourses.length);
console.log("出力:", OUTPUT);

console.log("\nサンプル:");
console.log(
  JSON.stringify(validCourses.slice(0, 3), null, 2)
);