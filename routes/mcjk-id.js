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

const sites = new Sites(path.join(__dirname, 'html'), 'en_GB');

router.get('/setup', requiresAuth(), async (req, res) => {
    if (await id.userExists(req.oidc.user.sub)) { // If user is already set up.
        res.redirect('/menu');
        return;
    }

    res.send(sites.render('id-setup', req.acceptsLanguages(),{
        'picture': req.oidc.user.picture,
        'nickname': req.oidc.user.nickname,
    }));
});

router.post('/setup', requiresAuth(), async (req, res) => {
    if (await id.userExists(req.oidc.user.sub)) { // If user is already set up.
        res.sendStatus(403);
        return;
    }

    const result = await id.setupUser(req.oidc.user.sub, req.body.displayName, req.body.username);

    if (!result.success) {
        if (result.validation) {
            return res.status(400).json({
                message: "Validation failed.",
                errors: result.validation.errors
            });
        }
        return res.status(500).json({ message: "An error occurred during setup." });
    }

    res.status(201).json({ message: "User setup successful." });
});



export default { startingPath: '/id', router }; // Passing the starting path of the router here.