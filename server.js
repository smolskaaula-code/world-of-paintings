const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const ExcelJS = require('exceljs'); // ДОБАВЛЕНО для экспорта в Excel

const app = express();
const PORT = 3000;

// Создаём папку для загрузок, если её нет
if (!fs.existsSync('./public/uploads')) {
    fs.mkdirSync('./public/uploads', { recursive: true });
}

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Подключение к MySQL (ЛОКАЛЬНАЯ БАЗА)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '7803075',
    database: 'world_paintings'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err);
        return;
    }
    console.log('✅ Подключено к MySQL');
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Настройка сессий
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

// Middleware для передачи user во все шаблоны
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Настройка шаблонов
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============= СТРАНИЦЫ =============

// Главная
app.get('/', (req, res) => {
    db.query('SELECT * FROM paintings ORDER BY views DESC LIMIT 5', (err, popularPaintings) => {
        if (err) popularPaintings = [];
        
        db.query('SELECT * FROM paintings ORDER BY created_at DESC LIMIT 6', (err, recentPaintings) => {
            if (err) recentPaintings = [];
            
            db.query('SELECT * FROM news ORDER BY created_at DESC LIMIT 3', (err, news) => {
                if (err) news = [];
                
                res.render('index', { 
                    title: 'Главная', 
                    popularPaintings, 
                    recentPaintings, 
                    news 
                });
            });
        });
    });
});

// Галерея
app.get('/gallery', (req, res) => {
    const { style, technique, mood, artist } = req.query;
    let sql = 'SELECT * FROM paintings';
    let params = [];
    let conditions = [];
    
    if (style) { conditions.push('style = ?'); params.push(style); }
    if (technique) { conditions.push('technique = ?'); params.push(technique); }
    if (mood) { conditions.push('mood = ?'); params.push(mood); }
    if (artist) { conditions.push('artist LIKE ?'); params.push(`%${artist}%`); }
    
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    
    db.query(sql, params, (err, paintings) => {
        if (err) paintings = [];
        res.render('gallery', { title: 'Галерея', paintings, filters: { style, technique, mood, artist } });
    });
});

// Картины
app.get('/paintings', (req, res) => {
    db.query('SELECT * FROM paintings ORDER BY created_at DESC', (err, paintings) => {
        res.render('paintings', { title: 'Картины', paintings: paintings || [] });
    });
});

// Художники
app.get('/artists', (req, res) => {
    db.query('SELECT id, username, country, birth_year, bio, created_at FROM users WHERE is_artist = TRUE ORDER BY created_at DESC', (err, artists) => {
        if (err) artists = [];
        res.render('artists', { title: 'Художники', artists: artists || [] });
    });
});

// Форум
app.get('/forum', (req, res) => {
    db.query(`
        SELECT f.*, u.username 
        FROM forum_topics f 
        LEFT JOIN users u ON f.user_id = u.id 
        ORDER BY f.created_at DESC
    `, (err, topics) => {
        res.render('forum', { title: 'Форум', topics: topics || [] });
    });
});

// Создать тему форума
app.post('/forum/topic', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const { title, content } = req.body;
    db.query(
        'INSERT INTO forum_topics (title, content, user_id) VALUES (?, ?, ?)',
        [title, content, req.session.user.id],
        (err) => {
            res.redirect('/forum');
        }
    );
});

// Новости
app.get('/news', (req, res) => {
    db.query('SELECT * FROM news ORDER BY created_at DESC', (err, news) => {
        res.render('news', { title: 'Новости', news: news || [] });
    });
});

// Обратная связь
app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Обратная связь', message: null });
});

app.post('/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    db.query(
        'INSERT INTO contacts (name, email, subject, message, status) VALUES (?, ?, ?, ?, "new")',
        [name, email, subject, message],
        (err) => {
            res.render('contact', { title: 'Обратная связь', message: 'Сообщение отправлено!' });
        }
    );
});

// Регистрация
app.get('/register', (req, res) => {
    res.render('register', { title: 'Регистрация', error: null });
});

app.post('/register', async (req, res) => {
    const { username, email, password, country, birth_year, bio, consent } = req.body;
    
    if (!consent) {
        return res.render('register', { title: 'Регистрация', error: 'Необходимо согласие на обработку персональных данных' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query(
        'INSERT INTO users (username, email, password_hash, country, birth_year, bio, is_artist) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
        [username, email, hashedPassword, country, birth_year, bio],
        (err) => {
            if (err) {
                return res.render('register', { title: 'Регистрация', error: 'Пользователь уже существует' });
            }
            res.redirect('/login');
        }
    );
});

// Вход
app.get('/login', (req, res) => {
    res.render('login', { title: 'Вход', error: null });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, users) => {
        if (err || users.length === 0) {
            return res.render('login', { title: 'Вход', error: 'Пользователь не найден' });
        }
        
        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        
        if (!valid) {
            return res.render('login', { title: 'Вход', error: 'Неверный пароль' });
        }
        
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_artist: user.is_artist === 1,
            country: user.country,
            birth_year: user.birth_year,
            bio: user.bio
        };
        res.redirect('/cabinet');
    });
});

