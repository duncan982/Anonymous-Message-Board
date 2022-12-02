/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
const threadHanler = require("../controllers/threadHandler.js");
const replyHandler = require("../controllers/replyHandler.js");

module.exports = function (app) {
  app
    .route("/api/threads/:board")
    .post(threadHanler.createThread)
    .get(threadHanler.listThread)
    .put(threadHanler.reportThread)
    .delete(threadHanler.deleteThread);

  app
    .route("/api/replies/:board")
    .post(replyHandler.createReply)
    .put(replyHandler.reportReply)
    .delete(replyHandler.deleteReply)
    .get(replyHandler.showAllReplies);
};
