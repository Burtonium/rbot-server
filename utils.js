const { capitalize, replace, kebabCase } = require('lodash');

module.exports.wait = millis => new Promise((resolve) => {
  setInterval(resolve, millis);
});

module.exports.precisionRound = (number, precision) => {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
};

module.exports.toWords = name => capitalize(replace(kebabCase(name), new RegExp('-', 'g'), ' '));
