import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const FILE = "./scripts/keio-courses-2026.json";
const BATCH_SIZE = 500;

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL が設定されていません");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY が設定されていません");
  process.exit(1);
}

if (!fs.existsSync(FILE)) {
  console.error(`❌ JSONが見つかりません: ${FILE}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

console.log("================================");
console.log("慶應Wiki 公式授業インポート");
console.log("================================");

const raw = fs.readFileSync(FILE, "utf8");
const json = JSON.parse(raw);

const courses = Array.isArray(json) ? json : json.courses;

if (!Array.isArray(courses)) {
  console.error("❌ courses 配列が見つかりません");
  process.exit(1);
}

console.log(`JSON授業数: ${courses.length}`);

const rows = courses.map((course) => ({
  name: course.name,
  professor: course.professor,

  description:
    course.description || "慶應義塾大学公式シラバス掲載科目",

  campus: course.campus,
  faculty: course.faculty,
  credits: course.credits ?? null,

  weekday: course.weekday ?? null,
  period: course.period ?? null,
  semester: course.semester ?? null,

  academic_year: course.academic_year ?? 2026,
  schedule_text: course.schedule_text ?? null,

  syllabus_id: course.syllabus_id
    ? String(course.syllabus_id)
    : null,

  syllabus_url: course.syllabus_url ?? null,
  subtitle: course.subtitle ?? null,
  language: course.language ?? null,
  lesson_mode: course.lesson_mode ?? null,
  field_name: course.field_name ?? null,
  level: course.level ?? null,

  source: "keio_syllabus",

  // 公式授業は特定ユーザーの所有物にしない
  user_id: null,
}));

const invalid = rows.filter(
  (course) =>
    !course.name ||
    !course.syllabus_id ||
    !course.academic_year
);

if (invalid.length > 0) {
  console.error(`❌ 必須データ不足: ${invalid.length}件`);
  console.log(invalid.slice(0, 5));
  process.exit(1);
}

console.log("必須データチェック: OK");
console.log(`投入予定: ${rows.length}件`);
console.log(`バッチサイズ: ${BATCH_SIZE}件`);
console.log("");

let processed = 0;

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE);

  const { error } = await supabase
    .from("courses")
    .upsert(batch, {
      onConflict: "academic_year,syllabus_id",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("");
    console.error("❌ インポート失敗");
    console.error(`開始位置: ${i}`);
    console.error(error);
    process.exit(1);
  }

  processed += batch.length;

  const percent = ((processed / rows.length) * 100).toFixed(1);

  console.log(
    `✅ ${processed} / ${rows.length} (${percent}%)`
  );
}

console.log("");
console.log("================================");
console.log("インポート完了");
console.log("================================");
console.log(`処理した授業: ${processed}件`);

const { count, error: countError } = await supabase
  .from("courses")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("source", "keio_syllabus")
  .eq("academic_year", 2026);

if (countError) {
  console.log(
    "⚠️ 最終件数の確認だけ失敗しました:",
    countError.message
  );
} else {
  console.log(`Supabase上の2026公式授業: ${count}件`);
}

console.log("");
console.log("🎉 完了");
