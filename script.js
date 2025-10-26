// --- HTMLの要素を取得 ---
const suggestButton = document.getElementById("suggest-button");
const resultName = document.getElementById("result-name");
const resultCost = document.getElementById("result-cost");
const resultEffort = document.getElementById("result-effort");
const resetButton = document.getElementById("reset-button");
const loader = document.getElementById("loader"); // ローダー要素を取得

// --- デュアルスライダー要素 ---
const sliderContainer = document.getElementById("cost-slider-container");
const lowerSlider = document.getElementById("lower-slider");
const upperSlider = document.getElementById("upper-slider");
const lowerValue = document.getElementById("lower-value");
const upperValue = document.getElementById("upper-value");

// --- 遊びのリストを格納する変数 (最初は空) ---
let activities = [];
let isLoading = false; // ★ 処理中フラグ (連打防止用)

// --- お金のカテゴリを定義 (data.json と一致させる) ---
const costLabels = ["0円", "数百円", "千円", "数千円", "一万円", "一万円以上"];
// カテゴリのインデックス最大値
const maxIndex = costLabels.length - 1;

// --- ページが読み込まれたときの処理 ---
window.addEventListener("DOMContentLoaded", () => {
  // 1. JSONを読み込む
  fetch("data.json") // もしGitHub Pagesで動かない場合は "./data.json" に
    .then((response) =>
      response.ok ? response.json() : Promise.reject(response)
    )
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
suggestButton.addEventListener("click", (event) => {
  event.preventDefault();

  // ★ 処理中なら何もしない (連打防止) ★
  if (isLoading) {
    return;
  }

  const resultArea = document.getElementById("result-area");

  if (activities.length === 0) {
    resultName.innerHTML = "データ読み込み中...";
    return;
  }

  // ▼▼▼ ローディング処理 ▼▼▼
  // 1. 前の結果をクリア & ローダーを表示
  resultName.innerHTML = "";
  resultCost.innerHTML = "";
  resultEffort.innerHTML = "";
  loader.style.display = "block";

  // 2. ローディング中はボタンを無効化 & フラグを立てる
  suggestButton.disabled = true;
  resetButton.disabled = true;
  isLoading = true; // ★ フラグを true に設定 ★

  // 3. アニメーションを待つ (例: 1500ms = 1.5秒)
  setTimeout(() => {
    // 4. ローダーを非表示 & ボタンを有効化
    loader.style.display = "none";
    suggestButton.disabled = false;
    resetButton.disabled = false;

    // 5. 絞り込みを実行して結果を表示 (既存のロジック)
    const checkedEffortBoxes = document.querySelectorAll(
      'input[name="effort"]:checked'
    );
    const selectedEfforts = Array.from(checkedEffortBoxes).map(
      (box) => box.value
    );

    const minIndex = parseInt(lowerSlider.value);
    const maxIndex = parseInt(upperSlider.value);
    const selectedCosts = costLabels.slice(minIndex, maxIndex + 1);

    let filteredActivities = activities;
    if (selectedEfforts.length > 0) {
      filteredActivities = filteredActivities.filter((activity) => {
        return selectedEfforts.includes(activity.effort);
      });
    }
    filteredActivities = filteredActivities.filter((activity) => {
      return selectedCosts.includes(activity.cost);
    });

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

    isLoading = false; // ★ 結果表示後にフラグを false に戻す ★
  }, 1500);
  // ▲▲▲ ローディング処理終了 ▲▲▲
});

// --- リセットボタンがクリックされたときの処理 ---
resetButton.addEventListener("click", () => {
  // 1. 「手間」のチェックボックスをすべてチェックする
  const allEffortCheckboxes = document.querySelectorAll('input[name="effort"]');
  allEffortCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });

  // 2. スライダーを【初期値（0円〜一万円以上）】に設定
  const minResetIndex = 0;
  const maxResetIndex = maxIndex;

  lowerSlider.value = minResetIndex;
  upperSlider.value = maxResetIndex;

  updateSliderDisplay(minResetIndex, maxResetIndex);

  // 3. 結果表示もリセットする
  resultName.innerHTML = "ここに結果が表示されます"; // ★ 初期テキストに戻す
  resultCost.innerHTML = "";
  resultEffort.innerHTML = "";
});
