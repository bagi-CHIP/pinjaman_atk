const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Tentukan direktori penyimpanan:
// Jika berjalan di Railway (production), gunakan folder Volume (/app/data)
// Jika di komputer lokal, gunakan folder tempat file ini berada
const dbDir = process.env.NODE_ENV === 'production' 
  ? '/app/data' 
  : __dirname;

// Buat direktori jika belum ada
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

// Inisialisasi tabel-tabel database
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

  // Tabel Peminjaman / Permintaan
  db.run(`
    CREATE TABLE IF NOT EXISTS peminjaman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_peminjam TEXT,
      divisi TEXT,
      keperluan TEXT,
      items TEXT,
      status TEXT DEFAULT 'Pending',
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Isi data awal barang jika tabel masih kosong
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
      stmt.finalize(() => {
        console.log("Data awal barang berhasil ditambahkan.");
      });
    }
  });
});

module.exports = db;
