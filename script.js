const firebaseConfig = {
  apiKey: "AIzaSyD0SccKNWtqgJrsCZepyA5PfFHqfajB2bw",
  authDomain: "denntetu.firebaseapp.com",
  databaseURL: "https://denntetu-default-rtdb.firebaseio.com",
  projectId: "denntetu",
  storageBucket: "denntetu.firebasestorage.app",
  messagingSenderId: "233879036281",
  appId: "1:233879036281:web:aa66129cfa45b7dfaf0fa8",
  measurementId: "G-0L4G45YDYM"
};

// Firebase 初期化
firebase.initializeApp(firebaseConfig);

// Realtime Database 取得
const database = firebase.database();

let pendingTeam = null;
let myTeam = null;
let rollDiceBtnA, rollDiceBtnB;
let arriveBtnA, arriveBtnB;
let waitA, waitB;
let diceOverlay;
let diceImage;
let cutinVideo;
let diceResultReady = false;
let diceGif;
let diceState = "idle";
let diceResult = null;
let isTen = false;
let diceWrapper;
let isDiceOverlayOpen = false;
let diceSe;
let isRolling = false;
let isTransferOverlayOpen = false;
const myPlayerId = getPlayerId();
let myDisplayName = null;
let isGameLoaded = false;
let lastResetAt = null;
let playersLoaded = false;
let teamNameCache = {
  A: "Aチーム",
  B: "Bチーム"
};

database.ref("routeGame/teamNames").on("value", snap => {
  if (snap.exists()) {
    teamNameCache = snap.val();
  }
});

const HIDDEN_NAMES = ["管理者"];

const stations = [
  { id: 0, name: "名古屋", type: "start" },

  { id: 1, name: "尾頭橋" },
  { id: 2, name: "金山" },
  { id: 3, name: "熱田" },
  { id: 4, name: "笠寺" },
  { id: 5, name: "大高" },
  { id: 6, name: "南大高" },
  { id: 7, name: "共和" },
  { id: 8, name: "大府" },
  { id: 9, name: "逢妻" },
  { id: 10, name: "刈谷" },
  { id: 11, name: "野田新町" },
  { id: 12, name: "東刈谷" },
  { id: 13, name: "三河安城" },
  { id: 14, name: "安城" },
  { id: 15, name: "西岡崎" },
  { id: 16, name: "岡崎" },
  { id: 17, name: "相見" },
  { id: 18, name: "幸田" },
  { id: 19, name: "三ヶ根" },
  { id: 20, name: "三河塩津" },
  { id: 21, name: "蒲郡" },
  { id: 22, name: "三河三谷" },
  { id: 23, name: "三河大津" },
  { id: 24, name: "愛知御津" },
  { id: 25, name: "西小坂井" },

  { id: 26, name: "豊橋", type: "transfer" },

  { id: 27, name: "二川", note: "静岡行" },
  { id: 28, name: "新所原" },
  { id: 29, name: "鷲津" },
  { id: 30, name: "新居町" },
  { id: 31, name: "弁天島" },
  { id: 32, name: "舞阪" },
  { id: 33, name: "高塚" },
  { id: 34, name: "浜松" },

  { id: 35, name: "天竜川" },
  { id: 36, name: "豊田町" },
  { id: 37, name: "磐田" },
  { id: 38, name: "御厨" },
  { id: 39, name: "袋井" },
  { id: 40, name: "愛野" },
  { id: 41, name: "掛川" },
  { id: 42, name: "菊川" },
  { id: 43, name: "金谷" },

  { id: 44, name: "島田", type: "transfer" },

  { id: 45, name: "六合", note: "熱海行" },
  { id: 46, name: "藤枝" },
  { id: 47, name: "西焼津" },
  { id: 48, name: "焼津" },
  { id: 49, name: "用宗" },
  { id: 50, name: "安倍川" },
  { id: 51, name: "静岡" },
  { id: 52, name: "東静岡" },
  { id: 53, name: "草薙" },
  { id: 54, name: "清水" },
  { id: 55, name: "興津" },
  { id: 56, name: "由比" },
  { id: 57, name: "蒲原" },
  { id: 58, name: "新蒲原" },
  { id: 59, name: "富士川" },
  { id: 60, name: "富士" },
  { id: 61, name: "吉原" },
  { id: 62, name: "東田子の浦" },
  { id: 63, name: "原" },
  { id: 64, name: "片浜" },
  { id: 65, name: "沼津" },
  { id: 66, name: "三島" },
  { id: 67, name: "函南" },

  { id: 68, name: "熱海", type: "transfer" },

  { id: 69, name: "湯河原", note: "上野東京ライン" },
  { id: 70, name: "真鶴" },
  { id: 71, name: "根府川" },
  { id: 72, name: "早川" },
  { id: 73, name: "小田原" },
  { id: 74, name: "鴨宮" },
  { id: 75, name: "国府津" },
  { id: 76, name: "二宮" },
  { id: 77, name: "大磯" },
  { id: 78, name: "平塚" },
  { id: 79, name: "茅ヶ崎" },
  { id: 80, name: "辻堂" },
  { id: 81, name: "藤沢" },
  { id: 82, name: "大船" },
  { id: 83, name: "戸塚" },

  { id: 84, name: "横浜", type: "goal" }
];

