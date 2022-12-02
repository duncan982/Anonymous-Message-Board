const MongoClient = require("mongodb").MongoClient,
  ObjectId = require("mongodb").ObjectID,
  mongoUri = process.env.MONGO_URI,
  flagObj = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  database = "anonymous-message-board-vaz1r";
const generalFunctions = require("./generalFunctions.js");
const checkId = generalFunctions.checkId;
const stampToJSON = generalFunctions.stampToJSON;

async function createReply(req, response) {
  const board = req.params.board;
  const thread_id = req.body.thread_id;
  const error = checkId(thread_id);
  if (error) return response.send(error);
  const select = {
    _id: new ObjectId(req.body.thread_id),
  };
  const newReply = {
    $push: {
      replies: {
        _id: new ObjectId(),
        text: req.body.text,
        created_on: Date.now(),
        reported: false,
        delete_password: req.body.delete_password,
      },
    },
  };

  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    dbo.collection(board).updateOne(select, newReply, (error, result) => {
      if (error) throw error;
      response.redirect(`/b/${board}/${thread_id}`);
      db.close();
    });
  });
}

async function reportReply(req, response) {
  const board = req.params.board;
  const thread_id = req.body.thread_id;
  const reply_id = req.body.reply_id;
  const threadError = checkId(thread_id);
  const replyError = checkId(reply_id);
  let error = "";
  if (!board) error += "board requierd ";
  if (threadError) error += ` thread_id error: ${threadError} `;
  if (replyError) error += ` reply_id error: ${replyError} `;
  if (error) return response.send(error);
  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    const select = {
      _id: new ObjectId(thread_id),
      "replies._id": new ObjectId(reply_id),
    };
    const modify = {
      $set: {
        "replies.$.reported": true,
      },
    };
    dbo.collection(board).updateOne(select, modify, (error, result) => {
      if (error) throw error;
      if (result.matchedCount && result.modifiedCount) {
        response.send("reported");
      } else if (result.matchedCount) {
        response.send(`This reply already reported: ${reply_id}`);
      } else response.send("Reply not found.");
      db.close();
    });
  });
}

async function deleteReply(req, response) {
  const board = req.params.board;
  const thread_id = req.body.thread_id;
  const reply_id = req.body.reply_id;
  const delete_password = req.body.delete_password;
  const threadError = checkId(thread_id);
  const replyError = checkId(reply_id);
  let error = "";
  if (!board) error += "board requierd ";
  if (threadError) error += ` thread_id error: ${threadError} `;
  if (replyError) error += ` reply_id error: ${replyError} `;
  if (error) return response.send(error);
  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    const select = {
      _id: new ObjectId(thread_id),
      replies: {
        $elemMatch: {
          _id: new ObjectId(reply_id),
          delete_password: delete_password,
        },
      },
    };
    const modify = {
      $set: {
        "replies.$.text": "[deleted]",
      },
    };
    console.log(req.body);
    dbo.collection(board).updateOne(select, modify, (error, result) => {
      if (error) throw error;
      if (result.matchedCount && result.modifiedCount) {
        response.send("success");
      } else response.send("incorrect password");
      db.close();
    });
  });
}

async function showAllReplies(req, response) {
  const board = req.params.board;
  const thread_id = req.query.thread_id;
  const error = checkId(thread_id);
  if (error) return response.send(error);
  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    const query = { _id: new ObjectId(thread_id) };
    const projection = {
      projection: {
        reported: 0,
        delete_password: 0,
        "replies.reported": 0,
        "replies.delete_password": 0,
      },
    };
    dbo.collection(board).findOne(query, projection, (error, result) => {
      if (error) throw error;
      if (result) {
        result.created_on = stampToJSON(result.created_on);
        result.replies.forEach((reply) => {
          reply.created_on = stampToJSON(reply.created_on);
        });
        response.json(result);
      } else response.send(`${thread_id} ID not found`);
      db.close();
    });
  });
}

const replyHandler = {
  createReply: createReply,
  reportReply: reportReply,
  deleteReply: deleteReply,
  showAllReplies: showAllReplies,
};

module.exports = replyHandler;
