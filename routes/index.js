const auth = require('./authentication');
const caddies = require('./order_caddies');
const exchanges = require('./exchanges');
const pairs = require('./currency_pairs');
const markets = require('./markets');
const router = require('express').Router();

router.post('/authenticate', auth.authenticate);
router.get('/caddies', auth.verifyToken, caddies.fetchAll);
router.get('/caddies/:id', auth.verifyToken, caddies.fetchOne);
router.delete('/caddies/:id', auth.verifyToken, caddies.deleteOne);
router.post('/caddies', auth.verifyToken, caddies.create);
router.get('/exchanges', auth.verifyToken, exchanges.fetchAll);
router.patch('/exchanges/:id', auth.verifyToken, exchanges.patch);
router.get('/markets', markets.get);
router.get('/pairs', pairs.fetchAll);

module.exports = router;