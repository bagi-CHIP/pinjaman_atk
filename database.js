const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Tentukan lokasi direktori berdasarkan environment
const dbDir = process.env.NODE_ENV === 'production' 
  ? '/app/data' 
  : __dirname;

// Pastikan direktori tempat database berada sudah dibuat sebelum file SQLite diakses
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Direktori database berhasil dibuat di: ${dbDir}`);
  } catch (err) {
    console.error(`Gagal membuat direktori database (${dbDir}):`, err.message);
  }
}

const dbPath = path.join(dbDir, 'peminjaman.db');

// Inisialisasi koneksi SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal terhubung ke database SQLite:', err.message);
  } else {
    console.log(`Berhasil terhubung ke database SQLite di: ${dbPath}`);
  }
});

db.serialize(() => {
  // Tabel Barang
  db.run(`
    CREATE TABLE IF NOT EXISTS barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode TEXT UNIQUE,
      nama TEXT,
      satuan TEXT,
      stok INTEGER
    )
  `);

  // Tabel Peminjaman
  db.run(`
    CREATE TABLE IF NOT EXISTS peminjaman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor_pinjam TEXT,
      nama_peminjam TEXT,
      email TEXT,
      bidang TEXT,
      keperluan TEXT,
      status TEXT DEFAULT 'Pending',
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabel Detail Item Peminjaman
  db.run(`
    CREATE TABLE IF NOT EXISTS detail_peminjaman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      peminjaman_id INTEGER,
      barang_id INTEGER,
      jumlah INTEGER,
      FOREIGN KEY(peminjaman_id) REFERENCES peminjaman(id),
      FOREIGN KEY(barang_id) REFERENCES barang(id)
    )
  `);

  // Isi data awal barang jika masih kosong
  db.get("SELECT COUNT(*) as count FROM barang", (err, row) => {
    if (err) {
      console.error("Gagal mengecek data barang:", err.message);
      return;
    }
    if (row && row.count === 0) {
      const stmt = db.prepare("INSERT INTO barang (kode, nama, satuan, stok) VALUES (?, ?, ?, ?)");
      stmt.run("BRG-001", "Laptop Probook", "unit", 5);
      stmt.run("BRG-002", "Proyektor Epson", "unit", 3);
      stmt.run("BRG-003", "Kabel HDMI 10m", "pcs", 10);
      stmt.finalize();
    }
  });
});

module.exports = db;