// チーム状態
const teams = {
  A: {
    position: 0,
    phase: "SELECT_RELIEF", // ← 唯一の状態
    waitUntil : null,
    nextPosition: null,
    history: [],
    dice: null,
    plus1Ready: false,
    relief: null, 
    reliefCount: {
      plus3: 0,            // 「3,3,3」使用回数
      double: 0 ,           // 「ダブル」使用回数
    },
    reliefUsedThisRoll : false,
  },
  B: {
    position: 0,
    phase: "SELECT_RELIEF",
    waitUntil: null,
    nextPosition: null,
    history: [],
    dice: null,
    plus1Ready: false,
    relief: null,
    reliefCount: {
      plus3: 0,            // 「3,3,3」使用回数
      double: 0,            // 「ダブル」使用回数
    } ,
    reliefUsedThisRoll : false, 
  }
};

const RELIEF_TYPES = {
  PLUS3: "PLUS3",     // 3,3,3
  DOUBLE: "DOUBLE",   // ダブル
  PLUS1: "PLUS1"      // +1
};

const goalIndex = stations.findIndex(s => s.type === "goal");

function reliefLabel(type) {
  if (type === RELIEF_TYPES.PLUS3) return "3・3・3";
  if (type === RELIEF_TYPES.DOUBLE) return "ダブル";
  if (type === RELIEF_TYPES.PLUS1) return "＋1";
  return "未選択";
}

function ensureTeamNames() {
  const ref = database.ref("routeGame/teamNames");
  ref.once("value", snap => {
    if (snap.exists()) return;
    ref.set({
      A: "Aチーム",
      B: "Bチーム"
    });
  });
}


// 表示更新
function updateView() {
  ["A", "B"].forEach(teamKey => {
    const team = teams[teamKey];

    // 現在地
    document.getElementById(`team${teamKey}-position`).textContent =
      stations[team.position]?.name ?? "不明";

    // サイコロ結果（★追加）
    const diceEl = document.getElementById(`diceResult${teamKey}`);
// サイコロ結果表示
  if (team.dice != null) {
    diceEl.textContent = team.dice;
  } else {
    diceEl.textContent = "-";
  }

    // 到着予定駅（★ここが追加）
    const arrivalEl = document.getElementById(`team${teamKey}-arrival`);
    if (team.phase === "ROLLED" && team.nextPosition != null) {
      arrivalEl.textContent =
        `到着予定駅: ${stations[team.nextPosition].name}`;
    } else {
      arrivalEl.textContent = "到着予定駅: -";
    }

    const remainEl = document.getElementById(`team${teamKey}-remaining`);
    const remaining = Math.max(goalIndex - team.position, 0);
    remainEl.textContent = `ゴールまであと ${remaining}駅`;

    document.getElementById("reliefA").textContent =
      reliefLabel(teams.A.relief);

    document.getElementById("reliefB").textContent =
      reliefLabel(teams.B.relief);
  });
  renderMap();

}

function updateControlLock() {

  ["A", "B"].forEach(teamKey => {
    const team = teams[teamKey];
    const isMine = myTeam === teamKey;
    const plus3Btn  = document.getElementById(`plus3Btn${teamKey}`);
    const doubleBtn = document.getElementById(`doubleBtn${teamKey}`);

  plus3Btn.style.display = "none";
  doubleBtn.style.display = "none";

    const rollBtn   = document.getElementById(`rollDiceBtn${teamKey}`);
    const arriveBtn = document.getElementById(`arriveBtn${teamKey}`);
    const undoBtn   = document.getElementById(`undoBtn${teamKey}`);
    const walkInput = document.getElementById(`walk${teamKey}`);
    const addBtn    = document.getElementById(`addWalk${teamKey}`);

    // 全部非表示
    rollBtn.style.display = "none";
    arriveBtn.style.display = "none";
    undoBtn.style.display = "none";
    walkInput.style.display = "none";
    addBtn.style.display = "none";

switch (team.phase) {

  case "SELECT_RELIEF":
    document.getElementById(`reliefSelect${teamKey}`).style.display =
      isMine ? "block" : "none";
    break;

  case "BEFORE_ROLL":
    document.getElementById(`reliefSelect${teamKey}`).style.display = "none";
    if (isMine) {
      rollBtn.style.display = "inline-block";
      undoBtn.style.display = "inline-block";
    }
    break;

  case "ROLLED":
    document.getElementById(`reliefSelect${teamKey}`).style.display = "none";
    if (isMine) {
      arriveBtn.style.display = "inline-block";

      if (!team.reliefUsedThisRoll) {
        if (team.relief === RELIEF_TYPES.PLUS3 && team.reliefCount.plus3 < 3) {
          plus3Btn.style.display = "inline-block";
        }
        if (team.relief === RELIEF_TYPES.DOUBLE && team.reliefCount.double < 1) {
          doubleBtn.style.display = "inline-block";
        }
      }
    }
    break;

  case "WAITING":
    document.getElementById(`reliefSelect${teamKey}`).style.display = "none";
    break;

  case "AFTER_WAIT":
    document.getElementById(`reliefSelect${teamKey}`).style.display = "none";
    if (isMine) {
      walkInput.style.display = "inline-block";
      addBtn.style.display = "inline-block";
    }
    break;

  default:
    document.getElementById(`reliefSelect${teamKey}`).style.display = "none";
    break;
 }
})
}

