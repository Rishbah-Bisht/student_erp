const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, feeController.getStudentFees);
router.get('/:id/receipt', authMiddleware, feeController.getFeeReceipt);

module.exports = router;
