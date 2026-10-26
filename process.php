<?php
declare(strict_types=1);

session_start();
date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json; charset=utf-8');

function gagal(string $pesan, int $kode = 422): void
{
    http_response_code($kode);
    echo json_encode([
        'success' => false,
        'message' => $pesan
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    gagal('Gunakan formulir untuk mengirim pengajuan.', 405);
}

/* Data contoh harus sama dengan konten.js. */
$alat = [
    1 => ['nama' => 'Proyektor', 'stok' => 3],
    2 => ['nama' => 'HDMI', 'stok' => 5],
    3 => ['nama' => 'Speaker', 'stok' => 2],
    4 => ['nama' => 'Mic', 'stok' => 4],
    5 => ['nama' => 'Stop Kontak', 'stok' => 0]
];

$jumlah = $_POST['jumlah'] ?? [];

if (!is_array($jumlah) || count($jumlah) === 0) {
    gagal('Pilih minimal satu alat.');
}

$detail = [];

foreach ($jumlah as $id => $nilai) {
    if (!isset($alat[$id]) || !is_scalar($nilai)) {
        gagal('Data alat tidak valid.');
    }

    $unit = filter_var($nilai, FILTER_VALIDATE_INT);

    if ($unit === false || $unit < 1 || $unit > $alat[$id]['stok']) {
        gagal('Jumlah ' . $alat[$id]['nama'] . ' tidak sesuai stok.');
    }

    $detail[] = [
        'id_alat' => (int) $id,
        'nama_alat' => $alat[$id]['nama'],
        'jumlah' => $unit
    ];
}

$pinjam = $_POST['tgl_pinjam'] ?? '';
$kembali = $_POST['tgl_kembali_rencana'] ?? '';
$keperluan = $_POST['keperluan'] ?? '';

if (
    !is_string($pinjam) ||
    !is_string($kembali) ||
    !is_string($keperluan)
) {
    gagal('Format data formulir tidak valid.');
}

function tanggalValid(string $nilai): bool
{
    $tanggal = DateTimeImmutable::createFromFormat('!Y-m-d', $nilai);

    return $tanggal !== false &&
        $tanggal->format('Y-m-d') === $nilai;
}

if (!tanggalValid($pinjam) || !tanggalValid($kembali)) {
    gagal('Tanggal pinjam dan tanggal kembali wajib diisi dengan benar.');
}

if ($pinjam < date('Y-m-d')) {
    gagal('Tanggal pinjam tidak boleh sebelum hari ini.');
}

if ($kembali < $pinjam) {
    gagal('Tanggal kembali tidak boleh lebih awal dari tanggal pinjam.');
}

$keperluan = trim($keperluan);

if ($keperluan === '') {
    gagal('Keperluan peminjaman wajib diisi.');
}

$panjang = function_exists('mb_strlen')
    ? mb_strlen($keperluan, 'UTF-8')
    : preg_match_all('/./us', $keperluan);

if ($panjang === false || $panjang > 1000) {
    gagal('Keperluan maksimal 1.000 karakter.');
}

$kode = 'ALT-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

$pengajuan = [
    'kode' => $kode,
    'tgl_pengajuan' => date('Y-m-d H:i:s'),
    'tgl_pinjam' => $pinjam,
    'tgl_kembali_rencana' => $kembali,
    'keperluan' => $keperluan,
    'detail' => $detail,
    'status' => 'Menunggu'
];

/*
 * Penyimpanan sementara untuk simulasi.
 * Belum terhubung ke pengguna login maupun database MySQL.
 * Stok tidak dikurangi ketika pengajuan masih menunggu.
 */
$_SESSION['pengajuan_alat'][] = $pengajuan;

session_write_close();

echo json_encode([
    'success' => true,
    'kode' => $kode,
    'status' => 'Menunggu'
], JSON_UNESCAPED_UNICODE);