function isValidDisplayName(name) {
  if (!name) return false;
  if (name.trim() === "") return false;
  return true;
}

function isValidTeam(team) {
  return team === "A" || team === "B";
}

function resetAllData() {
  const resetTime = Date.now();

  // ローカル初期化
  ["A", "B"].forEach(k => {
    teams[k] = {
      position: 0,
      phase: "SELECT_RELIEF",
      waitUntil: null,
      nextPosition: null,
      history: [],
      dice: null,
      plus1Ready: false,
      relief: null,
      reliefCount: { plus3: 0, double: 0 },
      reliefUsedThisRoll: false
    };
  });

  // Firebaseは「routeGame」に一括
  database.ref("routeGame").set({
    teams: {
      A: createInitialTeam(),
      B: createInitialTeam()
    },
      teamNames: {
    A: "Aチーム",
    B: "Bチーム"
  },
    resetAt: resetTime
  });

  database.ref("players").remove();
  database.ref("chat").remove();
  database.ref("logs").remove();

  localStorage.clear();
  sessionStorage.clear();

  myDisplayName = null;
  myTeam = null;

  // UI強制リセット
  isDiceOverlayOpen = false;
  isTransferOverlayOpen = false;
  diceState = "idle";
  pendingTeam = null;

  if (cutinVideo) {
    cutinVideo.pause();
    cutinVideo.currentTime = 0;
    cutinVideo.onended = null;
    cutinVideo.classList.add("hidden");
  }

  if (diceOverlay) {
    diceOverlay.classList.add("hidden");
    diceOverlay.style.display = "none";
  }

}




window.addEventListener("DOMContentLoaded", () => {

  ensureTeamNames();
  normalizeMyPlayer();

  waitA = document.getElementById("waitA");
  waitB = document.getElementById("waitB");

  rollDiceBtnA = document.getElementById("rollDiceBtnA");
  rollDiceBtnB = document.getElementById("rollDiceBtnB");
  arriveBtnA   = document.getElementById("arriveBtnA");
  arriveBtnB   = document.getElementById("arriveBtnB");

  loadProgress();
  updateView();
  updateControlLock();
  updateScreen();
  updateMyTeamLabel();
  loadMembers();

  const savedName = localStorage.getItem("displayName");
  if (savedName) {
    myDisplayName = savedName;
  }



  const diceResultA = document.getElementById("diceResultA");
  const diceResultB = document.getElementById("diceResultB");

  const registerBtn = document.getElementById("registerBtn");
  const registerScreen = document.getElementById("registerScreen");
  const gameScreen = document.getElementById("gameScreen");

  const editNameBtn = document.getElementById("editNameBtn");
  const nameEditArea = document.getElementById("nameEditArea");
  const nameEditInput = document.getElementById("nameEditInput");
  const saveNameBtn = document.getElementById("saveNameBtn");
  const cancelNameBtn = document.getElementById("cancelNameBtn");

  // 編集エリアを開く
  editNameBtn.addEventListener("click", () => {
    if (!myDisplayName) {
      alert("名前が未設定です。一度登録してください");
      return;
    }

    nameEditInput.value = myDisplayName;
    nameEditArea.style.display = "block";
  });


  // キャンセル
  cancelNameBtn.addEventListener("click", () => {
    nameEditArea.style.display = "none";
  });

  // 保存
  saveNameBtn.addEventListener("click", () => {
    const newName = nameEditInput.value.trim();
    if (!newName) {
      alert("名前を入力してください");
      return;
     }

    // 自分の表示名だけ更新
    myDisplayName = newName;

    // Firebase（players）
    database.ref("players/" + myPlayerId + "/displayName")
      .set(newName);

    // localStorage（復帰対策）
    localStorage.setItem("displayName", newName);

    nameEditArea.style.display = "none";
  });


  diceOverlay = document.getElementById("diceOverlay");
  cutinVideo = document.getElementById("cutinVideo");

  diceGif = document.getElementById("diceGif");

  diceGif.addEventListener("click", () => {
    if (diceState !== "showPNG") return;
    startDiceGif();
  });


  const menuToggleBtn = document.getElementById("menuToggleBtn");
  const floatingMenu = document.getElementById("floatingMenu");

  if (!menuToggleBtn || !floatingMenu) return;
  floatingMenu.classList.add("hidden");

  menuToggleBtn.addEventListener("click", e => {
    e.stopPropagation();
    floatingMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    floatingMenu.classList.add("hidden");
  });

  floatingMenu.addEventListener("click", e => {
    e.stopPropagation();
  });

  diceOverlay.addEventListener("click", () => {

    if (diceState === "showPNG") {
      startDiceGif();
      return;
    }

  if (diceState === "rollingGIF") return;

  if (diceState !== "canClose" && diceState !== "cutin") {
    closeDiceOverlay();
    return;
  }

  // 結果後
  if (diceState === "canClose") {
    if (isTen) {
      startCutin();   // ★ 10だけカットイン
    } else {
      closeDiceOverlay();
    }
  }

 });

 diceWrapper = document.getElementById("diceWrapper");

  registerBtn.addEventListener("click", () => {
  const name = document.getElementById("playerName").value.trim();
  const teamValue = document.getElementById("teamSelect").value;
  if (!name) {
    alert("名前を入力してください");
    return;
  }

  myDisplayName = name;
  myTeam = teamValue;
  localStorage.setItem("displayName", name);
  localStorage.setItem("myTeam", myTeam);

  database.ref("players/" + myPlayerId).set({
    displayName: name,
    team: myTeam,
    joinedAt: Date.now()
  });

    saveTeam(myTeam);

    registerScreen.style.display = "none";
    gameScreen.style.display = "block";

    updateControlLock();
    updateMyTeamLabel();
  });


  document.getElementById("arriveBtnA").addEventListener("click", () => {
    arriveTeam("A");
  });

  document.getElementById("arriveBtnB").addEventListener("click", () => {
    arriveTeam("B");
  });

  document.getElementById("undoBtnA").addEventListener("click", () => undoMove("A"));
  document.getElementById("undoBtnB").addEventListener("click", () => undoMove("B")); 
  
  document.getElementById("addWalkA").addEventListener("click", () => {
    addWalk("A");
  });

  document.getElementById("addWalkB").addEventListener("click", () => {
    addWalk("B");
  });

  rollDiceBtnA.addEventListener("click", () => {
    if (myTeam !== "A") return;
    openDiceOverlay("A");
  });

  rollDiceBtnB.addEventListener("click", () => {
    if (myTeam !== "B") return;
   openDiceOverlay("B");
  });

  document.getElementById("plus3BtnA")
    .addEventListener("click", () => usePlus3("A"));
  document.getElementById("doubleBtnA")
    .addEventListener("click", () => useDouble("A"));

  
  document.getElementById("plus3BtnB")
    .addEventListener("click", () => usePlus3("B"));
  document.getElementById("doubleBtnB")
    .addEventListener("click", () => useDouble("B"));

  const overlayCloseBtn = document.getElementById("overlayCloseBtn");
  const overlay = document.getElementById("overlay");

  if (overlayCloseBtn && overlay) {
    overlayCloseBtn.addEventListener("click", () => {
      overlay.style.display = "none";
      isTransferOverlayOpen = false;
    });
  }

  // ③ 表示更新
    updateView();
    updateControlLock();
    updateScreen();
    updateMyTeamLabel();

  database.ref("routeGame/teams/A").on("value", snap => {
    if (snap.val()) teams.A = snap.val();normalizeTeam(teams.A);
    updateView();
    updateControlLock();
  });

  database.ref("routeGame/teams/B").on("value", snap => {
    if (snap.val()) teams.B = snap.val();normalizeTeam(teams.B);
    updateView();
    updateControlLock();
  });

  if (myTeam) {
    localStorage.setItem("myTeam", myTeam);
  }

  loadMyPlayerFromFirebase();
  listenTeamNames();

});

