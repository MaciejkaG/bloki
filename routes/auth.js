import express from 'express';

const router = express.Router();

router.get('/callback', (req, res) => {
    // Redirect to the URL containing the user's email
    res.redirect(`/menu`);
});

export default { startingPath: '/api/auth', router }; // Passing the starting path of the router here.