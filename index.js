import 'dotenv/config';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { createServer } from 'node:http';
import openidconnect from 'express-openid-connect';
import setupSocket from './socket.js';

const { auth } = openidconnect;

// Define constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the app and server
const app = express();
const server = createServer(app);

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public')));

// Auth0 integration
app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.auth_secret ?? (() => { throw Error('Authentication secret missing from the .env file') })(),
    baseURL: process.env.auth_base_url ?? `http://localhost:${process.env.port}`,
    clientID: process.env.auth_client_id ?? (() => { throw Error('Authentication client ID missing from the .env file') })(),
    issuerBaseURL: process.env.auth_issuer_base_url ?? (() => { throw Error('Authentication issuer base URL missing from the .env file') })(),
    routes: {
        callback: '/api/auth/callback',
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        postLogoutRedirect: '/',
    },
    getLoginState() {
        return {
            returnTo: '/menu' // Return to the main menu after logging in.
        };
    }
}));

// Use routers from ./routes
fs.readdir(path.join(__dirname, 'routes'), (err, files) => {
    files.forEach(async file => {
        if (file.endsWith('.js')) {
            const { default: { startingPath, router } } = await import(pathToFileURL(path.join(__dirname, 'routes', file)));
            app.use(startingPath, router);
        }
    });
});

// Set up Socket.io
setupSocket(server);

// Start the server
const port = parseInt(process.env.port ?? 3000);
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});