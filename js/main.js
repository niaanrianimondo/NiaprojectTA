// ============================================================
//  main.js — Navigasi sidebar & inisialisasi halaman
//  Bergantung pada: data.js, toast.js, modal.js, render.js
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.main-admin');

    // 1. Tampilkan halaman awal
    if (mainContainer) renderKelola(mainContainer);

    // 2. Navigasi Sidebar
    document.querySelectorAll('.side-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const menu = this.innerText.trim().toUpperCase();
            mainContainer.innerHTML = '';

            if (menu.includes('LAPORAN')) renderLaporan(mainContainer);
            else if (menu.includes('SETUP')) renderSetup(mainContainer);
            else renderKelola(mainContainer);
        });
    });

    // 3. Tutup modal klik overlay
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    }

    // 4. Handle Form Submit — tanpa field id
    const atletForm = document.getElementById('atletForm');
    if (atletForm) {
        atletForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const nama = document.getElementById('atlet-nama').value.trim();
            const gender = document.getElementById('atlet-gender').value;
            const kelas = document.getElementById('atlet-kelas').value;

            if (!nama) {
                showToast('Nama atlet tidak boleh kosong!', 'error');
                return;
            }

            if (editIndex !== null) {
                atletList[editIndex] = { nama, gender, kelas };
                showToast(`Data ${nama} diperbarui.`);
            } else {
                atletList.push({ nama, gender, kelas });
                showToast(`${nama} berhasil ditambahkan sebagai ${gender}.`);
            }

            saveData();
            renderAll();
            closeModal();
        });
    }
});