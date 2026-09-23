import { spawn } from "node:child_process";

const SCRIPT = "scripts/import-keio-evaluations.mjs";

// 500件のバッチが終わってから、次のバッチを開始するまでの待機時間
const BETWEEN_BATCHES_MS = 5000;

let batchNumber = 0;
let stopping = false;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function runBatch() {
  return new Promise((resolve, reject) => {
    batchNumber++;

    console.log("");
    console.log("========================================");
    console.log(`🚀 自動バッチ ${batchNumber} を開始します`);
    console.log("========================================");
    console.log("");

    let output = "";

    const child = spawn(
      process.execPath,
      [SCRIPT],
      {
        stdio: ["inherit", "pipe", "pipe"],
        shell: false,
      }
    );

    child.stdout.on("data", (data) => {
      const text = data.toString();

      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();

      output += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (stopping) {
        resolve({
          finished: true,
          stopped: true,
        });
        return;
      }

      if (code !== 0) {
        reject(
          new Error(
            `バッチ処理が終了コード ${code} で停止しました`
          )
        );
        return;
      }

      const noRemaining =
        output.includes(
          "未処理の授業はありません"
        );

      resolve({
        finished: noRemaining,
        stopped: false,
      });
    });

    process.once("SIGINT", () => {
      stopping = true;

      console.log("");
      console.log("");
      console.log(
        "🛑 停止します。保存済みデータはそのまま残ります。"
      );
      console.log(
        "次回もう一度実行すれば、続きから再開できます。"
      );

      child.kill("SIGINT");
    });
  });
}

async function main() {
  console.log("");
  console.log("========================================");
  console.log("慶應Wiki 全シラバス自動インポート");
  console.log("========================================");
  console.log("");
  console.log(
    "500件ずつ自動で処理します。"
  );
  console.log(
    "停止したい場合は Ctrl + C を押してください。"
  );
  console.log("");

  while (!stopping) {
    try {
      const result = await runBatch();

      if (result.stopped) {
        break;
      }

      if (result.finished) {
        console.log("");
        console.log("========================================");
        console.log("🎉 全授業の処理が完了しました");
        console.log("========================================");
        console.log("");
        break;
      }

      console.log("");
      console.log(
        `✅ バッチ ${batchNumber} 完了`
      );
      console.log(
        `${BETWEEN_BATCHES_MS / 1000}秒後に次の500件を開始します...`
      );

      await sleep(BETWEEN_BATCHES_MS);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error("");
      console.error(
        `❌ 自動処理を停止しました: ${message}`
      );
      console.error("");
      console.error(
        "もう一度実行すれば、保存済みの続きから再開できます。"
      );

      process.exitCode = 1;
      break;
    }
  }
}

main();