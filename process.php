<?php
declare(strict_types=1);

session_start();
date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function gagal(string $pesan, int $kode = 422): void
{
    http_response_code($kode);

    echo json_encode([
        'success' => false,
        'message' => $pesan
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

function tanggalValid(string $nilai): bool
{
    // Cegah format tambahan atau karakter tidak valid.
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $nilai)) {
        return false;
    }

    $tanggal = DateTimeImmutable::createFromFormat('!Y-m-d', $nilai);

    return $tanggal !== false &&
        $tanggal->format('Y-m-d') === $nilai;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    gagal('Gunakan formulir untuk mengirim pengajuan.', 405);
}

/* Baca stok terbaru dari MySQL. */
try {
    require __DIR__ . '/koneksi.php';

    $query = $pdo->query(
        'SELECT id_alat, nama_alat, jumlah_tersedia
         FROM alat'
    );

    $alat = [];

    foreach ($query as $row) {
        $alat[(int) $row['id_alat']] = [
            'nama' => $row['nama_alat'],
            'stok' => (int) $row['jumlah_tersedia']
        ];
    }
} catch (Throwable $error) {
    error_log($error->getMessage());

    gagal(
        'Stok alat belum dapat diperiksa. Pastikan MySQL aktif.',
        500
    );
}

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

    if ($unit === false || $unit < 1) {
        gagal(
            'Jumlah ' . $alat[$id]['nama'] .
            ' harus berupa bilangan bulat minimal 1.'
        );
    }

    if ($unit > $alat[$id]['stok']) {
        gagal(
            'Jumlah ' . $alat[$id]['nama'] .
            ' melebihi stok terbaru. Tersedia ' .
            $alat[$id]['stok'] .
            ' unit. Buka kembali formulir untuk memperbarui stok.'
        );
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

$kode = 'ALT-' . date('Ymd') . '-' .
    strtoupper(bin2hex(random_bytes(3)));

$pengajuan = [
    'kode' => $kode,
    'tgl_pengajuan' => date('Y-m-d H:i:s'),
    'tgl_pinjam' => $pinjam,
    'tgl_kembali_rencana' => $kembali,
    'keperluan' => $keperluan,
    'detail' => $detail,
    'status' => 'menunggu'
];

/*
 * Data alat dan validasi stok menggunakan MySQL.
 * Pengajuan disimpan sementara dalam sesi PHP.
 * Pengajuan belum ditulis ke tabel transaksi.
 * Stok tidak dikurangi ketika pengajuan masih menunggu.
 */
if (!isset($_SESSION['pengajuan_alat'])) {
    $_SESSION['pengajuan_alat'] = [];
}

$_SESSION['pengajuan_alat'][] = $pengajuan;

session_write_close();

echo json_encode([
    'success' => true,
    'kode' => $kode,
    'status' => 'menunggu'
], JSON_UNESCAPED_UNICODE);