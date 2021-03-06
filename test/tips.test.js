const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../server');
const { Tip } = require('../tips/index');
const { Job } = require('../jobs/index');
const { User } = require('../users/index');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

const { tips, jobs, users } = require('../db/data');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Tip Tracks API - Tips', function () {
  let user = {};
  let token;
  before(function () {
    return mongoose.connect(TEST_DATABASE_URL, { useNewUrlParser: true, useCreateIndex: true })
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      User.insertMany(users),
      Tip.insertMany(tips),
      Job.insertMany(jobs),
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/tips', function () {


    it('should return the correct number of tips', function () {
      return Promise.all([
        Tip.find({ userId: user.id}),
        chai.request(app)
          .get('/api/tips')
          .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list sorted desc with the correct right fields', function () {
      return Promise.all([
        Tip.find({ userId: user.id }).sort({ updatedAt: 'desc' }),
        chai.request(app)
          .get('/api/tips')
          .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            // Note: folderId, tags and content are optional
            expect(item).to.include.all.keys('id', 'totalTips', 'tippedOut', 'notes', 'hours', 'date', 'baseWage', 'job', 'createdAt', 'updatedAt', 'userId');
            // expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(item.userId).to.equal(data[i].userId.toString());
            // expect(new Date(item.createdAt)).to.be.greaterThan(data[i].createdAt);
            // expect(new Date(item.updatedAt)).to.equal(data[i].updatedAt);
          });
        });
    });

  });
  
  describe('POST /api/tips', function () {
    
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        baseWage: '5',
        date: '2019-02-07',
        hours: '4.25',
        notes: 'sdfsfs',
        tippedOut: '5',
        totalTips: '110'
      };

      let res;
      return chai.request(app)
        .post('/api/tips')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          return Tip.findOne({ _id: res.body.id, userId: user.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.totalTips).to.equal(data.totalTips);
          expect(res.body.tippedOut).to.equal(data.tippedOut);
          expect(res.body.hours).to.equal(data.hours);
          expect(res.body.baseWage).to.equal(data.baseWage);
          expect(res.body.notes).to.equal(data.notes);
          expect(res.body.date).to.equal(data.date);
        });
    });

  });

  describe('DELETE /api/tips/:id', function () {

    it('should delete an existing document and respond with 204', function () {
      let data;
      return Tip.findOne({ userId: user.id })
        .then(_data => {
          data = _data;

          return chai.request(app)
            .delete(`/api/tips/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Tip.countDocuments({ _id: data.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      return chai.request(app)
        .delete('/api/tips/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });
  });
});