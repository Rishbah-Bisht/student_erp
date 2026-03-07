const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, resultController.getStudentResults);
router.get('/leaderboard', authMiddleware, resultController.getLeaderboard);

module.exports = router;