function saveTeam(teamKey) {
  if (!teamKey) return;

  database.ref(`routeGame/teams/${teamKey}`).transaction(current => {
    if (!current) return teams[teamKey];

    // Firebase側を基準にする
    return {
      ...current,
      ...teams[teamKey]
    };
  });
}

function selectRelief(teamKey, type) {
  if (!isGameLoaded) {
    alert("ゲームデータを読み込み中です。少し待ってください");
    return;
  }

  if (myTeam !== teamKey) {
    alert("自分のチームの救済措置だけ選べます");
    return;
  }
  const team = teams[teamKey];

  // すでに選んでいたら何もしない
  if (team.relief != null) return;

  team.relief = type;

  if (type === RELIEF_TYPES.PLUS3) {
    team.reliefCount.plus3 = 0;
  }
  if (type === RELIEF_TYPES.DOUBLE) {
    team.reliefCount.double = 0;
  }
  // 救済措置選択完了 → 通常フェーズへ
  team.phase = "BEFORE_ROLL";

  const diceSE = document.getElementById("diceSe");


  saveTeam(teamKey);
  updateView();
  updateControlLock();
}


function findNextNoteStation(fromIndex) {
  for (let i = fromIndex + 1; i < stations.length; i++) {
    if (stations[i].note) {
      return stations[i];
    }
  }
  return null;
}

function showTransferOverlay(transferStation, nextStation) {
  const overlay = document.getElementById("overlay");

  const mainText = document.querySelector("#overlayText .transfer-main");
  const subText  = document.querySelector("#overlayText .transfer-sub");

  mainText.textContent = `${transferStation.name}駅で乗り換えです`;
  subText.textContent  = `${nextStation.note}行きに乗り換えてください`;

  isTransferOverlayOpen = true; 
  overlay.style.display = "flex";
}

function showGoalOverlay() {
  const overlay = document.getElementById("overlay");

  document.getElementById("overlayText").innerHTML = `
    <span class="transfer-main">🎉 ゴール！</span>
    <span class="transfer-sub">あとは到着するだけ！</span>
  `;

  overlay.style.display = "flex";
}


