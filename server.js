// ✅ Import semua modul yang diperlukan
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const axios = require('axios');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');

// ✅ 🔥 Tambahkan ini untuk menangani CORS
const cors = require('cors');

const path = require('path');
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.jpg': case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.PNG': return 'image/png';
        case '.pdf': return 'application/pdf';
        case '.mp4': return 'video/mp4';
        case '.mp3': return 'audio/mpeg';
        default: return 'application/octet-stream';
    }
}

const app = express();

// ✅ Buat server HTTP & socket (tidak diubah)
const server = http.createServer(app);

// ✅ Konfigurasi Socket.IO dan CORS untuk WebSocket
const io = socketIO(server, {
    cors: {
        origin: "*", // ✅ Izinkan semua origin untuk socket.io
        methods: ["GET", "POST"]
    }
});

// ✅ Gunakan JSON body parser untuk Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
// ✅ 🔥 Tambahkan middleware CORS agar fetch() tidak gagal
app.use(cors({ origin: '*' })); // 💡 Bisa diganti dengan origin tertentu jika butuh

// ✅ Simpan semua sesi client WhatsApp
const sessions = {};
const os = require('os');

// Fungsi untuk mendapatkan IP lokal
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const i of iface) {
            if (i.family === 'IPv4' && !i.internal) {
                return i.address;
            }
        }
    }

    return 'localhost';
}

// Server berjalan di IP lokal dan port 3000
const ip = getLocalIP();
const createClient = (id) => {
    // ✅ Cek jika session sudah aktif sebelumnya
    if (sessions[id]) {
        console.log(`⚠️ Session "${id}" sudah aktif, skip inisialisasi ulang.`);
        return sessions[id]; // langsung kembalikan client yang sudah ada
    }

    console.log(`🚀 Memulai sesi baru: ${id}`);

    const client = new Client({
        // authStrategy: new LocalAuth({ clientId: id }),
        authStrategy: new LocalAuth({
            clientId: id,
            dataPath: path.join(__dirname, '.wwebjs_auth', `session-${id}`)
        }),
        puppeteer: {
            headless: true, //true
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // ← Tambahkan ini jika perlu
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        }
    });

    // ⬅️ QR code handler
    client.on('qr', (qr) => {
        console.log(`🟨 QR Code diterima untuk sesi "${id}".`);
        qrcode.toDataURL(qr, (err, url) => {
            if (!err) {
                io.emit(`qr-${id}`, url);
            } else {
                console.error("❌ Gagal membuat QR Code:", err);
            }
        });
    });

    // ⬅️ Ready handler
    client.on('ready', async () => {
        console.log(`✅ Sesi "${id}" sudah siap.`);
        io.emit(`ready-${id}`, `${id} is ready`);
        io.emit(`qr-${id}`, ""); // sembunyikan QR

        // Kirim pesan otomatis di sini, bukan di 'authenticated'
        try {
            const number = '6285329860005'; // nomor tujuan
            const message = `Informasi Whatsapp telah aktif aktif pada Id : ${id} tanpa scan ulang QrCode`;
            const chatId = `${number}@c.us`;
            const msg = await client.sendMessage(chatId, message, { linkPreview: true });
            console.log(`✅ Pesan berhasil dikirim ke ${number}`);
        } catch (error) {
            console.error(`❌ Gagal kirim pesan otomatis ke ${number}:`, error.message);
        }
    });

    // ⬅️ Auth handler
    client.on('authenticated', () => {
        console.log(`🔐 Sesi "${id}" berhasil login.`);
    });

    // 🔑 Tunggu ready sebelum kirim pesan
    client.on('ready', async () => {
        console.log(`✅ Sesi "${id}" siap, langsung kirim pesan.`);

        // tandai siap
        client.isReady = true;

        try {
            const number = '6285329860005'; // nomor tujuan
            const message = `Informasi Whatsapp telah aktif pada Id : ${id}`;
            const chatId = `${number}@c.us`;

            const msg = await client.sendMessage(chatId, message);
            console.log(`✅ Pesan berhasil dikirim ke ${number}`);
        } catch (error) {
            console.error(`❌ Gagal kirim pesan otomatis ke 6285329860005:`, error.message);
        }
    });
    client.on('ready', () => {
        console.log('Client siap');
        client.isReady = true;
        // Kirim pesan otomatis
        sendTestMessage(client, '6285329860005', 'Informasi Whatsapp Baru diaktifkan!!!');
    });

    // Jika ingin trigger lagi setelah server restart:
    if (client.info?.pushname) { // client sudah login
        sendTestMessage(client, '6285329860005', 'Hello Bro, server baru restart!');
    }

    // ⬅️ Disconnect handler
    client.on('disconnected', (reason) => {
        console.log(`❌ Sesi "${id}" logout: ${reason}`);

        // Hapus dari memory
        delete sessions[id];

        // Hapus folder sesi
        const sessionPath = path.join(__dirname, 'sessions', id);
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(`🧹 Folder sesi "${id}" dihapus.`);
        }
    });
    client.on('ready', () => {
        console.log('Bot siap!');
    });
    client.on('message', async (msg) => {
        try {
            // Kirim request ke Laravel API
            const response = await axios.get(`http://${ip}/siakad/public/whatsapp/auto-reply`, {
                params: {
                    number: msg.from,
                    message: msg.body,
                    nosession: msg.to   // <== nomor WA session penerima
                }
            });

            const replyText = response.data?.reply;
            const fileUrl = response.data?.file;

            // Kirim teks kalau ada
            if (replyText) {
                await client.sendMessage(msg.from, replyText);
            }

            // Kirim media kalau ada fileUrl valid
            if (fileUrl && typeof fileUrl === 'string' && fileUrl.trim() !== '') {
                try {
                    // Bebas menggunakan file apapun asal disimpan di whatsapp/uploads/
                    const media = MessageMedia.fromFilePath(fileUrl)

                    await client.sendMessage(msg.from, media);
                } catch (mediaErr) {
                    console.error('Gagal kirim media:', mediaErr.message);
                    await client.sendMessage(msg.from, '⚠️ Gagal mengirim file.');
                }
            }
        } catch (err) {
            // console.error('Error komunikasi dengan Laravel:', err.message);
            // await client.sendMessage(msg.from, '⚠️ Maaf, terjadi kesalahan server / Pesan Anda tidak lengkap.');
        }
    });

    client.initialize();

    // ✅ Simpan ke daftar sesi
    sessions[id] = client;

    return client;
};

