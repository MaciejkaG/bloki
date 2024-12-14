import express from 'express';
import Sites from '../utils/sites.js';
import openidconnect from 'express-openid-connect';
const { requiresAuth } = openidconnect;
import path from 'node:path';

const router = express.Router();

// Define some useful constants
const __dirname = path.resolve();

// Initiate Sites - A simple static HTML manager with a built-in localisation system.
const sites = new Sites(path.join(__dirname, 'html'), 'en_GB');

// Root endpoint
router.get('/', (req, res) => {
    // Find the supported locale based on the accept-language header.
    const locale = sites.findLocale('index', req.acceptsLanguages());
    res.sendFile(sites.sitePath('index', locale));
});

// Root endpoint
router.get('/menu', requiresAuth(), (req, res) => {
    // Find the supported locale based on the accept-language header.
    const locale = sites.findLocale('menu', req.acceptsLanguages());
    res.sendFile(sites.sitePath('menu', locale));
});

// User profile endpoint
router.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

export default { startingPath: '/', router }; // Passing the starting path of the router here.