function loadProgress() {
  const gameRef = database.ref("routeGame");

  const savedTeam = localStorage.getItem("myTeam");
  if (savedTeam) {
    myTeam = savedTeam;
  }

  gameRef.once("value", snapshot => {
    const data = snapshot.val();

    if (!data) {
      // 初期データを作る
      database.ref("routeGame").set({
        teams,
        updatedAt: Date.now()
      });
      return;
    }

    // Firebase のデータを反映
    if (data.teams?.A) Object.assign(teams.A, data.teams.A);
    if (data.teams?.B) Object.assign(teams.B, data.teams.B);


    ["A", "B"].forEach(teamKey => {
      const team = teams[teamKey];

      if (
        team.phase === "AFTER_WAIT" &&
        team.waitUntil !== null &&
        Date.now() >= team.waitUntil
      ) {
        team.waitUntil = null;
        saveTeam(teamKey);
      }
    });

    diceSe = document.getElementById("diceSe");

    updateView();
    updateControlLock();
    updateScreen();
    updateMyTeamLabel();
    updateWaitingTimeView();

    isGameLoaded = true;
    if (!isGameLoaded) return;
  });
}

function updateScreen() {
  if (isDiceOverlayOpen || isTransferOverlayOpen) return;

  const msg = document.getElementById("needRegisterMsg");
  const registerScreen = document.getElementById("registerScreen");
  const gameScreen = document.getElementById("gameScreen");

  const canEnterGame =
    isValidDisplayName(myDisplayName) &&
    isValidTeam(myTeam) &&
    playersLoaded === true;

  if (canEnterGame) {
    registerScreen.style.display = "none";
    gameScreen.style.display = "block";
    msg.style.display = "none";
    showPage("progress");
  } else {
    registerScreen.style.display = "block";
    gameScreen.style.display = "none";
    msg.style.display = "block";
  }
}

function updateMyTeamLabel() {
  const label = document.getElementById("myTeamLabel");

  if (!myTeam) {
    label.textContent = "";
    return;
  }

  label.textContent = `あなたは ${myTeam}チームです`;
}

function openDiceOverlay(teamKey) {
  if (!isGameLoaded) return;
  isDiceOverlayOpen = true;

  pendingTeam = teamKey;

  diceState = "showPNG";
  isRolling = false;
  isTen = false;

  diceResult = Math.floor(Math.random() * 10) + 1;

  diceState = "showPNG";

  diceOverlay.classList.remove("hidden");
  diceOverlay.style.display = "flex";

  // ★ PNG表示
  diceGif.src = "./dice_1.png";
  diceGif.style.display = "block";

  cutinVideo.pause();
  cutinVideo.currentTime = 0;
  cutinVideo.classList.add("hidden");

  // ★ ここで必ず「完全静止」
  diceWrapper.classList.remove("dice-bounce");
  diceWrapper.style.animation = "none";
}

function finalizeDice(actualValue) {
  const team = teams[pendingTeam];
  if (!team || team.phase === "ROLLED") return;
  const oldPosition = team.position;

  // ① 基本移動量
  let move = actualValue;

  // ② 救済措置「＋1」
  if (team.plus1Ready) {
    move += 1;
    team.plus1Ready = false; // ★使い切り
  }


  // ③ 状態更新
  team.dice = actualValue;
  team.reliefUsedThisRoll = false;
  team.history = [team.position];
  team.nextPosition = Math.min(
    team.position + move,
    stations.length - 1
  );
  team.phase = "ROLLED";
 
  afterMoveCheck(
    pendingTeam,
    oldPosition,
    team.nextPosition
  );

  // ⑥ 表示更新
  saveTeam(pendingTeam);
  updateView();
  updateControlLock();

}

function closeDiceOverlay() {
  isDiceOverlayOpen = false;

  diceOverlay.classList.add("hidden");
  diceOverlay.style.display = "none";

  diceGif.style.display = "none";
  cutinVideo.pause();
  cutinVideo.currentTime = 0;
  cutinVideo.classList.add("hidden");

  pendingTeam = null;
  diceState = "idle";
}





// 「到着ボタン」を押したとき
function arriveTeam(teamKey) {
  if (!isGameLoaded) return;
  if (myTeam !== teamKey) {
    alert("自分のチームだけ操作できます");
    return;
  }
  const team = teams[teamKey];
  if (team.phase !== "ROLLED") return;

  const arrivedIndex = team.nextPosition;

  team.position = team.nextPosition;
    logAction(teamKey, "ARRIVE");
    if (isTransferStation(arrivedIndex)) {
    postSystemChat(
      `【${teamKey}チーム】${stations[arrivedIndex].name}駅に到着しました（乗り換え）`
    );
  }

  if (team.position >= goalIndex) {
    postSystemChat(
      `🎉【${teamKey}チーム】${stations[goalIndex].name}駅に到着！ゴールです！`
    );
  }

  team.nextPosition = null;
  team.phase = "WAITING";
  team.waitUntil = Date.now() + 5000;

  saveTeam(teamKey);
  updateView();
  updateControlLock();
}

