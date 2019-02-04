const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Force mongoose to use JS Promises instead of it's own version of Promises
mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: { type: String, default: ''}
});

UserSchema.methods.serialize = function () {
  return {
    username: this.username || '',
    fullName: this.fullName || '',
  };
};

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = { User };