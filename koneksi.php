<?php
declare(strict_types=1);

$host = 'localhost';
$database = 'sipta';
$username = 'root';
$password = ''; // Sesuaikan jika MySQL menggunakan password.

$pdo = new PDO(
    "mysql:host={$host};dbname={$database};charset=utf8mb4",
    $username,
    $password,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]
);