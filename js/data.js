// ============================================================
//  data.js — Variabel global, konstanta, dan fungsi penyimpanan
// ============================================================

const CLASS_TARGET = {
    "Kelas A": "45-50kg",
    "Kelas B": "50-55kg",
    "Kelas C": "55-60kg",
    "Kelas D": "60-65kg",
    "Kelas E": "65-70kg"
};

// Pakai key baru 'siladash_v3' agar tidak tertumpuk data lama
let atletList = JSON.parse(localStorage.getItem('siladash_v3') || 'null') || [
    { nama: "Ahmad Fauzi", kelas: "Kelas C", gender: "Putra" },
    { nama: "Budi Santoso", kelas: "Kelas B", gender: "Putra" },
    { nama: "NiyaComel", kelas: "Kelas C", gender: "Putri" },
    { nama: "Siti Aisyah", kelas: "Kelas B", gender: "Putri" }
];

let editIndex = null;

function saveData() {
    localStorage.setItem('siladash_v3', JSON.stringify(atletList));
}