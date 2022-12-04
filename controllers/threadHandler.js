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

async function createThread(req, res) {
  const board = req.params.board;
  const thread = {
    text: req.body.text,
    created_on: Date.now(),
    bumped_on: Date.now(),
    reported: false,
    delete_password: req.body.delete_password,
    replies: [],
  };
  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    dbo.collection(board).insertOne(thread, (error, result) => {
      if (error) throw error;
      res.redirect(`/b/${board}/`);
      // db.close();
    });
  });
}

async function listThread(req, res) {
  const board = req.params.board;
  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    const projection = {
      projection: {
        reported: 0,
        delete_password: 0,
        "replies.reported": 0,
        "replies.delete_password": 0,
      },
    };
    const shortObj = {
      bumped_on: -1,
    };
    dbo
      .collection(board)
      .find({}, projection)
      .sort(shortObj)
      .limit(10)
      .toArray((error, result) => {
        if (error) throw error;
        result.forEach((documents) => {
          documents.replycount = documents.replies.length;
          if (documents.replies.length > 3) {
            documents.replies = documents.replies.slice(-3);
          }
          if (documents.replycount) {
            documents.replies.forEach((reply) => {
              reply.created_on = stampToJSON(reply.created_on);
            });
          }
          documents.created_on = stampToJSON(documents.created_on);
          documents.bumped_on = stampToJSON(documents.bumped_on);
        });
        res.json(result);
        // db.close();
      });
  });
}

async function reportThread(req, response) {
  const board = req.params.board;
  const thread_id = req.body.thread_id;
  const error = checkId(thread_id);
  if (error) return response.send(error);
  const selectDocument = {
    _id: new ObjectId(thread_id),
  };
  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    const modifyObj = [
      selectDocument,
      {
        // update the fields in the selected document
        $set: { reported: true },
      },
    ];
    dbo.collection(board).findOneAndUpdate(...modifyObj, (error, result) => {
      if (error)
        return response.send(`could not reported ${thread_id} ${error}`);
      if (result.lastErrorObject.updatedExisting) {
        return response.send(`reported`);
      }
      return response.send(`could not update: invalid id: ${thread_id}`);
    });
    // db.close();
  });
}

async function deleteThread(req, response) {
  const board = req.params.board;
  const thread_id = req.body.thread_id;
  const error = checkId(thread_id);
  if (error) return response.send(error);
  const delete_password = req.body.delete_password;
  await MongoClient.connect(mongoUri, flagObj, (error, db) => {
    if (error) throw error;
    const dbo = db.db(database);
    const query = {
      _id: new ObjectId(thread_id),
      delete_password: delete_password,
    };
    dbo.collection(board).findOneAndDelete(query, (error, result) => {
      if (error) throw error;
      if (result.value) return response.send(`success`);
      response.send(`incorrect password`);
    });
    // db.close();
  });
}

const threadHandler = {
  createThread: createThread,
  listThread: listThread,
  reportThread: reportThread,
  deleteThread: deleteThread,
};

module.exports = threadHandler;
