require('dotenv').config();
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth/index');

const { PORT, DATABASE_URL } = require('./config');

// Create instance of express application
const app = express();

// Passport/Auth setup
passport.use(localStrategy);
passport.use(jwtStrategy);

// Protect endpoints using JWT strategy
const jwtAuth = passport.authenticate('jwt', { session: false });

// Mount routers
app.use('/api/auth/', authRouter);

app.get('/api/protected', jwtAuth, (req, res) => {
  return res.json({
    data: 'SUPER SECRET DATA'
  });
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
