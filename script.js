// --- HTMLの要素を取得 ---
const suggestButton = document.getElementById("suggest-button");
const resultName = document.getElementById("result-name");
const resultCost = document.getElementById("result-cost");
const resultEffort = document.getElementById("result-effort");
const resetButton = document.getElementById("reset-button");
const loader = document.getElementById("loader");
const suggestButtonSpan = document.getElementById("suggest-button-span");
const clickCounterText = document.getElementById("click-counter-text"); // ★ 追加

// --- デュアルスライダー要素 ---
const sliderContainer = document.getElementById("cost-slider-container");
const lowerSlider = document.getElementById("lower-slider");
const upperSlider = document.getElementById("upper-slider");
const lowerValue = document.getElementById("lower-value");
const upperValue = document.getElementById("upper-value");

// --- 遊びのリストを格納する変数 (最初は空) ---
let activities = [];
let isLoading = false; // 処理中フラグ

// --- お金のカテゴリを定義 (data.json と一致させる) ---
const costLabels = ["0円", "数百円", "千円", "数千円", "一万円", "一万円以上"];
// カテゴリのインデックス最大値
const maxIndex = costLabels.length - 1;

// --- ★ クリック回数制限用の設定 ★ ---
const STORAGE_KEY = "koreShiyoClickData";
const MAX_CLICKS = 20;

// ★ 今日の日付を YYYY-MM-DD 形式で取得する関数
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ★ localStorage からデータを読み込む関数
function getClickData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { clickCount: 0, lastClickDate: "" };
  }
  return JSON.parse(data);
}

// ★ localStorage にデータを保存する関数
function saveClickData(count, date) {
  const data = { clickCount: count, lastClickDate: date };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ★ ボタンの状態と残り回数テキストを更新する関数 (修正) ★
function updateButtonState(count) {
  const remainingClicks = MAX_CLICKS - count;

  if (remainingClicks <= 0) {
    // 上限に達した場合
    suggestButton.classList.add("is-disabled");
    if (suggestButtonSpan) {
      suggestButtonSpan.innerHTML = "また明日";
    }
    suggestButton.disabled = true;
    clickCounterText.innerHTML = "本日の回数上限に達しました"; // ★ テキスト更新
  } else {
    // まだ回数が残っている場合
    suggestButton.classList.remove("is-disabled");
    if (suggestButtonSpan) {
      suggestButtonSpan.innerHTML = "コレしよ！";
    }
    suggestButton.disabled = false;
    clickCounterText.innerHTML = `本日の残り回数： ${remainingClicks} / ${MAX_CLICKS}`; // ★ テキスト更新
  }
}

// ★ クリック制限をチェックし、カウントを返す関数
function checkClickLimit() {
  const today = getTodayDate();
  let { clickCount, lastClickDate } = getClickData();

  if (lastClickDate !== today) {
    // 日付が違うのでリセット
    clickCount = 0;
    saveClickData(clickCount, today);
  }
  return clickCount;
}

// --- ページが読み込まれたときの処理 ---
window.addEventListener("DOMContentLoaded", () => {
  // 1. JSONを読み込む
  fetch("data.json")
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
  [lowerSlider, upperSlider].forEach((slider) => {
    slider.min = 0;
    slider.max = maxIndex;
    slider.step = 1;
  });
  const initialLower = 0;
  const initialUpper = maxIndex;
  lowerSlider.value = initialLower;
  upperSlider.value = initialUpper;
  updateSliderDisplay(initialLower, initialUpper);

  // 3. スライダーのイベントリスナーを設定
  lowerSlider.addEventListener("input", onSliderInput);
  upperSlider.addEventListener("input", onSliderInput);

  // 4. 「手間」のチェックボックスをすべてチェックする (初期値)
  const allEffortCheckboxes = document.querySelectorAll('input[name="effort"]');
  allEffortCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });

  // 5. ★ ページ読み込み時にクリック回数をチェックしてボタン状態とテキストを設定 ★
  const currentCount = checkClickLimit();
  updateButtonState(currentCount);
});

// --- スライダーイベント関数 ---
function onSliderInput() {
  let lowerIndex = parseInt(lowerSlider.value);
  let upperIndex = parseInt(upperSlider.value);

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
  lowerValue.innerHTML = costLabels[lowerIndex];
  upperValue.innerHTML = costLabels[upperIndex];
  const lowerPercent = (lowerIndex / maxIndex) * 100;
  const upperPercent = (upperIndex / maxIndex) * 100;
  sliderContainer.style.setProperty("--lower-val-percent", `${lowerPercent}%`);
  sliderContainer.style.setProperty("--upper-val-percent", `${upperPercent}%`);
}

// --- 提案ボタンがクリックされたときの処理 ---
suggestButton.addEventListener("click", (event) => {
  event.preventDefault();
  if (isLoading) return;

  // ★ 1. クリック回数をチェック ★
  const today = getTodayDate();
  let currentCount = checkClickLimit();

  if (currentCount >= MAX_CLICKS) {
    updateButtonState(currentCount);
    return;
  }

  // ★ 2. クリック回数を加算して保存 ★
  currentCount++;
  saveClickData(currentCount, today);

  // ★ 3. ボタンの状態を更新 (ローディング前にテキストを更新) ★
  updateButtonState(currentCount);

  const resultArea = document.getElementById("result-area");

  if (activities.length === 0) {
    resultName.innerHTML = "データ読み込み中...";
    return;
  }

  // ▼▼▼ ローディング処理 ▼▼▼
  resultName.innerHTML = "";
  resultCost.innerHTML = "";
  resultEffort.innerHTML = "";
  loader.style.display = "block";
  resultArea.classList.add("loading");

  suggestButton.disabled = true;
  resetButton.disabled = true;
  isLoading = true;

  const randomDelay = 2000 + Math.floor(Math.random() * 1001);
  console.log("遅延時間:", randomDelay, "ms");

  setTimeout(() => {
    loader.style.display = "none";
    resetButton.disabled = false;
    resultArea.classList.remove("loading");

    // 5. 絞り込みを実行して結果を表示
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
      filteredActivities = filteredActivities.filter((activity) =>
        selectedEfforts.includes(activity.effort)
      );
    }
    filteredActivities = filteredActivities.filter((activity) =>
      selectedCosts.includes(activity.cost)
    );

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

    // ★ 6. ボタンの状態を最終更新 (ローディング後に再度更新) ★
    // (suggestButton.disabled = false; の代わり)
    updateButtonState(currentCount);

    isLoading = false;
  }, randomDelay);
  // ▲▲▲ ローディング処理終了 ▲▲▲
});

// --- リセットボタンがクリックされたときの処理 ---
resetButton.addEventListener("click", () => {
  // 1. 「手間」のチェックボックスをすべてチェックする
  const allEffortCheckboxes = document.querySelectorAll('input[name="effort"]');
  allEffortCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });

  // 2. スライダーを初期値（0円〜一万円以上）に設定
  const minResetIndex = 0;
  const maxResetIndex = maxIndex;
  lowerSlider.value = minResetIndex;
  upperSlider.value = maxResetIndex;
  updateSliderDisplay(minResetIndex, maxResetIndex);

  // 3. 結果表示もリセットする
  resultName.innerHTML = "ここに結果が表示されます";
  resultCost.innerHTML = "";
  resultEffort.innerHTML = "";
});
