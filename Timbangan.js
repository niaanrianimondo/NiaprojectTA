/* ============================================
   SILADASH — TIMBANGAN.JS (VERSI INTEGRASI AI)
   Weight sensor simulation + Real-Time AI API Link
   ============================================ */

// ── CLOCK ──────────────────────────────────
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const el = document.getElementById('clock');
    if (el) el.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── WEIGHT SIMULATION ──────────────────────
let currentWeight = 57.77;
let weightTarget = 57.77;
let weightTimer = null;

function animateWeight(target) {
    const el = document.getElementById('weight-num');
    const bar = document.getElementById('progress-bar');
    const duration = 600;
    const start = currentWeight;
    const startTime = performance.now();

    function step(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const val = start + (target - start) * ease;
        if (el) el.textContent = val.toFixed(2);
        // bar range: 30kg = 0%, 120kg = 100%
        const pct = Math.max(0, Math.min(100, ((val - 30) / 90) * 100));
        if (bar) bar.style.width = pct + '%';
        if (t < 1) requestAnimationFrame(step);
        else currentWeight = target;
    }
    requestAnimationFrame(step);
}

function startWeightSimulation() {
    clearInterval(weightTimer);
    weightTimer = setInterval(() => {
        const delta = (Math.random() - 0.5) * 0.4;
        weightTarget = Math.max(40, Math.min(100, weightTarget + delta));
        animateWeight(weightTarget);
    }, 1800);
}
startWeightSimulation();

// ── TOAST NOTIFICATIONS ────────────────────
let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function showToast(message, type = 'info', duration = 3500) {
    const icons = { info: 'ti-info-circle', success: 'ti-circle-check', warning: 'ti-alert-triangle', error: 'ti-x-circle' };
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="ti ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toast-out .3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── MODAL HELPER ───────────────────────────
function createModal(titleText, bodyHTML) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${titleText}</span>
        <button class="modal-close"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
    </div>
  `;
    overlay.querySelector('.modal-close').addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
    document.body.appendChild(overlay);
    return overlay;
}

function closeModal(overlay) {
    overlay.style.animation = 'fade-in .2s ease reverse';
    setTimeout(() => overlay.remove(), 200);
}


// ══════════════════════════════════════════
// INTEGRASI REAL-TIME KE BACKEND PYTHON (app.py)
// ══════════════════════════════════════════
let attendanceRunning = false;
let pollingInterval = null;

// ── BUTTON 1 — TAKE IMAGE ──────────────────
function handleTakeImage() {
    const btn = document.getElementById('btn-capture');
    if (btn.classList.contains('running')) return;

    btn.classList.add('running');
    showToast('📸 Mengaktifkan Kamera Perekam Wajah...', 'info', 2000);

    // Efek kilatan Flash Kamera pada Layar Face Screen
    const screen = document.querySelector('.face-screen');
    if (screen) {
        const flash = document.createElement('div');
        flash.style.cssText = `position:absolute;inset:0;background:#fff;z-index:10;animation:none;opacity:0;transition:opacity .05s;pointer-events:none;`;
        screen.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0.9'; }, 100);
        setTimeout(() => { flash.style.opacity = '0'; }, 250);
        setTimeout(() => { flash.remove(); }, 500);
    }

    const textStatusWajah = document.getElementById('face-status-text');
    if (textStatusWajah) textStatusWajah.textContent = `MEMBUKA KAMERA...`;

    // Mengirim request ke Flask untuk rekam wajah atlet (Contoh: ID 47, NiyaComel)
    fetch('http://127.0.0.1:5000/api/take-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: 47,
            nama: "Niyacomel",
            kelas: "Kelas-C"
        })
    })
        .then(res => res.json())
        .then(data => {
            btn.classList.remove('running');
            if (textStatusWajah) textStatusWajah.textContent = `MENDETEKSI...`;

            if (data.status === "success") {
                showToast(`✅ ${data.message}`, 'success');
                createModal('📸 TAKE IMAGE — SELESAI', `
                <p>Pengambilan sampel wajah untuk dataset AI telah berhasil disimpan.</p>
                <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
                  <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#0b1520;border-radius:8px;border:1px solid #0e2a3a;">
                    <span style="font-family:monospace;font-size:11px;color:#4a7a94">ATLET</span>
                    <span style="font-family:monospace;font-size:11px;color:#e0f4ff">NiyaComel</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#0b1520;border-radius:8px;border:1px solid #0e2a3a;">
                    <span style="font-family:monospace;font-size:11px;color:#4a7a94">SAMPEL FOTO</span>
                    <span style="font-family:monospace;font-size:11px;color:#00ff88">30 / 30 ✓</span>
                  </div>
                </div>
            `);
            } else {
                showToast(`❌ Gagal: ${data.message}`, 'error');
            }
        })
        .catch(err => {
            btn.classList.remove('running');
            if (textStatusWajah) textStatusWajah.textContent = `MENDETEKSI...`;
            showToast('❌ Gagal terhubung ke Server Python!', 'error');
        });
}

// ── BUTTON 2 — TRAINING ────────────────────
function handleTraining() {
    const btn = document.getElementById('btn-training');
    if (btn.classList.contains('running')) return;

    btn.classList.add('running');
    showToast('🧠 Memulai kompilasi dataset wajah...', 'warning', 2000);

    const textStatusWajah = document.getElementById('face-status-text');
    if (textStatusWajah) textStatusWajah.textContent = `TRAINING MODEL...`;

    // Memanggil API Training Flask Python
    fetch('http://127.0.0.1:5000/api/training', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            btn.classList.remove('running');
            if (textStatusWajah) textStatusWajah.textContent = `MENDETEKSI...`;

            if (data.status === "success") {
                showToast('✅ Model AI SilaDash berhasil dilatih!', 'success', 4000);
            } else {
                showToast(`⚠️ ${data.message}`, 'warning');
            }
        })
        .catch(err => {
            btn.classList.remove('running');
            if (textStatusWajah) textStatusWajah.textContent = `MENDETEKSI...`;
            showToast('❌ Gagal melatih model AI backend!', 'error');
        });
}

