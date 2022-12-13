/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  const testText = Math.floor(Math.random() * 10000000);
  let testId; //_id of thread 1 created
  let testId2; //_id of thread 2 created
  let testId3; //_id of reply created

  suite("API ROUTING FOR /api/threads/:board", function () {
    suite("POST", function () {
      test("create 2 new threads(because we end up deleting 1 in the delete test)", (done) => {
        chai
          .request(server)
          .post("/api/threads/fcc")
          .send({ text: testText, delete_password: "pass" })
          .end((err, res) => {
            assert.equal(res.status, 200);
          });
        chai
          .request(server)
          .post("/api/threads/fcc")
          .send({ text: testText, delete_password: "pass" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", () => {
      test("most recent 10 threads with most recent 3 replies each", (done) => {
        chai
          .request(server)
          .get("/api/threads/fcc")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isBelow(res.body.length, 11);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "replies");
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "delete_password");
            assert.isArray(res.body[0].replies);
            assert.isBelow(res.body[0].replies.length, 4);
            testId = res.body[0]._id;
            testId2 = res.body[1]._id;
            done();
          });
      });
    });

    suite("DELETE", () => {
      test("delete thread with good password", (done) => {
        chai
          .request(server)
          .delete("/api/threads/fcc")
          .send({ thread_id: testId, delete_password: "pass" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });

      test("delete thread with bad password", (done) => {
        chai
          .request(server)
          .delete("/api/threads/fcc")
          .send({ thread_id: testId2, delete_password: "wrong" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });
    });

    suite("PUT", () => {
      test("report thread", (done) => {
        chai
          .request(server)
          .put("/api/threads/fcc")
          .send({ thread_id: testId2 })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "reported");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", () => {
    suite("POST", () => {
      test("reply to thread", (done) => {
        chai
          .request(server)
          .post("/api/replies/fcc")
          .send({
            thread_id: testId2,
            reply_id: testId2,
            text: "a reply" + testText,
            delete_password: "pass",
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", () => {
      test("Get all replies for 1 thread", (done) => {
        chai
          .request(server)
          .get("/api/replies/fcc")
          .query({ thread_id: testId2 })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "text");
            assert.property(res.body, "replies");
            assert.notProperty(res.body, "reported");
            assert.isArray(res.body.replies);
            assert.equal(
              res.body.replies[res.body.replies.length - 1].text,
              "a reply" + testText
            );
            done();
          });
      });
    });

    suite("PUT", () => {
      test("report reply", (done) => {
        chai
          .request(server)
          .put("/api/threads/fcc")
          .send({ thread_id: testId2, reply_id: testId2 })
          .end((err, res) => {
            // console.log("res.text:", res.text);
            assert.equal(res.status, 200);
            assert.equal(res.text, "reported");
            done();
          });
      });
    });

    suite("DELETE", () => {
      test("delete reply with bad password", (done) => {
        chai
          .request(server)
          .delete("/api/threads/fcc")
          .send({
            thread_id: testId2,
            reply_id: testId3,
            delete_password: "wrong",
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("delete reply with valid password", (done) => {
        chai
          .request(server)
          .delete("/api/threads/fcc")
          .send({
            thread_id: testId2,
            reply_id: testId3,
            delete_password: "pass",
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });
});
