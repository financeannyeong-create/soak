// Konfigurasi Webhook Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNkYKTrGaA9INfHK_c4DeiSwvWc8hmjW1n-yMG5WPO5kIhy7LD0WpEIZ9IjrT7aahr/exec";

// Fungsi umum untuk mengirim data ke Google Sheets
function sendToGoogleSheets(actionType, payloadData) {
    // Hanya batalkan jika SCRIPT_URL kosong atau masih berisi teks placeholder 'YOUR_SCRIPT_URL'
    if (!SCRIPT_URL || SCRIPT_URL === "" || SCRIPT_URL.includes("YOUR_SCRIPT_URL")) {
        console.warn("URL Webhook Google Apps Script belum dipasang.");
        return;
    }

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Digunakan agar tidak terhalang kebijakan CORS browser
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: actionType,
            data: payloadData
        })
    })
    .then(() => {
        console.log("Data berhasil dikirim ke Google Sheets.");
    })
    .catch((error) => {
        console.error("Gagal mengirim data ke Google Sheets:", error);
    });
}

// CAFE & WAREHOUSE OPS - MULTI-OUTLET SYSTEM
// =========================================================

// --- 1. PIN CONFIG & SESSION MANAGEMENT ---
const DEFAULT_PINS = [
  { id: 'branch_owner', name: "Owner Central", pin: "1409", role: "admin" },
  { id: 'branch_owner_alt', name: "Owner Central", pin: "1409", role: "admin" },
  { id: 'branch_1', name: "Annyeong TA", pin: "1111", role: "branch" },
  { id: 'branch_2', name: "Annyeong KDR", pin: "2222", role: "branch" },
  { id: 'branch_3', name: "Kono 1", pin: "3333", role: "branch" },
  { id: 'branch_4', name: "Kono 2.0", pin: "4444", role: "branch" },
  { id: 'branch_5', name: "Warehouse", pin: "9999", role: "warehouse" }
];

let pinsList = [];
let enteredPin = "";
let currentUserSession = null;
let activeOpnameCat = 'All';

// Master Items Catalog
const DEFAULT_MASTER_BARANG = [
  { id: 'item_1', sku: 'BB-001', name: 'Biji Kopi House Blend', category: 'Bahan Baku', unit: 'Kg', cost: 120000, whStock: 45, bufferStock: 10, awal: 5.0, masuk: 2.0, akhir: 4.5 },
  { id: 'item_2', sku: 'BB-002', name: 'Biji Kopi Arabica Single Origin', category: 'Bahan Baku', unit: 'Kg', cost: 180000, whStock: 22, bufferStock: 5, awal: 2.5, masuk: 0, akhir: 2.0 },
  { id: 'item_3', sku: 'BB-003', name: 'Susu UHT Fresh Milk', category: 'Bahan Baku', unit: 'Liter', cost: 18500, whStock: 120, bufferStock: 24, awal: 12, masuk: 24, akhir: 18 },
  { id: 'item_4', sku: 'BB-004', name: 'Oat Milk Barista Edition', category: 'Bahan Baku', unit: 'Liter', cost: 38000, whStock: 30, bufferStock: 8, awal: 4, masuk: 6, akhir: 5 },
  { id: 'item_5', sku: 'SP-001', name: 'Syrup Vanilla 750ml', category: 'Syrup & Powder', unit: 'Botol', cost: 85000, whStock: 15, bufferStock: 3, awal: 3, masuk: 0, akhir: 2 },
  { id: 'item_6', sku: 'SP-002', name: 'Syrup Caramel 750ml', category: 'Syrup & Powder', unit: 'Botol', cost: 85000, whStock: 14, bufferStock: 3, awal: 2, masuk: 1, akhir: 2 },
  { id: 'item_7', sku: 'SP-003', name: 'Syrup Hazelnut 750ml', category: 'Syrup & Powder', unit: 'Botol', cost: 85000, whStock: 12, bufferStock: 3, awal: 1, masuk: 2, akhir: 2 },
  { id: 'item_8', sku: 'SP-004', name: 'Powder Matcha Premium', category: 'Syrup & Powder', unit: 'Kg', cost: 140000, whStock: 18, bufferStock: 4, awal: 2.0, masuk: 0, akhir: 1.2 },
  { id: 'item_9', sku: 'SP-005', name: 'Powder Dark Chocolate', category: 'Syrup & Powder', unit: 'Kg', cost: 110000, whStock: 25, bufferStock: 5, awal: 3.5, masuk: 0, akhir: 2.8 },
  { id: 'item_10', sku: 'PKG-001', name: 'Cup Cold 16oz Clear', category: 'Packaging', unit: 'Pcs', cost: 450, whStock: 2500, bufferStock: 500, awal: 250, masuk: 500, akhir: 420 },
  { id: 'item_11', sku: 'PKG-002', name: 'Cup Cold 12oz Clear', category: 'Packaging', unit: 'Pcs', cost: 380, whStock: 1800, bufferStock: 300, awal: 180, masuk: 200, akhir: 210 },
  { id: 'item_12', sku: 'PKG-003', name: 'Cup Hot 8oz Paper', category: 'Packaging', unit: 'Pcs', cost: 500, whStock: 900, bufferStock: 200, awal: 90, masuk: 100, akhir: 110 },
  { id: 'item_13', sku: 'PKG-004', name: 'Lid Dome 16oz', category: 'Packaging', unit: 'Pcs', cost: 180, whStock: 3000, bufferStock: 600, awal: 200, masuk: 500, akhir: 430 },
  { id: 'item_14', sku: 'PKG-005', name: 'Paper Straw Eco', category: 'Packaging', unit: 'Pack', cost: 12000, whStock: 60, bufferStock: 15, awal: 3, masuk: 5, akhir: 4 },
  { id: 'item_15', sku: 'OTH-001', name: 'Tissue Cafe', category: 'Kebersihan/Lain-lain', unit: 'Pack', cost: 8000, whStock: 80, bufferStock: 20, awal: 4, masuk: 10, akhir: 8 }
];

let masterBarangList = [];
let opnameItems = [];
let daftarPermintaan = []; // Array perbaikan Store Order
let currentShipmentDraft = []; // Items for Warehouse Tab 2

// --- INIT APP ---
window.addEventListener('DOMContentLoaded', () => {
  loadStoredPins();
  loadMasterBarang();
  loadStoredOpnameItems();
  checkActiveSession();
  setTomorrowDeliveryDate();
  setTodayPurchasingDate();
  setTodayOmsetDate();
  populateCatalogDropdowns();
  loadWebhookUrlToInput();
  fetchLatestPinsFromSheet(false);
});

// Stored PINs
function loadStoredPins() {
  const stored = localStorage.getItem('cafe_pins_config');
  if (stored) {
    try {
      pinsList = JSON.parse(stored);
      // Pastikan akun Owner Central (PIN 1409) selalu terdaftar
      let modified = false;
      if (!pinsList.some(p => p.pin === "1409")) {
        pinsList.push({ id: 'branch_owner_alt', name: "Owner Central", pin: "1409", role: "admin" });
        modified = true;
      }
      if (modified) {
        localStorage.setItem('cafe_pins_config', JSON.stringify(pinsList));
      }
    } catch (e) {
      pinsList = [...DEFAULT_PINS];
    }
  } else {
    pinsList = [...DEFAULT_PINS];
    localStorage.setItem('cafe_pins_config', JSON.stringify(pinsList));
  }
}

function checkActiveSession() {
  const stored = sessionStorage.getItem('cafe_user_session');
  if (stored) {
    try {
      const session = JSON.parse(stored);
      if (session && session.name) {
        activateUserSession(session);
        return;
      }
    } catch (e) {
      sessionStorage.removeItem('cafe_user_session');
    }
  }
  showPinOverlay();
}

function showPinOverlay() {
  document.getElementById('pinOverlay').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
  const btnSheetsSync = document.getElementById('btnSheetsSync');
  if (btnSheetsSync) btnSheetsSync.style.display = 'none';
  handlePinClear();
  fetchLatestPinsFromSheet(false);
}

// PIN Keypad Handlers
window.handlePinInput = function(num) {
  if (enteredPin.length < 4) {
    enteredPin += num;
    updatePinDots();
    clearPinMsg();
    if (enteredPin.length === 4) {
      setTimeout(handlePinSubmit, 150);
    }
  }
};

window.handlePinClear = function() {
  enteredPin = "";
  updatePinDots();
  clearPinMsg();
};

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (dot) {
      if (i < enteredPin.length) dot.classList.add('filled');
      else dot.classList.remove('filled');
    }
  }
}

function clearPinMsg() {
  const el = document.getElementById('pinMsg');
  if (el) el.textContent = "";
}

window.handlePinSubmit = function() {
  if (enteredPin.length !== 4) {
    showPinError("Masukkan 4 digit PIN lengkap");
    return;
  }

  loadStoredPins();
  const matchedOutlet = pinsList.find(p => p.pin === enteredPin);

  if (matchedOutlet) {
    const sessionData = {
      name: matchedOutlet.name,
      role: matchedOutlet.role,
      token: "SES_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      loginAt: new Date().toISOString()
    };
    sessionStorage.setItem('cafe_user_session', JSON.stringify(sessionData));
    activateUserSession(sessionData);
  } else {
    showPinError("PIN Salah! Silakan coba lagi.");
    const container = document.getElementById('pinDotsContainer');
    if (container) {
      container.classList.add('shake');
      setTimeout(() => container.classList.remove('shake'), 400);
    }
    setTimeout(handlePinClear, 600);
  }
};

function showPinError(msg) {
  const el = document.getElementById('pinMsg');
  if (el) el.textContent = msg;
}

// PERBAIKAN TOMBOL "Lock / Exit"
window.handleLogout = function() {
  sessionStorage.removeItem('cafe_user_session');
  currentUserSession = null;
  enteredPin = "";
  showPinOverlay();
  showToast("Aplikasi terkunci. Sesi keluar.");
};

