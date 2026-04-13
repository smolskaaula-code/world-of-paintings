const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

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

// Подключение к MySQL (облачная база TiDB Cloud)
const db = mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    user: '3xQnp6dcaUYWWZ4.root',
    password: '5T8dWqnmiymvVZKT',
    database: 'world_paintings',
    port: 4000,
    ssl: {}
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err);
        return;
    }
    console.log('Подключено к MySQL');
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
    // Получаем популярные картины для слайдера (топ-5 по просмотрам)
    db.query('SELECT * FROM paintings ORDER BY views DESC LIMIT 5', (err, popularPaintings) => {
        if (err) popularPaintings = [];
        
        // Последние добавленные картины
        db.query('SELECT * FROM paintings ORDER BY created_at DESC LIMIT 6', (err, recentPaintings) => {
            if (err) recentPaintings = [];
            
            // Последние новости
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
    
    if (style) {
        conditions.push('style = ?');
        params.push(style);
    }
    if (technique) {
        conditions.push('technique = ?');
        params.push(technique);
    }
    if (mood) {
        conditions.push('mood = ?');
        params.push(mood);
    }
    if (artist) {
        conditions.push('artist LIKE ?');
        params.push(`%${artist}%`);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY created_at DESC';
    
    db.query(sql, params, (err, paintings) => {
        if (err) {
            console.error(err);
            paintings = [];
        }
        res.render('gallery', { 
            title: 'Галерея', 
            paintings, 
            filters: { style, technique, mood, artist } 
        });
    });
});

// Картины
app.get('/paintings', (req, res) => {
    db.query('SELECT * FROM paintings ORDER BY created_at DESC', (err, paintings) => {
        res.render('paintings', { title: 'Картины', paintings: paintings || [] });
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
    const { username, email, password, country, birth_year, bio } = req.body;
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

// ============= ПОЛНАЯ АДМИН-ПАНЕЛЬ =============

// Страница админ-панели (полная)
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

// Управление пользователями: изменение роли
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

// Управление пользователями: удаление
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

// Управление картинами: удаление
app.post('/admin/painting/delete/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('DELETE FROM paintings WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#paintings');
    });
});

// Управление новостями: добавление
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

// Управление новостями: удаление
app.post('/admin/news/delete/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('DELETE FROM news WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#news');
    });
});

// Управление сообщениями: изменение статуса
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

// Управление сообщениями: удаление
app.post('/admin/contact/delete/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Доступ запрещён');
    }
    
    db.query('DELETE FROM contacts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send('Ошибка');
        res.redirect('/admin#contacts');
    });
});

// Увеличить счётчик просмотров картины
app.post('/painting/:id/view', (req, res) => {
    const paintingId = req.params.id;
    db.query('UPDATE paintings SET views = views + 1 WHERE id = ?', [paintingId], (err) => {
        if (err) console.error(err);
        res.json({ success: true });
    });
});

// Поставить лайк картине
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

// Страница отдельной картины
app.get('/painting/:id', (req, res) => {
    const paintingId = req.params.id;
    db.query('SELECT * FROM paintings WHERE id = ?', [paintingId], (err, paintings) => {
        if (err || paintings.length === 0) {
            return res.status(404).send('Картина не найдена');
        }
        res.render('painting-detail', { painting: paintings[0] });
    });
});

// Увеличить счётчик просмотров картины
app.post('/painting/:id/view', (req, res) => {
    const paintingId = req.params.id;
    db.query('UPDATE paintings SET views = views + 1 WHERE id = ?', [paintingId], (err) => {
        if (err) console.error(err);
        res.json({ success: true });
    });
});

// Поставить лайк картине
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

// Страница отдельной картины
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

// ============= ЗАПУСК СЕРВЕРА =============
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на http://0.0.0.0:${PORT}`);
    console.log(`Доступно из сети по адресу: http://172.28.13.57:${PORT}`);
});