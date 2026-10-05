const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk memproses data JSON dan Form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder statis untuk aset HTML, CSS, JS
app.use(express.static(path.join(__dirname, 'public')));

// Set Up Lokasi Database SQLite menggunakan Railway Volume
// Jika folder /app/data ada (di Railway), gunakan folder tersebut. Jika di lokal, gunakan root folder.
const dataDir = fs.existsSync('/app/data') ? '/app/data' : __dirname;
const dbPath = path.join(dataDir, 'peminjaman.db');

// Inisialisasi Koneksi Database SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal terhubung ke database:', err.message);
  } else {
    console.log(`Berhasil terhubung ke database SQLite di: ${dbPath}`);
  }
});

// Buat Tabel Database jika belum ada
db.serialize(() => {
  // Tabel Stok Barang ATK
  db.run(`
    CREATE TABLE IF NOT EXISTS barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_barang TEXT NOT NULL,
      stok INTEGER DEFAULT 0,
      satuan TEXT DEFAULT 'Pcs'
    )
  `);

  // Tabel Permintaan/Peminjaman ATK
  db.run(`
    CREATE TABLE IF NOT EXISTS peminjaman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_peminjam TEXT NOT NULL,
      divisi TEXT NOT NULL,
      keperluan TEXT NOT NULL,
      items TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ==================== API ENDPOINTS ====================

// 1. Ambil Semua Data Barang (Stok)
app.get('/api/barang', (req, res) => {
  db.all('SELECT * FROM barang ORDER BY nama_barang ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. Tambah Barang Baru (Admin)
app.post('/api/barang', (req, res) => {
  const { nama_barang, stok, satuan } = req.body;
  const sql = 'INSERT INTO barang (nama_barang, stok, satuan) VALUES (?, ?, ?)';
  db.run(sql, [nama_barang, stok || 0, satuan || 'Pcs'], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nama_barang, stok, satuan });
  });
});

// 3. Update Stok Barang (Restock/Edit Admin)
app.put('/api/barang/:id', (req, res) => {
  const { stok } = req.body;
  const sql = 'UPDATE barang SET stok = ? WHERE id = ?';
  db.run(sql, [stok, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// 4. Hapus Barang (Admin)
app.delete('/api/barang/:id', (req, res) => {
  const sql = 'DELETE FROM barang WHERE id = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// 5. Ambil Semua Data Permintaan (Admin / User)
app.get('/api/peminjaman', (req, res) => {
  db.all('SELECT * FROM peminjaman ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 6. Buat Permintaan ATK Baru (User)
app.post('/api/peminjaman', (req, res) => {
  const { nama_peminjam, divisi, keperluan, items } = req.body;
  const sql = 'INSERT INTO peminjaman (nama_peminjam, divisi, keperluan, items) VALUES (?, ?, ?, ?)';
  db.run(sql, [nama_peminjam, divisi, keperluan, items], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, status: 'Pending' });
  });
});

// 7. Update Status Permintaan (Setujui / Tolak oleh Admin)
app.put('/api/peminjaman/:id/status', (req, res) => {
  const { status } = req.body;
  const sql = 'UPDATE peminjaman SET status = ? WHERE id = ?';
  db.run(sql, [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Menjalankan Server Node.js
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
