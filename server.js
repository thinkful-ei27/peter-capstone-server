const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth/index');
const { router: userRouter } = require('./users/router');
const { router: reportRouter } = require('./tips/index');
const { router: jobsRouter } = require('./jobs/index');

const { PORT, DATABASE_URL, CLIENT_ORIGIN } = require('./config');

// Create instance of express application
const app = express();

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

// CORS
app.use(cors({origin: CLIENT_ORIGIN}));

// Passport/Auth setup
passport.use(localStrategy);
passport.use(jwtStrategy);

// Protect endpoints using JWT strategy
const jwtAuth = passport.authenticate('jwt', { session: false });

// Mount routers
app.use('/api/auth/', authRouter);
app.use('/api/users/', userRouter);
app.use('/api/tips/', jwtAuth, reportRouter);
app.use('/api/jobs/', jwtAuth, jobsRouter);

// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Custom Error Handler
app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = { ...err, message: err.message };
    res.status(err.status).json(errBody);
  } else {
    res.status(500).json({ message: 'Internal Server Error'});
  }
});

// Listen for incoming connections 
if (require.main === module) {
  // Connect to DB and listen for incoming connections
  mongoose.connect(DATABASE_URL, { useNewUrlParser: true })
    .then(instance => {
      const conn = instance.connections[0];
      console.info(`Connected to: monogodb://${conn.host}:${conn.port}/${conn.name}`);
    })
    .catch(err => {
      console.error(err);
    });

  app.listen(PORT , function () {
    console.info(`Server is now listening on port ${PORT}`);
  }).on('error', err => {
    console.error(err);
  });
}
// export app for testing
module.exports = app;