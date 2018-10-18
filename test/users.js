const shortid = require('shortid');
process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
let User = require('../models/User');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();


chai.use(chaiHttp);

describe('Users', () => {

  beforeEach((done) => {
    User.remove({}, (err) => { 
      done();           
    });        
  });

  describe('/GET /users', () => {
    it('it should GET all the users', (done) => {
      chai.request(server)
        .get('/users')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('data');
          res.body.message.should.be.a('string');
          res.body.data.should.be.a('array');
          res.body.data.length.should.be.eql(0);
          done();
        });
    });
  });

  describe('/POST /users/new', () => {
    it('it should not POST a user without username field', (done) => {
      let user = {
        name: "Foo Bar",
        password: "foobarbazquay",
        email: "foo@example.com"
      };
      chai.request(server)
        .post('/users/new')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('message').eql('Check the form for errors.');
          res.body.should.have.property('errors');
          res.body.errors.should.have.property('username').eql('Please provide your username.');
          done();
        });
    });
    it('it should not POST a user without name field', (done) => {
      let user = {
        username: "foobar",
        password: "foobarbazquay",
        email: "foo@example.com"
      };
      chai.request(server)
        .post('/users/new')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('message').eql('Check the form for errors.');
          res.body.should.have.property('errors');
          res.body.errors.should.have.property('name').eql('Please provide your name.');
          done();
        });
    });
    it('it should not POST a user without email field', (done) => {
      let user = {
        username: "foobar",
        password: "foobarbazquay",
        name: "Foo Bar"
      };
      chai.request(server)
        .post('/users/new')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('message').eql('Check the form for errors.');
          res.body.should.have.property('errors');
          res.body.errors.should.have.property('email').eql('Please provide your email.');
          done();
        });
    });
    it('it should successfully POST a user', (done) => {
      let user = {
        username: "123",
        password: "foobarbaz",
        name: "foo",
        email: "foo@example.com",
        imageUrl: "http://example.com/examplepicture"
      };
      chai.request(server)
        .post('/users/new')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('data');
          res.body.data.should.be.a('object');
          res.body.data.should.have.property('username');
          res.body.data.should.have.property('name');
          res.body.data.should.have.property('email');
          done();
        });
    });            
  });

  describe('/GET /users/:recordId', () => {
    it('it should GET a user by id', (done) => {
      let user = new User({
        username: "123",
        password: "foobarbaz",
        name: "foo",
        email: "foo@example.com",
        imageUrl: "http://example.com/examplepicture"
      });
      user.save((error, user) => {
        let route = `/users/${user._id}`;
        chai.request(server)
          .get(route)
          .send(user)
          .end((err, res) => {
            if (err) { console.log(err) }
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.should.have.property('data');
            res.body.data.should.be.a('object');
            res.body.data.should.have.property('username');
            res.body.data.should.have.property('name');
            res.body.data.should.have.property('email');
            res.body.data.should.have.property('isAdmin');
            res.body.data.should.have.property('createdAt');
            res.body.data.should.have.property('imageUrl');
            done();
          });
      });
    });
  });

  describe('/POST /users/:recordId/edit', () => {
    it('it should UPDATE user by id', (done) => {
      let user = new User({
        username: "123",
        password: "foobarbaz",
        name: "foo",
        email: "foo@example.com",
        imageUrl: "http://example.com/examplepicture"
      });
      user.save((error, user) => {
        let route = `/users/${user._id}/edit`;
        chai.request(server)
          .post(route)
          .send({
            username: "1234",
            password: "foobarbaz2",
            name: "foo2",
            email: "foo@example.com2",
            isAdmin: true,
            imageUrl: "http://example.com/examplepicture2"    
          })
          .end((err, res) => {
            if (err) { console.log(err) }
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.should.have.property('data');
            res.body.data.should.be.a('object');
            res.body.data.should.have.property('username').eql("1234");
            res.body.data.should.have.property('name').eql("foo2");
            res.body.data.should.have.property('email').eql("foo@example.com2");
            res.body.data.should.have.property('isAdmin').eql(true);
            res.body.data.should.have.property('createdAt');
            res.body.data.should.have.property('imageUrl').eql("http://example.com/examplepicture2");
            done();
          });
      });
    });
  });

  describe('/POST /users/:recordId/remove', () => {
    it('it should DELETE user by id', (done) => {
      let user = new User({
        username: "123",
        password: "foobarbaz",
        name: "foo",
        email: "foo@example.com"
      });
      user.save((error, user) => {
        let route = `/users/${user._id}/remove`;
        chai.request(server)
          .post(route)
          .end((err, res) => {
            if (err) { console.log(err) }
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message').eql('The record was successfully removed.');
            done();
          });
      });
    });
  });

});