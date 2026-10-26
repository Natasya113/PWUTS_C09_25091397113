"use strict";

const mainContent = document.getElementById("main-content");
const rootURL = window.SIPTA_ROOT;

const alamatHalaman = {
  beranda: new URL("index.html", rootURL).href,
  katalog: new URL("pages/konten.html", rootURL).href,
  form: new URL("pages/form.html", rootURL).href
};

let requestAktif = null;

function aturTampilan(page) {
  // Semua halaman sekarang menggunakan sidebar.
  document.body.classList.add("mode-layanan");

  const judul = {
    beranda: "Beranda — SIPTA",
    katalog: "Katalog Alat — SIPTA",
    form: "Pengajuan Peminjaman — SIPTA"
  };

  document.title = judul[page] || "SIPTA";

  document.querySelectorAll("a[data-page]").forEach(function (link) {
    const tujuan = link.dataset.page;

    if (alamatHalaman[tujuan]) {
      const url = new URL(alamatHalaman[tujuan]);

      if (link.dataset.alatId) {
        url.searchParams.set("alat", link.dataset.alatId);
      }

      link.href = url.href;
    }

    const aktif = tujuan === page;

    if (link.classList.contains("nav-link")) {
      link.classList.toggle("active", aktif);
    }

    if (link.closest(".alat-menu")) {
      link.classList.toggle("selected", aktif);
    }

    if (
      link.classList.contains("nav-link") ||
      link.closest(".alat-menu")
    ) {
      if (aktif) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  });
}

function buatLayoutLayanan(isi) {
  return `
    <section class="alat-page">
      <div class="alat-layout">

        <aside class="alat-sidebar">
          <div class="alat-sidebar-title">
            <a
              class="alat-sidebar-icon"
              href="${alamatHalaman.beranda}"
              data-page="beranda"
              aria-label="SIPTA Beranda"
            >
              S
            </a>

            <div>
              <strong>SIPTA</strong>
              <small>Layanan mahasiswa</small>
            </div>
          </div>

          <p class="alat-menu-label">MENU LAYANAN</p>

          <nav class="alat-menu" aria-label="Menu layanan alat">
            <a
              href="${alamatHalaman.beranda}"
              data-page="beranda"
            >
              Beranda
            </a>

            <a
              href="${alamatHalaman.katalog}"
              data-page="katalog"
            >
              Katalog Alat
            </a>

            <a
              href="${alamatHalaman.form}"
              data-page="form"
            >
              Pengajuan Peminjaman
            </a>
          </nav>

          <div class="alat-sidebar-note">
            <strong>Peminjaman gratis</strong>

            <p>
              Pilih alat sesuai kebutuhan. Peminjaman alat
              tidak memerlukan surat permohonan.
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

function initBeranda() {
  const jenis = document.getElementById("home-jenis");
  const total = document.getElementById("home-total");
  const tersedia = document.getElementById("home-tersedia");
  const daftar = document.getElementById("home-daftar-alat");

  if (!jenis || !total || !tersedia || !daftar) {
    return;
  }

  const alat = window.dataAlat;
  const aman = window.amanHTML;

  jenis.textContent = alat.length;

  total.textContent = alat.reduce(function (jumlah, item) {
    return jumlah + item.stokTotal;
  }, 0);

  tersedia.textContent = alat.reduce(function (jumlah, item) {
    return jumlah + item.stok;
  }, 0);

  if (!alat.length) {
    daftar.innerHTML = `
      <tr>
        <td colspan="5">Belum ada data alat.</td>
      </tr>
    `;

    return;
  }

  daftar.innerHTML = alat.map(function (item) {
    const adaStok = item.stok > 0;

    return `
      <tr>
        <td>
          <strong>${aman(item.nama)}</strong>
        </td>

        <td>${aman(item.kondisi)}</td>

        <td>${item.stokTotal}</td>

        <td>${item.stok}</td>

        <td>
          <span class="dashboard-badge ${
            adaStok ? "available" : "empty"
          }">
            ${adaStok ? "Tersedia" : "Stok habis"}
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

function tampilkanGagal(error, page) {
  mainContent.innerHTML = buatLayoutLayanan(`
    <div role="alert">
      <p class="eyebrow">INFORMASI LAYANAN</p>

      <h1>Halaman belum dapat dimuat</h1>

      <p>
        Pastikan Apache dan MySQL aktif, database sipta tersedia,
        serta file website berada di folder yang benar.
      </p>

      <div class="dashboard-actions">
        <a
          href="${alamatHalaman[page]}"
          class="button button-primary"
          data-page="${page}"
        >
          Coba lagi
        </a>

        <a
          href="${alamatHalaman.beranda}"
          class="button button-secondary"
          data-page="beranda"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  `);

  aturTampilan(page);
  mainContent.focus({ preventScroll: true });

  console.error(error);
}

async function aktifkanHalaman(page, alatId, controller) {
  aturTampilan(page);

  const tombol = document.getElementById("kirim-pengajuan");

  if (tombol) {
    tombol.disabled = true;
    tombol.textContent = "Memuat data alat...";
  }

  await window.muatDataAlat(controller.signal);

  if (controller.signal.aborted) {
    return;
  }

  if (page === "beranda") {
    initBeranda();
  }

  if (page === "katalog") {
    window.initKatalog();
  }

  if (page === "form") {
    const form = document.getElementById("form-peminjaman");

    if (form) {
      form.action = new URL("process.php", rootURL).href;
      window.initForm(alatId);
    }

    if (tombol) {
      tombol.disabled = false;
      tombol.textContent = "Kirim Pengajuan";
    }
  }

  aturTampilan(page);
}

async function muatHalaman(page, alatId) {
  if (!alamatHalaman[page] || !mainContent) {
    return;
  }

  if (requestAktif) {
    requestAktif.abort();
  }

  const controller = new AbortController();
  requestAktif = controller;

  mainContent.setAttribute("aria-busy", "true");

  mainContent.innerHTML = buatLayoutLayanan(`
    <p role="status">Memuat halaman...</p>
  `);

  aturTampilan(page);
  window.scrollTo(0, 0);

  try {
    const response = await fetch(alamatHalaman[page], {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(
        `Halaman gagal dimuat (${response.status}).`
      );
    }

    const html = await response.text();

    if (controller.signal.aborted) {
      return;
    }

    const dokumen = new DOMParser().parseFromString(
      html,
      "text/html"
    );

    const konten = dokumen.querySelector("#main-content");

    const isi = konten
      ? konten.innerHTML
      : dokumen.body.innerHTML;

    const punyaSidebar = konten
      ? konten.querySelector(".alat-layout")
      : dokumen.body.querySelector(".alat-layout");

    mainContent.innerHTML = punyaSidebar
      ? isi
      : buatLayoutLayanan(isi);

    await aktifkanHalaman(page, alatId, controller);

    if (!controller.signal.aborted) {
      mainContent.focus({ preventScroll: true });
    }
  } catch (error) {
    if (
      error.name === "AbortError" ||
      controller.signal.aborted
    ) {
      return;
    }

    tampilkanGagal(error, page);
  } finally {
    if (requestAktif === controller) {
      mainContent.removeAttribute("aria-busy");
      requestAktif = null;
    }
  }
}

document.addEventListener("click", function (event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const link = event.target.closest("a[data-page]");

  if (
    !link ||
    !mainContent ||
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0 ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  ) {
    return;
  }

  const page = link.dataset.page;

  if (!alamatHalaman[page]) {
    return;
  }

  event.preventDefault();

  const alatId =
    link.dataset.alatId ||
    new URL(link.href).searchParams.get("alat");

  muatHalaman(page, alatId);
});

async function mulaiHalaman() {
  if (!mainContent) {
    return;
  }

  let page = "beranda";

  if (document.getElementById("alat-list")) {
    page = "katalog";
  } else if (document.getElementById("form-peminjaman")) {
    page = "form";
  }

  const alatId = new URLSearchParams(
    window.location.search
  ).get("alat");

  const controller = new AbortController();
  requestAktif = controller;

  mainContent.setAttribute("aria-busy", "true");

  try {
    await aktifkanHalaman(page, alatId, controller);
  } catch (error) {
    if (
      error.name !== "AbortError" &&
      !controller.signal.aborted
    ) {
      tampilkanGagal(error, page);
    }
  } finally {
    if (requestAktif === controller) {
      mainContent.removeAttribute("aria-busy");
      requestAktif = null;
    }
  }
}

mulaiHalaman();