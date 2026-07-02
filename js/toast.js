// ============================================================
//  toast.js — Notifikasi popup (bergantung pada: -)
// ============================================================

function showToast(msg, type = 'success') {
    const old = document.querySelector('.toast-admin');
    if (old) old.remove();

    const icon = type === 'success' ? 'ti-circle-check' : 'ti-alert-circle';
    const t = document.createElement('div');
    t.className = `toast toast-admin ${type}`;
    t.innerHTML = `<i class="ti ${icon}"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}