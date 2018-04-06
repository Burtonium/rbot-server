const promisify = require('promisify-node');
const jwt = promisify('jsonwebtoken');
const User = require('../models/user');

class AuthenticationError extends Error {
  get status() {
    return 401;
  }
}

module.exports.verifyToken = async (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  let decoded;
  try {
    decoded = await jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }

  req.decodedToken = decoded;
  req.user = decoded.user;
  next();
};

module.exports.authenticate = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user =  username && password && await User.query().where({ username }).first();

  if (!user || !(await user.verifyPassword(password))) {
    throw new AuthenticationError('Authentication failed.');
  }

  const secret = process.env.JWT_SECRET;
  const encoded = await jwt.sign({ user: user.toJSON() }, secret, { expiresIn: 60 * 60 });

  return res.json({
    success: true,
    message: 'Authentication successful',
    token: encoded
  });
};