// Activate Session & Configure Role UI
function activateUserSession(session) {
  currentUserSession = session;
  document.getElementById('pinOverlay').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';

  const outletHeaderEl = document.getElementById('headerOutletName');
  const roleBadgeEl = document.getElementById('headerRoleBadge');
  const orderOutletInput = document.getElementById('orderOutletInput');

  if (outletHeaderEl) outletHeaderEl.textContent = session.name;
  if (orderOutletInput) orderOutletInput.value = session.name;

  // PEMBATASAN AKSES TOMBOL "⚙️ Sheets Sync" (HANYA UNTUK ROLE 'admin')
  const btnSheetsSync = document.getElementById('btnSheetsSync');
  if (btnSheetsSync) {
    if (session && session.role === 'admin') {
      btnSheetsSync.style.display = 'inline-block';
    } else {
      btnSheetsSync.style.display = 'none';
    }
  }

  // Cabang Tabs
  const tabBtnOpname = document.getElementById('tabBtnOpname');
  const tabBtnOrder = document.getElementById('tabBtnOrder');

  // Warehouse Tabs (6 Fitur Utama)
  const tabBtnMasterBarang = document.getElementById('tabBtnMasterBarang');
  const tabBtnPurchasing = document.getElementById('tabBtnPurchasing');
  const tabBtnBarangKeluar = document.getElementById('tabBtnBarangKeluar');
  const tabBtnListPermintaan = document.getElementById('tabBtnListPermintaan');
  const tabBtnOmset = document.getElementById('tabBtnOmset');
  const tabBtnPinSettings = document.getElementById('tabBtnPinSettings');
  const navContainer = document.getElementById('navTabsContainer');

  if (session.role === 'admin') {
    // OWNER / ADMIN CENTRAL: AKSES PENUH KE SEMUA FITUR WAREHOUSE & CENTRAL
    // KHUSUS OWNER: Sembunyikan "Closing Harian" (Opname) karena Owner adalah pemantau/admin
    if (roleBadgeEl) {
      roleBadgeEl.textContent = "Owner Central";
      roleBadgeEl.className = "badge";
      roleBadgeEl.style.background = "#6366f1";
      roleBadgeEl.style.color = "#ffffff";
    }

    if (navContainer) navContainer.setAttribute('data-role', 'admin');

    tabBtnOpname.style.display = 'none'; // Sembunyikan Closing Harian
    tabBtnOrder.style.display = 'none';

    if (tabBtnMasterBarang) tabBtnMasterBarang.style.display = 'flex';
    tabBtnPurchasing.style.display = 'flex';
    tabBtnBarangKeluar.style.display = 'flex';
    tabBtnListPermintaan.style.display = 'flex';
    tabBtnOmset.style.display = 'flex';
    tabBtnPinSettings.style.display = 'flex';

    // Default tab for Owner Central: Master Barang
    switchTab('master_barang');
    renderMasterBarangTable();
    renderPurchasingHistory();
    loadBranchShipmentItems();
    renderAllOrdersSummary();
    renderOmsetTable();
    renderPinSettingsList();
  } else if (session.role === 'warehouse') {
    // WAREHOUSE ROLE: SEMBUNYIKAN Opname & Order, TAMPILKAN 6 FITUR UTAMA
    if (roleBadgeEl) {
      roleBadgeEl.textContent = "Admin Warehouse";
      roleBadgeEl.className = "badge badge-cyan";
      roleBadgeEl.style.background = "";
      roleBadgeEl.style.color = "";
    }

    if (navContainer) navContainer.setAttribute('data-role', 'warehouse');

    tabBtnOpname.style.display = 'none';
    tabBtnOrder.style.display = 'none';

    if (tabBtnMasterBarang) tabBtnMasterBarang.style.display = 'flex';
    tabBtnPurchasing.style.display = 'flex';
    tabBtnBarangKeluar.style.display = 'flex';
    tabBtnListPermintaan.style.display = 'flex';
    tabBtnOmset.style.display = 'flex';
    tabBtnPinSettings.style.display = 'flex';

    // Default tab for Warehouse: 1. Master Barang
    switchTab('master_barang');
    renderMasterBarangTable();
    renderPurchasingHistory();
    loadBranchShipmentItems();
    renderAllOrdersSummary();
    renderOmsetTable();
    renderPinSettingsList();
  } else {
    // CABANG CAFE ROLE: HANYA 2 TAB (Opname & Store Order)
    if (roleBadgeEl) {
      roleBadgeEl.textContent = "Cabang";
      roleBadgeEl.className = "badge badge-amber";
      roleBadgeEl.style.background = "";
      roleBadgeEl.style.color = "";
    }

    if (navContainer) navContainer.setAttribute('data-role', 'branch');

    tabBtnOpname.style.display = 'flex';
    tabBtnOrder.style.display = 'flex';

    if (tabBtnMasterBarang) tabBtnMasterBarang.style.display = 'none';
    tabBtnPurchasing.style.display = 'none';
    tabBtnBarangKeluar.style.display = 'none';
    tabBtnListPermintaan.style.display = 'none';
    tabBtnOmset.style.display = 'none';
    tabBtnPinSettings.style.display = 'none';

    // Default tab for Branch: Opname
    switchTab('opname');
    renderOpnameTable();
  }
}

// Dynamic Tab Switcher
window.switchTab = function(tabName) {
  const tabs = [
    { id: 'opname', btn: 'tabBtnOpname', sec: 'sectionOpname' },
    { id: 'order', btn: 'tabBtnOrder', sec: 'sectionOrder' },
    { id: 'master_barang', btn: 'tabBtnMasterBarang', sec: 'sectionMasterBarang' },
    { id: 'purchasing', btn: 'tabBtnPurchasing', sec: 'sectionPurchasing' },
    { id: 'barang_keluar', btn: 'tabBtnBarangKeluar', sec: 'sectionBarangKeluar' },
    { id: 'list_permintaan', btn: 'tabBtnListPermintaan', sec: 'sectionListPermintaan' },
    { id: 'omset', btn: 'tabBtnOmset', sec: 'sectionOmset' },
    { id: 'pin_settings', btn: 'tabBtnPinSettings', sec: 'sectionPinSettings' }
  ];

  tabs.forEach(t => {
    const btn = document.getElementById(t.btn);
    const sec = document.getElementById(t.sec);
    if (t.id === tabName) {
      if (btn) btn.classList.add('active');
      if (sec) sec.style.display = 'block';
    } else {
      if (btn) btn.classList.remove('active');
      if (sec) sec.style.display = 'none';
    }
  });

  if (tabName === 'master_barang') renderMasterBarangTable();
  else if (tabName === 'opname') renderOpnameTable();
  else if (tabName === 'order') renderOrderCart();
  else if (tabName === 'purchasing') renderPurchasingHistory();
  else if (tabName === 'barang_keluar') loadBranchShipmentItems();
  else if (tabName === 'list_permintaan') renderAllOrdersSummary();
  else if (tabName === 'omset') renderOmsetTable();
  else if (tabName === 'pin_settings') renderPinSettingsList();
};


// =========================================================
// FITUR KHUSUS WAREHOUSE: TAB 1 - MASTER BARANG (KATALOG UTAMA)
// =========================================================
function loadMasterBarang() {
  const stored = localStorage.getItem('cafe_master_barang');
  if (stored) {
    try {
      masterBarangList = JSON.parse(stored);
    } catch (e) {
      masterBarangList = [...DEFAULT_MASTER_BARANG];
    }
  } else {
    masterBarangList = [...DEFAULT_MASTER_BARANG];
    localStorage.setItem('cafe_master_barang', JSON.stringify(masterBarangList));
  }
}

