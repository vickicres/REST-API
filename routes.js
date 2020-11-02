'use strict';

const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// connect models
const User = require('./models').User;
const Course = require('./models').Course;

// connect express validator
const { check, validationResult } = require('express-validator');

// handler
function asyncHandler(cb) {
    return async(req, res, next) => {
      try {
        await cb(req, res, next)
      } catch(err) {
          next(err);
      }
    }
  }

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
    let message = null;
    // const users = await User.findAll();
    // Parse the user's credentials from the Authorization header
    const credentials = auth(req);
  
    // If the user's credentials are available...
    if (credentials) {
      // Attempt to retrieve the user from the data store by their email address (user's key) from the Authorization header
      const user = users.find(u => u.emailAddress === credentials.name);
      
      // If a user was successfully retrieved from the data store
      if (user) {
        // Use the bcryptjs npm package to compare the user's password from the Auth header to the user's password that was retrieved from the data store
        const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
  
        // If the passwords match...
      if (authenticated) {
        console.log(`Authentication successful for username: ${user.username}`);

        // Then store the retrieved user object on the request object
        // so any middleware functions that follow this middleware function
        // will have access to the user's information.
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.username}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }
  
    // If user auth failed...
    if (message) {
        console.warn(message);
  
        // Return a response with a 401 Unauthorized HTTP status code
        res.status(401).json({ message: 'Access Denied' });
    } else {
        // Or if the user auth succeeded, call the next() method
        next();
    }
  };

  // Construct a router instance.
const router = express.Router();

//Set up users routes
// send GET request to /users 200 to return currently authenticated user
router.get('/users', authenticateUser, asyncHandler(async(req, res) => {  
    const authenticatedUser = req.currentUser;
    const user = await User.findByPk(authenticatedUser.id, {
      attributes: {
        exclude: ['password', 'createdAt','updatedAt']
      }
    });
  
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ message: 'User not found!' });
    }
  }));
  
  // send POST request to /users 201 - Creates a user, sets the Location header to "/", and returns no content
  router.post('/users', 
  [
    check("firstName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "first name"'),
    check("lastName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "last name"'),
    check("emailAddress")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "email"'),
    check("password")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "password"'),
  ],

  asyncHandler(async(req, res) => {
    // get validation result from req object
    const errors = validationResult(req);
    // if there are validation errors
    if (!errors.isEmpty()) {
      //use array Map() method to get a list of error messages
      const errorMessages = errors.array().map(error => error.msg);
      //return the validation errors to the client
      res.status(400).json({ errors: errorMessages });
    } else {
      const user = req.body;
      if (user.password) {
        user.password = bcryptjs.hashSync(user.password);
      }
      await User.create(req.body);
      res.status(201).location('/').end();
    }
  }));

  // set up courses routes
  // send GET request to /courses 200 to return list of courses (includes the user that owns each course)
  router.get('/courses', asyncHandler(async(req, res) => {
      const courses = await Course.findAll({
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        },
        include: [{ model: User, attributes: {
          exclude: ['password', 'createdAt', 'updatedAt']
        }}]
      });
      res.status(200).json(courses);
  }));
  
  // send GET request to /courses/:id 200 to return the course (including the user that owns the course) for the provided course ID
  router.get('/courses/:id', asyncHandler(async(req, res) => {
    const course = await Course.findByPk(req.params.id, {
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      include: [{ model: User, attributes: {
        exclude: ['password', 'createdAt', 'updatedAt']
      }}]
    });
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: "Course not found." });
    }
  }));
  
  // send a POST request to /courses 201 to create a course, sets the Location header to the URI for the course, and returns no content
  router.post('/courses', 
  [
    check("title")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "title"'),
    check("description")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "description"'),
  ],
  
  authenticateUser, asyncHandler(async(req, res) => {
    const course = await Course.create(req.body);
    if (course) {
      res.status(201).location('/courses' + course.id).end();
    } else {
      res.status(400).json({message: "course info is required."});
    }
  }));
  
  // send a PUT request to /courses/:id 204 to update (edit) a course and returns no content
  router.put('/courses/:id', authenticateUser,  [ 
    check('title')
        .exists()
        .withMessage('Please provide a title'),
    check('description')
        .exists()
        .withMessage('Please provide a description')
  ], asyncHandler(async(req, res) => {
    // get validation result from req object
    const errors = validationResult(req);
    // if there are validation errors
    if (!errors.isEmpty()) {
      //use array Map() method to get a list of error messages
      const errorMessages = errors.array().map(error => error.msg);
      //return the validation errors to the client
      res.status(400).json({ errors: errorMessages });
    } else {
      const authenticatedUser = req.currentUser;
      const course = await Course.findByPk(req.params.id);
      if (authenticatedUser.id = course.userId) {
        await course.update(req.body);
        res.status(204).end();
      } else {
        res.status(403).end();
      }
    }
  }));
  
  // send a DELETE request to /courses/:id 204 to delete a course and return no content
  router.delete('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
    const authenticatedUser = req.currentUser;
    const course = await Course.findByPk(req.params.id);
    if (course) {
      if (authenticatedUser.id === course.userId) {
        await course.destroy();
        res.status(204).end();
      } else {
        res.status(403).json({ message: "You don't have premission to deleted this course." });
      } 
    } else {
        res.status(400).json();
    }
  }));

module.exports = router;