const User = require("../models/User");
const jwt = require("jsonwebtoken");
const adminRequired = require("../modules/apiAccess").adminRequired;
const adminOrOwnerRequired = require("../modules/apiAccess").adminOrOwnerRequired;

if (!process.env.JWT_SECRET) {
  require("../config/env.js");
}

module.exports = function(app, passport) {

  // new record
  app.post("/users/new", adminRequired, (req, res, next) => {

    const validationResult = validateSignupForm(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.message,
        errors: validationResult.errors
      });
    }

    return passport.authenticate('local-signup', (err, user) => {
      if (err) {
        console.log(err);
        if (err.name === 'MongoError' && err.code === 11000) {
          // the 11000 Mongo code is for a duplication email error
          // the 409 HTTP status code is for conflict error
          return res.status(409).json({
            success: false,
            message: 'Check the form for errors.',
            errors: {
              email: 'This email is already taken.'
            }
          });
        }

        return res.status(400).json({
          success: false, 
          message: `Could not process the form.${JSON.stringify(err)}`
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'You have successfully signed up! Now you should be able to log in.',
          data: user
        });
      }
    })(req, res, next);    
  });

  // remove record
  app.post("/users/:recordId/remove", adminOrOwnerRequired, (req, res) => {
    User.findByIdAndRemove(req.params.recordId).exec(error => {
      if (error) {
        jsonResponse = {
          message: "There was a problem removing the record."
        };
      } else {
        jsonResponse = {
          message: "The record was successfully removed."
        };
      }
      res.json(jsonResponse);
    });
  });

  // edit record
  app.post("/users/:recordId/edit", adminOrOwnerRequired, (req, res) => {
    if (process.env.NODE_ENV === 'test') {
      User.findOne({ _id: req.params.recordId })
      .exec((err, record) => {
        record.name = req.body.name;
        record.email = req.body.email;
        record.username = req.body.username;
        record.isAdmin = Boolean(req.body.isAdmin);
        record.imageUrl = req.body.imageUrl;
        record.updatedAt = new Date();
        record.save((error, updatedRecord) => {
          let jsonResponse;
          if (error) {
            jsonResponse = {
              message: "There was a problem saving the updated record.",
              data: record
            };
          } else {
            jsonResponse = {
              message: "The updated record was successfully saved.",
              data: updatedRecord
            };
          }
          res.json(jsonResponse);
        });
      });
    } else {
      User.findOne({ _id: req.params.recordId })
      .exec((err, record) => {
        record.name = req.body.name;
        record.email = req.body.email;
        record.username = req.body.username;
        record.isAdmin = Boolean(req.body.isAdmin);
        record.imageUrl = req.body.imageUrl;
        record.updatedAt = new Date();
        record.save((error, updatedRecord) => {
          let jsonResponse;
          if (error) {
            jsonResponse = {
              message: "There was a problem saving the updated record.",
              data: record
            };
          } else {
            jsonResponse = {
              message: "The updated record was successfully saved.",
              data: updatedRecord
            };
          }
          res.json(jsonResponse);
        });
      });    
    }  
  });

  // show one record
  app.get("/users/:recordId", getRecordById, (req, res) => {
    let jsonResponse = {
      message: res.locals.message,
      data: res.locals.data
    };
    res.json(jsonResponse);
  });

  // list all records
  app.get("/users", getAllRecords, (req, res) => {
    let jsonResponse = {
      message: res.locals.message,
      data: res.locals.data
    };
    res.json(jsonResponse);
  });
};

function getAllRecords(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    User.find({}, {"password": 0}, { sort: { username: 1 } })
    .exec((error, data) => {
      if (error) {
        res.locals.message = "There was a problem with retrieving the records.";
        res.locals.data = [];
      } else {
        res.locals.message = "The records were successfully retrieved.";
        res.locals.data = data;
      }
      return next();
    });
  } else {
    User.find({}, {"password": 0}, { sort: { username: 1 } })
    .populate("parentId")
    .exec((error, data) => {
      if (error) {
        res.locals.message = "There was a problem with retrieving the records.";
        res.locals.data = [];
      } else {
        res.locals.message = "The records were successfully retrieved.";
        res.locals.data = data;
      }
      return next();
    });    
  }  
}

function getRecordById(req, res, next) {
    User
    .findOne({'_id': req.params.recordId}, {"password": 0})
    .exec((error, data) => {
      if(error) {
        res.locals.message = "There was a problem with retrieving the record.";
        res.locals.error = error;
        res.locals.data = {};
        return next();
      } else {
        res.locals.message = "The record was successfully retrieved.";
        res.locals.data = data;
        return next();
      }
    });
}

function validateSignupForm(payload) {
  const errors = {};
  let isFormValid = true;
  let message = '';

  if (!payload || typeof payload.username !== 'string' || payload.username.trim().length === 0) {
    isFormValid = false;
    errors.username = 'Please provide your username.';
  }

  if (!payload || typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    isFormValid = false;
    errors.name = 'Please provide your name.';
  }

  if (!payload || typeof payload.email !== 'string' || payload.email.trim().length === 0) {
    isFormValid = false;
    errors.email = 'Please provide your email.';
  }

  if (!payload || typeof payload.password !== 'string' || payload.password.trim().length < 8) {
    isFormValid = false;
    errors.password = 'Password must have at least 8 characters.';
  }

  if (!isFormValid) {
    message = 'Check the form for errors.';
  }

  return {
    success: isFormValid,
    message,
    errors
  };
}