window.renderMasterBarangTable = function() {
  const tbody = document.getElementById('masterBarangTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const totalBadge = document.getElementById('masterTotalBadge');
  if (totalBadge) totalBadge.textContent = `${masterBarangList.length} Item`;

  const searchTxt = (document.getElementById('searchMasterInput')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('filterMasterCat')?.value || 'All';

  const filtered = masterBarangList.filter(item => {
    const matchCat = (catFilter === 'All' || item.category === catFilter);
    const matchSearch = (!searchTxt || 
      (item.name && item.name.toLowerCase().includes(searchTxt)) || 
      (item.sku && item.sku.toLowerCase().includes(searchTxt))
    );
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:18px; color:var(--text-dim);">Tidak ada barang yang cocok dengan pencarian / filter.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const buffer = item.bufferStock || 0;
    const stock = item.whStock || 0;
    let stockStatusBadge = '';
    if (stock <= 0) {
      stockStatusBadge = `<span class="badge badge-red" title="Stok Habis">0 (Habis!)</span>`;
    } else if (stock <= buffer) {
      stockStatusBadge = `<span class="badge badge-amber" title="Di bawah Buffer Stock">${stock} (Menipis)</span>`;
    } else {
      stockStatusBadge = `<span style="font-family:'JetBrains Mono'; font-weight:700; color:#38bdf8;">${stock}</span>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono'; font-size:11px; color:#f59e0b; font-weight:600;">${item.sku || '-'}</td>
      <td>
        <div style="font-weight:700; color:#f8fafc;">${item.name}</div>
      </td>
      <td><span class="badge" style="background:#1e293b; color:#94a3b8;">${item.category}</span></td>
      <td style="text-align:center; color:var(--text-muted);">${item.unit}</td>
      <td style="text-align:center;">${stockStatusBadge}</td>
      <td style="text-align:center; font-family:'JetBrains Mono'; color:var(--text-dim);">${buffer}</td>
      <td style="text-align:center;">
        <div style="display:flex; justify-content:center; gap:5px;">
          <button type="button" onclick="openEditMasterModal('${item.id}')" style="background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; padding:3px 7px; border-radius:5px; font-size:11px; cursor:pointer;" title="Edit Item">✏️</button>
          <button type="button" class="btn-delete-master" data-id="${item.id}" data-sku="${item.sku || ''}" onclick="window.deleteMasterBarang('${item.id || item.sku}'); return false;" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#fca5a5; padding:3px 7px; border-radius:5px; font-size:11px; cursor:pointer;" title="Hapus Item">
            <span style="font-style:normal; pointer-events:none;">🗑️</span>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (!tbody.dataset.deleteListenerAttached) {
    tbody.dataset.deleteListenerAttached = 'true';
    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-delete-master');
      if (btn) {
        e.preventDefault();
        const idOrSku = btn.getAttribute('data-id') || btn.getAttribute('data-sku');
        if (idOrSku && typeof window.deleteMasterBarang === 'function') {
          window.deleteMasterBarang(idOrSku);
        }
      }
    });
  }
};

window.handleAddNewMasterBarang = function() {
  const sku = document.getElementById('newMasterSku').value.trim() || `SKU-${Date.now().toString().slice(-4)}`;
  const name = document.getElementById('newMasterName').value.trim();
  const category = document.getElementById('newMasterCategory').value;
  const unit = document.getElementById('newMasterUnit').value;
  const bufferStock = parseFloat(document.getElementById('newMasterBuffer').value) || 0;
  const whStock = parseFloat(document.getElementById('newMasterWhStock').value) || 0;

  if (!name) return alert("Silakan isi nama barang!");

  // Cek duplikasi nama
  if (masterBarangList.some(i => i.name.toLowerCase() === name.toLowerCase())) {
    return alert(`Barang dengan nama "${name}" sudah terdaftar di Master Barang!`);
  }

  const newItem = {
    id: 'item_' + Date.now(),
    sku: sku,
    name: name,
    category: category,
    unit: unit,
    cost: 0,
    whStock: whStock,
    bufferStock: bufferStock,
    awal: 0,
    masuk: 0,
    akhir: 0
  };

  masterBarangList.push(newItem);
  localStorage.setItem('cafe_master_barang', JSON.stringify(masterBarangList));

  // Reset form input
  document.getElementById('newMasterSku').value = '';
  document.getElementById('newMasterName').value = '';
  document.getElementById('newMasterBuffer').value = '';
  document.getElementById('newMasterWhStock').value = '';

  // Sinkronkan ke Opname dan Dropdown
  syncMasterToOpnameAndDropdowns();
  renderMasterBarangTable();
  showToast(`✓ Barang "${name}" berhasil ditambahkan ke Master Barang!`);
};

window.openEditMasterModal = function(id) {
  const item = masterBarangList.find(i => i.id === id);
  if (!item) return;
  document.getElementById('editMasterId').value = item.id;
  document.getElementById('editMasterSku').value = item.sku || '';
  document.getElementById('editMasterName').value = item.name;
  document.getElementById('editMasterCategory').value = item.category;
  document.getElementById('editMasterUnit').value = item.unit;
  document.getElementById('editMasterBuffer').value = item.bufferStock || 0;
  document.getElementById('editMasterWhStock').value = item.whStock || 0;
  document.getElementById('editMasterModal').style.display = 'flex';
};

window.closeEditMasterModal = function() {
  document.getElementById('editMasterModal').style.display = 'none';
};

window.saveEditMasterBarang = function() {
  const id = document.getElementById('editMasterId').value;
  const item = masterBarangList.find(i => i.id === id);
  if (!item) return;

  const newName = document.getElementById('editMasterName').value.trim();
  if (!newName) return alert("Nama barang tidak boleh kosong!");

  item.sku = document.getElementById('editMasterSku').value.trim() || item.sku;
  item.name = newName;
  item.category = document.getElementById('editMasterCategory').value;
  item.unit = document.getElementById('editMasterUnit').value;
  item.bufferStock = parseFloat(document.getElementById('editMasterBuffer').value) || 0;
  item.whStock = parseFloat(document.getElementById('editMasterWhStock').value) || 0;

  localStorage.setItem('cafe_master_barang', JSON.stringify(masterBarangList));
  closeEditMasterModal();
  syncMasterToOpnameAndDropdowns();
  renderMasterBarangTable();
  showToast(`Data barang "${item.name}" berhasil diperbarui!`);
};

let isDeletingMaster = false;
window.deleteMasterBarang = function(idOrSku) {
  if (isDeletingMaster) return;
  if (!idOrSku) return;

  const key = String(idOrSku).trim();
  const item = masterBarangList.find(i => 
    String(i.id).trim() === key || 
    (i.sku && String(i.sku).trim() === key) ||
    (i.name && i.name.trim().toLowerCase() === key.toLowerCase())
  );
  if (!item) {
    console.warn("Item tidak ditemukan untuk ID/SKU:", idOrSku);
    return;
  }

  isDeletingMaster = true;
  const isConfirmed = confirm(`Apakah Anda yakin ingin menghapus item '${item.name}' dari Master Barang?`);
  if (!isConfirmed) {
    isDeletingMaster = false;
    return;
  }

  // a. Hapus barang tersebut dari array MASTER_BARANG di LocalStorage & state aplikasi
  masterBarangList = masterBarangList.filter(i => 
    String(i.id).trim() !== String(item.id).trim() && 
    (!item.sku || String(i.sku || '').trim() !== String(item.sku).trim())
  );
  localStorage.setItem('cafe_master_barang', JSON.stringify(masterBarangList));
  localStorage.setItem('master_barang', JSON.stringify(masterBarangList));
  syncMasterToOpnameAndDropdowns();

  // b. Render/refresh ulang tabel Master Barang di layar
  renderMasterBarangTable();

  // c. Lakukan otomatis sinkronisasi (Sync) update Master Barang terbaru ke Google Sheets (action: 'master_barang')
  syncToGoogleSheet('master_barang', masterBarangList);

  // d. Tampilkan notifikasi "Item berhasil dihapus!"
  showToast(`Item '${item.name}' berhasil dihapus!`);

  setTimeout(() => {
    isDeletingMaster = false;
  }, 400);
};

window.deleteMasterItem = window.deleteMasterBarang;

window.syncMasterBarangToSheet = function() {
  if (masterBarangList.length === 0) return alert("Master Barang masih kosong!");
  syncToGoogleSheet('master_barang', masterBarangList);
  showToast("Katalog Master Barang disimpan & disinkronkan ke Google Sheets (Sheet: MASTER_BARANG)!");
};

window.fetchMasterBarangFromSheet = async function(isManual = false) {
  const webhookUrl = localStorage.getItem('cafe_gsheet_webhook_url');
  if (!webhookUrl) {
    if (isManual) alert("URL Webhook belum diatur. Silakan atur di ⚙️ Sheets Sync.");
    return;
  }
  try {
    const separator = webhookUrl.includes('?') ? '&' : '?';
    const fetchUrl = `${webhookUrl}${separator}action=get_master_barang&_t=${Date.now()}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error("HTTP error " + res.status);
    const result = await res.json();
    let remoteItems = null;
    if (result && result.status === 'success' && Array.isArray(result.data)) {
      remoteItems = result.data;
    } else if (Array.isArray(result)) {
      remoteItems = result;
    }
    if (remoteItems && remoteItems.length > 0) {
      masterBarangList = remoteItems;
      localStorage.setItem('cafe_master_barang', JSON.stringify(masterBarangList));
      syncMasterToOpnameAndDropdowns();
      renderMasterBarangTable();
      if (isManual) showToast(`✓ Berhasil menarik ${remoteItems.length} Master Barang dari Google Sheets!`);
    } else if (isManual) {
      showToast("Sheet MASTER_BARANG belum ada data. Tetap menggunakan data lokal.");
    }
  } catch (err) {
    console.warn("Gagal fetch master barang dari Sheets:", err);
    if (isManual) showToast("Gagal mengambil Master Barang dari Google Sheets.");
  }
};

function syncMasterToOpnameAndDropdowns() {
  // Sinkronkan data Master Barang ke opnameItems secara dinamis
  opnameItems = masterBarangList.map(masterItem => {
    const existing = opnameItems.find(o => o.id === masterItem.id || o.name.toLowerCase() === masterItem.name.toLowerCase());
    return {
      id: masterItem.id,
      name: masterItem.name,
      category: masterItem.category,
      unit: masterItem.unit,
      cost: masterItem.cost || 0,
      whStock: masterItem.whStock || 0,
      awal: existing ? existing.awal : (masterItem.awal || 0),
      masuk: existing ? existing.masuk : (masterItem.masuk || 0),
      akhir: existing ? existing.akhir : (masterItem.akhir || 0)
    };
  });
  localStorage.setItem('cafe_opname_items', JSON.stringify(opnameItems));
  populateCatalogDropdowns();
  const opnameSec = document.getElementById('sectionOpname');
  if (opnameSec && opnameSec.style.display !== 'none') {
    renderOpnameTable();
  }
}

// =========================================================
// FITUR 2: CABANG TAB 1 - STOCK OPNAME (CLOSING CAFE)
// =========================================================
function loadStoredOpnameItems() {
  loadMasterBarang();
  const stored = localStorage.getItem('cafe_opname_items');
  let savedOpname = [];
  if (stored) {
    try {
      savedOpname = JSON.parse(stored);
    } catch (e) {
      savedOpname = [];
    }
  }

  // Gabungkan dinamis dari masterBarangList
  opnameItems = masterBarangList.map(m => {
    const found = savedOpname.find(s => s.id === m.id || (s.name && s.name.toLowerCase() === m.name.toLowerCase()));
    return {
      id: m.id,
      name: m.name,
      category: m.category,
      unit: m.unit,
      cost: m.cost || 0,
      whStock: m.whStock || 0,
      awal: found ? found.awal : (m.awal || 0),
      masuk: found ? found.masuk : (m.masuk || 0),
      akhir: found ? found.akhir : (m.akhir || 0)
    };
  });
  localStorage.setItem('cafe_opname_items', JSON.stringify(opnameItems));
}

window.filterOpnameCat = function(category) {
  activeOpnameCat = category;
  ['All', 'Bahan', 'Syrup', 'Pack', 'Lain'].forEach(cat => {
    const btn = document.getElementById(`cat_${cat}`);
    if (btn) {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-muted)';
    }
  });

  const catMap = { 'All': 'cat_All', 'Bahan Baku': 'cat_Bahan', 'Syrup & Powder': 'cat_Syrup', 'Packaging': 'cat_Pack', 'Lain-lain': 'cat_Lain' };
  const activeBtn = document.getElementById(catMap[category] || 'cat_All');
  if (activeBtn) {
    activeBtn.style.background = '#1e293b';
    activeBtn.style.color = '#fff';
  }
  renderOpnameTable();
};

function renderOpnameTable() {
  const tbody = document.getElementById('opnameTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const countAll = document.getElementById('countAll');
  if (countAll) countAll.textContent = opnameItems.length;

  const filtered = activeOpnameCat === 'All' 
    ? opnameItems 
    : opnameItems.filter(i => i.category === activeOpnameCat);

  filtered.forEach((item) => {
    const selisih = Number((item.akhir - (item.awal + item.masuk)).toFixed(2));
    let selisihBadge = `<span class="badge" style="background:#1e293b; color:#94a3b8;">${selisih}</span>`;
    if (selisih > 0) selisihBadge = `<span class="badge badge-emerald">+${selisih}</span>`;
    else if (selisih < 0) selisihBadge = `<span class="badge badge-red">${selisih}</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight: 600; color: #f8fafc;">${item.name}</div>
        <div style="font-size: 10px; color: var(--text-dim);">${item.category}</div>
      </td>
      <td style="text-align: center; font-family:'JetBrains Mono';">${item.awal}</td>
      <td style="text-align: center; font-family:'JetBrains Mono'; color:#38bdf8;">${item.masuk}</td>
      <td style="text-align: center;">
        <input type="number" step="any" value="${item.akhir}" 
          class="touch-input" style="width: 85px; text-align: center; font-weight: 700; font-family:'JetBrains Mono';"
          onchange="updateOpnameAkhir('${item.id}', this.value)"
        />
      </td>
      <td style="text-align: center; color: var(--text-muted);">${item.unit}</td>
      <td style="text-align: right; font-family:'JetBrains Mono'; font-weight:700;">${selisihBadge}</td>
    `;
    tbody.appendChild(tr);
  });

  checkMinusItemsForOrder();
}

window.updateOpnameAkhir = function(id, val) {
  const num = parseFloat(val) || 0;
  const item = opnameItems.find(i => i.id === id);
  if (item) {
    item.akhir = num;
    localStorage.setItem('cafe_opname_items', JSON.stringify(opnameItems));
    renderOpnameTable();
  }
};

window.handleSubmitOpnameAndSync = function() {
  localStorage.setItem('cafe_opname_items', JSON.stringify(opnameItems));
  const payload = {
    date: new Date().toISOString().split('T')[0],
    outlet: currentUserSession ? currentUserSession.name : 'Unknown Branch',
    totalItems: opnameItems.length,
    items: opnameItems.map(i => ({
      name: i.name,
      category: i.category,
      awal: i.awal,
      masuk: i.masuk,
      akhir: i.akhir,
      satuan: i.unit,
      selisih: Number((i.akhir - (i.awal + i.masuk)).toFixed(2))
    }))
  };

  // Sync to Google Sheets
  syncToGoogleSheet('opname', payload);
  showToast("Opname tersimpan & disinkronkan ke Google Sheets!");

  // Pemicu buka Store Order
  setTimeout(() => {
    switchTab('order');
    showToast("Membuka Modul Store Order H+1...");
  }, 900);
};

// Modal Tambah Item Opname
window.openAddItemModal = function() { document.getElementById('addItemModal').style.display = 'flex'; };
window.closeAddItemModal = function() { document.getElementById('addItemModal').style.display = 'none'; };
window.saveNewOpnameItem = function() {
  const name = document.getElementById('newOpnameName').value.trim();
  const cat = document.getElementById('newOpnameCat').value;
  const unit = document.getElementById('newOpnameUnit').value;

  if (!name) return alert("Nama barang wajib diisi!");

  const newItem = {
    id: 'item_' + Date.now(),
    name: name,
    category: cat,
    awal: 0,
    masuk: 0,
    akhir: 0,
    unit: unit,
    cost: 50000,
    whStock: 20
  };

  opnameItems.push(newItem);
  localStorage.setItem('cafe_opname_items', JSON.stringify(opnameItems));
  populateCatalogDropdowns();
  renderOpnameTable();
  closeAddItemModal();
  document.getElementById('newOpnameName').value = '';
  showToast(`Item "${name}" berhasil ditambahkan ke Opname.`);
};


// =========================================================
// FITUR 2: CABANG TAB 2 - STORE ORDER (PERMINTAAN H+1)
// =========================================================
function setTomorrowDeliveryDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  const dateInput = document.getElementById('orderDeliveryDate');
  if (dateInput) dateInput.value = dateStr;
  const shipDate = document.getElementById('shipmentDeliveryDate');
  if (shipDate) shipDate.value = dateStr;
}

function populateCatalogDropdowns() {
  const selectOrder = document.getElementById('orderSelectCatalog');
  const selectPurchasing = document.getElementById('purchasingSelectCatalog');
  if (!selectOrder && !selectPurchasing) return;

  const catalogSource = (masterBarangList && masterBarangList.length > 0) ? masterBarangList : opnameItems;
  let optionsHtml = '';
  catalogSource.forEach(item => {
    optionsHtml += `<option value="${item.name}" data-unit="${item.unit}" data-cost="${item.cost || 0}">${item.name} (${item.unit})</option>`;
  });

  if (selectOrder) {
    selectOrder.innerHTML = optionsHtml;
    handleCatalogSelectChange();
  }
  if (selectPurchasing) {
    selectPurchasing.innerHTML = optionsHtml;
    handlePurchasingSelectChange();
  }
}

window.handleCatalogSelectChange = function() {
  const sel = document.getElementById('orderSelectCatalog');
  if (!sel || !sel.selectedOptions[0]) return;
  const unit = sel.selectedOptions[0].getAttribute('data-unit') || 'Pcs';
  const unitSelect = document.getElementById('orderUnitInput');
  if (unitSelect) unitSelect.value = unit;
};

window.toggleCustomItemInput = function() {
  const select = document.getElementById('orderSelectCatalog');
  const custom = document.getElementById('orderCustomItemName');
  const btn = document.getElementById('btnToggleCustom');

  if (custom.style.display === 'none') {
    custom.style.display = 'block';
    select.style.display = 'none';
    btn.textContent = 'Katalog?';
    custom.focus();
  } else {
    custom.style.display = 'none';
    select.style.display = 'block';
    btn.textContent = 'Item Baru?';
  }
};

// PERBAIKAN TOMBOL: + Masukkan Daftar
window.handleAddItemToCart = function() {
  const custom = document.getElementById('orderCustomItemName');
  const select = document.getElementById('orderSelectCatalog');
  let itemName = '';

  if (custom.style.display !== 'none' && custom.value.trim() !== '') {
    itemName = custom.value.trim();
  } else {
    itemName = select.value;
  }

  const qty = parseFloat(document.getElementById('orderQtyInput').value);
  const unit = document.getElementById('orderUnitInput').value;
  const priority = document.getElementById('orderPriorityInput').value;
  const notes = document.getElementById('orderNotesInput').value.trim();

  if (!itemName) return alert("Pilih atau masukkan nama barang!");
  if (isNaN(qty) || qty <= 0) return alert("Masukkan jumlah qty yang valid (lebih dari 0)!");

  // Cek jika barang sudah ada di array daftarPermintaan
  const existingIndex = daftarPermintaan.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
  if (existingIndex > -1) {
    daftarPermintaan[existingIndex].qty += qty;
    if (priority === 'Urgen') daftarPermintaan[existingIndex].priority = 'Urgen';
    if (notes) daftarPermintaan[existingIndex].notes = notes;
  } else {
    daftarPermintaan.push({
      id: 'ord_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: itemName,
      qty: qty,
      unit: unit,
      priority: priority,
      notes: notes
    });
  }

  // Reset Input
  document.getElementById('orderQtyInput').value = '';
  document.getElementById('orderNotesInput').value = '';
  if (custom.style.display !== 'none') {
    custom.value = '';
    window.toggleCustomItemInput();
  }

  renderOrderCart();
  showToast(`+ ${qty} ${unit} ${itemName} dimasukkan ke daftar order.`);
};

// PERBAIKAN TOMBOL: Hapus Semua
window.clearOrderCart = function() {
  if (daftarPermintaan.length === 0) return;
  daftarPermintaan = [];
  renderOrderCart();
  showToast("Daftar permintaan telah dikosongkan.");
};

window.removeCartItem = function(idx) {
  daftarPermintaan.splice(idx, 1);
  renderOrderCart();
};

function renderOrderCart() {
  const tbody = document.getElementById('orderCartTableBody');
  const empty = document.getElementById('orderEmptyState');
  const countBadge = document.getElementById('orderCartCount');
  const headerBadge = document.getElementById('orderCartBadge');

  if (countBadge) countBadge.textContent = daftarPermintaan.length;
  if (headerBadge) {
    headerBadge.textContent = daftarPermintaan.length;
    headerBadge.style.display = daftarPermintaan.length > 0 ? 'inline-block' : 'none';
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (daftarPermintaan.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  daftarPermintaan.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const prioBadge = item.priority === 'Urgen' 
      ? `<span class="badge badge-red">URGEN</span>` 
      : `<span class="badge badge-emerald">Normal</span>`;

    tr.innerHTML = `
      <td style="text-align: center; color: var(--text-dim);">${idx + 1}</td>
      <td style="font-weight: 600;">${item.name}</td>
      <td style="text-align: center; font-family:'JetBrains Mono'; font-weight:700; color:#f59e0b;">${item.qty} ${item.unit}</td>
      <td style="text-align: center;">${prioBadge}</td>
      <td style="font-size: 11px; color: var(--text-muted);">${item.notes || '-'}</td>
      <td style="text-align: center;">
        <button onclick="removeCartItem(${idx})" style="background:none; border:none; color:#ef4444; font-size:14px; font-weight:bold;">&times;</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function checkMinusItemsForOrder() {
  const minusItems = opnameItems.filter(i => (i.akhir - (i.awal + i.masuk)) < 0);
  const suggestionBox = document.getElementById('opnameSuggestionBox');
  if (suggestionBox) {
    suggestionBox.style.display = minusItems.length > 0 ? 'flex' : 'none';
  }
}

window.autoAddMinusItemsToCart = function() {
  const minusItems = opnameItems.filter(i => (i.akhir - (i.awal + i.masuk)) < 0);
  minusItems.forEach(i => {
    const neededQty = Math.abs(Number((i.akhir - (i.awal + i.masuk)).toFixed(2)));
    if (!daftarPermintaan.some(d => d.name === i.name)) {
      daftarPermintaan.push({
        id: 'ord_minus_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: i.name,
        qty: neededQty,
        unit: i.unit,
        priority: 'Urgen',
        notes: 'Auto-restock dari minus opname'
      });
    }
  });
  renderOrderCart();
  showToast(`Ditambahkan ${minusItems.length} barang minus ke daftar order.`);
};

// Generate Order WA Message
function generateOrderMessageText() {
  const outlet = currentUserSession ? currentUserSession.name : 'Outlet';
  const deliveryDate = document.getElementById('orderDeliveryDate').value;
  let text = `*STORE ORDER / PERMINTAAN BARANG WAREHOUSE*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📍 *Outlet Asal* : ${outlet}\n`;
  text += `📅 *Tanggal Kirim* : ${deliveryDate} (H+1)\n`;
  text += `⏰ *Waktu Order* : ${new Date().toLocaleTimeString('id-ID')}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `*DAFTAR BARANG YANG DIBUTUHKAN:*\n`;

  daftarPermintaan.forEach((item, index) => {
    const prioTag = item.priority === 'Urgen' ? ' [URGEN 🔴]' : '';
    const noteTag = item.notes ? ` _(Ket: ${item.notes})_` : '';
    text += `${index + 1}. *${item.name}* : ${item.qty} ${item.unit}${prioTag}${noteTag}\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Total: *${daftarPermintaan.length} Item Barang*\n`;
  text += `_Mohon diproses & disiapkan untuk pengiriman besok. Terima kasih!_`;
  return text;
}

window.openOrderSummaryModal = function() {
  if (daftarPermintaan.length === 0) return alert("Daftar permintaan masih kosong!");
  document.getElementById('summaryTextPreview').value = generateOrderMessageText();
  document.getElementById('orderSummaryModal').style.display = 'flex';
};
window.closeOrderSummaryModal = function() { document.getElementById('orderSummaryModal').style.display = 'none'; };

window.copySummaryText = function() {
  const text = document.getElementById('summaryTextPreview').value;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btnCopySummary');
    btn.textContent = 'Tersalin! ✓';
    setTimeout(() => { btn.textContent = 'Salin Teks'; }, 2000);
  });
};

window.handleSendOrderAndSync = function() {
  if (daftarPermintaan.length === 0) return alert("Daftar order kosong! Masukkan barang terlebih dahulu.");

  const outlet = currentUserSession ? currentUserSession.name : 'Unknown';
  const deliveryDate = document.getElementById('orderDeliveryDate').value;
  const adminWa = document.getElementById('orderWaAdmin').value.trim() || "6281234567890";
  const orderId = 'ORD-' + Date.now();

  const newOrderRecord = {
    orderId: orderId,
    outlet: outlet,
    requestDate: new Date().toISOString().split('T')[0],
    targetDate: deliveryDate,
    status: 'Pending',
    items: [...daftarPermintaan].map(i => ({
      ...i,
      accQty: i.qty // default di-acc sama dengan diminta
    }))
  };

  // Simpan ke localStorage global orders
  const orders = JSON.parse(localStorage.getItem('cafe_orders_list') || '[]');
  orders.unshift(newOrderRecord);
  localStorage.setItem('cafe_orders_list', JSON.stringify(orders));

  // Sync ke Google Sheets
  syncToGoogleSheet('store_order', newOrderRecord);

  // Buat URL WA
  const message = generateOrderMessageText();
  const waUrl = `https://wa.me/${adminWa}?text=${encodeURIComponent(message)}`;

  showToast("Pesanan disimpan & disinkronkan ke Google Sheets!");
  window.open(waUrl, '_blank');

  // Kosongkan keranjang
  daftarPermintaan = [];
  renderOrderCart();
  closeOrderSummaryModal();
};

window.exportOrderToCSV = function() {
  if (daftarPermintaan.length === 0) return alert("Daftar order masih kosong!");
  const outlet = currentUserSession ? currentUserSession.name : 'Outlet';
  const deliveryDate = document.getElementById('orderDeliveryDate').value;

  let csv = "No,Outlet,Tanggal Pengiriman,Nama Barang,Jumlah,Satuan,Prioritas,Catatan\n";
  daftarPermintaan.forEach((item, idx) => {
    csv += `${idx + 1},"${outlet}","${deliveryDate}","${item.name}",${item.qty},"${item.unit}","${item.priority}","${item.notes || ''}"\n`;
  });

  downloadCSVFile(csv, `Store_Order_${outlet.replace(/\s+/g, '_')}_${deliveryDate}.csv`);
};


// =========================================================
// FITUR 3: WAREHOUSE TAB 1 - INPUT BARANG DATANG (PURCHASING)
// =========================================================
function setTodayPurchasingDate() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('purchasingDate');
  if (el) el.value = today;
}

window.handlePurchasingSelectChange = function() {
  const sel = document.getElementById('purchasingSelectCatalog');
  if (!sel || !sel.selectedOptions[0]) return;
  const unit = sel.selectedOptions[0].getAttribute('data-unit') || 'Pcs';
  const cost = sel.selectedOptions[0].getAttribute('data-cost') || '0';
  document.getElementById('purchasingUnit').value = unit;
  document.getElementById('purchasingPrice').value = cost;
};

window.handleSavePurchasingEntryAndSync = function() {
  const date = document.getElementById('purchasingDate').value;
  const vendor = document.getElementById('purchasingVendor').value.trim();
  const invoice = document.getElementById('purchasingInvoice').value.trim() || '-';
  const itemName = document.getElementById('purchasingSelectCatalog').value;
  const qty = parseFloat(document.getElementById('purchasingQty').value);
  const unit = document.getElementById('purchasingUnit').value;
  const price = parseFloat(document.getElementById('purchasingPrice').value) || 0;

  if (!vendor) return alert("Nama supplier/vendor wajib diisi!");
  if (isNaN(qty) || qty <= 0) return alert("Kuantitas barang masuk harus lebih dari 0!");

  const purchasingData = {
    id: 'PUR-' + Date.now(),
    date: date,
    vendor: vendor,
    invoice: invoice,
    itemName: itemName,
    qty: qty,
    unit: unit,
    price: price,
    total: qty * price,
    timestamp: new Date().toLocaleTimeString('id-ID')
  };

  // Tambahkan ke Master Stok Gudang
  const itemMaster = masterBarangList.find(i => i.name === itemName);
  if (itemMaster) {
    itemMaster.whStock = (itemMaster.whStock || 0) + qty;
  }
  const item = opnameItems.find(i => i.name === itemName);
  if (item) {
    item.whStock = (item.whStock || 0) + qty;
  }
  localStorage.setItem('cafe_master_barang', JSON.stringify(masterBarangList));
  localStorage.setItem('cafe_opname_items', JSON.stringify(opnameItems));
  renderMasterBarangTable();

  // Simpan log purchasing
  const purchases = JSON.parse(localStorage.getItem('warehouse_purchasing_history') || '[]');
  purchases.unshift(purchasingData);
  localStorage.setItem('warehouse_purchasing_history', JSON.stringify(purchases));

  // Sync to Google Sheets
  syncToGoogleSheet('purchasing', purchasingData);

  // Reset input
  document.getElementById('purchasingQty').value = '';
  document.getElementById('purchasingInvoice').value = '';

  renderPurchasingHistory();
  showToast(`Stok gudang ${itemName} bertambah +${qty} ${unit} & disinkronkan!`);
};

function renderPurchasingHistory() {
  const tbody = document.getElementById('purchasingTableBody');
  const countBadge = document.getElementById('purchasingCountBadge');
  if (!tbody) return;

  const purchases = JSON.parse(localStorage.getItem('warehouse_purchasing_history') || '[]');
  if (countBadge) countBadge.textContent = `${purchases.length} Transaksi`;
  tbody.innerHTML = '';

  if (purchases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:var(--text-dim);">Belum ada penerimaan pasokan barang tercatat.</td></tr>`;
    return;
  }

  purchases.slice(0, 15).forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono';">${p.date}</td>
      <td style="font-weight:600; color:#f8fafc;">${p.vendor}</td>
      <td style="color:var(--text-muted); font-size:11px;">${p.invoice}</td>
      <td><b>${p.itemName}</b> <span style="color:#38bdf8;">(${p.qty} ${p.unit})</span></td>
      <td style="font-family:'JetBrains Mono';">Rp ${p.price.toLocaleString('id-ID')}</td>
      <td style="font-family:'JetBrains Mono'; font-weight:700; color:#34d399;">Rp ${p.total.toLocaleString('id-ID')}</td>
    `;
    tbody.appendChild(tr);
  });
}


// =========================================================
// FITUR 3: WAREHOUSE TAB 2 - INPUT BARANG KELUAR (PENGIRIMAN CABANG)
// =========================================================
window.loadBranchShipmentItems = function() {
  const branch = document.getElementById('selectBranchToShip').value;
  const orders = JSON.parse(localStorage.getItem('cafe_orders_list') || '[]');
  const branchOrders = orders.filter(o => o.outlet === branch && o.status !== 'Selesai');

  currentShipmentDraft = [];
  branchOrders.forEach(o => {
    o.items.forEach(item => {
      currentShipmentDraft.push({
        orderId: o.orderId,
        name: item.name,
        reqQty: item.qty,
        accQty: item.accQty !== undefined ? item.accQty : item.qty, // EDITABLE QUANTITY ACC
        unit: item.unit,
        notes: item.notes || ''
      });
    });
  });

  renderShipmentDraftTable();
};

function renderShipmentDraftTable() {
  const tbody = document.getElementById('shipmentItemsTableBody');
  const empty = document.getElementById('shipmentEmptyState');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (currentShipmentDraft.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  currentShipmentDraft.forEach((item, idx) => {
    const isManual = item.isManual || item.reqQty === 0 || (item.orderId && String(item.orderId).startsWith('MANUAL-'));
    const reqDisplay = isManual
      ? `<span class="badge" style="background:#1e293b; color:#94a3b8; font-size:10px;">0 (Manual)</span>`
      : `<span style="font-family:'JetBrains Mono'; font-weight:700; color:#fbbf24;">${item.reqQty}</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
          <span>${item.name}</span>
          ${isManual ? '<span class="badge badge-amber" style="font-size:9px; padding:1px 5px;">Manual</span>' : ''}
        </div>
        <div style="font-size: 10px; color: var(--text-dim);">${item.notes ? 'Catatan: ' + item.notes : ''}</div>
      </td>
      <td style="text-align: center;">${reqDisplay}</td>
      <td style="text-align: center;">
        <!-- INPUT EDITABLE JUMLAH KIRIM (ACC) -->
        <input type="number" step="any" min="0" value="${item.accQty}" 
          class="touch-input" style="width: 90px; text-align: center; font-weight: 800; font-family:'JetBrains Mono'; border-color:#38bdf8; color:#38bdf8;"
          onchange="updateShipmentAccQty(${idx}, this.value)"
        />
      </td>
      <td style="text-align: center; color: var(--text-muted); font-weight: 600;">${item.unit}</td>
      <td>
        <div style="display: flex; gap: 5px; align-items: center;">
          <input type="text" placeholder="Ket kirim..." value="${item.shipNotes || ''}" 
            class="touch-input" style="font-size: 11px; flex: 1;"
            onchange="updateShipmentNotes(${idx}, this.value)"
          />
          <button type="button" onclick="removeShipmentDraftItem(${idx})" title="Hapus item dari pengiriman ini" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 4px 7px; border-radius: 6px; font-size: 11px; cursor: pointer;">
            ✕
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.removeShipmentDraftItem = function(idx) {
  const item = currentShipmentDraft[idx];
  if (!item) return;
  currentShipmentDraft.splice(idx, 1);
  renderShipmentDraftTable();
  showToast(`Item "${item.name}" dihapus dari daftar kirim.`);
};

window.updateShipmentAccQty = function(idx, val) {
  const num = parseFloat(val);
  if (!isNaN(num) && num >= 0) {
    currentShipmentDraft[idx].accQty = num;
  }
};

window.updateShipmentNotes = function(idx, val) {
  currentShipmentDraft[idx].shipNotes = val.trim();
};

// =========================================================
// MODAL: TAMBAH ITEM KIRIM MANUAL DARI MASTER BARANG
// =========================================================
window.openManualShipmentModal = function() {
  const modal = document.getElementById('modalManualShipment');
  const select = document.getElementById('manualShipmentItemSelect');
  if (!modal || !select) return;

  // Pastikan data master barang sudah termuat
  if (!masterBarangList || masterBarangList.length === 0) {
    loadMasterBarang();
  }

  // Populate Dropdown dari MASTER_BARANG
  const catalog = (masterBarangList && masterBarangList.length > 0) ? masterBarangList : DEFAULT_MASTER_BARANG;
  let optionsHtml = '';
  catalog.forEach(item => {
    const stock = (item.whStock !== undefined) ? item.whStock : 0;
    const skuLabel = item.sku ? `[${item.sku}] ` : '';
    optionsHtml += `<option value="${item.name}" data-unit="${item.unit}" data-stock="${stock}">${skuLabel}${item.name} (${item.unit}) - Stok: ${stock}</option>`;
  });
  select.innerHTML = optionsHtml;

  // Set default values
  handleManualShipmentSelectChange();
  const qtyInput = document.getElementById('manualShipmentQty');
  if (qtyInput) {
    qtyInput.value = '1';
  }
  const notesInput = document.getElementById('manualShipmentNotes');
  if (notesInput) {
    notesInput.value = '';
  }

  modal.style.display = 'flex';
  if (qtyInput) setTimeout(() => qtyInput.focus(), 100);
};

window.closeManualShipmentModal = function() {
  const modal = document.getElementById('modalManualShipment');
  if (modal) modal.style.display = 'none';
};

window.handleManualShipmentSelectChange = function() {
  const select = document.getElementById('manualShipmentItemSelect');
  if (!select || !select.selectedOptions[0]) return;
  const opt = select.selectedOptions[0];
  const unit = opt.getAttribute('data-unit') || 'Pcs';
  const stock = opt.getAttribute('data-stock') || '0';

  const unitDisplay = document.getElementById('manualShipmentUnitDisplay');
  if (unitDisplay) unitDisplay.value = unit;

  const stockBadge = document.getElementById('manualShipmentStockBadge');
  if (stockBadge) {
    stockBadge.textContent = `Stok Gudang: ${stock} ${unit}`;
    if (parseFloat(stock) <= 0) {
      stockBadge.className = 'badge badge-red';
    } else {
      stockBadge.className = 'badge badge-cyan';
    }
  }
};

window.confirmAddManualShipmentItem = function() {
  const select = document.getElementById('manualShipmentItemSelect');
  if (!select || !select.value) return alert("Pilih barang terlebih dahulu!");

  const itemName = select.value;
  const opt = select.selectedOptions[0];
  const unit = opt ? opt.getAttribute('data-unit') || 'Pcs' : 'Pcs';
  const qty = parseFloat(document.getElementById('manualShipmentQty').value);
  const notes = (document.getElementById('manualShipmentNotes')?.value || '').trim();

  if (isNaN(qty) || qty <= 0) {
    return alert("Masukkan kuantitas kirim yang valid (lebih dari 0)!");
  }

  // Cek apakah barang sudah ada di daftar kirim
  const existingIndex = currentShipmentDraft.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
  if (existingIndex > -1) {
    currentShipmentDraft[existingIndex].accQty += qty;
    if (notes) {
      currentShipmentDraft[existingIndex].shipNotes = (currentShipmentDraft[existingIndex].shipNotes ? currentShipmentDraft[existingIndex].shipNotes + '; ' : '') + notes;
    }
  } else {
    currentShipmentDraft.push({
      orderId: 'MANUAL-' + Date.now(),
      name: itemName,
      reqQty: 0, // Diminta: 0 (Manual)
      accQty: qty,
      unit: unit,
      isManual: true,
      notes: notes ? `Manual: ${notes}` : 'Item Manual Warehouse',
      shipNotes: notes || 'Manual Warehouse'
    });
  }

  renderShipmentDraftTable();
  closeManualShipmentModal();
  showToast(`✓ "${itemName}" (+${qty} ${unit}) berhasil ditambahkan ke daftar kirim!`);
};

// Expose alias untuk kompatibilitas
window.addManualShipmentItem = function() {
  window.openManualShipmentModal();
};

window.handleProcessShipmentAndSync = function() {
  if (currentShipmentDraft.length === 0) {
    return alert("Tidak ada barang dalam daftar pengiriman!");
  }

  const branch = document.getElementById('selectBranchToShip').value;
  const deliveryDate = document.getElementById('shipmentDeliveryDate').value;
  const driver = document.getElementById('shipmentDriverName').value.trim() || "Driver Warehouse";
  const noSuratJalan = 'SJ-WH/' + new Date().getFullYear() + '/' + Date.now().toString().slice(-6);

  // Potong stok gudang
  currentShipmentDraft.forEach(draft => {
    const itemMaster = masterBarangList.find(i => i.name === draft.name);
    if (itemMaster && itemMaster.whStock !== undefined) {
      itemMaster.whStock = Math.max(0, itemMaster.whStock - draft.accQty);
    }
    const item = opnameItems.find(i => i.name === draft.name);
    if (item && item.whStock !== undefined) {
      item.whStock = Math.max(0, item.whStock - draft.accQty);
    }
  });
  localStorage.setItem('cafe_master_barang', JSON.stringify(masterBarangList));
  localStorage.setItem('cafe_opname_items', JSON.stringify(opnameItems));
  renderMasterBarangTable();

  // Update status orders terkait
  const orders = JSON.parse(localStorage.getItem('cafe_orders_list') || '[]');
  orders.forEach(o => {
    if (o.outlet === branch && o.status !== 'Selesai') {
      o.status = 'Selesai';
      o.items.forEach(ordItem => {
        const matched = currentShipmentDraft.find(d => d.name === ordItem.name);
        if (matched) ordItem.accQty = matched.accQty;
      });
    }
  });
  localStorage.setItem('cafe_orders_list', JSON.stringify(orders));

  const shipmentPayload = {
    noSuratJalan: noSuratJalan,
    branchDestination: branch,
    deliveryDate: deliveryDate,
    driver: driver,
    processedAt: new Date().toISOString(),
    items: currentShipmentDraft.map(i => ({
      name: i.name,
      requestedQty: i.reqQty,
      approvedQty: i.accQty,
      unit: i.unit,
      shipNotes: i.shipNotes || ''
    }))
  };

  // Sync to Google Sheets
  syncToGoogleSheet('barang_keluar', shipmentPayload);

  // Tampilkan Surat Jalan Printable Modal
  openSuratJalanModal(shipmentPayload);
  showToast(`Pengiriman ke ${branch} diproses & disinkronkan ke Sheets!`);

  // Refresh view
  loadBranchShipmentItems();
  renderAllOrdersSummary();
};

function openSuratJalanModal(data) {
  const container = document.getElementById('suratJalanPrintArea');
  if (!container) return;

  container.innerHTML = `
    <div style="background:#090d16; border:1px solid #233252; padding:18px; border-radius:10px; font-size:12px; color:#f8fafc;">
      <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #334155; padding-bottom:10px; margin-bottom:10px;">
        <div>
          <h3 style="font-size:15px; font-weight:800; color:#f59e0b;">SURAT JALAN & PACKING LIST</h3>
          <p style="font-size:11px; color:#94a3b8;">WAREHOUSE CENTRAL LOGISTICS</p>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'JetBrains Mono'; font-weight:700; color:#38bdf8;">${data.noSuratJalan}</div>
          <div style="font-size:11px; color:#94a3b8;">Tgl: ${data.deliveryDate}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-size:11.5px;">
        <div><b>Tujuan:</b> <span style="color:#f59e0b; font-weight:700;">${data.branchDestination}</span></div>
        <div><b>Driver:</b> ${data.driver}</div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        <thead>
          <tr style="border-bottom:1px solid #334155; background:#111a2e; font-size:10.5px; text-transform:uppercase;">
            <th style="padding:6px; text-align:left;">Barang</th>
            <th style="padding:6px; text-align:center;">Diminta</th>
            <th style="padding:6px; text-align:center; color:#38bdf8;">Di-Acc (Kirim)</th>
            <th style="padding:6px; text-align:center;">Satuan</th>
            <th style="padding:6px; text-align:left;">Catatan</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((i, idx) => `
            <tr style="border-bottom:1px solid #1e293b;">
              <td style="padding:6px;">${idx + 1}. ${i.name}</td>
              <td style="padding:6px; text-align:center; font-family:'JetBrains Mono';">${i.requestedQty > 0 ? i.requestedQty : '<span style="color:#94a3b8; font-size:10px;">0 (Manual)</span>'}</td>
              <td style="padding:6px; text-align:center; font-family:'JetBrains Mono'; font-weight:800; color:#34d399;">${i.approvedQty}</td>
              <td style="padding:6px; text-align:center;">${i.unit}</td>
              <td style="padding:6px; font-size:10px; color:#94a3b8;">${i.shipNotes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; margin-top:20px; font-size:11px; color:#94a3b8;">
        <div>
          <p>Disiapkan Oleh,</p>
          <div style="height:42px;"></div>
          <p style="border-top:1px dotted #475569; padding-top:4px;">( Admin Warehouse )</p>
        </div>
        <div>
          <p>Diserahkan Oleh,</p>
          <div style="height:42px;"></div>
          <p style="border-top:1px dotted #475569; padding-top:4px;">( ${data.driver} )</p>
        </div>
        <div>
          <p>Diterima Oleh,</p>
          <div style="height:42px;"></div>
          <p style="border-top:1px dotted #475569; padding-top:4px;">( Barista / SPV Outlet )</p>
        </div>
      </div>
    </div>
  `;
  document.getElementById('suratJalanModal').style.display = 'flex';
}
window.closeSuratJalanModal = function() { document.getElementById('suratJalanModal').style.display = 'none'; };


// =========================================================
// FITUR 3: WAREHOUSE TAB 3 - LIST PERMINTAAN BARANG CAFE
// =========================================================
function renderAllOrdersSummary() {
  const tbody = document.getElementById('allOrdersSummaryTableBody');
  const empty = document.getElementById('allOrdersEmptyState');
  if (!tbody) return;

  const orders = JSON.parse(localStorage.getItem('cafe_orders_list') || '[]');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  orders.forEach((order, index) => {
    const totalReq = order.items.reduce((sum, i) => sum + (parseFloat(i.qty) || 0), 0);
    const totalAcc = order.items.reduce((sum, i) => sum + (parseFloat(i.accQty !== undefined ? i.accQty : i.qty) || 0), 0);
    const itemsPreview = order.items.map(i => `${i.name} (${i.qty} ${i.unit})`).join(', ');

    let statusBadge = `<span class="badge badge-amber">Pending</span>`;
    if (order.status === 'Diproses') statusBadge = `<span class="badge badge-cyan">Diproses</span>`;
    else if (order.status === 'Selesai') statusBadge = `<span class="badge badge-emerald">Selesai</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono';">${order.targetDate || order.requestDate}</td>
      <td style="font-weight:700; color:#f8fafc;">${order.outlet}</td>
      <td style="font-size:11px; max-width:280px; color:var(--text-muted);">${itemsPreview}</td>
      <td style="text-align:center; font-family:'JetBrains Mono'; font-weight:700;">${totalReq}</td>
      <td style="text-align:center; font-family:'JetBrains Mono'; font-weight:700; color:#34d399;">${totalAcc}</td>
      <td style="text-align:center;">${statusBadge}</td>
      <td style="text-align:center;">
        <select onchange="changeOrderStatus(${index}, this.value)" class="touch-input" style="padding:4px 6px; font-size:11px; width:auto;">
          <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Diproses" ${order.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
          <option value="Selesai" ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.changeOrderStatus = function(idx, newStatus) {
  const orders = JSON.parse(localStorage.getItem('cafe_orders_list') || '[]');
  if (orders[idx]) {
    orders[idx].status = newStatus;
    localStorage.setItem('cafe_orders_list', JSON.stringify(orders));
    renderAllOrdersSummary();
    showToast(`Status order diubah menjadi "${newStatus}"`);
  }
};

window.exportAllOrdersToExcelCSV = function() {
  const orders = JSON.parse(localStorage.getItem('cafe_orders_list') || '[]');
  if (orders.length === 0) return alert("Belum ada data permintaan dari cabang untuk diexport!");

  let csv = "Tanggal Request,Tanggal Kirim,Nama Cabang,Nama Barang,Jumlah Request,Jumlah Di-acc,Satuan,Prioritas,Status,Catatan\n";
  orders.forEach(o => {
    o.items.forEach(item => {
      const acc = item.accQty !== undefined ? item.accQty : item.qty;
      csv += `"${o.requestDate}","${o.targetDate}","${o.outlet}","${item.name}",${item.qty},${acc},"${item.unit}","${item.priority || 'Normal'}","${o.status}","${item.notes || ''}"\n`;
    });
  });

  const filename = `Rekap_Permintaan_Barang_AllCabang_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSVFile(csv, filename);
};

window.seedSampleBranchOrders = function() {
  const sample = [
    {
      orderId: 'ORD-SAMPLE-1',
      outlet: 'Annyeong TA',
      requestDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'Pending',
      items: [
        { name: 'Biji Kopi House Blend', qty: 5, accQty: 5, unit: 'Kg', priority: 'Urgen' },
        { name: 'Susu UHT Fresh Milk', qty: 24, accQty: 20, unit: 'Liter', priority: 'Normal' },
        { name: 'Cup Cold 16oz Clear', qty: 500, accQty: 500, unit: 'Pcs', priority: 'Normal' }
      ]
    },
    {
      orderId: 'ORD-SAMPLE-2',
      outlet: 'Annyeong KDR',
      requestDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'Diproses',
      items: [
        { name: 'Syrup Vanilla 750ml', qty: 3, accQty: 3, unit: 'Botol', priority: 'Normal' },
        { name: 'Powder Matcha Premium', qty: 2, accQty: 1, unit: 'Kg', priority: 'Urgen' }
      ]
    },
    {
      orderId: 'ORD-SAMPLE-3',
      outlet: 'Kono 1',
      requestDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'Pending',
      items: [
        { name: 'Oat Milk Barista Edition', qty: 10, accQty: 8, unit: 'Liter', priority: 'Normal' },
        { name: 'Cup Hot 8oz Paper', qty: 200, accQty: 200, unit: 'Pcs', priority: 'Normal' }
      ]
    }
  ];

  localStorage.setItem('cafe_orders_list', JSON.stringify(sample));
  renderAllOrdersSummary();
  loadBranchShipmentItems();
  showToast("Simulasi order 3 cabang berhasil dimuat!");
};


// =========================================================
// FITUR 3: WAREHOUSE TAB 4 - INPUT OMSET HARIAN 4 OUTLET
// =========================================================
function setTodayOmsetDate() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('omsetDateInput');
  if (el) el.value = today;
}

window.calcTotalOmset = function() {
  const food = parseFloat(document.getElementById('omsetFoodInput').value) || 0;
  const drink = parseFloat(document.getElementById('omsetDrinkInput').value) || 0;
  const total = food + drink;
  const display = document.getElementById('omsetTotalDisplay');
  if (display) display.value = `Rp ${total.toLocaleString('id-ID')}`;
};

window.handleSaveOmsetAndSync = function() {
  const date = document.getElementById('omsetDateInput').value;
  const branch = document.getElementById('omsetBranchSelect').value;
  const food = parseFloat(document.getElementById('omsetFoodInput').value) || 0;
  const drink = parseFloat(document.getElementById('omsetDrinkInput').value) || 0;
  const total = food + drink;

  if (total <= 0) {
    return alert("Silakan masukkan omset makanan atau minuman!");
  }

  const omsetEntry = {
    id: 'OMS-' + Date.now(),
    date: date,
    branch: branch,
    food: food,
    drink: drink,
    total: total,
    recordedAt: new Date().toLocaleTimeString('id-ID')
  };

  const omsets = JSON.parse(localStorage.getItem('cafe_daily_omset') || '[]');
  omsets.unshift(omsetEntry);
  localStorage.setItem('cafe_daily_omset', JSON.stringify(omsets));

  // Sync to Google Sheets
  syncToGoogleSheet('omset_harian', omsetEntry);

  // Reset inputs
  document.getElementById('omsetFoodInput').value = '';
  document.getElementById('omsetDrinkInput').value = '';
  calcTotalOmset();

  renderOmsetTable();
  showToast(`Omset ${branch} Rp ${total.toLocaleString('id-ID')} disimpan & disinkronkan!`);
};

function renderOmsetTable() {
  const tbody = document.getElementById('omsetTableBody');
  const grandTotalBadge = document.getElementById('omsetGrandTotalBadge');
  if (!tbody) return;

  const omsets = JSON.parse(localStorage.getItem('cafe_daily_omset') || '[]');
  tbody.innerHTML = '';

  const grandTotal = omsets.reduce((sum, item) => sum + (item.total || 0), 0);
  if (grandTotalBadge) grandTotalBadge.textContent = `Total: Rp ${grandTotal.toLocaleString('id-ID')}`;

  if (omsets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:var(--text-dim);">Belum ada rekap omset yang dicatat.</td></tr>`;
    return;
  }

  omsets.slice(0, 20).forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono';">${o.date}</td>
      <td style="font-weight:700; color:#f8fafc;">${o.branch}</td>
      <td style="text-align:right; font-family:'JetBrains Mono';">Rp ${o.food.toLocaleString('id-ID')}</td>
      <td style="text-align:right; font-family:'JetBrains Mono';">Rp ${o.drink.toLocaleString('id-ID')}</td>
      <td style="text-align:right; font-family:'JetBrains Mono'; font-weight:800; color:#34d399;">Rp ${o.total.toLocaleString('id-ID')}</td>
      <td style="text-align:center; font-size:11px; color:var(--text-muted);">${o.recordedAt || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}


// =========================================================
// FITUR 3: WAREHOUSE TAB 5 - PENGATURAN PIN CABANG
// =========================================================
function renderPinSettingsList() {
  const container = document.getElementById('pinManageContainer');
  if (!container) return;
  loadStoredPins();
  container.innerHTML = '';

  pinsList.forEach(item => {
    let roleBadge = `<span class="badge badge-amber">Cabang</span>`;
    if (item.role === 'admin') {
      roleBadge = `<span class="badge" style="background:#6366f1; color:#fff;">Owner Central</span>`;
    } else if (item.role === 'warehouse') {
      roleBadge = `<span class="badge badge-cyan">Warehouse</span>`;
    }

    const row = document.createElement('div');
    row.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #090d16; border: 1px solid var(--border-color); border-radius: 8px; gap: 8px;";
    row.innerHTML = `
      <div>
        <div style="font-weight: 700; font-size: 13px; color: #f8fafc; display:flex; align-items:center; gap:6px;">
          ${item.name} ${roleBadge}
        </div>
        <div style="font-size: 10.5px; color: var(--text-dim);">Akses ID: ${item.id}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 11px; color: var(--text-muted);">PIN:</span>
        <input type="text" id="pin_input_${item.id}" value="${item.pin}" maxlength="4"
          class="touch-input" style="width: 75px; text-align: center; font-family: 'JetBrains Mono'; font-size: 14px; font-weight: 800; letter-spacing: 2px;"
        />
      </div>
    `;
    container.appendChild(row);
  });
}

window.saveUpdatedPins = function() {
  let hasError = false;
  const newPins = pinsList.map(item => {
    const el = document.getElementById(`pin_input_${item.id}`);
    const val = el ? el.value.trim() : item.pin;
    if (!/^\d{4}$/.test(val)) {
      hasError = true;
    }
    return { ...item, pin: val };
  });

  if (hasError) {
    return alert("Semua PIN harus berupa 4 digit angka!");
  }

  // Cek duplikasi
  const pinValues = newPins.map(p => p.pin);
  const isDuplicate = new Set(pinValues).size !== pinValues.length;
  if (isDuplicate) {
    return alert("PIN setiap outlet harus unik dan tidak boleh sama!");
  }

  pinsList = newPins;
  localStorage.setItem('cafe_pins_config', JSON.stringify(pinsList));
  renderPinSettingsList();

  // 1. FUNGSI SIMPAN PIN DARI WAREHOUSE:
  // Kirim data PIN terbaru ke Google Sheets Sheet "SETTINGS_PIN"
  syncToGoogleSheet('update_pin', pinsList);
  showToast("Perubahan PIN disimpan di lokal & disinkronkan ke Google Sheets (Sheet: SETTINGS_PIN)!");
};

window.resetDefaultPins = function() {
  if (confirm("Reset seluruh PIN ke pengaturan awal default?")) {
    pinsList = [...DEFAULT_PINS];
    localStorage.setItem('cafe_pins_config', JSON.stringify(pinsList));
    renderPinSettingsList();
    syncToGoogleSheet('update_pin', pinsList);
    showToast("PIN direset ke default & disinkronkan ke Google Sheets.");
  }
};


// =========================================================
// 2. FUNGSI FETCH/LOAD PIN SAAT LOGIN (CLOUD GOOGLE SHEETS)
// =========================================================
window.fetchLatestPinsFromSheet = async function(isManual = false) {
  const webhookUrl = localStorage.getItem('cafe_gsheet_webhook_url');
  updatePinSyncStatus('syncing', 'Menyinkronkan PIN online...');

  if (!webhookUrl) {
    updatePinSyncStatus('offline', 'PIN Lokal (URL Sheets belum diset)');
    if (isManual) {
      alert("URL Webhook Google Sheets belum diatur. Silakan atur di tombol '⚙️ Sheets Sync' pada header.");
    }
    return;
  }

  try {
    // Tambahkan action=get_pins dan cache-buster timestamp
    const separator = webhookUrl.includes('?') ? '&' : '?';
    const fetchUrl = `${webhookUrl}${separator}action=get_pins&_t=${Date.now()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500); // 7.5 detik timeout

    const res = await fetch(fetchUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const result = await res.json();
    let remotePins = null;

    if (result && result.status === 'success' && Array.isArray(result.data)) {
      remotePins = result.data;
    } else if (Array.isArray(result)) {
      remotePins = result;
    } else if (result && Array.isArray(result.pins)) {
      remotePins = result.pins;
    }

    if (remotePins && remotePins.length > 0) {
      let updatedCount = 0;
      pinsList = pinsList.map(localItem => {
        const found = remotePins.find(r => 
          (r.id && String(r.id).trim() === localItem.id) || 
          (r.name && String(r.name).trim().toLowerCase() === localItem.name.toLowerCase())
        );
        if (found && found.pin && /^\d{4}$/.test(String(found.pin).trim())) {
          updatedCount++;
          return { ...localItem, pin: String(found.pin).trim() };
        }
        return localItem;
      });

      // Simpan PIN terbaru dari Cloud ke localStorage
      localStorage.setItem('cafe_pins_config', JSON.stringify(pinsList));
      updatePinSyncStatus('synced', `PIN Online Aktif (${updatedCount} Outlet)`);

      const pinSec = document.getElementById('sectionPinSettings');
      if (pinSec && pinSec.style.display !== 'none') {
        renderPinSettingsList();
      }

      if (isManual) {
        showToast(`✓ Berhasil memuat ${updatedCount} PIN dari Sheet 'SETTINGS_PIN'!`);
      }
    } else {
      updatePinSyncStatus('synced', 'PIN Lokal Aktif (Cloud kosong)');
      if (isManual) {
        showToast("Sheet 'SETTINGS_PIN' belum ada isi. Menggunakan PIN lokal.");
      }
    }
  } catch (err) {
    // 3. Fallback jika offline atau gagal koneksi ke Webhook
    console.warn("Gagal fetch PIN dari Google Sheets Webhook, menggunakan fallback PIN lokal:", err);
    updatePinSyncStatus('offline', 'PIN Lokal (Mode Offline / Fallback)');
    if (isManual) {
      showToast("Gagal mengambil data online. Menggunakan PIN lokal.");
    }
  }
};

window.updatePinSyncStatus = function(status, text) {
  const dot = document.getElementById('pinSyncDot');
  const txt = document.getElementById('pinSyncText');
  if (!dot || !txt) return;

  txt.textContent = text;
  if (status === 'syncing') {
    dot.style.background = '#f59e0b';
    dot.style.boxShadow = '0 0 6px #f59e0b';
  } else if (status === 'synced') {
    dot.style.background = '#10b981';
    dot.style.boxShadow = '0 0 6px #10b981';
  } else {
    dot.style.background = '#94a3b8';
    dot.style.boxShadow = 'none';
  }
};


// =========================================================
// FITUR 4: GOOGLE SHEETS WEBHOOK INTEGRATION
// =========================================================
window.openSettingsModal = function() {
  document.getElementById('settingsModal').style.display = 'flex';
  loadWebhookUrlToInput();
};
window.closeSettingsModal = function() { document.getElementById('settingsModal').style.display = 'none'; };

function loadWebhookUrlToInput() {
  const url = localStorage.getItem('cafe_gsheet_webhook_url') || '';
  const input = document.getElementById('inputWebhookUrl');
  if (input) input.value = url;
}

window.saveWebhookSettings = function() {
  const url = document.getElementById('inputWebhookUrl').value.trim();
  localStorage.setItem('cafe_gsheet_webhook_url', url);
  showToast("URL Google Apps Script Webhook disimpan!");
  closeSettingsModal();
  // Langsung coba fetch PIN dengan URL baru
  if (url) {
    fetchLatestPinsFromSheet(true);
  }
};

window.syncToGoogleSheet = function(actionType, payloadData) {
  const webhookUrl = localStorage.getItem('cafe_gsheet_webhook_url');
  if (!webhookUrl) {
    console.info("Google Sheets Webhook URL belum diisi. Data tetap tersimpan di lokal.");
    return;
  }

  const payload = {
    action: actionType, // opname, store_order, purchasing, barang_keluar, omset_harian, update_pin
    outlet: currentUserSession ? currentUserSession.name : 'Warehouse Central',
    timestamp: new Date().toISOString(),
    data: payloadData
  };

  fetch(webhookUrl, {
    method: 'POST',
    mode: 'no-cors', // standard Apps Script POST handling
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(() => {
    if (actionType === 'update_pin') {
      showToast("⚡ PIN disinkronkan ke Sheet 'SETTINGS_PIN'!");
      updatePinSyncStatus('synced', 'PIN Online Aktif');
    } else {
      showToast(`⚡ Sync [${actionType}] ke Google Sheets berhasil!`);
    }
  }).catch(err => {
    console.warn("Gagal menghubungi Google Sheets Webhook:", err);
  });
};

window.testWebhookConnection = function() {
  const url = document.getElementById('inputWebhookUrl').value.trim();
  if (!url) return alert('Silakan masukkan URL Webhook terlebih dahulu!');
  localStorage.setItem('cafe_gsheet_webhook_url', url);

  syncToGoogleSheet('ping_test', { message: 'Halo dari Aplikasi Cafe & Warehouse Ops!' });
  alert("Permintaan uji coba telah dikirim ke Webhook Google Apps Script!");
};


// =========================================================
// FITUR: RESET DATABASE DENGAN KONFIRMASI PIN KEAMANAN ADMIN (1409)
// =========================================================
window.openResetDatabaseModal = function() {
  if (!currentUserSession || currentUserSession.role !== 'admin') {
    alert("Akses ditolak! Fitur Reset Database hanya diizinkan untuk akun Admin / Owner.");
    return;
  }

  const modal = document.getElementById('resetDatabaseModal');
  const step1 = document.getElementById('resetDbStep1');
  const step2 = document.getElementById('resetDbStep2');
  const pinInput = document.getElementById('resetAdminPinInput');
  const errorEl = document.getElementById('resetPinError');

  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
  if (pinInput) {
    pinInput.value = '';
    pinInput.classList.remove('shake');
  }

  if (modal) modal.style.display = 'flex';
  setTimeout(() => {
    if (pinInput) pinInput.focus();
  }, 100);
};

window.closeResetDatabaseModal = function() {
  const modal = document.getElementById('resetDatabaseModal');
  if (modal) modal.style.display = 'none';
  const pinInput = document.getElementById('resetAdminPinInput');
  if (pinInput) pinInput.value = '';
  const errorEl = document.getElementById('resetPinError');
  if (errorEl) errorEl.style.display = 'none';
};

window.handleResetPinInputChanged = function() {
  const errorEl = document.getElementById('resetPinError');
  if (errorEl) errorEl.style.display = 'none';
  const pinInput = document.getElementById('resetAdminPinInput');
  if (pinInput && pinInput.value.length === 4) {
    setTimeout(window.handleVerifyResetPin, 120);
  }
};

window.handleVerifyResetPin = function() {
  const pinInput = document.getElementById('resetAdminPinInput');
  const errorEl = document.getElementById('resetPinError');
  if (!pinInput) return;

  const entered = pinInput.value.trim();
  const SECRET_ADMIN_PIN = "1409";

  if (entered !== SECRET_ADMIN_PIN) {
    // PIN SALAH
    if (errorEl) {
      errorEl.textContent = "PIN Keamanan Salah! Akses ditolak.";
      errorEl.style.display = 'block';
      errorEl.classList.remove('shake');
      void errorEl.offsetWidth; // trigger reflow
      errorEl.classList.add('shake');
    }
    pinInput.classList.remove('shake');
    void pinInput.offsetWidth;
    pinInput.classList.add('shake');
    pinInput.value = '';
    showToast("❌ PIN Keamanan Salah! Akses ditolak.");
    return;
  }

  // PIN BENAR -> Lanjut ke Konfirmasi Kedua
  if (errorEl) errorEl.style.display = 'none';
  const step1 = document.getElementById('resetDbStep1');
  const step2 = document.getElementById('resetDbStep2');
  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';
};

window.executeDatabaseReset = function() {
  const btn = document.getElementById('btnExecuteResetDb');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Memproses Reset...";
  }

  // 1. SINKRONISASI KE GOOGLE APPS SCRIPT
  // Kirimkan request Webhook POST ke Apps Script dengan payload:
  // { action: 'reset_database', pin: '1409' }
  const webhookUrl = localStorage.getItem('cafe_gsheet_webhook_url');
  if (webhookUrl) {
    const payload = {
      action: 'reset_database',
      pin: '1409'
    };

    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn("Gagal menghubungi Google Sheets Webhook:", err);
    });
  }

  // 2. KOSONGKAN TRANSAKSI LOKAL (Opname, Purchasing, Store Order / Barang Keluar, Omset)
  localStorage.removeItem('warehouse_purchasing_history');
  localStorage.removeItem('cafe_orders_list');
  localStorage.removeItem('cafe_daily_omset');

  // Bersihkan data opname transaksi lokal
  localStorage.removeItem('cafe_opname_items');
  loadStoredOpnameItems();

  daftarPermintaan = [];
  currentShipmentDraft = [];

  // 3. RE-RENDER SELURUH TABEL
  renderMasterBarangTable();
  renderPurchasingHistory();
  loadBranchShipmentItems();
  renderAllOrdersSummary();
  renderOmsetTable();
  renderOpnameTable();
  if (typeof renderOrderCart === 'function') renderOrderCart();

  // 4. TUTUP MODAL & TAMPILKAN NOTIFIKASI
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = "<span>🗑️ Ya, Bersihkan Database</span>";
  }
  closeResetDatabaseModal();
  closeSettingsModal();

  showToast("Database transaksi berhasil dibersihkan!");
  alert("Database transaksi berhasil dibersihkan!");
};


// =========================================================
// UTILITIES & HELPERS
// =========================================================
function showToast(msg) {
  const toast = document.getElementById('syncToast');
  const text = document.getElementById('toastMsg');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 2600);
}

function downloadCSVFile(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`File ${filename} berhasil didownload!`);
}

// Ganti baris pendaftaran di paling bawah app.js menjadi seperti ini:
window.handlePinInput = typeof handlePinInput !== 'undefined' ? handlePinInput : null;
window.handlePinSubmit = typeof handlePinSubmit !== 'undefined' ? handlePinSubmit : null;

if (typeof clearPin !== 'undefined') {
  window.clearPin = clearPin;
}
