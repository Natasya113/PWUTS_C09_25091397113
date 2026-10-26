<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');

    echo json_encode([
        'success' => false,
        'message' => 'Metode permintaan tidak diizinkan.'
    ]);

    exit;
}

try {
    require __DIR__ . '/koneksi.php';

    $query = $pdo->query(
        'SELECT
            id_alat,
            nama_alat,
            deskripsi,
            jumlah_total,
            jumlah_tersedia,
            kondisi
         FROM alat
         ORDER BY id_alat'
    );

    // Foto dan kategori tidak memiliki kolom pada tabel alat.
    $tampilan = [
        1 => [
            'kategori' => 'Presentasi',
            'gambar' => 'img/proyektor.jpg'
        ],
        2 => [
            'kategori' => 'Kabel',
            'gambar' => 'img/hdmi.jpg'
        ],
        3 => [
            'kategori' => 'Kelistrikan',
            'gambar' => 'img/stop-kontak.jpg'
        ],
        4 => [
            'kategori' => 'Audio',
            'gambar' => 'img/speaker.jpg'
        ],
        5 => [
            'kategori' => 'Audio',
            'gambar' => 'img/mic.jpg'
        ]
    ];

    $data = [];

    foreach ($query as $row) {
        $id = (int) $row['id_alat'];

        $data[] = [
            'id' => $id,
            'nama' => $row['nama_alat'],
            'deskripsi' => $row['deskripsi'] ?? '',
            'stokTotal' => (int) $row['jumlah_total'],
            'stok' => (int) $row['jumlah_tersedia'],
            'kondisi' => $row['kondisi'],
            'kategori' => $tampilan[$id]['kategori'] ?? 'Alat',
            'gambar' => $tampilan[$id]['gambar'] ?? ''
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Data alat gagal dimuat. Periksa koneksi MySQL.'
    ], JSON_UNESCAPED_UNICODE);
}