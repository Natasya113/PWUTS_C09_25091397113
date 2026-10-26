"use strict";

window.initForm = function (alatId) {
  const form = document.getElementById("form-peminjaman");
  if (!form) return;

  const daftar = document.getElementById("pilihan-alat");
  const tglPinjam = document.getElementById("tgl-pinjam");
  const tglKembali = document.getElementById("tgl-kembali");
  const keperluan = document.getElementById("keperluan");
  const ringkasan = document.getElementById("ringkasan-alat");
  const durasi = document.getElementById("info-durasi");
  const pesan = document.getElementById("form-pesan");
  const tombol = document.getElementById("kirim-pengajuan");
  const aman = window.amanHTML;

  let terkirim = false;

  const sekarang = new Date();
  const hariIni = [
    sekarang.getFullYear(),
    String(sekarang.getMonth() + 1).padStart(2, "0"),
    String(sekarang.getDate()).padStart(2, "0")
  ].join("-");

  tglPinjam.min = hariIni;
  tglKembali.min = hariIni;

  daftar.innerHTML = window.dataAlat.map(function (alat) {
    const tersedia = alat.stok > 0;
    const dipilih = tersedia && String(alat.id) === String(alatId);

    return `
      <div class="pinjam-alat-row ${tersedia ? "" : "stok-kosong"}">
        <label class="pinjam-alat-label">
          <input
            type="checkbox"
            class="pilih-alat"
            value="${alat.id}"
            ${dipilih ? "checked" : ""}
            ${tersedia ? "" : "disabled"}
          >

          <span>
            <strong>${aman(alat.nama)}</strong>
            <small>
              ${tersedia ? `Tersedia ${alat.stok} unit` : "Stok habis"}
            </small>
          </span>
        </label>

        <div class="pinjam-jumlah">
          <label for="jumlah-${alat.id}">Jumlah unit</label>

          <input
            type="number"
            id="jumlah-${alat.id}"
            name="jumlah[${alat.id}]"
            min="1"
            max="${alat.stok}"
            step="1"
            value="1"
            required
            ${dipilih ? "" : "disabled"}
          >
        </div>
      </div>
    `;
  }).join("");

  if (!window.dataAlat.length) {
    daftar.textContent = "Belum ada data alat.";
  }

  function tampilkanPesan(teks, berhasil) {
    pesan.hidden = false;
    pesan.className = berhasil
      ? "pinjam-message berhasil"
      : "pinjam-message gagal";
    pesan.textContent = teks;
    pesan.focus();
  }

  function perbaruiRingkasan() {
    let jenis = 0;
    let unit = 0;

    daftar.querySelectorAll(".pilih-alat").forEach(function (checkbox) {
      const input = document.getElementById(`jumlah-${checkbox.value}`);
      input.disabled = !checkbox.checked;

      if (checkbox.checked) {
        jenis++;

        const nilai = Number(input.value);

        if (Number.isInteger(nilai) && nilai > 0) {
          unit += nilai;
        }
      }
    });

    ringkasan.textContent = jenis
      ? `${jenis} jenis alat • ${unit} unit`
      : "Belum ada alat dipilih";
  }

  function perbaruiTanggal() {
    tglKembali.min = tglPinjam.value || hariIni;
    tglKembali.setCustomValidity("");

    if (
      tglPinjam.value &&
      tglKembali.value &&
      tglKembali.value < tglPinjam.value
    ) {
      tglKembali.setCustomValidity(
        "Tanggal kembali tidak boleh lebih awal dari tanggal pinjam."
      );

      durasi.textContent = "Periksa kembali urutan tanggal peminjaman.";
      return;
    }

    if (tglPinjam.value && tglKembali.value) {
      const awal = Date.parse(`${tglPinjam.value}T00:00:00Z`);
      const akhir = Date.parse(`${tglKembali.value}T00:00:00Z`);
      const selisih = Math.round((akhir - awal) / 86400000);

      durasi.textContent = selisih === 0
        ? "Pengembalian pada hari yang sama."
        : `Rencana pengembalian ${selisih} hari setelah tanggal pinjam.`;
    } else {
      durasi.textContent =
        "Pilih tanggal pinjam dan tanggal rencana kembali.";
    }
  }

  form.addEventListener("invalid", function (event) {
    const input = event.target;

    if (!input.matches('.pinjam-jumlah input[type="number"]')) {
      return;
    }

    event.preventDefault();

    const id = input.id.replace("jumlah-", "");
    const alat = window.dataAlat.find(function (item) {
      return String(item.id) === id;
    });

    if (!alat) return;

    const teks = input.validity.rangeOverflow
      ? `Jumlah ${alat.nama} melebihi stok tersedia. Maksimal ${alat.stok} unit.`
      : `Jumlah ${alat.nama} wajib berupa bilangan bulat antara 1 dan ${alat.stok} unit.`;

    tampilkanPesan(teks, false);
  }, true);

  daftar.addEventListener("change", perbaruiRingkasan);
  daftar.addEventListener("input", perbaruiRingkasan);

  tglPinjam.addEventListener("change", perbaruiTanggal);
  tglKembali.addEventListener("change", perbaruiTanggal);

  keperluan.addEventListener("input", function () {
    keperluan.setCustomValidity("");
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (terkirim || tombol.disabled) return;

    pesan.hidden = true;

    const dipilih = daftar.querySelectorAll(".pilih-alat:checked");

    if (!dipilih.length) {
      tampilkanPesan("Pilih minimal satu alat terlebih dahulu.", false);
      return;
    }

    for (const checkbox of dipilih) {
      const alat = window.dataAlat.find(function (item) {
        return String(item.id) === checkbox.value;
      });

      if (!alat) {
        tampilkanPesan("Data alat tidak valid. Muat ulang halaman.", false);
        return;
      }

      const input = document.getElementById(`jumlah-${alat.id}`);
      const jumlah = Number(input.value);

      if (
        !Number.isInteger(jumlah) ||
        jumlah < 1 ||
        jumlah > alat.stok
      ) {
        tampilkanPesan(
          `Jumlah ${alat.nama} harus berupa bilangan bulat antara 1 dan ${alat.stok} unit.`,
          false
        );
        return;
      }
    }

    keperluan.value = keperluan.value.trim();
    keperluan.setCustomValidity(
      keperluan.value ? "" : "Keperluan peminjaman wajib diisi."
    );

    perbaruiTanggal();

    if (!form.reportValidity()) return;

    tombol.disabled = true;
    tombol.textContent = "Mengirim...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json"
        }
      });

      const hasil = await response.json();

      if (!response.ok || !hasil.success) {
        throw new Error(hasil.message || "Pengajuan gagal dikirim.");
      }

      terkirim = true;

      tampilkanPesan(
        `Pengajuan ${hasil.kode} berhasil disimpan sementara. ` +
        `Status: ${hasil.status}. Pengajuan belum disetujui admin.`,
        true
      );

      form.querySelectorAll("input, textarea, select").forEach(function (input) {
        input.disabled = true;
      });

      tombol.textContent = "Pengajuan Terkirim";
    } catch (error) {
      const teks = error instanceof SyntaxError
        ? "Respons server tidak sesuai. Periksa process.php dan jalankan melalui localhost."
        : error.message;

      tampilkanPesan(teks, false);
    } finally {
      if (!terkirim) {
        tombol.disabled = false;
        tombol.textContent = "Kirim Pengajuan";
      }
    }
  });

  perbaruiRingkasan();
  perbaruiTanggal();
};