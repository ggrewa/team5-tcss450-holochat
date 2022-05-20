const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;

const validation = require("../utilities").validation;
const isStringProvided = validation.isStringProvided;

/**
 * @api {get} /contacts Request to get all contacts the user has a connection to
 * @apiName GetContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {String} email the email of the current user
 * @apiSuccess {Object[]} contacts the ids, names and email of each connected user
 *
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
 router.get("/", (req, res, next) => {
  const query = "SELECT MemberId, username, email FROM members WHERE memberid IN (SELECT memberid_b FROM contacts WHERE memberid_a = $1);"
  const values = [req.decoded.memberid];
  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send({ 
        success: true, 
        email: req.decoded.email, 
        contacts: result.rows});
    })
    .catch((err) => {
      res.status(400).send({
        message: "SQL Error",
        error: err,
      });
    });
});

/**
 * @api {get} /contacts/search Request for a search of contacts based on input string. 
 * @apiName SearchContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 * 
 * @apiBody {String} search_string the string to search with. 
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {String} email the email of the current user
 * @apiSuccess {Object[]} contacts the ids, names, usernames and email of each connected user
 *
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
 router.get("/search", (req, res, next) => {
  const query = "SELECT MemberID, CONCAT(firstname,' ', lastname) AS first_last, username, email FROM members WHERE CONCAT(firstname, ' ', lastname) LIKE $1 OR username LIKE $1 OR email LIKE $1;";
  // const query = "SELECT MATCH (CONCAT (firstname, ' ', lastname), email) AGAINST ('%'+ $1 + '%') FROM members GROUP BY email WITH ROLLUP;";
  const values = ['%' + req.body.search_string.toLowerCase() + '%'];
  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send({ 
        success: true, 
        email: req.decoded.email, 
        contacts: result.rows});
    })
    .catch((err) => {
      res.status(400).send({
        message: "SQL Error",
        error: err,
      });
    });
});

/**
 * @api {post} /contacts/:memberid_b Request add a user as a contact
 * @apiName AddContact
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} memberid_b the id of the user to request a connection
 *
 * @apiSuccess {boolean} success true on successful SQL query
 *
 * @apiError (400: Malformed Parameter, Member ID_B Must Be A Number) {String} message "Malformed Parameter, Member ID_B Must Be A Number"
 * @apiError (400: User Already Exists As A Contact) {String} message "User Already Exists As A Contact"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: User Not Found) {String} message "User Not Found"
 */
 router.post(
  "/:memberid_b",

  // check that a valid memberid is given
  (req, res, next) => {
    if (!req.params.memberid_b) {
      res.status(400).send({
        message: "Missing Required Information",
      });
    } else if (isNaN(req.params.memberid_b)) {
      res.status(400).send({
        message: "Malformed Parameter, Memberid Must Be A Number",
      });
    } else {
      next();
    }
  },

  // check that user exists
  (req, res, next) => {
    const query = "select * from members where memberid = $1";
    const values = [req.params.memberid_b];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 0) {
          res.status(404).send({
            message: "User Not Found",
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error",
          error: error,
        });
      });
  },

  // check that user doesn't already exist in the chatroom
  (req, res, next) => {
    const query = "select * from contacts where memberid_b = $1 and memberid_a = $2";
    const values = [req.params.memberid_b, req.decoded.memberid];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount > 0) {
          res.status(400).send({
            message: "User Already Exists as a Contact",
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error",
          error: error,
        });
      });
  },



  // add member as a contact
  (req, res) => {
    const insert = "insert into contacts(memberid_a, memberid_b) values ($1, $2) returning *";
    const values = [req.decoded.memberid, req.params.memberid_b];

    pool
      .query(insert, values)
      .then((result) => {
        res.status(200).send({
          success: true,
        });
      })
      .catch((err) => {
        res.status(400).send({
          message: "SQL Error",
          error: err,
        });
      });
  }
);

/**
 * @api {delete} /contacts/:memberid_b Request to delete a user from contacts
 * @apiName DeleteUser
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} memberid_b the id of the user to delete from contacts
 *
 * @apiSuccess {boolean} success true on successful SQL query
 *
 * @apiError (400: Malformed Parameter, Member ID Must Be A Number) {String} message "Malformed Parameter, Member ID Must Be A Number"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: User Not a Contact) {String} message "User Not a Contact"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: User Not Found) {String} message "User Not Found"
 *
 */
 router.delete(
  "/:memberid_b",

  // check that a valid chatid and memberid are given, and that they are both numerical
  (req, res, next) => {
    if (!req.params.memberid_b) {
      res.status(400).send({
        message: "Missing Required Information",
      });
    } else if (isNaN(req.params.memberid_b)) {
      res.status(400).send({
        message: "Malformed Parameter, Member ID Must Be A Number",
      });
    } else {
      next();
    }
  },

  // check that member exists and convert email to memberid
  (req, res, next) => {
    const query = "select * from members where memberid = $1";
    const values = [req.params.memberid_b];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 0) {
          res.status(404).send({
            message: "User Not Found",
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error",
          error: error,
        });
      });
  },

  // check that member is actually a contact
  (req, res, next) => {
    const query = "select * from contacts where memberid_a = $1 and memberid_b = $2";
    const values = [req.decoded.memberid, req.params.memberid_b];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount > 0) {
          next();
        } else {
          res.status(400).send({
            message: "User Not a Contact",
          });
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error",
          error: error,
        });
      });
  },

  // delete member from the chat room
  (req, res) => {
    const query = "delete from contacts where memberid_a = $1 and memberid_b = $2 returning *";
    const values = [req.decoded.memberid, req.params.memberid_b];
    pool
      .query(query, values)
      .then((result) => {
        res.status(200).send({
          success: true,
        });
      })
      .catch((err) => {
        res.status(400).send({
          message: "SQL Error",
          error: err,
        });
      });
  }
);

module.exports = router;