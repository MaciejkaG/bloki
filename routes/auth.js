import express from 'express';

const router = express.Router();

router.get('/callback', (req, res) => {
    res.redirect(`/menu`);
});

export default { startingPath: '/api/auth', router }; // Passing the starting path of the router here.