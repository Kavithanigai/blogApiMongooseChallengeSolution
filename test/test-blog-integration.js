'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;
//const should = chai.should();

const { BlogPost } = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// used to put randomish documents in db
function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogPostData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

// generate an object represnting a restaurant.
// can be used to generate seed data for db
// or request.body data
function generateBlogPostData() {
  return {
    author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    }
}

// this function deletes the entire database.
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('BlogPost API resource', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // Test get
  describe('GET endpoint', function() {

    it('should return all existing blogposts', function() {

     let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res=_res;
          expect(res).to.be.json;
          expect(res).to.have.status(200);
          //check if atleast there is one blog post
         expect(res.body.length).to.be.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.posts).to.have.length.of(count);
          //code with should
          /*res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);

          return BlogPost.count();
        })
        .then(count => {
          // the number of returned posts should be same
          // as number of posts in DB
          res.body.should.have.length.of(count);*/
        });
    });


    it('should return blogposts with right fields', function() {
      // Strategy: Get back all restaurants, and ensure they have expected keys

      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.posts).to.be.a('array');
          expect(res.body.posts).to.have.length.of.at.least(1);

          res.body.posts.forEach(function(blog) {
            expect(blog).to.be.a('object');
            expect(blog).to.include.keys(
              'id', 'author', 'title', 'content', 'created');
          });
          resPost = res.body.posts[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(blog) {
          expect(resPost.id).to.equal(blog.id);
          expect(resPost.author).to.equal(blog.authorName);
          expect(resPost.title).to.equal(blog.titlr);
          expect(resPost.content).to.equal(blog.content);
          /*
          .then(function (res) {

          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function (post) {
            post.should.be.a('object');
            post.should.include.keys('id', 'title', 'content', 'author', 'created');
          });
          // just check one of the posts that its values match with those in db
          // and we'll assume it's true for rest
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(post => {
          resPost.title.should.equal(post.title);
          resPost.content.should.equal(post.content);
          resPost.author.should.equal(post.authorName);*/
        });
    });
  });

  describe('POST endpoint', function() {
    // make a POST request with data
    it('should add a new blogPost', function() {

      const newBlogPost = generateBlogPostData();

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
         expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'author', 'title', 'content', 'created');
            expect(res.body.author).to.equal(newBlogPost.authorName);

        //  expect(res.body.author.firstName).to.equal(newBlogPost.author.firstName);
          //  expect(res.body.author.lastName).to.equal(newBlogPost.author.lastName);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(newBlogPost.title);
          expect(res.body.content).to.equal(newBlogPost.content);
          expect(res.body.created).to.equal(newBlogPost.created);
          return BlogPost.findById(res.body.id);
        })
        .then(function(blogPost) {
          expect(blogPost.author.firstName).to.equal(newBlogPost.author.firstName);
          expect(blogPost.author.lastName).to.equal(newBlogPost.author.lastName);
          expect(blogPost.title).to.equal(newBlogPost.title);
          expect(blogPost.content).to.equal(newBlogPost.content);
          expect(blogPost.created).to.equal(newBlogPost.created);

     //code with should
     /*
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'title', 'content', 'author', 'created');
          res.body.title.should.equal(newBlogPost.title);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;
          res.body.author.should.equal(
            `${newBlogPost.author.firstName} ${newBlogPost.author.lastName}`);
          res.body.content.should.equal(newBlogPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function (post) {
          post.title.should.equal(newBlogPost.title);
          post.content.should.equal(newBlogPost.content);
          post.author.firstName.should.equal(newBlogPost.author.firstName);
          post.author.lastName.should.equal(newBlogPost.author.lastName);*/
        });
    });
  });

  describe('PUT endpoint', function() {
   // Make a PUT request to update the post
    it('should update fields you send over', function() {
      const updateData = {
        title: 'Recipe',
        content: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
      };

      return BlogPost
        .findOne()
        .then(function(blogPost) {
          updateData.id = blogPost.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/posts/${blogPost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(function(blogPost) {
          expect(blogPost.title).to.equal(updateData.title);
          expect(blogPost.content).to.equal(updateData.content);

        });
    });
  });

  describe('DELETE endpoint', function() {
   // DELETE a blog post with id
    it('delete a blogPost by id', function() {
      let blogPost;
      return BlogPost
        .findOne()
        .then(function(blogPost) {
         return chai.request(app).delete(`/posts/${blogPost.id}`);
        })
        .then(function(res) {
         expect(res).to.have.status(204);
          return BlogPost.findById(blogPost.id);
        })
        .then(function(blogPost) {
          expect(blogPost).to.be.null;
          /*
          //code with should
          .then(_post => {
                    post = _post;
                    return chai.request(app).delete(`/posts/${post.id}`);
                  })
                  .then(res => {
                    res.should.have.status(204);
                    return BlogPost.findById(post.id);
                  })
                  .then(_post => {
                    // when a variable's value is null, chaining `should`
                    // doesn't work. so `_post.should.be.null` would raise
                    // an error. `should.be.null(_post)` is how we can
                    // make assertions about a null value.
                    should.not.exist(_post);*/
        });
    });
  });
});
