require('dotenv').config();
const express = require('express');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple Auth Middleware
const auth = (req, res, next) => {
    const password = req.query.password;
    if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).send('Unauthorized. Please provide the correct password in the query string.');
    }
};

app.get('/', (req, res) => {
    res.render('index', { year: new Date().getFullYear() });
});

app.post('/dispatch', (req, res) => {
    const { name, phone, issue } = req.body;
    if (!name || !phone) return res.status(400).send('Name and phone are required');
    try {
        db.prepare('INSERT INTO leads (name, phone, issue) VALUES (?, ?, ?)').run(name, phone, issue || 'Not specified');
        res.redirect('/thank-you');
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

app.get('/thank-you', (req, res) => {
    res.render('thank-you');
});

app.get('/admin/leads', auth, (req, res) => {
    try {
        const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