function addWalk(teamKey) {
  if (!isGameLoaded) return;
  const team = teams[teamKey];

  if (
    team.waitUntil !== null &&
    Date.now() < team.waitUntil
  ) {
    alert("まだ待ち時間が終わっていません");
    return;
  }

  if (myTeam !== teamKey) {
    alert("自分のチームだけ操作できます");
    return;
  }

  // フェーズ制限
  if (team.phase !== "AFTER_WAIT") {
    alert("今は歩いた駅数を入力できません");
    return;
  }

  const inputEl = document.getElementById(`walk${teamKey}`);
  const steps = Number(inputEl.value);

  if (isNaN(steps) || steps < 0) {
    alert("正しい駅数を入力してください");
    return;
  }

  if (
    team.relief === RELIEF_TYPES.PLUS1 &&
    steps >= 1
  ) {
    team.plus1Ready = true;
  }

  const oldPosition = team.position;
  const newPosition = Math.min(
    team.position + steps,
    stations.length - 1
  );

  team.history = [team.position];
  team.position = newPosition;
  logAction(teamKey, "ADD_WALK");
  team.phase = "BEFORE_ROLL";

  afterMoveCheck(
    teamKey,
    oldPosition,
    newPosition
  );


  inputEl.value = "";

  updateView();
  updateControlLock();
  saveTeam(teamKey); // または saveTeam(myTeam)
}

function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}分${sec}秒`;
}

function updateWaitingTimeView() {
  ["A", "B"].forEach(key => {
    const team = teams[key];
    const el = document.getElementById(`wait${key}`);

    if (
      team.phase === "WAITING" &&
      team.waitUntil !== null &&
      Date.now() < team.waitUntil
    ) {
      const remain = team.waitUntil - Date.now();
      el.textContent = `⏳ 残り ${formatTime(remain)}`;
    } else {
      el.textContent = "";
    }
  });
}

function updateWaitingStatus() {
  const now = Date.now();

  ["A", "B"].forEach(teamKey => {
    const team = teams[teamKey];
    const el = teamKey === "A" ? waitA : waitB;

    if (
      team.phase === "WAITING" &&
      team.waitUntil !== null
    ) {
      const remain = team.waitUntil - now;

      if (remain <= 0) {
        team.waitUntil = null;
        team.phase = "AFTER_WAIT";
        saveTeam(teamKey); // または saveTeam(myTeam)
        el.textContent = "-";

        if (myTeam === teamKey) {
          alert(`${teamKey}チーム、出発できます！`);
        }

        saveTeam(teamKey);
      }
    }
  });
  updateView();
  updateControlLock();
}

function undoMove(teamKey) {
  const team = teams[teamKey];
 
  if (myTeam !== teamKey) {
    alert("自分のチームだけ操作できます");
    return;
  }

  if (team.phase !== "BEFORE_ROLL") {
    alert("今は修正できません");
    return;
  }

  if (team.history.length === 0) {
    alert("修正できる履歴がありません");
    return;
  }

  if (!confirm("前のターンの歩数を取り消しますか？")) {
    return;
  }

  // 位置を戻す
  team.position = team.history[0];
  team.history = [];

  // ★必ず歩数入力フェーズへ戻す
  team.phase = "AFTER_WAIT";

  updateView();
  updateControlLock();
  saveTeam(teamKey);
}

setInterval(() => {
  updateWaitingStatus();
  updateWaitingTimeView();
}, 1000);

function logAction(teamKey, action) {
  database.ref("logs").push({
    team: teamKey,
    action: action,
    phase: teams[teamKey].phase,
    position: teams[teamKey].position,
    time: Date.now()
  });
}

function usePlus3(teamKey) {
  const team = teams[teamKey];

  if (team.relief !== RELIEF_TYPES.PLUS3) return;
  if (team.phase !== "ROLLED") return;
  if (team.reliefUsedThisRoll) {
    alert("このサイコロでは救済措置は1回までです");
    return;
  }
  if (team.reliefCount.plus3 >= 3) return;

  team.reliefUsedThisRoll = true;
  team.reliefCount.plus3++;

  team.nextPosition = Math.min(
    team.nextPosition + 3,
    stations.length - 1
  );

  postSystemChat(
    `✨【${teamKey}チーム】救済措置「3・3・3」を使用！（＋3駅）`
  );

  saveTeam(teamKey);
  updateView();
  updateControlLock();
}

function useDouble(teamKey) {
  const team = teams[teamKey];

  if (team.relief !== RELIEF_TYPES.DOUBLE) return;
  if (team.phase !== "ROLLED") return;
  if (team.reliefUsedThisRoll) {
    alert("このサイコロでは救済措置は1回までです");
    return;
  }
  if (team.reliefCount.double >= 1) return;

  team.reliefUsedThisRoll = true;
  team.reliefCount.double++;

  team.nextPosition = Math.min(
    team.position + team.dice * 2,
    stations.length - 1
  );

  postSystemChat(
    `🔥【${teamKey}チーム】救済措置「ダブル」を使用！（${team.dice}×2）`
  );


  saveTeam(teamKey);
  updateView();
  updateControlLock();
}

function rollDiceWithOverlay() {
  diceResult = Math.floor(Math.random() * 10) + 1;
  isTen = diceResult === 10;

  diceOverlay.classList.remove("hidden");

  diceGif.src = "./dice_1.png"; // ← 静止画
  diceGif.style.display = "block";

  cutinVideo.classList.add("hidden");

  diceState = "showPNG";
}



function startDiceGif() {
  if (diceState !== "showPNG") return;

  isRolling = true;
  diceState = "rollingGIF";

  diceGif.style.display = "block";
  diceGif.src = `./dice_roll_${diceResult}.gif`;

  diceSe.currentTime = 0;
  diceSe.play();

  playDiceBounce();

  // ★ 強制リセット
  diceWrapper.classList.remove("dice-bounce");
  diceWrapper.style.animation = "none";

  // ★ 次フレームで復活
  requestAnimationFrame(() => {
    diceWrapper.style.animation = "";
    diceWrapper.classList.add("dice-bounce");
  });

  setTimeout(() => {
    diceSe.pause();
    diceSe.currentTime = 0;

    // ★ ここで初めて10判定
    isTen = diceResult === 10;

    document.getElementById(`diceResult${pendingTeam}`).textContent = diceResult;
    finalizeDice(diceResult);

  if (diceResult === 10) {
    postSystemChat(
      `🎲【${pendingTeam}チーム】サイコロで「10」が出ました！`
    );
  }

    diceState = "afterRoll";

    // ★ ここでは何も再生しない
    diceState = "canClose";
  }, 2100);
}

console.log("wrapper:", diceWrapper);



function startCutin(){

  const v = document.getElementById("cutinVideo")

  v.classList.remove("hidden")

  v.currentTime = 0
  v.play()

}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = 'none';
  });

  document.getElementById('page-' + page).style.display = 'block';

  if (page === "map") {
    renderMap();
  }

  document.querySelectorAll('#menuBar button').forEach(btn => {
    btn.classList.remove('active');
  });
  document
    .querySelector(`#menuBar button[onclick="showPage('${page}')"]`)
    ?.classList.add('active');
}

