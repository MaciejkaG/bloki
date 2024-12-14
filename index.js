// Import the configuration from the .env file
import 'dotenv/config'

// Set up some default config values
process.env.port = parseInt(process.env.port ?? 3000);

// Import packages
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import auth from 'express-openid-connect';
const { auth, requiresAuth } = auth;

import Sites from './utils/sites.js';

// Define some useful constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an app and a Socket.io server
const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Auth0 integration
// Auth0 uses the /login and /logout routes.
app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.auth_secret ?? (() => { throw Error('Authentication secret missing from the .env file') })(),
    baseURL: process.env.auth_base_url ?? `http://localhost:${process.env.port}`,
    clientID: process.env.auth_client_id ?? (() => { throw Error('Authentication client ID missing from the .env file') })(),
    issuerBaseURL: process.env.auth_issuer_base_url ?? (() => { throw Error('Authentication issuer base URL missing from the .env file') })()
}));

// Initiate Sites - A simple static HTML manager with a built-in localisation system.
const sites = new Sites(path.join(__dirname, 'html'), 'en_GB');

// Define endpoints here
app.get('/', (req, res) => {
    // FInd the supported locale based on the accept-language header.
    const locale = sites.findLocale('index', req.acceptsLanguages());

    res.sendFile(sites.sitePath('index', locale));
});

// User data fetching example
app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

// Listen for requests
server.listen(process.env.port, () => {
    console.log(`Server running at http://localhost:${process.env.port}`);
});