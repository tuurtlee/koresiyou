// --- HTMLの要素を取得 ---
const suggestButton = document.getElementById("suggest-button");
const resultName = document.getElementById("result-name");
const resultCost = document.getElementById("result-cost");
const resultEffort = document.getElementById("result-effort");

// --- 遊びのリストを格納する変数 (最初は空) ---
let activities = [];

// --- ページが読み込まれたら、まずJSONを読み込む ---
window.addEventListener("DOMContentLoaded", () => {
  // data.jsonファイルをfetch (取得) する
  fetch("data.json")
    .then((response) => {
      // ネットワークエラーなどをチェック
      if (!response.ok) {
        throw new Error("ネットワークの応答が正しくありませんでした");
      }
      // 応答をJSONとして解釈する
      return response.json();
    })
    .then((data) => {
      // 読み込んだデータをactivities変数に格納
      activities = data;
      console.log("JSONデータの読み込み完了:", activities);
    })
    .catch((error) => {
      // エラーハンドリング
      console.error("データの読み込みに失敗しました:", error);
      resultName.textContent = "データの読み込みに失敗しました";
    });
});

// --- ボタンがクリックされたときの処理 ---
suggestButton.addEventListener("click", () => {
  // データがまだ読み込めていない（0件の）場合は何もしない
  if (activities.length === 0) {
    resultName.textContent = "データ読み込み中...";
    return;
  }

  // 1. チェックされた「手間」の値を取得
  const checkedEffortBoxes = document.querySelectorAll('input[name="effort"]:checked');
  const selectedEfforts = Array.from(checkedEffortBoxes).map((box) => box.value);

  // 2. チェックされた「お金」の値を取得
  const checkedCostBoxes = document.querySelectorAll('input[name="cost"]:checked');
  const selectedCosts = Array.from(checkedCostBoxes).map((box) => box.value);

  // 3. リストを絞り込む
  let filteredActivities = activities; // まずは全リストを対象にする

  // 「手間」のチェックボックスが1つ以上選択されている場合
  if (selectedEfforts.length > 0) {
    filteredActivities = filteredActivities.filter((activity) => {
      // 選択された「手間」のいずれかに一致するか
      return selectedEfforts.includes(activity.effort);
    });
  }

  // 「お金」のチェックボックスが1つ以上選択されている場合
  if (selectedCosts.length > 0) {
    filteredActivities = filteredActivities.filter((activity) => {
      // 選択された「お金」のいずれかに一致するか
      return selectedCosts.includes(activity.cost);
    });
  }

  // 4. 絞り込んだ結果からランダムに選ぶ (ここから下は以前と同じ)
  if (filteredActivities.length === 0) {
    // 該当する遊びが1件もなかった場合
    resultName.textContent = "該当する遊びがありません";
    resultCost.textContent = "（フィルター条件を変えてみてください）";
    resultEffort.textContent = "";
  } else {
    // 絞り込んだリストからランダムに1つ選ぶ
    const randomIndex = Math.floor(Math.random() * filteredActivities.length);
    const selectedActivity = filteredActivities[randomIndex];

    // HTMLの各要素に、選ばれたオブジェクトの中身を表示する
    resultName.textContent = selectedActivity.name;
    resultCost.textContent = "かかるお金: " + selectedActivity.cost;
    resultEffort.textContent = "手間: " + selectedActivity.effort;
  }
});
