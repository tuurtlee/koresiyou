// --- HTMLの要素を取得 ---
const suggestButton = document.getElementById("suggest-button");
const resultName = document.getElementById("result-name");
const resultCost = document.getElementById("result-cost");
const resultEffort = document.getElementById("result-effort");
const resetButton = document.getElementById("reset-button");

// --- スライダー用の要素を取得 ---
const costSlider = document.getElementById("cost-slider");
const minCostValue = document.getElementById("min-cost-value");
const maxCostValue = document.getElementById("max-cost-value");

// --- 遊びのリストを格納する変数 (最初は空) ---
let activities = [];

// --- ★ お金のカテゴリを定義 (data.json と一致させる) ★ ---
const costLabels = ["0円", "数百円", "千円", "数千円", "一万円", "一万円以上"];

// --- ページが読み込まれたときの処理 ---
window.addEventListener("DOMContentLoaded", () => {
  // 1. JSONを読み込む
  fetch("data.json") // もしGitHub Pagesで動かない場合は "./data.json" に
    .then((response) => {
      if (!response.ok) {
        throw new Error("ネットワークの応答が正しくありませんでした");
      }
      return response.json();
    })
    .then((data) => {
      activities = data;
      console.log("JSONデータの読み込み完了:", activities);
    })
    .catch((error) => {
      console.error("データの読み込みに失敗しました:", error);
      resultName.textContent = "データの読み込みに失敗しました";
    });

  // 2. ★ コストスライダーを「カテゴリ」で初期化 ★
  noUiSlider.create(costSlider, {
    start: [0, costLabels.length - 1], // 初期の最小・最大 (インデックス)
    connect: true,
    step: 1, // 1段階ずつ動く
    range: {
      min: 0,
      max: costLabels.length - 1, // 0からカテゴリの数-1まで
    },
    // ハンドルを動かしたときに値を表示に反映
    format: {
      // 数値 (0, 1, 2...) をラベル ("0円", "数百円"...) に変換
      to: (value) => {
        return costLabels[Math.round(value)];
      },
      // ラベルを数値に変換 (今回は使わないが設定)
      from: (value) => {
        return costLabels.indexOf(value);
      },
    },
  });

  // 3. スライダーの値が変更されたら、横のテキストを更新
  costSlider.noUiSlider.on("update", (values) => {
    // values にはフォーマットされたラベル (例: "数百円") が入る
    minCostValue.textContent = values[0];
    maxCostValue.textContent = values[1];
  });
});

// --- 提案ボタンがクリックされたときの処理 ---
suggestButton.addEventListener("click", () => {
  if (activities.length === 0) {
    resultName.textContent = "データ読み込み中...";
    return;
  }

  // 1. チェックされた「手間」の値を取得
  const checkedEffortBoxes = document.querySelectorAll('input[name="effort"]:checked');
  const selectedEfforts = Array.from(checkedEffortBoxes).map((box) => box.value);

  // 2. ★ スライダーの「お金」の「インデックス」を取得 ★
  // get(true) で数値 (0, 1, 2...) を取得
  const [minIndex, maxIndex] = costSlider.noUiSlider.get(true);

  // 3. ★ 選択されたインデックス範囲の「ラベル配列」を作成 ★
  // 例: [1, 3] -> ["数百円", "千円", "数千円"]
  const selectedCosts = costLabels.slice(minIndex, maxIndex + 1);

  // 4. リストを絞り込む
  let filteredActivities = activities;

  // 「手間」で絞り込み
  if (selectedEfforts.length > 0) {
    filteredActivities = filteredActivities.filter((activity) => {
      return selectedEfforts.includes(activity.effort);
    });
  }

  // ★ 「お金」で絞り込み (カテゴリ名で比較) ★
  filteredActivities = filteredActivities.filter((activity) => {
    // 選択されたラベル配列に、データが含まれているか
    return selectedCosts.includes(activity.cost);
  });

  // 5. 絞り込んだ結果からランダムに選ぶ
  if (filteredActivities.length === 0) {
    resultName.textContent = "該当する遊びがありません";
    resultCost.textContent = "（フィルター条件を変えてみてください）";
    resultEffort.textContent = "";
  } else {
    const randomIndex = Math.floor(Math.random() * filteredActivities.length);
    const selectedActivity = filteredActivities[randomIndex];

    // 結果を表示
    resultName.textContent = selectedActivity.name;
    // data.json の値 (文字列) をそのまま表示
    resultCost.textContent = "かかるお金: " + selectedActivity.cost;
    resultEffort.textContent = "手間: " + selectedActivity.effort;
  }
});

// --- リセットボタンがクリックされたときの処理 ---
resetButton.addEventListener("click", () => {
  // 1. 「手間」のチェックボックスをすべて外す
  const allEffortCheckboxes = document.querySelectorAll('input[name="effort"]');
  allEffortCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  // 2. ★ スライダーを初期位置（インデックス 0 と 5）に戻す ★
  costSlider.noUiSlider.set([0, costLabels.length - 1]);

  // 3. 結果表示もリセットする
  resultName.textContent = "ここに遊びの名前";
  resultCost.textContent = "ここに かかるお金";
  resultEffort.textContent = "ここに 手間";
});
