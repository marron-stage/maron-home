/* ==============================================
   1. タブ切り替え制御
   ============================================== */
const tabBtns = document.querySelectorAll('.tab-btn');
const roomPanels = document.querySelectorAll('.room-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetRoom = btn.getAttribute('data-room');
    tabBtns.forEach(b => b.classList.remove('active'));
    roomPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(targetRoom).classList.add('active');
  });
});

/* ==============================================
   2. お家部屋（時間帯背景・時計・BGM・歩行＆自動セリフ）
   ============================================== */
const homeRoom = document.getElementById('home-room');
const clockDisplay = document.getElementById('clockDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const homeBgmBtn = document.getElementById('homeBgmBtn');
const homeAudio = document.getElementById('homeAudio');
const footstepAudio = document.getElementById('footstepAudio');
const marronWalker = document.getElementById('marronWalker');
const marronCanvas = document.getElementById('marronCanvas');
const ctx = marronCanvas.getContext('2d', { willReadFrequently: true });
const marronWalkVideo = document.getElementById('marronWalkVideo');
const homeBubble = document.getElementById('homeBubble');

let isHomeBgmOn = false;
footstepAudio.volume = 0.35; // 足音の音量

// 時間帯別・自動つぶやきセリフ集
const timeBasedMessages = {
  morning: [
    "おはよう！今日もいいお天気だワン🐾",
    "朝ごはん食べた？いっぱい食べてね！",
    "のび〜っ！今日もマロンと一緒に頑張ろ！",
    "おはようワン！深呼吸してスタートだよ。"
  ],
  day: [
    "お昼ご飯はなにかな〜？クーン🐾",
    "ちょっとひと息つこ？無理は禁物だワン！",
    "日差しがポカポカして気持ちいいワン…",
    "お仕事や作業、えらいワン！見てるよ！"
  ],
  sunset: [
    "今日もおつかれさまだワン！夕暮れだね。",
    "今日も1日よく頑張ったね、えらいワン！",
    "早く一緒にお家でゴロゴロしよ〜！",
    "夕焼けきれいだワン…お腹すいてきた！"
  ],
  night: [
    "今日も最後まで生き抜いてえらかったワン。",
    "夜はのんびり、好きなことして過ごそうね。",
    "お風呂でしっかりあったまってね🐾",
    "マロンはずーっとそばにいるから安心するワン。"
  ],
  midnight: [
    "まだ起きてるの？夜更かしはほどほどにね。",
    "無理しないで、眠くなったら寝るんだよ…",
    "今日もお疲れさま。いい夢見ようね…zzz",
    "マロンがついてるから大丈夫。おやすみワン。"
  ]
};

// 現在の時間帯を取得
function getCurrentTimeCategory(hour) {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'sunset';
  if (hour >= 19 && hour <= 23) return 'night';
  return 'midnight';
}

// 時間帯背景の自動更新
function updateTimeAndBackground() {
  const now = new Date();
  const hour = now.getHours();
  const category = getCurrentTimeCategory(hour);
  let bgImage = `room_${category}.jpg`;

  const img = new Image();
  img.src = bgImage;
  img.onload = () => { homeRoom.style.backgroundImage = `url('${bgImage}')`; };
  img.onerror = () => { homeRoom.style.backgroundImage = `url('room.jpg')`; };

  const h = String(hour).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  clockDisplay.textContent = `${h}:${m}`;

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const y = now.getFullYear();
  const mon = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  dateDisplay.textContent = `${y}.${mon}.${d} ${days[now.getDay()]}`;
}
setInterval(updateTimeAndBackground, 1000);
updateTimeAndBackground();

// お部屋BGMボタン（足音とも連動）
homeBgmBtn.addEventListener('click', () => {
  isHomeBgmOn = !isHomeBgmOn;
  if (isHomeBgmOn) {
    homeAudio.play().then(() => {
      homeBgmBtn.textContent = '🔇 BGM OFF';
    }).catch(() => { isHomeBgmOn = false; });
  } else {
    homeAudio.pause();
    footstepAudio.pause(); // BGMオフ時は足音も即座に停止
    homeBgmBtn.textContent = '🎵 BGM ON';
  }
});

// Canvasクロマキー透過描画ループ（青背景除去）
function renderChromaKey() {
  if (!marronWalkVideo.paused && !marronWalkVideo.ended) {
    if (marronCanvas.width !== marronWalkVideo.videoWidth && marronWalkVideo.videoWidth > 0) {
      marronCanvas.width = marronWalkVideo.videoWidth;
      marronCanvas.height = marronWalkVideo.videoHeight;
    }

    if (marronCanvas.width > 0) {
      ctx.drawImage(marronWalkVideo, 0, 0, marronCanvas.width, marronCanvas.height);
      const frame = ctx.getImageData(0, 0, marronCanvas.width, marronCanvas.height);
      const l = frame.data.length / 4;

      for (let i = 0; i < l; i++) {
        const r = frame.data[i * 4 + 0];
        const g = frame.data[i * 4 + 1];
        const b = frame.data[i * 4 + 2];

        // 青背景（Blue Screen）の判定と透過
        if (b > 110 && b > r * 1.25 && b > g * 1.15) {
          frame.data[i * 4 + 3] = 0;
        }
      }
      ctx.putImageData(frame, 0, 0);
    }
  }
  requestAnimationFrame(renderChromaKey);
}

// マロンの自律歩行（ムーンウォーク解消・足踏み防止・奥行き連動）
let currentX = 50; // %
let currentY = 8;  // % (bottom)
let walkStopTimer = null;

function startNextWalkSession() {
  clearTimeout(walkStopTimer);

  // 足踏み防止：必ず現在地から一定距離（横に18%以上離れた場所）を目的地に選ぶ
  let targetX, diffX;
  let attempts = 0;
  do {
    targetX = Math.floor(Math.random() * 56) + 22; // 22%〜78%
    diffX = targetX - currentX;
    attempts++;
  } while (Math.abs(diffX) < 16 && attempts < 10);

  const targetY = Math.floor(Math.random() * 15) + 6; // 6%〜21%
  const diffY = targetY - currentY;

  let selectedVideo = 'marron_walk.mp4';
  let flipX = 1;

  // 進行方向の動画選択
  if (diffY > 4 && Math.abs(diffX) < 14) {
    // 奥（画面上）へ歩く ＝ 後ろ姿
    selectedVideo = 'marron_back.mp4';
    flipX = diffX >= 0 ? -1 : 1;
  } else if (diffY < -4 && Math.abs(diffX) < 14) {
    // 手前（画面下）へ歩く ＝ 正面
    selectedVideo = 'marron_front.mp4';
    flipX = diffX >= 0 ? -1 : 1;
  } else if (diffY > 4) {
    // 斜め奥
    selectedVideo = 'marron_diagonal_back.mp4';
    flipX = diffX >= 0 ? -1 : 1; // 右に進む時は反転して右を向く
  } else if (diffY < -4) {
    // 斜め手前
    selectedVideo = 'marron_diagonal.mp4';
    flipX = diffX >= 0 ? -1 : 1;
  } else {
    // 横歩き（進む方向を真っ直ぐ向くよう修正）
    selectedVideo = 'marron_walk.mp4';
    flipX = diffX >= 0 ? -1 : 1;
  }

  // 奥行きに応じたスケール（手前で大きく、奥で小さく）
  const depthFactor = 1.15 - ((targetY - 6) / 15) * 0.35;
  const targetWidth = Math.round(165 * depthFactor);
  marronCanvas.style.width = `${targetWidth}px`;
  marronCanvas.style.transform = `scaleX(${flipX})`;

  // 動画切り替え＆歩行開始
  if (!marronWalkVideo.src.endsWith(selectedVideo)) {
    marronWalkVideo.src = selectedVideo;
  }
  marronWalkVideo.play().catch(() => {});

  // BGMがONの時だけ足音を鳴らす
  if (isHomeBgmOn) {
    footstepAudio.currentTime = 0;
    footstepAudio.play().catch(() => {});
  }

  // 移動開始（CSSで3.5秒かけて移動）
  marronWalker.style.transition = 'left 3.5s ease-in-out, bottom 3.5s ease-in-out';
  marronWalker.style.left = `${targetX}%`;
  marronWalker.style.bottom = `${targetY}%`;

  currentX = targetX;
  currentY = targetY;

  // 3.5秒後に到着：足を止めて佇む＆足音停止
  walkStopTimer = setTimeout(() => {
    footstepAudio.pause();
    marronWalkVideo.pause();
  }, 3500);
}

// 歩行開始＆インターバル（3.5秒歩行 ＋ 約2秒休憩でテンポよく巡回）
marronWalkVideo.src = 'marron_walk.mp4';
marronWalkVideo.play().then(() => {
  renderChromaKey();
}).catch(() => {});
setInterval(startNextWalkSession, 5800);

// マロンの頭上吹き出し表示関数
let bubbleTimer = null;
function showBubble(text, duration = 3500) {
  clearTimeout(bubbleTimer);
  homeBubble.textContent = text;
  homeBubble.style.display = 'block';
  bubbleTimer = setTimeout(() => {
    homeBubble.style.display = 'none';
  }, duration);
}

// 時間帯ごとの自動つぶやき（12秒ごとにランダムでつぶやく）
setInterval(() => {
  // 撫でた直後などで吹き出しが出ている時はスキップ
  if (homeBubble.style.display === 'block') return;
  
  const now = new Date();
  const category = getCurrentTimeCategory(now.getHours());
  const msgList = timeBasedMessages[category];
  const randomMsg = msgList[Math.floor(Math.random() * msgList.length)];
  showBubble(randomMsg, 3500);
}, 12000);

// マロンをタップした時の甘えセリフ（撫でた時）
const marronVoices = [
  "わふっ！なでてくれるの？",
  "クーン…そばにいてくれて嬉しいワン🐾",
  "今日も一日お疲れさまだよ！",
  "マロンはずーっと君の味方だワン！",
  "えへへ、お腹なでて〜！"
];

marronWalker.addEventListener('click', () => {
  const voice = marronVoices[Math.floor(Math.random() * marronVoices.length)];
  showBubble(voice, 3000);
});

/* ==============================================
   3. 添い寝部屋（BGM1〜4ループ＆寝息サウンド）
   ============================================== */
const lightToggleBtn = document.getElementById('lightToggleBtn');
const sleepOverlay = document.getElementById('sleepOverlay');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const sleepBreathAudio = document.getElementById('sleepBreathAudio');
const sleepBgmAudio = document.getElementById('sleepBgmAudio');
let isLightOff = false;
let isSleepSoundOn = false;

const sleepPlaylist = ['bgm1.mp3', 'bgm2.mp3', 'bgm3.mp3', 'bgm4.mp3'];
let currentBgmIndex = 0;

sleepBgmAudio.addEventListener('ended', () => {
  currentBgmIndex = (currentBgmIndex + 1) % sleepPlaylist.length;
  sleepBgmAudio.src = sleepPlaylist[currentBgmIndex];
  sleepBgmAudio.play().catch(() => {});
});

lightToggleBtn.addEventListener('click', () => {
  isLightOff = !isLightOff;
  if (isLightOff) {
    sleepOverlay.style.opacity = '1';
    lightToggleBtn.textContent = '☀️ 明かりオン';
    lightToggleBtn.classList.add('active');
  } else {
    sleepOverlay.style.opacity = '0';
    lightToggleBtn.textContent = '🌙 明かりオフ';
    lightToggleBtn.classList.remove('active');
  }
});

soundToggleBtn.addEventListener('click', () => {
  isSleepSoundOn = !isSleepSoundOn;
  if (isSleepSoundOn) {
    if (!sleepBgmAudio.src || sleepBgmAudio.src === '') {
      sleepBgmAudio.src = sleepPlaylist[currentBgmIndex];
    }
    sleepBgmAudio.play().catch(() => {});
    sleepBreathAudio.play().catch(() => {});

    soundToggleBtn.textContent = '🔇 サウンド停止';
    soundToggleBtn.classList.add('active');
  } else {
    sleepBgmAudio.pause();
    sleepBreathAudio.pause();
    soundToggleBtn.textContent = '🎵 添い寝サウンド';
    soundToggleBtn.classList.remove('active');
  }
});

/* ==============================================
   4. 相談部屋（2本立て動画連動＆音声ON）
   ============================================== */
const talkVideo = document.getElementById('counselingVideo');
const talkBubble = document.getElementById('counselingBubble');
const actionArea = document.getElementById('counselingActionArea');
const sendBtn = document.getElementById('sendLetterBtn');
const resetBtn = document.getElementById('counselResetBtn');
const counselInput = document.getElementById('counselingInput');

const comfortMessages = [
  "全部ふかふかの土に埋めて、きれいなお花が咲いたワン。もうここには何もないよ。大丈夫。",
  "今日を最後まで生き抜いただけでもう100点満点だよ。本当にお疲れさま。もう何も考えなくていいワン。",
  "嫌だったね、悔しかったね…。その気持ち、マロンが全部預かったよ。今日はお布団で丸まろ？",
  "あなたが悪いんじゃないワン。頑張りすぎちゃう優しいあなたが、マロンは大好きなんだよ。",
  "ぜーんぶ土に還してきれいなお花にしちゃった！胸のつかえ、少しは軽くなったかな？ずっとそばにいるワン。",
  "無理に前を向かなくていいんだよ。立ち止まって、マロンをなでなでして、深呼吸しよ。",
  "手紙を届けてくれてありがとう。心に溜まってたトゲトゲ、マロンがペロペロしてまるくしといたワン！",
  "世の中のみんなが敵になっても、マロンはずーっとあなたの味方だからね。約束だワン。",
  "嬉しいことも、悔しいことも、全部マロンに話してくれてありがとう。あなたの一番の理解者でいるワン！"
];

sendBtn.addEventListener('click', () => {
  actionArea.style.display = 'none';
  talkBubble.style.display = 'none';

  // 1本目：埋めて開花する動画（音声を有効化）
  talkVideo.muted = false;
  talkVideo.src = 'bury_and_bloom.mp4';
  talkVideo.loop = false;
  talkVideo.play();

  // 演出動画が終わった瞬間に待機ループ動画へバトンタッチ
  talkVideo.onended = () => {
    talkVideo.src = 'marron_happy_loop.mp4';
    talkVideo.loop = true;
    talkVideo.play();

    const msg = comfortMessages[Math.floor(Math.random() * comfortMessages.length)];
    talkBubble.textContent = msg;
    talkBubble.style.display = 'block';
    resetBtn.style.display = 'block';
  };
});

resetBtn.addEventListener('click', () => {
  talkVideo.onended = null;
  talkVideo.muted = true;
  talkVideo.src = 'marron_talk.mp4';
  talkVideo.loop = true;
  talkVideo.play();

  talkBubble.style.display = 'none';
  resetBtn.style.display = 'none';
  actionArea.style.display = 'flex';
  counselInput.value = '';
});

/* ==============================================
   5. 日常部屋（モーダル再生）
   ============================================== */
const cinemaModal = document.getElementById('cinemaModal');
const cinemaVideo = document.getElementById('cinemaVideo');
const closeCinemaBtn = document.getElementById('closeCinemaBtn');
const dailyItems = document.querySelectorAll('.daily-item');

dailyItems.forEach(item => {
  item.addEventListener('click', () => {
    const videoSrc = item.getAttribute('data-video');
    cinemaVideo.src = videoSrc;
    cinemaModal.style.display = 'flex';
    cinemaVideo.play();
  });
});

closeCinemaBtn.addEventListener('click', () => {
  cinemaModal.style.display = 'none';
  cinemaVideo.pause();
  cinemaVideo.src = '';
});
