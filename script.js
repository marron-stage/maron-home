/* ==============================================
   3. 添い寝部屋（BGM1〜4ループ＆寝息4回＋寝言1回サイクル）
   ============================================== */
const lightToggleBtn = document.getElementById('lightToggleBtn');
const sleepOverlay = document.getElementById('sleepOverlay');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const sleepBreathAudio = document.getElementById('sleepBreathAudio');
const sleepVoiceAudio = document.getElementById('sleepVoiceAudio');
const sleepBgmAudio = document.getElementById('sleepBgmAudio');

let isLightOff = false;
let isSleepSoundOn = false;

// 添い寝BGMプレイリスト（1〜4を自動連続再生）
const sleepPlaylist = ['bgm1.mp3', 'bgm2.mp3', 'bgm3.mp3', 'bgm4.mp3'];
let currentBgmIndex = 0;

sleepBgmAudio.addEventListener('ended', () => {
  currentBgmIndex = (currentBgmIndex + 1) % sleepPlaylist.length;
  sleepBgmAudio.src = sleepPlaylist[currentBgmIndex];
  sleepBgmAudio.play().catch(() => {});
});

// 寝息・寝言のカウント管理（1〜4回：寝息、5回目：寝言）
let sleepCycleCount = 0;

function playNextSleepSound() {
  if (!isSleepSoundOn) return;

  sleepCycleCount++;

  if (sleepCycleCount % 5 === 0) {
    // 5回目：寝言を再生
    sleepVoiceAudio.currentTime = 0;
    sleepVoiceAudio.play().catch(() => {});
  } else {
    // 1〜4回目：寝息を再生
    sleepBreathAudio.currentTime = 0;
    sleepBreathAudio.play().catch(() => {});
  }
}

// 寝息が終わったら次へ
sleepBreathAudio.addEventListener('ended', () => {
  if (isSleepSoundOn) {
    // 息継ぎの自然な間（約1秒）を空けて次の音へ
    setTimeout(playNextSleepSound, 1000);
  }
});

// 寝言が終わったら次へ
sleepVoiceAudio.addEventListener('ended', () => {
  if (isSleepSoundOn) {
    // 寝言の後の自然な間（約1.5秒）を空けて寝息へ戻る
    setTimeout(playNextSleepSound, 1500);
  }
});

// 明かりオン/オフ
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

// 添い寝サウンド オン/オフ
soundToggleBtn.addEventListener('click', () => {
  isSleepSoundOn = !isSleepSoundOn;

  if (isSleepSoundOn) {
    // BGMの再生開始
    if (!sleepBgmAudio.src || sleepBgmAudio.src === '') {
      sleepBgmAudio.src = sleepPlaylist[currentBgmIndex];
    }
    sleepBgmAudio.play().catch(() => {});

    // 寝息サイクルの開始
    sleepCycleCount = 0;
    playNextSleepSound();

    soundToggleBtn.textContent = '🔇 サウンド停止';
    soundToggleBtn.classList.add('active');
  } else {
    // 全音声を停止＆リセット
    sleepBgmAudio.pause();
    sleepBreathAudio.pause();
    sleepVoiceAudio.pause();
    sleepBreathAudio.currentTime = 0;
    sleepVoiceAudio.currentTime = 0;
    sleepCycleCount = 0;

    soundToggleBtn.textContent = '🎵 添い寝サウンド';
    soundToggleBtn.classList.remove('active');
  }
});