// ── BUTTON 3 — AUTOMATIC ATTENDANCE ────────
function handleAttendance() {
    const btn = document.getElementById('btn-attendance');
    const textStatusWajah = document.getElementById('face-status-text');
    const textAkurasiWajah = document.getElementById('face-conf');
    const faceOverlay = document.querySelector('.face-stats-overlay');

    if (attendanceRunning) {
        // PERINTAH STOP ABSENSI
        clearInterval(pollingInterval);
        attendanceRunning = false;
        btn.classList.remove('running');
        btn.querySelector('.btn-label span:first-child').textContent = 'AUTO ATTENDANCE';
        btn.querySelector('.btn-sublabel').textContent = 'absensi otomatis';

        if (textStatusWajah) textStatusWajah.innerText = "MENDETEKSI...";
        if (textAkurasiWajah) textAkurasiWajah.innerText = "CONF: 0%";
        if (faceOverlay) faceOverlay.innerHTML = "STATUS: TRACKING...<br>ID: SCANNING...";
        showToast('⛔ Pemindaian wajah dihentikan.', 'warning');
        return;
    }

    // PERINTAH JALANKAN ABSENSI
    attendanceRunning = true;
    btn.classList.add('running');
    btn.querySelector('.btn-label span:first-child').textContent = 'STOP';
    btn.querySelector('.btn-sublabel').textContent = 'klik untuk hentikan';
    showToast('🟡 Mengaktifkan Real-Time Live Tracking Camera...', 'warning', 2000);

    // Memicu Python untuk mengaktifkan sub-sistem kamera absensi
    fetch('http://127.0.0.1:5000/api/start-attendance', { method: 'POST' })
        .then(res => res.json())
        .then(startData => {

            // Memulai Polling Data Real-Time ke Python setiap 800ms
            pollingInterval = setInterval(() => {
                fetch('http://127.0.0.1:5000/api/get-status')
                    .then(r => r.json())
                    .then(resAI => {
                        if (resAI.nama !== "Mencari..." && resAI.nama !== "Tidak Dikenal") {
                            // Update tampilan HUD utama di layar monitoring
                            if (textStatusWajah) {
                                textStatusWajah.innerText = `TERDETEKSI: ${resAI.nama.toUpperCase()}`;
                                textStatusWajah.style.color = "var(--accent2)"; // Mengubah font menjadi hijau neon sukses
                            }
                            if (textAkurasiWajah) textAkurasiWajah.innerText = `CONF: ${resAI.confidence.toFixed(1)}%`;
                            if (faceOverlay) faceOverlay.innerHTML = `STATUS: IDENTIFIED<br>ID: ATLET_${resAI.nama.substring(0, 3).toUpperCase()}`;

                            // Ambil angka berat badan saat ini secara dinamis dari layar timbangan web
                            const beratSekarang = document.getElementById('weight-num').innerText + " kg";

                            // Masukkan ke dalam log tabel riwayat validasi paling bawah secara otomatis
                            addLiveHistoryRow(resAI.nama, resAI.kelas, beratSekarang);
                        } else {
                            // Jika kamera belum menangkap wajah yang dikenali
                            if (textStatusWajah) {
                                textStatusWajah.innerText = resAI.nama.toUpperCase();
                                textStatusWajah.style.color = "";
                            }
                            if (textAkurasiWajah) textAkurasiWajah.innerText = `CONF: 0%`;
                            if (faceOverlay) faceOverlay.innerHTML = `STATUS: SCANNING...<br>ID: MENCARI...`;
                        }
                    });
            }, 800);

        })
        .catch(err => {
            attendanceRunning = false;
            btn.classList.remove('running');
            showToast('❌ Gagal mengaktifkan Kamera AI!', 'error');
        });
}

// ── FUNGSI INPUT BARIS TABEL OTOMATIS ───────
let lastLoggedName = ""; // Variabel pengunci agar baris log orang yang sama tidak menduplikasi terus-menerus setiap milidetik
function addLiveHistoryRow(nama, kelas, berat) {
    if (nama === lastLoggedName) return;
    lastLoggedName = nama;

    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.style.animation = 'entry-in .4s ease';
    tr.innerHTML = `
        <td><strong>${nama}</strong></td>
        <td>${kelas}</td>
        <td class="mono">${berat}</td>
        <td><span class="status-verified"><i class="ti ti-circle-check"></i> Verified</span></td>
        <td><span class="badge-sah">SAH</span></td>
    `;
    // Memasukkan baris baru di urutan paling atas tabel riwayat
    tbody.insertBefore(tr, tbody.firstChild);
    showToast(`👤 Log Masuk: ${nama} berhasil divalidasi`, 'success', 2000);
}

// ── BIND BUTTONS ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const btnCapture = document.getElementById('btn-capture');
    const btnTraining = document.getElementById('btn-training');
    const btnAttendance = document.getElementById('btn-attendance');

    if (btnCapture) btnCapture.addEventListener('click', handleTakeImage);
    if (btnTraining) btnTraining.addEventListener('click', handleTraining);
    if (btnAttendance) btnAttendance.addEventListener('click', handleAttendance);
});