// API untuk memulai sesi baru
app.post('/start-session', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID wajib diisi' });

    if (sessions[id]) {
        return res.json({ message: 'Sesi sudah ada' });
    }

    createClient(id);
    return res.json({ message: 'Sesi dimulai' });
});

// API untuk menghapus sesi
app.delete('/remove-session/:sessionName', async (req, res) => {
    const sessionName = req.params.sessionName;

    if (!sessions[sessionName]) {
        return res.status(400).json({ error: 'Session tidak ditemukan' });
    }

    try {
        await sessions[sessionName].logout();
        delete sessions[sessionName];

        // Hapus folder auth
        const sessionPath = path.join(__dirname, 'sessions', `session-${sessionName}`);
        fs.rmSync(sessionPath, { recursive: true, force: true });

        res.json({ success: true, message: "Sesi berhasil dihapus" });
    } catch (error) {
        console.error("Error saat menghapus sesi:", error);
        res.status(500).json({ success: false, message: "Gagal menghapus sesi", error: error.message });
    }
});
app.use(cors({ origin: '*' })); // 💡 Bisa diganti dengan origin tertentu jika butuh
app.get('/status', (req, res) => {
    res.json({ status: 'CONNECTED' });
});

// API untuk mengecek status sesi
app.get('/status/:id', (req, res) => {
    const { id } = req.params;
    if (sessions[id]) {
        res.json({ status: "connected" });
    } else {
        res.json({ status: "not connected" });
    }
});

// API untuk mengirim pesan
app.post('/send-message', async (req, res) => {
    const { id, number, message } = req.body;

    if (!sessions[id]) {
        return res.status(400).json({ error: '❌ Session tidak ditemukan' });
    }

    try {
        const chatId = `${number}@c.us`;

        // Tangkap pesan jika butuh metadata (tidak wajib)
        const msg = await sessions[id].sendMessage(chatId, message);

        console.log(`✅ Pesan berhasil dikirim ke ${number} (via sesi "${id}")`);

        // Bisa balikin HTTP 200 tanpa data
        res.status(200).end();
    } catch (error) {
        //console.error(`❌ Gagal kirim pesan ke ${number}:`, error.message);
        res.status(500).json({
            error: '❌ Gagal mengirim pesan',
            details: error.message
        });
    }
});
// kirim file
app.get('/send-message', async (req, res) => {
    const { id, number, message } = req.query; // ambil dari query string

    if (!sessions[id]) {
        return res.status(400).json({ error: '❌ Session tidak ditemukan' });
    }

    if (!number || !message) {
        return res.status(400).json({ error: '❌ Parameter number atau message kosong' });
    }

    try {
        const chatId = `${number}@c.us`;

        // Kirim pesan via session WA
        const msg = await sessions[id].sendMessage(chatId, message);

        console.log(`✅ Pesan berhasil dikirim ke ${number} (via sesi "${id}")`);

        // Balik status sukses
        res.status(200).json({ status: true, message: 'Pesan berhasil dikirim' });
    } catch (error) {
        console.error(`❌ Gagal kirim pesan ke ${number}:`, error.message);
        res.status(500).json({
            status: false,
            error: '❌ Gagal mengirim pesan',
            details: error.message
        });
    }
});

