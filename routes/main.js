import express from 'express';
import Sites from '../utils/sites.js';
import openidconnect from 'express-openid-connect';
const { requiresAuth } = openidconnect;
import path from 'node:path';
import mcjk_id from '../utils/mcjk-id.js';

const id = new mcjk_id({
    host: process.env.id_db_host,
    user: process.env.id_db_user,
    password: process.env.id_db_password,
    database: process.env.id_db_dbname,
});

const router = express.Router();

const __dirname = path.resolve();

// Initiate Sites - A simple static HTML manager with a built-in localisation system.
const sites = new Sites(path.join(__dirname, 'html'), 'en_GB');

router.get('/', (req, res) => {
    // Find the supported locale based on the accept-language header.
    const locale = sites.findLocale('index', req.acceptsLanguages());
    res.sendFile(sites.sitePath('index', locale));
});

router.get('/tos', (req, res) => res.redirect('/terms'));
router.get('/terms', (req, res) => {
    const locale = sites.findLocale('terms', req.acceptsLanguages());
    res.sendFile(sites.sitePath('terms', locale));
});

router.get('/privacy', (req, res) => {
    const locale = sites.findLocale('privacy-policy', req.acceptsLanguages());
    res.sendFile(sites.sitePath('privacy-policy', locale));
});

router.get('/menu', requiresAuth(), id.requiresId(), (req, res) => {
    const locale = sites.findLocale('menu', req.acceptsLanguages());
    res.sendFile(sites.sitePath('menu', locale));
});

// Handle redirects to SPA routes
router.get('/menu/*', (req, res) => {
    res.redirect('/menu/?path=' + req.originalUrl.slice('/menu'.length));
});

// User profile endpoint
router.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

export default { startingPath: '/', router }; // Passing the starting path of the router here.