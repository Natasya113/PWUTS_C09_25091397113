"use strict";

const mainContent = document.getElementById("main-content");
const berandaHTML = mainContent.innerHTML;

let requestAktif = null;

/* Mengatur tampilan landing page atau halaman layanan. */
function aturTampilan(page) {
  document.body.classList.toggle("mode-layanan", page !== "beranda");

  document.querySelectorAll(".navigation .nav-link").forEach(function (link) {
    const tujuan = link.dataset.page || "beranda";
    const aktif = tujuan === page;

    link.classList.toggle("active", aktif);

    if (aktif) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const judul = {
    beranda: "SIPTA — Peminjaman Alat",
    katalog: "Katalog Alat — SIPTA",
    form: "Pengajuan Peminjaman — SIPTA"
  };

  document.title = judul[page];
}

/* Kerangka sidebar untuk halaman pengajuan dan pesan pemuatan. */
function buatLayoutLayanan(page, isi) {
  return `
    <section class="alat-page">
      <div class="alat-layout">

        <aside class="alat-sidebar">
          <div class="alat-sidebar-title">
            <span class="alat-sidebar-icon" aria-hidden="true">S</span>
            <div>
              <strong>SIPTA</strong>
              <small>Layanan mahasiswa</small>
            </div>
          </div>

          <p class="alat-menu-label">MENU LAYANAN</p>

          <nav class="alat-menu" aria-label="Menu layanan alat">
            <a href="index.html" data-page="beranda">
              Beranda
            </a>

            <a
              href="pages/konten.html"
              data-page="katalog"
              ${page === "katalog"
                ? 'class="selected" aria-current="page"'
                : ""}
            >
              Katalog Alat
            </a>

            <a
              href="pages/form.html"
              data-page="form"
              ${page === "form"
                ? 'class="selected" aria-current="page"'
                : ""}
            >
              Pengajuan Peminjaman
            </a>
          </nav>

          <div class="alat-sidebar-note">
            <strong>Peminjaman gratis</strong>
            <p>
              Pilih alat sesuai kebutuhan.
              Peminjaman alat tidak memerlukan surat permohonan.
            </p>
          </div>
        </aside>

        <div class="alat-main">
          ${isi}
        </div>

      </div>
    </section>
  `;
}

/* Memuat konten halaman menggunakan Ajax. */
async function muatHalaman(page, alatId) {
  const halaman = {
    katalog: "pages/konten.html",
    form: "pages/form.html"
  };

  if (page !== "beranda" && !halaman[page]) return;

  if (requestAktif) {
    requestAktif.abort();
    requestAktif = null;
  }

  mainContent.removeAttribute("aria-busy");
  aturTampilan(page);

  if (page === "beranda") {
    mainContent.innerHTML = berandaHTML;
    window.scrollTo(0, 0);
    mainContent.focus({ preventScroll: true });
    return;
  }

  const controller = new AbortController();
  requestAktif = controller;

  mainContent.setAttribute("aria-busy", "true");

  mainContent.innerHTML = buatLayoutLayanan(
    page,
    '<p role="status">Memuat halaman...</p>'
  );

  window.scrollTo(0, 0);

  try {
    const response = await fetch(halaman[page], {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("Halaman gagal dimuat.");
    }

    const html = await response.text();

    if (controller.signal.aborted) return;

    if (!html.trim()) {
      mainContent.innerHTML = buatLayoutLayanan(
        page,
        `
          <p class="alat-breadcrumb">
            Layanan Mahasiswa / ${
              page === "form" ? "Pengajuan" : "Katalog"
            }
          </p>

          <div class="alat-heading">
            <div>
              <p class="eyebrow">LAYANAN PEMINJAMAN ALAT</p>

              <h1>${
                page === "form"
                  ? "Pengajuan Peminjaman"
                  : "Katalog Alat"
              }</h1>

              <p>
                Isi halaman ini belum dibuat.
                Kerangka tampilannya sudah siap.
              </p>
            </div>
          </div>

          <a
            href="index.html"
            class="button button-secondary"
            data-page="beranda"
          >
            Kembali ke Beranda
          </a>
        `
      );
    } else {
      /*
       * Katalog saat ini sudah memiliki sidebar.
       * Formulir yang hanya berisi konten akan otomatis
       * dibungkus dengan kerangka sidebar yang sama.
       */
      const template = document.createElement("template");
      template.innerHTML = html;

      const sudahAdaLayout =
        template.content.querySelector(".alat-layout");

      mainContent.innerHTML = sudahAdaLayout
        ? html
        : buatLayoutLayanan(page, html);

      if (page === "katalog") {
        window.initKatalog();
      }

      if (page === "form" && typeof window.initForm === "function") {
        window.initForm(alatId);
      }
    }

    mainContent.focus({ preventScroll: true });
  } catch (error) {
    if (error.name === "AbortError") return;

    mainContent.innerHTML = buatLayoutLayanan(
      page,
      `
        <div role="alert">
          <h1>Halaman belum dapat dimuat</h1>
          <p>
            Periksa file halaman dan JavaScript.
            Pastikan website dibuka melalui localhost.
          </p>

          <a
            href="index.html"
            class="button button-primary"
            data-page="beranda"
          >
            Kembali ke Beranda
          </a>
        </div>
      `
    );

    mainContent.focus({ preventScroll: true });
  } finally {
    if (requestAktif === controller) {
      mainContent.removeAttribute("aria-busy");
      requestAktif = null;
    }
  }
}

/* Menangani klik menu, termasuk menu hasil pemuatan Ajax. */
document.addEventListener("click", function (event) {
  const link = event.target.closest("a[data-page]");

  if (!link) return;

  if (
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  ) {
    return;
  }

  event.preventDefault();

  muatHalaman(
    link.dataset.page,
    link.dataset.alatId
  );
});