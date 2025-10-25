// --- HTMLの要素を取得 ---
const suggestButton = document.getElementById("suggest-button");
const resultName = document.getElementById("result-name");
const resultCost = document.getElementById("result-cost");
const resultEffort = document.getElementById("result-effort");
const resetButton = document.getElementById("reset-button");

// --- デュアルスライダー要素 ---
const sliderContainer = document.getElementById("cost-slider-container");
const lowerSlider = document.getElementById("lower-slider");
const upperSlider = document.getElementById("upper-slider");
const lowerValue = document.getElementById("lower-value");
const upperValue = document.getElementById("upper-value");

// --- 遊びのリストを格納する変数 (最初は空) ---
let activities = [];

// --- お金のカテゴリを定義 (data.json と一致させる) ---
const costLabels = ["0円", "数百円", "千円", "数千円", "一万円", "一万円以上"];
// カテゴリのインデックス最大値
const maxIndex = costLabels.length - 1;

// --- ページが読み込まれたときの処理 ---
window.addEventListener("DOMContentLoaded", () => {
  // 1. JSONを読み込む
  fetch("data.json") // もしGitHub Pagesで動かない場合は "./data.json" に
    .then((response) => (response.ok ? response.json() : Promise.reject(response)))
    .then((data) => {
      activities = data;
      console.log("JSONデータの読み込み完了:", activities);
    })
    .catch((error) => {
      console.error("データの読み込みに失敗しました:", error);
      resultName.innerHTML = "データの読み込みに失敗しました";
    });

  // 2. デュアルスライダーを「カテゴリ（インデックス）」で初期化

  // スライダーの min, max, step, value を設定
  [lowerSlider, upperSlider].forEach((slider) => {
    slider.min = 0;
    slider.max = maxIndex;
    slider.step = 1;
  });

  // 初期値（0円〜一万円以上）を設定
  const initialLower = 0;
  const initialUpper = maxIndex;
  lowerSlider.value = initialLower;
  upperSlider.value = initialUpper;

  // スライダーの初期状態（トラックの色と値表示）を更新
  updateSliderDisplay(initialLower, initialUpper);

  // 3. スライダーのイベントリスナーを設定
  lowerSlider.addEventListener("input", onSliderInput);
  upperSlider.addEventListener("input", onSliderInput);

  // 4. 「手間」のチェックボックスをすべてチェックする (初期値)
  const allEffortCheckboxes = document.querySelectorAll('input[name="effort"]');
  allEffortCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });
});

// --- スライダーイベント関数 ---
function onSliderInput() {
  let lowerIndex = parseInt(lowerSlider.value);
  let upperIndex = parseInt(upperSlider.value);

  // 最小値が最大値を超えないように制御
  if (lowerIndex > upperIndex) {
    if (this === lowerSlider) {
      upperSlider.value = lowerIndex;
      upperIndex = lowerIndex;
    } else {
      lowerSlider.value = upperIndex;
      lowerIndex = upperIndex;
    }
  }

  updateSliderDisplay(lowerIndex, upperIndex);
}

// スライダーの表示（値とトラック色）を更新する関数
function updateSliderDisplay(lowerIndex, upperIndex) {
  // 1. 値の表示（span）を更新
  lowerValue.innerHTML = costLabels[lowerIndex];
  upperValue.innerHTML = costLabels[upperIndex];

  // 2. トラックの色（CSS変数）を更新
  const lowerPercent = (lowerIndex / maxIndex) * 100;
  const upperPercent = (upperIndex / maxIndex) * 100;

  sliderContainer.style.setProperty("--lower-val-percent", `${lowerPercent}%`);
  sliderContainer.style.setProperty("--upper-val-percent", `${upperPercent}%`);
}

// --- 提案ボタンがクリックされたときの処理 ---
suggestButton.addEventListener("click", () => {
  // 結果表示エリアを取得して表示する (初回のみ影響)
  const resultArea = document.getElementById("result-area");
  console.log("クリック:", activities);
  resultArea.style.display = "block";
  console.log(resultArea.style.display, activities);

  if (activities.length === 0) {
    resultName.innerHTML = "データ読み込み中...";
    return;
  }

  // 1. チェックされた「手間」の値を取得
  const checkedEffortBoxes = document.querySelectorAll('input[name="effort"]:checked');
  const selectedEfforts = Array.from(checkedEffortBoxes).map((box) => box.value);

  // 2. スライダーの「お金」の「インデックス」を取得
  const minIndex = parseInt(lowerSlider.value);
  const maxIndex = parseInt(upperSlider.value);

  // 3. 選択されたインデックス範囲の「ラベル配列」を作成
  const selectedCosts = costLabels.slice(minIndex, maxIndex + 1);

  // 4. リストを絞り込む
  let filteredActivities = activities;

  if (selectedEfforts.length > 0) {
    filteredActivities = filteredActivities.filter((activity) => {
      return selectedEfforts.includes(activity.effort);
    });
  }

  filteredActivities = filteredActivities.filter((activity) => {
    return selectedCosts.includes(activity.cost);
  });

  // 5. 絞り込んだ結果からランダムに選ぶ
  if (filteredActivities.length === 0) {
    resultName.innerHTML = "該当する遊びがありません";
    resultCost.innerHTML = "（フィルター条件を変えてみてください）";
    resultEffort.innerHTML = "";
  } else {
    const randomIndex = Math.floor(Math.random() * filteredActivities.length);
    const selectedActivity = filteredActivities[randomIndex];

    resultName.innerHTML = selectedActivity.name;
    resultCost.innerHTML = "かかるお金: " + selectedActivity.cost;
    resultEffort.innerHTML = "手間: " + selectedActivity.effort;
  }
});

// --- リセットボタンがクリックされたときの処理 ---
resetButton.addEventListener("click", () => {
  // 1. ★ 「手間」のチェックボックスをすべて【チェックする】に変更 ★
  const allEffortCheckboxes = document.querySelectorAll('input[name="effort"]');
  allEffortCheckboxes.forEach((checkbox) => {
    checkbox.checked = true; // false から true に変更
  });

  // 2. ★ スライダーを【初期値（0円〜一万円以上）】に設定 ★
  const minResetIndex = 0; // "0円" のインデックス
  const maxResetIndex = maxIndex; // "一万円以上" のインデックス (costLabels.length - 1 と同じ)

  // スライダーの値をインデックス 0 と maxIndex に設定
  lowerSlider.value = minResetIndex;
  upperSlider.value = maxResetIndex;

  // 表示を更新
  updateSliderDisplay(minResetIndex, maxResetIndex);

  // 3. 結果表示もリセットする
  resultName.innerHTML = "ここに遊びの名前";
  resultCost.innerHTML = "ここに かかるお金";
  resultEffort.innerHTML = "ここに 手間";
});
