import fs from "node:fs";

const files = [
  "./scripts/all-mon.json",
  "./scripts/all-tue.json",
  "./scripts/all-wed.json",
  "./scripts/all-thu.json",
  "./scripts/all-fri.json",
  "./scripts/all-sat.json",
  "./scripts/all-other.json",
];

const OUTPUT = "./scripts/courses-2026-all.json";

const uniqueMap = new Map();

let rawCount = 0;

console.log("================================");
console.log("慶應Wiki 2026 全キャンパス統合");
console.log("================================");

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`❌ ファイルがありません: ${file}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data.searchResultDs)) {
    console.error(`❌ searchResultDs がありません: ${file}`);
    process.exit(1);
  }

  let fileCount = 0;

  for (const group of data.searchResultDs) {
    if (!Array.isArray(group.sbjtDs)) continue;

    for (const subject of group.sbjtDs) {
      rawCount++;
      fileCount++;

      const entno = subject.ENTNO;
      const year = Number(subject.TTBLYR ?? 2026);

      if (!entno) continue;

      const key = `${year}-${entno}`;

      // 同じ授業が別曜日にも存在する場合
      if (uniqueMap.has(key)) {
        const existing = uniqueMap.get(key);

        const schedules = new Set(
          String(existing.schedule_text ?? "")
            .split(" / ")
            .filter(Boolean)
        );

        if (subject.DOWPD) {
          schedules.add(subject.DOWPD);
        }

        existing.schedule_text = [...schedules].join(" / ");

        continue;
      }

      const schedule = subject.DOWPD ?? null;

      const weekdayMatch =
        typeof schedule === "string"
          ? schedule.match(/[月火水木金土日]/)
          : null;

      const periodMatch =
        typeof schedule === "string"
          ? schedule.match(/\d+/)
          : null;

      const syllabusUrl = subject.SYLLABUS_DETAIL_URL
        ? `https://gslbs.keio.jp/pub-syllabus/${subject.SYLLABUS_DETAIL_URL}`
        : `https://gslbs.keio.jp/pub-syllabus/detail?ttblyr=${year}&entno=${entno}&lang=jp`;

      uniqueMap.set(key, {
        name: subject.SBJTNM ?? null,

        professor: subject.LCTNM ?? null,

        description:
          subject.SUBTITLE?.trim() ||
          "慶應義塾大学公式シラバス掲載科目",

        credits:
          subject.CREDIT !== null &&
          subject.CREDIT !== undefined &&
          subject.CREDIT !== ""
            ? Number(subject.CREDIT)
            : null,

        campus: subject.AREANM ?? null,

        faculty: subject.ESTB ?? null,

        academic_year: year,

        semester: subject.SMS ?? null,

        schedule_text: schedule,

        weekday: weekdayMatch
          ? weekdayMatch[0]
          : null,

        period: periodMatch
          ? Number(periodMatch[0])
          : null,

        syllabus_id: String(entno),

        syllabus_url: syllabusUrl,

        subtitle: subject.SUBTITLE ?? null,

        language: subject.KNLESSONLANGNM ?? null,

        lesson_mode: subject.KNLESSONMODENM ?? null,

        field_name: subject.FLDNM ?? null,

        level: subject.LVL ?? null,

        source: "keio_syllabus",
      });
    }
  }

  console.log(`${file} → ${fileCount}件`);
}

let courses = [...uniqueMap.values()];

courses = courses.filter(
  (course) =>
    course.name &&
    course.syllabus_id
);

courses.sort((a, b) =>
  String(a.name).localeCompare(String(b.name), "ja")
);

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(courses, null, 2),
  "utf8"
);

console.log("");
console.log("================================");
console.log("統合結果");
console.log("================================");

console.log("元データ合計:", rawCount);
console.log("重複除去後:", courses.length);
console.log("重複数:", rawCount - courses.length);

console.log("");
console.log("出力:");
console.log(OUTPUT);

// ------------------------------
// キャンパス別
// ------------------------------

console.log("");
console.log("================================");
console.log("キャンパス別");
console.log("================================");

const campusCounts = {};

for (const course of courses) {
  const campus = course.campus || "不明";

  campusCounts[campus] =
    (campusCounts[campus] ?? 0) + 1;
}

console.table(
  Object.entries(campusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([campus, count]) => ({
      campus,
      count,
    }))
);

// ------------------------------
// 学部別
// ------------------------------

console.log("");
console.log("================================");
console.log("学部・研究科別");
console.log("================================");

const facultyCounts = {};

for (const course of courses) {
  const faculty = course.faculty || "不明";

  facultyCounts[faculty] =
    (facultyCounts[faculty] ?? 0) + 1;
}

console.table(
  Object.entries(facultyCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([faculty, count]) => ({
      faculty,
      count,
    }))
);

// ------------------------------
// 曜日別
// ------------------------------

console.log("");
console.log("================================");
console.log("曜日別");
console.log("================================");

const weekdayCounts = {};

for (const course of courses) {
  const weekday = course.weekday || "その他";

  weekdayCounts[weekday] =
    (weekdayCounts[weekday] ?? 0) + 1;
}

console.table(
  Object.entries(weekdayCounts)
    .map(([weekday, count]) => ({
      weekday,
      count,
    }))
);

// ------------------------------
// データ品質チェック
// ------------------------------

console.log("");
console.log("================================");
console.log("データ品質チェック");
console.log("================================");

const missingProfessor =
  courses.filter((x) => !x.professor).length;

const missingCampus =
  courses.filter((x) => !x.campus).length;

const missingFaculty =
  courses.filter((x) => !x.faculty).length;

const missingSemester =
  courses.filter((x) => !x.semester).length;

const missingSchedule =
  courses.filter((x) => !x.schedule_text).length;

console.log("教授名なし:", missingProfessor);
console.log("キャンパスなし:", missingCampus);
console.log("学部なし:", missingFaculty);
console.log("学期なし:", missingSemester);
console.log("時間割なし:", missingSchedule);

console.log("");
console.log("================================");
console.log("サンプル5件");
console.log("================================");

console.log(
  JSON.stringify(
    courses.slice(0, 5),
    null,
    2
  )
);

console.log("");
console.log("✅ 統合完了");