function getPlayerId() {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = "player_" + crypto.randomUUID();
    localStorage.setItem("playerId", id);
  }
  return id;
}

function loadMembers() {
  database.ref("players").on("value", snapshot => {
    playersLoaded = true;
    const listA = document.getElementById("memberListA");
    const listB = document.getElementById("memberListB");

    listA.innerHTML = "";
    listB.innerHTML = "";

    const players = snapshot.val();
    if (!players) return;

    Object.values(players).forEach(p => {
      if (HIDDEN_NAMES.includes(p.displayName)) return;
      const li = document.createElement("li");
      li.textContent = p.displayName;


      if (p.team === "A") listA.appendChild(li);
      if (p.team === "B") listB.appendChild(li);
    });
    updateScreen();
  });
}

document.getElementById("sendChatBtn").addEventListener("click", () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  if (!myDisplayName) {
    alert("名前が設定されていません");
    return;
  }

  if (text === "/reset") {
    resetAllData();
    input.value = "";
    return; // ← チャット送信しない
  }

  database.ref("chat").push({
    playerId: myPlayerId,
    text,
    time: Date.now()
  });


  input.value = "";
});

function loadChat() {
  const log = document.getElementById("chatLog");

  database.ref("chat").limitToLast(50).on("child_added", snap => {
    const msg = snap.val();
    const div = document.createElement("div");

    // ★ SYSTEMメッセージ
    if (msg.system) {
      div.textContent = msg.text;
      div.classList.add("chat-system");
      log.prepend(div);
      log.scrollTop = log.scrollHeight;
      return;
    }

    // ★ 通常メッセージ
    database.ref("players/" + msg.playerId).once("value", pSnap => {
      const p = pSnap.val();
      if (!p) return;

      const teamLabel = teamNameCache[p.team] || p.team;
      div.textContent = `【${teamLabel}】${p.displayName}：${msg.text}`;

      log.prepend(div);
      log.scrollTop = log.scrollHeight;
    });
  });
}

loadChat();

database.ref("players/" + myPlayerId).once("value", snap => {
  if (!snap.exists()) {
    localStorage.removeItem("displayName");
    localStorage.removeItem("myTeam");
    myDisplayName = null;
    myTeam = null;
    updateScreen(); 
    return;}

  const data = snap.val();

  if (
    !isValidDisplayName(data.displayName) ||
    !isValidTeam(data.team)
  ) {
    // 壊れたデータは無効化
    database.ref("players/" + myPlayerId).remove();
    localStorage.removeItem("displayName");
    localStorage.removeItem("myTeam");
    myDisplayName = null;
    myTeam = null;
    updateScreen();
    return;
  }

  myDisplayName = data.displayName;
  myTeam = data.team;

  localStorage.setItem("displayName", myDisplayName);
  localStorage.setItem("myTeam", myTeam);

  updateMyTeamLabel();
  updateScreen();
  updateControlLock();
});


function playDiceBounce() {
  const diceWrapper = document.getElementById("diceWrapper");
  if (!diceWrapper) return;

  diceWrapper.classList.remove("dice-bounce");
  void diceWrapper.offsetWidth; // ← 超重要（強制リフロー）
  diceWrapper.classList.add("dice-bounce");
}