// Личный кабинет
app.get('/cabinet', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('cabinet', { title: 'Личный кабинет' });
});

// Добавление картины
app.get('/add-painting', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('add-painting', { title: 'Добавить картину', error: null });
});

app.post('/add-painting', upload.single('image'), (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    const { title, artist, year, description, style, technique, mood } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.query(
        'INSERT INTO paintings (title, artist, year, description, image_url, style, technique, mood, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, artist, year, description, imageUrl, style, technique, mood, req.session.user.id],
        (err) => {
            if (err) {
                return res.render('add-painting', { title: 'Добавить картину', error: 'Ошибка добавления' });
            }
            res.redirect('/cabinet');
        }
    );
});

// Выход
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Стать художником
app.post('/become-artist', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    const { country, birth_year, bio } = req.body;
    
    db.query(
        'UPDATE users SET country = ?, birth_year = ?, bio = ?, is_artist = TRUE WHERE id = ?',
        [country, birth_year, bio, req.session.user.id],
        (err) => {
            if (err) {
                console.error('Ошибка:', err);
                return res.status(500).send('Ошибка при обновлении профиля');
            }
            req.session.user.is_artist = true;
            req.session.user.country = country;
            req.session.user.birth_year = birth_year;
            req.session.user.bio = bio;
            res.redirect('/cabinet');
        }
    );
});

// ============= АДМИН-ПАНЕЛЬ =============

app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён. Вы не администратор.');
    }
    
    db.query('SELECT * FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) users = [];
        
        db.query('SELECT * FROM paintings ORDER BY created_at DESC', (err, paintings) => {
            if (err) paintings = [];
            
            db.query('SELECT * FROM news ORDER BY created_at DESC', (err, news) => {
                if (err) news = [];
                
                db.query('SELECT * FROM contacts ORDER BY created_at DESC', (err, contacts) => {
                    if (err) contacts = [];
                    
                    res.render('admin', { 
                        title: 'Админ-панель',
                        users: users, 
                        paintings: paintings, 
                        news: news, 
                        contacts: contacts 
                    });
                });
            });
        });
    });
});

app.post('/admin/user/role/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    const { role } = req.body;
    db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#users');
    });
});

app.post('/admin/user/delete/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('DELETE FROM paintings WHERE user_id = ?', [req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        
        db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
            if (err) return res.send('Ошибка');
            res.redirect('/admin#users');
        });
    });
});

app.post('/admin/painting/delete/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('DELETE FROM paintings WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#paintings');
    });
});

app.post('/admin/news/add', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    const { title, content } = req.body;
    db.query('INSERT INTO news (title, content) VALUES (?, ?)', [title, content], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#news');
    });
});

app.post('/admin/news/delete/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('DELETE FROM news WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#news');
    });
});

app.post('/admin/contact/status/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    const { status } = req.body;
    db.query('UPDATE contacts SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#contacts');
    });
});

app.post('/admin/contact/delete/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('DELETE FROM contacts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#contacts');
    });
});

// Лайки и просмотры
app.post('/painting/:id/view', (req, res) => {
    const paintingId = req.params.id;
    db.query('UPDATE paintings SET views = views + 1 WHERE id = ?', [paintingId], (err) => {
        if (err) console.error(err);
        res.json({ success: true });
    });
});

app.post('/painting/:id/like', (req, res) => {
    const paintingId = req.params.id;
    db.query('UPDATE paintings SET likes = likes + 1 WHERE id = ?', [paintingId], (err) => {
        if (err) {
            return res.json({ success: false });
        }
        db.query('SELECT likes FROM paintings WHERE id = ?', [paintingId], (err, result) => {
            if (err) return res.json({ success: false });
            res.json({ success: true, likes: result[0].likes });
        });
    });
});

app.get('/painting/:id', (req, res) => {
    const paintingId = req.params.id;
    db.query('SELECT * FROM paintings WHERE id = ?', [paintingId], (err, paintings) => {
        if (err || paintings.length === 0) {
            return res.status(404).send('Картина не найдена');
        }
        res.render('painting-detail', { 
            title: paintings[0].title,
            painting: paintings[0] 
        });
    });
});

