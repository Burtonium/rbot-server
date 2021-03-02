require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('express-async-errors');
const routes = require('./routes');

const port = process.env.PORT || 4000;
const app = express();
// const production = process.env.NODE_ENV === 'production';

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use('/', routes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: err
  });

  next(err);
});

app.listen(port);

console.log(`Listening on ${port}`);