app.post('/send-media', upload.single('media'), async (req, res) => {
    const { id, number, caption } = req.body;
    const file = req.file;

    if (!sessions[id]) {
        return res.status(400).json({ error: '❌ Session tidak ditemukan' });
    }

    if (!file) {
        return res.status(400).json({ error: '❌ File media tidak ditemukan' });
    }

    try {
        const filePath = file.path;
        const filename = file.originalname;
        const fileData = fs.readFileSync(filePath);
        const mimeType = getMimeType(filename);

        const media = new MessageMedia(
            mimeType,
            fileData.toString('base64'),
            filename
        );
        await sessions[id].sendMessage(`${number}@c.us`, media, { caption });
        console.log(`📎 Media ${filename} dikirim ke ${number} (via sesi "${id}")`);
        res.status(200).json({ status: 'success', message: 'Media terkirim!' });
    } catch (error) {
        console.error(`❌ Gagal kirim media: ${error.message}`);
        res.status(500).json({ error: '❌ Gagal kirim media', details: error.message });
    }
});
// Ini Untuk kebutuhan group dan nomor
app.post('/send-media-file', upload.single('media'), async (req, res) => {
    const { id, number, caption } = req.body;
    const file = req.file;

    if (!sessions[id]) return res.status(400).json({ error: 'Session tidak ditemukan' });
    if (!file) return res.status(400).json({ error: 'File media tidak ditemukan' });

    const fileData = fs.readFileSync(file.path);
    const mimeType = getMimeType(file.originalname); // misal 'image/png'
    const media = new MessageMedia(mimeType, fileData.toString('base64'), file.originalname);

    try {
        const targets = Array.isArray(number) ? number : [number];
        for (const n of targets) {
            let receiverId = n;
            if (!n.endsWith('@c.us') && !n.endsWith('@g.us')) receiverId = `${n}@c.us`;

            await sessions[id].sendMessage(receiverId, media, { caption });
            console.log(`📎 Media ${file.originalname} dikirim ke ${receiverId} (Base64)`);
        }

        res.json({ status: 'success' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal kirim media', details: err.message });
    }
});

// API untuk ambil semua anggota grup
app.get('/group-members/:groupId', async (req, res) => {
    const sessionId = req.query.id || req.headers['x-session-id']; // ambil session id dari query/header
    if (!sessionId) return res.status(400).json({ error: 'Session ID dibutuhkan' });

    const client = sessions[sessionId];
    if (!client) return res.status(404).json({ error: 'Session tidak ditemukan' });

    try {
        const chat = await client.getChatById(req.params.groupId);
        if (!chat.isGroup) return res.status(400).send('Bukan grup');

        const members = chat.participants.map(m => m.id.user);
        res.json(members);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// app.get('/get-groups', async (req, res) => {
//     const sessionId = req.query.id;
//     const client = sessions[sessionId];

//     if (!client) {
//         return res.status(404).json({ status: false, message: '❌ Session tidak ditemukan' });
//     }

//     try {
//         const chats = await client.getChats();
//         const groups = chats
//             .filter(chat => chat.isGroup)
//             .map(group => ({
//                 id: group.id._serialized,
//                 name: group.name,
//                 participants: group.participants?.length || 0
//             }));

//         res.status(200).json({ status: true, groups });
//     } catch (error) {
//         console.error('❌ Error saat ambil grup:', error);
//         res.status(500).json({ status: false, message: '❌ Gagal ambil grup', error: error.toString() });
//     }
// });
app.get('/get-groups', async (req, res) => {
    const sessionId = req.query.id;
    const client = sessions[sessionId];

    if (!client || !client.info) { // pastikan client ready
        return res.status(404).json({ status: false, message: '❌ Session tidak ditemukan atau belum siap' });
    }

    try {
        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(group => ({
                id: group.id._serialized,
                name: group.name,
                participants: group.participants?.length || 0
            }));

        res.status(200).json({ status: true, groups });
    } catch (error) {
        console.error('❌ Error saat ambil grup:', error);
        res.status(500).json({ status: false, message: '❌ Gagal ambil grup', error: error.toString() });
    }
});

app.get('/send-message-get', async (req, res) => {
    const { id, number, message } = req.query;

    if (!sessions[id]) {
        return res.status(400).json({ error: '❌ Session tidak ditemukan' });
    }

    try {
        const chatId = `${number}@c.us`;

        // Kirim pesan ke nomor tujuan
        const msg = await sessions[id].sendMessage(chatId, message);

        console.log(`✅ Pesan berhasil dikirim ke ${number} (via sesi "${id}")`);

        res.status(200).json({ success: true, message: 'Pesan berhasil dikirim' });
    } catch (error) {
        res.status(500).json({
            error: '❌ Gagal mengirim pesan',
            details: error.message
        });
    }
});

// API untuk logout
app.post('/logout', (req, res) => {
    const { id } = req.body;
    if (!sessions[id]) return res.status(400).json({ error: 'Session tidak ditemukan' });

    sessions[id].logout();
    delete sessions[id];
    res.json({ success: true, message: 'Logged out' });
});

// // Server berjalan di IP lokal dan port 3000
// const ip = getLocalIP();
// 🧯 Tangkap error agar server tidak keluar tiba-tiba
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Tidak pakai process.exit() agar server tetap hidup
});

process.on('unhandledRejection', (reason, p) => {
    console.error('⚠️ Unhandled Promise Rejection:', reason);
    // Optional: log lebih lanjut
});

async function activateSessions() {
    try {
        const response = await axios.get("http://localhost/siakad/public/respon-aktif");
        const data = response.data;

        if (!data.success || data.akun_ids.length === 0) {
            return console.log("Tidak ada akun_id ditemukan");
        }

        data.akun_ids.forEach(async (akunId) => {
            let client = sessions[akunId];

            if (!client) {
                // Buat client baru dulu
                console.log(`Membuat client baru untuk akun ${akunId}`);
                client = await createClient(akunId);
            }

            // Setelah client dibuat, cek info.me
            if (client.info && client.info.me) {
                console.log(`Sesi akun ${akunId} sudah siap, aktif`);
            } else {
                console.log(`Akun ${akunId} belum scan QR, dilewati`);
            }
        });
    } catch (err) {
        console.error("Error saat aktivasi sesi:", err.message);
    }
}

// Panggil otomatis saat server.js dijalankan
activateSessions();

server.listen(3000, '0.0.0.0', () => {
    console.clear(); // Optional: bersihkan layar
    console.log("=========================================");
    console.log("  🔌 ATA DIGITAL WA GATEWAY & Boot Asisten  ");
    console.log("=========================================");
    console.log(" [✔] Memuat Modul...");
    console.log(" [✔] Menyiapkan Session WhatsApp...");
    console.log(" [⚙] Menyalakan Engine WebSocket...");
    console.log("<----------------------------------------->");
    console.log(" 📡 Tunggu hingga QR ditampilkan...");
    console.log(" Jika sudah login, status akan muncul dan siap digunaka...");
    console.log("-----------------------------------------");
    console.log(" Dibangun oleh ATA DIGITAL 💡");
    console.log(" Kontak    : 085329860005");
    console.log(" Alamat    : Banjarharjo - Brebes, 52265 ");
    console.log(` IP Server : http://${ip}:3000 `);
    console.log("=========================================\n");

    // // langsung bikin sesi tanpa request HTTP
    // if (!sessions['GuruId']) {
    //     createClient('GuruId');
    //     console.log('Sesi GuruId dibuat langsung dari server.js');
    // }

    const sessionPath = path.join(__dirname, '.wwebjs_auth', 'session-GuruId');
    const logFile = path.join(__dirname, 'runwa.log');
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    // fungsi bantu log ke console + file
    function log(msg) {
        const time = new Date().toISOString();
        const line = `[${time}] ${msg}\n`;
        process.stdout.write(line); // console
        logStream.write(line);      // file
    }

    // cek session GuruId
    if (fs.existsSync(sessionPath)) {
        createClient('GuruId'); // sudah ada session → langsung login
        log('✅ Client GuruId dibuat menggunakan sesi yang sudah login');
    } else {
        log('⚠ Tidak ada sesi GuruId, client tidak dibuat');
    }

    // tandai server aktif
    log('🚀 Server aktif dan siap digunakan');
    console.log(`Server siap digunakan`);

    //// Jalankan batch file setelah server siap jalan
    // const { exec } = require('child_process');
    // exec('start "" "E:\\laragon\\www\\siakad\\whatsapp\\Jalankan ID Whatsapp.bat"', (err, stdout, stderr) => {
    //     if (err) {
    //         console.error('Gagal jalankan bat:', err);
    //         return;
    //     }

    //     console.log('Batch file berhasil dijalankan:', stdout);
    // });
    // const { spawn } = require('child_process');

    // const waSession = spawn('php', ['artisan', 'start:wa-sessions'], { shell: true, stdio: 'inherit' });

    // // Cek output WA session, kalau sudah login
    // waSession.stdout.on('data', (data) => {
    //     const str = data.toString();
    //     if (str.toLowerCase().includes('connected')) { // sesuaikan string log Laravel WA
    //         console.log('[✔] Session GuruId connected');
    //         spawn('php', ['artisan', 'start:ServerAktif'], { shell: true, stdio: 'inherit' });
    //     }
    // });
});