const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', authMiddleware, cacheMiddleware(60), feeController.getStudentFees);
router.get('/:id/receipt', authMiddleware, cacheMiddleware(300), feeController.getFeeReceipt);

module.exports = router;
