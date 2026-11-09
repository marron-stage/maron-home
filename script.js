document.addEventListener('DOMContentLoaded', () => {
  /* ==============================================
     1. タブ切り替え制御（最優先・絶対停止させない）
     ============================================== */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const roomPanels = document.querySelectorAll('.room-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetRoom = btn.getAttribute('data-room');
      tabBtns.forEach(b => b.classList.remove('active'));
      roomPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetRoom);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  /* ==============================================
     2. お家部屋（時計・時間帯背景・BGM・歩行マロン）
     ============================================== */
  const homeRoom = document.getElementById('home-room');
  const clockDisplay = document.getElementById('clockDisplay');
  const dateDisplay = document.getElementById('dateDisplay');
  const homeBgmBtn = document.getElementById('homeBgmBtn');
  const homeAudio = document.getElementById('homeAudio');
  const footstepAudio = document.getElementById('footstepAudio');
  const marronWalker = document.getElementById('marronWalker');
  const marronCanvas = document.getElementById('marronCanvas');
  const marronWalkVideo = document.getElementById('marronWalkVideo');
  const homeBubble = document.getElementById('homeBubble');

  let isHomeBgmOn = false;
  if (footstepAudio) footstepAudio.volume = 0.35;

  // 時間帯別メッセージ
  const timeBasedMessages = {
    morning: ["おはよう！今日もいいお天気だワン🐾", "朝ごはん食べた？いっぱい食べてね！", "のび〜っ！今日も一緒に頑張ろ！"],
    day: ["お昼ご飯はなにかな〜？クーン🐾", "ひと息つこ？無理は禁物だワン！", "日差しが気持ちいいワン…"],
    sunset: ["今日もおつかれさまだワン！", "夕焼けきれいだワン…お腹すいた！", "1日よく頑張ったね、えらいワン！"],
    night: ["今日も最後まで生き抜いてえらかったワン。", "夜はのんびり過ごそうね。", "マロンはずーっとそばにいるワン。"],
    midnight: ["まだ起きてるの？夜更かしはほどほどにね。", "無理しないで眠くなったら寝てね…", "おやすみワン…zzz"]
  };

  function getCurrentCategory(hour) {
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'day';
    if (hour >= 17 && hour < 19) return 'sunset';
    if (hour >= 19 && hour <= 23) return 'night';
    return 'midnight';
  }

  // 時計と背景更新
  function updateTimeAndBackground() {
    const now = new Date();
    const hour = now.getHours();
    const category = getCurrentCategory(hour);
    const bgImage = `room_${category}.jpg`;

    if (homeRoom) {
      const img = new Image();
      img.src = bgImage;
      img.onload = () => { homeRoom.style.backgroundImage = `url('${bgImage}')`; };
      img.onerror = () => { homeRoom.style.backgroundImage = `url('room.jpg')`; };
    }

    if (clockDisplay) {
      const h = String(hour).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      clockDisplay.textContent = `${h}:${m}`;
    }

    if (dateDisplay) {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const y = now.getFullYear();
      const mon = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      dateDisplay.textContent = `${y}.${mon}.${d} ${days[now.getDay()]}`;
    }
  }
  setInterval(updateTimeAndBackground, 1000);
  updateTimeAndBackground();

  // お部屋BGMボタン
  if (homeBgmBtn && homeAudio) {
    homeBgmBtn.addEventListener('click', () => {
      isHomeBgmOn = !isHomeBgmOn;
      if (isHomeBgmOn) {
        homeAudio.play().then(() => {
          homeBgmBtn.textContent = '🔇 BGM OFF';
        }).catch(() => { isHomeBgmOn = false; });
      } else {
        homeAudio.pause();
        if (footstepAudio) footstepAudio.pause();
        homeBgmBtn.textContent = '🎵 BGM ON';
      }
    });
  }

  // Canvasクロマキー処理（青背景透過）
  if (marronCanvas && marronWalkVideo) {
    const ctx = marronCanvas.getContext('2d', { willReadFrequently: true });

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
            // 青色を透過
            if (b > 110 && b > r * 1.25 && b > g * 1.15) {
              frame.data[i * 4 + 3] = 0;
            }
          }
          ctx.putImageData(frame, 0, 0);
        }
      }
      requestAnimationFrame(renderChromaKey);
    }

    // 自律歩行ロジック
    let currentX = 50;
    let currentY = 8;
    let walkStopTimer = null;

    function startNextWalkSession() {
      clearTimeout(walkStopTimer);

      let targetX, diffX;
      let attempts = 0;
      do {
        targetX = Math.floor(Math.random() * 56) + 22;
        diffX = targetX - currentX;
        attempts++;
      } while (Math.abs(diffX) < 16 && attempts < 10);

      const targetY = Math.floor(Math.random() * 15) + 6;
      const diffY = targetY - currentY;

      let selectedVideo = 'marron_walk.mp4';
      let flipX = 1;

      if (diffY > 4 && Math.abs(diffX) < 14) {
        selectedVideo = 'marron_back.mp4';
        flipX = diffX >= 0 ? -1 : 1;
      } else if (diffY < -4 && Math.abs(diffX) < 14) {
        selectedVideo = 'marron_front.mp4';
        flipX = diffX >= 0 ? -1 : 1;
      } else if (diffY > 4) {
        selectedVideo = 'marron_diagonal_back.mp4';
        flipX = diffX >= 0 ? -1 : 1;
      } else if (diffY < -4) {
        selectedVideo = 'marron_diagonal.mp4';
        flipX = diffX >= 0 ? -1 : 1;
      } else {
        selectedVideo = 'marron_walk.mp4';
        flipX = diffX >= 0 ? -1 : 1;
      }

      // 奥行きスケール
      const depthFactor = 1.15 - ((targetY - 6) / 15) * 0.35;
      const targetWidth = Math.round(165 * depthFactor);
      marronCanvas.style.width = `${targetWidth}px`;
      marronCanvas.style.transform = `scaleX(${flipX})`;

      if (!marronWalkVideo.src.endsWith(selectedVideo)) {
        marronWalkVideo.src = selectedVideo;
      }
      marronWalkVideo.play().catch(() => {});

      if (isHomeBgmOn && footstepAudio) {
        footstepAudio.currentTime = 0;
        footstepAudio.play().catch(() => {});
      }

      if (marronWalker) {
        marronWalker.style.left = `${targetX}%`;
        marronWalker.style.bottom = `${targetY}%`;
      }

      currentX = targetX;
      currentY = targetY;

      walkStopTimer = setTimeout(() => {
        if (footstepAudio) footstepAudio.pause();
        marronWalkVideo.pause();
      }, 3500);
    }

    marronWalkVideo.src = 'marron_walk.mp4';
    marronWalkVideo.play().then(() => {
      renderChromaKey();
    }).catch(() => {});
    setInterval(startNextWalkSession, 5800);
  }

  // 吹き出し管理
  let bubbleTimer = null;
  function showBubble(text, duration = 350
