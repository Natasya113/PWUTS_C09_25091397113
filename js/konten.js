"use strict";

/* Data dan stok contoh untuk simulasi UTS. */
window.dataAlat = [
  {
    id: 1,
    nama: "Proyektor",
    deskripsi: "Proyektor untuk presentasi dan kegiatan pembelajaran.",
    stok: 3,
    kondisi: "Baik",
    kategori: "Presentasi",
    gambar: "img/proyektor.jpg"
  },
  {
    id: 2,
    nama: "HDMI",
    deskripsi: "Kabel HDMI untuk menghubungkan laptop dengan proyektor atau layar.",
    stok: 5,
    kondisi: "Baik",
    kategori: "Kabel",
    gambar: "img/hdmi.jpg"
  },
  {
    id: 3,
    nama: "Speaker",
    deskripsi: "Pengeras suara untuk mendukung kegiatan akademik.",
    stok: 2,
    kondisi: "Baik",
    kategori: "Audio",
    gambar: "img/speaker.jpg"
  },
  {
    id: 4,
    nama: "Mic",
    deskripsi: "Mikrofon untuk presentasi, diskusi, dan kegiatan akademik.",
    stok: 4,
    kondisi: "Baik",
    kategori: "Audio",
    gambar: "img/mic.jpg"
  },
  {
    id: 5,
    nama: "Stop Kontak",
    deskripsi: "Stop kontak tambahan untuk menghubungkan perangkat ke sumber listrik.",
    stok: 0,
    kondisi: "Baik",
    kategori: "Kelistrikan",
    gambar: "img/stop-kontak.jpg"
  }
];

/* Menjalankan katalog setelah halaman dimuat melalui Ajax. */
window.initKatalog = function () {
  const search = document.getElementById("search-alat");
  const filter = document.getElementById("filter-stok");
  const list = document.getElementById("alat-list");
  const result = document.getElementById("catalog-result");
  const empty = document.getElementById("catalog-empty");
  const reset = document.getElementById("reset-filter");

  if (!search || !filter || !list || !result || !empty || !reset) {
    return;
  }

  function tampilkanAlat() {
    const keyword = search.value.trim().toLowerCase();
    const pilihan = filter.value;

    const hasil = window.dataAlat.filter(function (alat) {
      const teks = `${alat.nama} ${alat.deskripsi}`.toLowerCase();

      const cocokKata = teks.includes(keyword);

      const cocokStok =
        pilihan === "semua" ||
        (pilihan === "tersedia" && alat.stok > 0) ||
        (pilihan === "habis" && alat.stok === 0);

      return cocokKata && cocokStok;
    });

    // Isi kartu berasal dari data contoh tetap di atas.
    list.innerHTML = hasil.map(function (alat) {
      const tersedia = alat.stok > 0;

      return `
        <article class="alat-card alat-card-foto">

          <div class="alat-photo">
            <img
              src="${alat.gambar}"
              alt="${alat.nama}"
              width="320"
              height="200"
              loading="lazy"
              decoding="async"
            >

            <span class="alat-status ${
              tersedia ? "is-available" : "is-empty"
            }">
              ${tersedia ? "Tersedia" : "Stok habis"}
            </span>
          </div>

          <div class="alat-photo-body">
            <div class="alat-card-header">
              <div class="alat-card-title">
                <span class="alat-category">
                  ${alat.kategori}
                </span>

                <h3>${alat.nama}</h3>
              </div>
            </div>

            <p class="alat-description">
              ${alat.deskripsi}
            </p>

            <dl class="alat-specs">
              <div>
                <dt>Kondisi</dt>
                <dd>${alat.kondisi}</dd>
              </div>

              <div>
                <dt>Stok tersedia</dt>
                <dd>${alat.stok} unit</dd>
              </div>

              <div>
                <dt>Biaya</dt>
                <dd class="alat-free">Gratis</dd>
              </div>
            </dl>

            ${
              tersedia
                ? `
                  <a
                    href="pages/form.html"
                    class="button button-primary alat-pinjam"
                    data-page="form"
                    data-alat-id="${alat.id}"
                    aria-label="Pinjam ${alat.nama}"
                  >
                    Pinjam Alat
                    <span aria-hidden="true">→</span>
                  </a>
                `
                : `
                  <button
                    type="button"
                    class="button alat-pinjam"
                    disabled
                  >
                    Belum Tersedia
                  </button>
                `
            }
          </div>

        </article>
      `;
    }).join("");

    result.textContent =
      `Menampilkan ${hasil.length} dari ${window.dataAlat.length} alat`;

    empty.hidden = hasil.length !== 0;
  }

  search.addEventListener("input", tampilkanAlat);
  filter.addEventListener("change", tampilkanAlat);

  reset.addEventListener("click", function () {
    search.value = "";
    filter.value = "semua";

    tampilkanAlat();
    search.focus();
  });

  tampilkanAlat();
};