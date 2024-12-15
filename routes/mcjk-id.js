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

router.post('/api/setup', requiresAuth(), async (req, res) => {
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

router.get('/api/my-profile', requiresAuth(), id.requiresId(), async (req, res) => {
    const user = await id.getUser(req.oidc.user.sub);
    res.send({
        ...user,
        email: req.oidc.user.email,
        email_verified: req.oidc.user.email_verified,
        picture: req.oidc.user.picture,
    });
});

router.get('/api/get-user', requiresAuth(), id.requiresId(), async (req, res) => {
    const user = await id.getUserByUsername(req.query.username);
    if (!user.success && user.message === "User doesn't exist") {
        res.sendStatus(404);
        return;
    } else if (!user.success) {
        res.sendStatus(500);
        return;
    }

    res.send(user);
});

router.get('/api/my-friends', requiresAuth(), id.requiresId(), async (req, res) => {
    const friends = await id.getFriends(req.oidc.user.sub);
    res.send(friends);
});

router.post('/api/send-friend-invite', requiresAuth(), id.requiresId(), async (req, res) => {
    const userId = req.oidc.user.sub; // Authenticated user's ID
    const { friendUsername } = req.body; // Friend's username

    try {
        await id.inviteToFriends(userId, friendUsername);
        return res.status(200).send({ message: 'Friend request sent successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Unable to send friend request.' });
    }
});

router.post('/api/accept-friend-invite', requiresAuth(), id.requiresId(), async (req, res) => {
    const userId = req.oidc.user.sub; // Authenticated user's ID
    const { friendUsername } = req.body; // Friend's username

    try {
        await id.acceptFriendship(userId, friendUsername);
        return res.status(200).send({ message: 'Friend request accepted successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Unable to accept friend request.' });
    }
});

router.post('/api/remove-friend', requiresAuth(), id.requiresId(), async (req, res) => {
    const userId = req.oidc.user.sub; // Authenticated user's ID
    const { friendUsername } = req.body; // Friend's username

    try {
        await id.removeFriendship(userId, friendUsername);
        return res.status(200).send({ message: 'Friendship removed successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Unable to remove friendship.' });
    }
});

export default { startingPath: '/id', router }; // Passing the starting path of the router here.