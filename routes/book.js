const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('../middleware/multer-config');

const bookCtrl = require('../controllers/book');

router.get('/bestrating', bookCtrl.getBestRating);
router.post('/:id/rating', auth, bookCtrl.createRating);
router.get('/', bookCtrl.getAllBooks);
router.get('/:id', bookCtrl.getOneBook);
router.post('/', auth, multer, bookCtrl.createBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;
