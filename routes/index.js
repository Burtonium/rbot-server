const auth = require('./authentication');
const caddies = require('./order_caddies');
const exchanges = require('./exchanges');
const pairs = require('./currency_pairs');
const markets = require('./markets');
const router = require('express').Router();

router.post('/authenticate', auth.authenticate);
router.get('/caddies', caddies.fetchAll);
router.get('/caddies/:id', caddies.fetchOne);
router.delete('/caddies/:id', caddies.deleteOne);
router.post('/caddies', caddies.create);
router.patch('/caddies/:id', caddies.patch);
router.get('/exchanges', exchanges.fetchAll);
router.get('/exchanges/:id/balances', exchanges.fetchBalances);
router.patch('/exchanges/:id', exchanges.patch);
router.get('/markets', markets.fetchAll);
router.get('/pairs', pairs.fetchAll);

module.exports = router;