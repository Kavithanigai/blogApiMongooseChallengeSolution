'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;


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
          expect(res.body).to.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body).to.have.length.of(count);
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
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length.of.at.least(1);

          res.body.forEach(function(blog) {
            expect(blog).to.be.a('object');
            expect(blog).to.include.keys(
              'id', 'author', 'title', 'content', 'created');
          });
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(blog) {
          expect(resPost.id).to.equal(blog.id);
          expect(resPost.author).to.equal(blog.authorName);
          expect(resPost.title).to.equal(blog.title);
          expect(resPost.content).to.equal(blog.content);
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
          expect(res.body.author).to.equal(`${newBlogPost.author.firstName} ${newBlogPost.author.lastName}`);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(newBlogPost.title);
          expect(res.body.content).to.equal(newBlogPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(blogPost) {
          expect(blogPost.author.firstName).to.equal(newBlogPost.author.firstName);
          expect(blogPost.author.lastName).to.equal(newBlogPost.author.lastName);
          expect(blogPost.title).to.equal(newBlogPost.title);
          expect(blogPost.content).to.equal(newBlogPost.content);
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
        .then(function(_blogPost) {
          blogPost=_blogPost;
         return chai.request(app).delete(`/posts/${blogPost.id}`);
        })
        .then(function(res) {
         expect(res).to.have.status(204);
          return BlogPost.findById(blogPost.id);
        })
        .then(function(blogPost) {
          expect(blogPost).to.be.null;

        });
    });
  });
});