function postSystemChat(text) {
  database.ref("chat").push({
    system: true,
    text,
    time: Date.now()
  });
}

function isTransferStation(index) {
  return stations[index]?.type === "transfer";
}

function afterMoveCheck(teamKey, oldPosition, newPosition) {
  // ① 乗り換え判定
  for (let i = oldPosition + 1; i <= newPosition; i++) {
    if (stations[i]?.type === "transfer") {
      const nextNoteStation = findNextNoteStation(i);
      if (nextNoteStation) {
        showTransferOverlay(stations[i], nextNoteStation);
        postSystemChat(
          `【${teamKey}チーム】${stations[i].name}駅で乗り換えです`
        );
        break;
      }
    }
  }

  // ② ゴール判定
  if (oldPosition < goalIndex && newPosition >= goalIndex) {
    showGoalOverlay();
    postSystemChat(
      `🎉【${teamKey}チーム】${stations[goalIndex].name}駅に到着！ゴールです！`
    );
  }
}

function renderMap() {
  const container = document.getElementById("mapContainer");
  if (!container) return;

  container.innerHTML = "";

  stations.forEach((station, index) => {
    const div = document.createElement("div");
    div.className = "map-station";
    div.textContent = `${index}. ${station.name}`;

    // 特殊駅
    if (station.type === "transfer") {
      div.classList.add("map-transfer");
    }
    if (station.type === "goal") {
      div.classList.add("map-goal");
    }

    // チーム位置
    if (teams.A.position === index) {
      div.classList.add("map-team-a");
    }
    if (teams.B.position === index) {
      div.classList.add("map-team-b");
    }

    container.appendChild(div);
  });
}

function normalizeMyPlayer() {
  const savedName = localStorage.getItem("displayName");
  const savedTeam = localStorage.getItem("myTeam");

  const nameOk = isValidDisplayName(savedName);
  const teamOk = isValidTeam(savedTeam);

  if (!nameOk) {
    localStorage.removeItem("displayName");
    myDisplayName = null;
  } else {
    myDisplayName = savedName;
  }

  if (!teamOk) {
    localStorage.removeItem("myTeam");
    myTeam = null;
  } else {
    myTeam = savedTeam;
  }
}

function loadMyPlayerFromFirebase() {
  database.ref("players/" + myPlayerId).once("value", snapshot => {
    const p = snapshot.val();

    if (!p) {
      // ★ リセット後は必ずここに来る
      myDisplayName = null;
      myTeam = null;

      localStorage.removeItem("displayName");
      localStorage.removeItem("myTeam");

      updateScreen();
      return;
    }

    myDisplayName = p.displayName;
    myTeam = p.team;

    localStorage.setItem("displayName", myDisplayName);
    localStorage.setItem("myTeam", myTeam);

    updateMyTeamLabel();
    updateScreen();
  });
}



database.ref("routeGame/resetAt").on("value", snap => {
  const resetAt = snap.val();
  if (!resetAt) return;

  // 初回は無視
  if (lastResetAt === null) {
    lastResetAt = resetAt;
    return;
  }

  // リセット検知
  if (resetAt !== lastResetAt) {
    lastResetAt = resetAt;

    playersLoaded = false;
    sessionStorage.clear();
    localStorage.removeItem("displayName");
    localStorage.removeItem("myTeam");

    location.reload(); // 全員強制リロード
  }
});

function createInitialTeam() {
  return {
    position: 0,
    phase: "SELECT_RELIEF",
    waitUntil: null,
    nextPosition: null,
    history: [],
    dice: null,
    plus1Ready: false,
    relief: null,
    reliefCount: {
      plus3: 0,
      double: 0
    },
    reliefUsedThisRoll: false
  };
}

function normalizeTeam(team) {
  if (!team.reliefCount) {
    team.reliefCount = { plus3: 0, double: 0 };
  }
  if (team.reliefUsedThisRoll === undefined) {
    team.reliefUsedThisRoll = false;
  }
  if (!Array.isArray(team.history)) {
    team.history = [];
  }
}

function listenTeamNames() {
  database.ref("routeGame/teamNames").on("value", snap => {
    const names = snap.val() || {};

    // 進捗ページ
    document.getElementById("teamA-name").textContent = names.A || "Aチーム";
    document.getElementById("teamB-name").textContent = names.B || "Bチーム";

    // メンバーページ
    document.getElementById("memberTeamA-name").textContent = names.A || "Aチーム";
    document.getElementById("memberTeamB-name").textContent = names.B || "Bチーム";
  });
}


document.addEventListener("click", e => {
  if (!e.target.classList.contains("editTeamNameBtn")) return;

  const team = e.target.dataset.team;

  // 自分のチームだけ変更可
  if (myTeam !== team) {
    alert("自分のチームの名前だけ変更できます");
    return;
  }

  const currentName =
    document.getElementById(`team${team}-name`).textContent;

  const newName = prompt("新しいチーム名を入力してください", currentName);
  if (!newName || newName.trim() === "") return;

  database.ref(`routeGame/teamNames/${team}`).set(newName.trim());
});

