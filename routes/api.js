import express from 'express';
import openidconnect from 'express-openid-connect';
const { requiresAuth } = openidconnect;

const router = express.Router();

router.get('/my-profile', requiresAuth(), (req, res) => {
    const { nickname, email, email_verified, picture } = req.oidc.user;
    res.send({ nickname, email, email_verified, picture });
});

export default { startingPath: '/api', router }; // Passing the starting path of the router here.