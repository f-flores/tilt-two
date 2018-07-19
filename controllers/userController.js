// require("../models");
// const bcrypt = require("bcrypt");
const Users = require("../models/Users");

// Minimum username length
const UnameMinLength = 2;

// Maximum username length
const UnameMaxLength = 10;

// Minimum password length
const MinPasswordLength = 6;

// Defining database methods for the Tilt's User table
module.exports = {
  findAll: function (req, res) {
    Users
      .find(req.query)
      .sort({ date: -1 })
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },

  create: function (req, res) {
    let isValidEntry = true;
    let errorText = "";

    // -----------------------------------------------------------------------
    // validateEmail() checks if an email is valid
    // source code for regular expression:
    // https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript/1373724#1373724
    //
    function validateEmail(email) {
      var re = /^(?:[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

      return re.test(email);
    }

    // backend validation
    // validate username
    if (req.body.username.length < UnameMinLength || 
      req.body.username.length > UnameMaxLength) {
      isValidEntry = false;
      errorText += `Username must be between ${UnameMinLength} and ${UnameMaxLength} characters.\n`;
    }

    // validate email
    if (!validateEmail(req.body.email)) {
      isValidEntry = false;
      errorText += `Invalid email.\n`;
    }

    // validate password
    if (req.body.password.length < MinPasswordLength) {
      isValidEntry = false;
      errorText += `Password must be at least ${MinPasswordLength} characters long.\n`;
    }

    // validate password match
    if (req.body.password !== req.body.pswrdConfirmation) {
      isValidEntry = false;
      errorText += `Password and confirmation do not match.\n`;
    }

    if (isValidEntry) {
      let userData = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
      }
      //use schema.create to insert data into the db 
      Users
        .create(userData, function (err, user) {
          if (err) {console.log(err); res.status(404).send("Username/email exists already.");}

          // Left Hand Side Comes From Sessions and Is Mapped To Our User Table
          req.session.userId = user._id;
          req.session.username = user.username;
          req.session.userType = user.userType;
          req.session.email = user.email;
          res.json({
            isLoggedIn: true,
            userId: req.session.userId,
            username: req.session.username,
            email: req.session.email
          });          
        });
    }
    else {
      res.status(404).send(errorText);
    }
  },

  findOne: function(req, res) {
    if (req.body.username && req.body.password) {
      Users
        .authenticate(req.body.username, req.body.password, function (err, user) {
          if (err) {
            console.log(err);
            res.status(404).send("Incorrect username/password");
          } 
          
          if (!user) {
            res.status(404).send("Incorrect username/password");
          } else {
            req.session.userId = user._id;
            req.session.username = user.username;
            req.session.email = user.email;
            res.json({
              isLoggedIn: true,
              userId: req.session.userId,
              username: req.session.username,
              email: req.session.email
            });
          }
        });
    }
    else {
      res.status(404).send("Incorrect username/password");
    }
  },

  findById: function (req, res) {
    // console.log(`req.session.userId: ${req.session.userId}`);
    // console.log("req.session: ", JSON.stringify(req.session));
    Users
      .findById(req.session.userId)
      .then(dbModel => {
        // if user was not found send back false
        if (!dbModel) return res.status(404).json({isLoggedIn: false});
        // console.log("dbModel in findById: " + dbModel);

        // means user is signed in already send back true
        // session: req.session
        res.json({
          isLoggedIn: true,
          session: req.session,
          userId: req.session.userId,
          username: req.session.username,
          email: req.session.email
        });
      })
      .catch(err => res.json({isLoggedIn: false, err: err}));
  },

  isAdmin: function (req, res) {
    Users
      .findById(req.session.userId)
      .then(dbModel => {
        // if user was not found send back false, status 404 not found
        if (!dbModel) return res.status(404).json({isAdmin: false});

        // check if active session user is an administrator
        if (dbModel.userType === "admin")
          res.json({isAdmin: true});
        else if (dbModel.userType === "user")
          res.json({isAdmin: false});
        else 
          // user not of recognized type, possible db breach
          res.status(422).end();
      })
      .catch(err => res.json({isAdmin: false, err: err}));
  },

  update: function (req, res) {
    Users
      .findOneAndUpdate({ _id: req.params.id }, req.body)
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  },

  remove: function (req, res) {
    Users
      .findById({ _id: req.params.id })
      .then(dbModel => dbModel.remove())
      .then(dbModel => res.json(dbModel))
      .catch(err => res.status(422).json(err));
  } 

};