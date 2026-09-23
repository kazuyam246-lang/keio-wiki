const url = "https://gslbs.keio.jp/pub-syllabus/result";

const body = new URLSearchParams({
  URL_TYPE_PNM_nZ9CpQJc: "general",
  ACTION_ID: "SYLLABUS_SEARCH_RESULT",
  SUB_ACTION_ID: "SYLLABUS_SEARCH_KEYWORD_EXECUTE",

  KEYWORD_TTBLYR: "2026",
  KEYWORD_SMSCD: "5",
  KEYWORD_HALFSEMESTER: "ALL",
  KEYWORD_KBS_SMSCD: "ALL",
  KEYWORD_CAMPUS: "02",

  KEYWORD_PRGANDFCD: "",
  KEYWORD_KAMOKUNM: "",
  KEYWORD_TANTONM: "",
  KEYWORD_KEYWORD: "",

  KEYWORD_LESSONLANG: "ALL",
  KEYWORD_SCRGUTP: "ALL",
  KEYWORD_FLD1CD: "ALL",
  KEYWORD_FLD2CD: "ALL",
  KEYWORD_PROFESSIONALEXPERIENCECOURSE: "ALL",
  KEYWORD_ENGSUPPORT: "ALL",
  KEYWORD_LECTURELOCATION: "ALL",

  KEYWORD_FLD1NM: "すべて",
  KEYWORD_FLD2NM: "すべて",

  NARABIJUN: "1",
  SELECTED_TT_DWCD: "1",
});

console.log("慶應シラバス検索テスト");
console.log("------------------------");

const response = await fetch(url, {
  method: "POST",

  headers: {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    Referer: "https://gslbs.keio.jp/pub-syllabus/search",
  },

  body,
});

console.log("HTTP:", response.status);
console.log("Content-Type:", response.headers.get("content-type"));

const text = await response.text();

console.log("取得文字数:", text.length);

console.log("\n先頭500文字");
console.log("------------------------");
console.log(text.slice(0, 500));

try {
  const data = JSON.parse(text);

  console.log("\nJSON取得成功！");
  console.log("------------------------");

  if (Array.isArray(data)) {
    console.log("配列件数:", data.length);

    if (data.length > 0) {
      console.log("\n最初の1件:");
      console.log(JSON.stringify(data[0], null, 2));
    }
  } else {
    console.log("トップレベルのキー:");
    console.log(Object.keys(data));

    console.log("\nJSON先頭部分:");
    console.log(JSON.stringify(data, null, 2).slice(0, 3000));
  }
} catch {
  console.log("\nJSONとしては解析できませんでした。");
}