// Страница политики конфиденциальности
app.get('/privacy', (req, res) => {
    res.render('privacy', { title: 'Политика конфиденциальности' });
});

// ============= ЭКСПОРТ В EXCEL =============

// Экспорт пользователей
app.get('/export/users', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('SELECT id, username, email, role, created_at FROM users', (err, users) => {
        if (err) {
            return res.status(500).send('Ошибка загрузки данных');
        }
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Пользователи');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Имя пользователя', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Роль', key: 'role', width: 15 },
            { header: 'Дата регистрации', key: 'created_at', width: 20 }
        ];
        
        users.forEach(user => {
            worksheet.addRow(user);
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
        
        workbook.xlsx.write(res).then(() => {
            res.end();
        });
    });
});

// Экспорт картин
app.get('/export/paintings', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('SELECT id, title, artist, year, style, technique, views, likes, created_at FROM paintings', (err, paintings) => {
        if (err) {
            return res.status(500).send('Ошибка загрузки данных');
        }
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Картины');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Название', key: 'title', width: 25 },
            { header: 'Художник', key: 'artist', width: 20 },
            { header: 'Год', key: 'year', width: 10 },
            { header: 'Стиль', key: 'style', width: 15 },
            { header: 'Техника', key: 'technique', width: 15 },
            { header: 'Просмотры', key: 'views', width: 12 },
            { header: 'Лайки', key: 'likes', width: 10 },
            { header: 'Дата добавления', key: 'created_at', width: 20 }
        ];
        
        paintings.forEach(painting => {
            worksheet.addRow(painting);
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=paintings.xlsx');
        
        workbook.xlsx.write(res).then(() => {
            res.end();
        });
    });
});

// Экспорт новостей
app.get('/export/news', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('SELECT id, title, content, created_at FROM news', (err, news) => {
        if (err) {
            return res.status(500).send('Ошибка загрузки данных');
        }
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Новости');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Заголовок', key: 'title', width: 40 },
            { header: 'Содержание', key: 'content', width: 50 },
            { header: 'Дата публикации', key: 'created_at', width: 20 }
        ];
        
        news.forEach(item => {
            worksheet.addRow(item);
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=news.xlsx');
        
        workbook.xlsx.write(res).then(() => {
            res.end();
        });
    });
});

// Экспорт сообщений
app.get('/export/contacts', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('SELECT id, name, email, subject, message, status, created_at FROM contacts', (err, contacts) => {
        if (err) {
            return res.status(500).send('Ошибка загрузки данных');
        }
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Сообщения');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Имя', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Тема', key: 'subject', width: 25 },
            { header: 'Сообщение', key: 'message', width: 50 },
            { header: 'Статус', key: 'status', width: 15 },
            { header: 'Дата', key: 'created_at', width: 20 }
        ];
        
        contacts.forEach(contact => {
            worksheet.addRow(contact);
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
        
        workbook.xlsx.write(res).then(() => {
            res.end();
        });
    });
});

// ============= ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ IP-АДРЕСОВ =============
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (!iface.internal && iface.family === 'IPv4') {
                ips.push(iface.address);
            }
        }
    }
    
    return ips;
}

// ============= ЗАПУСК СЕРВЕРА =============
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('✅ СЕРВЕР УСПЕШНО ЗАПУЩЕН');
    console.log('========================================\n');
    
    console.log('📍 ДЛЯ ДОСТУПА НА ЭТОМ КОМПЬЮТЕРЕ:');
    console.log(`   → http://localhost:${PORT}\n`);
    
    const localIPs = getLocalIPs();
    
    if (localIPs.length > 0) {
        console.log('📱 ДЛЯ ДОСТУПА С ДРУГИХ УСТРОЙСТВ (телефон, планшет, другой ПК):');
        console.log('   Введи в браузере на другом устройстве ЭТУ ссылку:');
        
        localIPs.forEach(ip => {
            console.log(`   → http://${ip}:${PORT}`);
        });
        
        console.log('\n💡 ВАЖНО:');
        console.log('   • Устройства должны быть в ОДНОЙ Wi-Fi сети');
        console.log('   • Если не открывается, отключи брандмауэр Windows');
        console.log('   • Или разреши входящие подключения для Node.js\n');
    } else {
        console.log('⚠️  ВНИМАНИЕ: Сетевые IP-адреса не найдены!');
        console.log('   • Проверь подключение к Wi-Fi или интернет-кабелю');
        console.log('   • Без сети другие устройства не смогут подключиться\n');
    }
    
    console.log('========================================');
    console.log(`🟢 Сервер слушает порт ${PORT}`);
    console.log('🛑 Для остановки нажми Ctrl+C');
    console.log('========================================\n');
});