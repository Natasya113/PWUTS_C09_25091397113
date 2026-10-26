"use strict";

// konten.js berada di folder js/.
window.SIPTA_ROOT = new URL("../", document.currentScript.src);
window.dataAlat = [];

window.amanHTML = function (nilai) {
  return String(nilai ?? "").replace(/[&<>"']/g, function (karakter) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[karakter];
  });
};

window.muatDataAlat = async function (signal) {
  const response = await fetch(
    new URL("alat.php", window.SIPTA_ROOT),
    {
      cache: "no-store",
      signal: signal
    }
  );

  const hasil = await response.json();

  if (!response.ok || !hasil.success || !Array.isArray(hasil.data)) {
    throw new Error(hasil.message || "Data alat gagal dimuat.");
  }

  if (signal && signal.aborted) return;

  window.dataAlat = hasil.data;
};

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

  const aman = window.amanHTML;

  function tampilkanAlat() {
    const keyword = search.value.trim().toLowerCase();
    const pilihan = filter.value;

    const hasil = window.dataAlat.filter(function (alat) {
      const teks = `${alat.nama} ${alat.deskripsi}`.toLowerCase();

      const cocokStok =
        pilihan === "semua" ||
        (pilihan === "tersedia" && alat.stok > 0) ||
        (pilihan === "habis" && alat.stok === 0);

      return teks.includes(keyword) && cocokStok;
    });

    list.innerHTML = hasil.map(function (alat) {
      const tersedia = alat.stok > 0;

      const tujuan = new URL("pages/form.html", window.SIPTA_ROOT);
      tujuan.searchParams.set("alat", alat.id);

      const foto = alat.gambar
        ? `
          <img
            src="${aman(new URL(alat.gambar, window.SIPTA_ROOT).href)}"
            alt="${aman(alat.nama)}"
            width="320"
            height="200"
            loading="lazy"
            decoding="async"
          >
        `
        : '<span>Foto alat belum tersedia</span>';

      return `
        <article class="alat-card alat-card-foto">
          <div class="alat-photo">
            ${foto}

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
                  ${aman(alat.kategori)}
                </span>
                <h3>${aman(alat.nama)}</h3>
              </div>
            </div>

            <p class="alat-description">
              ${aman(alat.deskripsi)}
            </p>

            <dl class="alat-specs">
              <div>
                <dt>Kondisi</dt>
                <dd>${aman(alat.kondisi)}</dd>
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
                    href="${aman(tujuan.href)}"
                    class="button button-primary alat-pinjam"
                    data-page="form"
                    data-alat-id="${alat.id}"
                    aria-label="Pinjam ${aman(alat.nama)}"
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

  // Foto yang belum tersedia tidak menampilkan ikon gambar rusak.
  list.addEventListener("error", function (event) {
    if (event.target.tagName !== "IMG") return;

    const pengganti = document.createElement("span");
    pengganti.textContent = "Foto alat belum tersedia";
    event.target.replaceWith(pengganti);
  }, true);

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