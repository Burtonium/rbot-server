const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

promisify(jwt.verify);

class AuthenticationError extends Error {
  static get status() {
    return 401;
  }
}

module.exports.verifyToken = async (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  let decoded;
  try {
    decoded = await jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid token:', error.message);
  }

  req.decodedToken = decoded;
  req.user = await User.query().where('id', decoded.user.id).first();
  if (!req.user) {
    throw new AuthenticationError('User doesn\'t exist');
  }
  next();
};

module.exports.authenticate = async (req, res) => {
  const { username } = req.body;
  const { password } = req.body;

  const user = username && password && await User.query().where({ username }).first();


  const secret = process.env.JWT_SECRET;
  const encoded = await jwt.sign({ user: user.toJSON() }, secret, { expiresIn: 60 * 60 });

  return res.json({
    success: true,
    message: 'Authentication successful',
    token: encoded
  });
};
