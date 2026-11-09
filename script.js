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
   2. お家部屋（時間帯背景・時計・BGM・クロマキー歩行）
   ============================================== */
const homeRoom = document.getElementById('home-room');
const clockDisplay = document.getElementById('clockDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const homeBgmBtn = document.getElementById('homeBgmBtn');
const homeAudio = document.getElementById('homeAudio');
const marronWalker = document.getElementById('marronWalker');
const marronCanvas = document.getElementById('marronCanvas');
const ctx = marronCanvas.getContext('2d', { willReadFrequently: true });
const marronWalkVideo = document.getElementById('marronWalkVideo');
const homeBubble = document.getElementById('homeBubble');
let isHomeBgmOn = false;

// 時間帯背景の自動更新
function updateTimeAndBackground() {
  const now = new Date();
  const hour = now.getHours();
  let bgImage = 'room.jpg';

  if (hour >= 5 && hour < 11) {
    bgImage = 'room_morning.jpg';
  } else if (hour >= 11 && hour < 17) {
    bgImage = 'room_day.jpg';
  } else if (hour >= 17 && hour < 19) {
    bgImage = 'room_sunset.jpg';
  } else if (hour >= 19 && hour <= 23) {
    bgImage = 'room_night.jpg';
  } else {
    bgImage = 'room_midnight.jpg';
  }

  // 背景画像の設定
  const img = new Image();
  img.src = bgImage;
  img.onload = () => { homeRoom.style.backgroundImage = `url('${bgImage}')`; };
  img.onerror = () => { homeRoom.style.backgroundImage = `url('room.jpg')`; };

  // 時計・日付更新
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

// お部屋BGMボタン
homeBgmBtn.addEventListener('click', () => {
  isHomeBgmOn = !isHomeBgmOn;
  if (isHomeBgmOn) {
    homeAudio.play().then(() => {
      homeBgmBtn.textContent = '🔇 BGM OFF';
    }).catch(() => { isHomeBgmOn = false; });
  } else {
    homeAudio.pause();
    homeBgmBtn.textContent = '🎵 BGM ON';
  }
});

// Canvasクロマキー透過描画ループ（青背景を除去）
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
          frame.data[i * 4 + 3] = 0; // 完全透明化
        }
      }
      ctx.putImageData(frame, 0, 0);
    }
  }
  requestAnimationFrame(renderChromaKey);
}

// マロンの自律歩行（座標・方向に応じた動画切り替え）
let currentX = 50; // %
let currentY = 10; // %

function startNextWalkSession() {
  const targetX = Math.floor(Math.random() * 60) + 20; // 20%〜80%
  const targetY = Math.floor(Math.random() * 15) + 6;  // 6%〜21% (奥行き)

  const diffX = targetX - currentX;
  const diffY = targetY - currentY;

  let selectedVideo = 'marron_walk.mp4';
  let flipX = 1;

  // 移動方向判定
  if (Math.abs(diffY) > 8 && Math.abs(diffX) < 15) {
    // 縦方向の移動がメイン
    selectedVideo = diffY > 0 ? 'marron_front.mp4' : 'marron_back.mp4';
  } else if (diffY > 5) {
    // 斜め手前
    selectedVideo = 'marron_diagonal.mp4';
    flipX = diffX > 0 ? -1 : 1;
  } else if (diffY < -5) {
    // 斜め奥
    selectedVideo = 'marron_diagonal_back.mp4';
    flipX = diffX > 0 ? -1 : 1;
  } else {
    // 横歩き
    selectedVideo = 'marron_walk.mp4';
    flipX = diffX > 0 ? -1 : 1;
  }

  // 動画切り替え＆再生
  if (!marronWalkVideo.src.endsWith(selectedVideo)) {
    marronWalkVideo.src = selectedVideo;
    marronWalkVideo.play().catch(() => {});
  }
  marronCanvas.style.transform = `scaleX(${flipX})`;

  // 位置の更新（CSS transitionで滑らかに移動）
  marronWalker.style.left = `${targetX}%`;
  marronWalker.style.bottom = `${targetY}%`;

  currentX = targetX;
  currentY = targetY;
}

// 歩行開始
marronWalkVideo.src = 'marron_walk.mp4';
marronWalkVideo.play().then(() => {
  renderChromaKey();
}).catch(() => {});
setInterval(startNextWalkSession, 5500);

// マロンをタップした時のセリフ
const marronVoices = [
  "わふっ！なでてくれるの？",
  "クーン…そばにいてくれて嬉しいワン🐾",
  "今日も一日お疲れさまだよ！",
  "マロンはずーっと君の味方だワン！",
  "えへへ、お腹なでて〜！"
];
let bubbleTimer = null;
marronWalker.addEventListener('click', () => {
  clearTimeout(bubbleTimer);
  const voice = marronVoices[Math.floor(Math.random() * marronVoices.length)];
  homeBubble.textContent = voice;
  homeBubble.style.display = 'block';
  bubbleTimer = setTimeout(() => { homeBubble.style.display = 'none'; }, 3000);
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

// 添い寝BGMプレイリスト（1〜4）
const sleepPlaylist = ['bgm1.mp3', 'bgm2.mp3', 'bgm3.mp3', 'bgm4.mp3'];
let currentBgmIndex = 0;

// 曲が終わったら自動で次の曲へ
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
    // プレイリストの再生
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
