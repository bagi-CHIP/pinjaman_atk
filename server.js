const express = require('express');
const path = require('path');
const db = require('./database'); // Menggunakan koneksi tunggal dari database.js

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- ENDPOINT API ---

// Endpoint Ambil Daftar Barang
app.get('/api/barang', (req, res) => {
  db.all("SELECT * FROM barang ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoint Tambah Barang Baru
app.post('/api/barang', (req, res) => {
  const { kode, nama, satuan, stok } = req.body;
  if (!nama || stok === undefined) return res.status(400).json({ message: 'Nama dan stok wajib diisi' });

  const query = `INSERT INTO barang (kode, nama, satuan, stok) VALUES (?, ?, ?, ?)`;
  db.run(query, [kode || null, nama, satuan || 'pcs', parseInt(stok)], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Barang berhasil ditambahkan', id: this.lastID });
  });
});

// Endpoint Update Barang
app.put('/api/barang/:id', (req, res) => {
  const { id } = req.params;
  const { nama, stok, kode, satuan } = req.body;

  const query = `
    UPDATE barang 
    SET nama = COALESCE(?, nama), 
        stok = ?, 
        kode = COALESCE(?, kode), 
        satuan = COALESCE(?, satuan) 
    WHERE id = ?
  `;

  db.run(query, [nama, parseInt(stok), kode, satuan, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Stok barang berhasil diperbarui' });
  });
});

// Endpoint Hapus Barang
app.delete('/api/barang/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM barang WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Barang berhasil dihapus' });
  });
});

// Endpoint Ambil Semua Permintaan
app.get('/api/peminjaman', (req, res) => {
  db.all("SELECT * FROM peminjaman ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoint Tambah Permintaan Baru
app.post('/api/peminjaman', (req, res) => {
  const { nama_peminjam, divisi, keperluan, items } = req.body;

  if (!nama_peminjam || !divisi || !items) {
    return res.status(400).json({ message: 'Data tidak lengkap' });
  }

  const query = `
    INSERT INTO peminjaman (nama_peminjam, divisi, keperluan, items) 
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [nama_peminjam, divisi, keperluan || '', items], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Permintaan berhasil dikirim', id: this.lastID });
  });
});

// Endpoint Update Status Permintaan (Setujui / Tolak)
app.put('/api/peminjaman/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(`UPDATE peminjaman SET status = ? WHERE id = ?`, [status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `Status permintaan berhasil diubah menjadi ${status}` });
  });
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di port http://localhost:${PORT}`);
});
