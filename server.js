"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var expect = require("chai").expect;
var cors = require("cors");

var apiRoutes = require("./routes/api.js");
var fccTestingRoutes = require("./routes/fcctesting.js");
var runner = require("./test-runner");

var app = express();

const helmet = require("helmet");
const MongoClient = require("mongodb/lib/mongo_client");

// app.use(
//   helmet({
//     frameguard: {
//       action: "sameorigin",
//     },
//     dnsPrefetchControl: {
//       allow: false,
//     },
//     referrerPolicy: {
//       policy: "same-origin",
//     },
//   })
// );

// app.use(helmet.frameguard({ action: "sameorigin" }));
// app.use(helmet.dnsPrefetchControl());
// app.use(helmet.referrerPolicy({ policy: "same-origin" }));

/** prevent various malicius attacks*/
app.use(
  helmet({
    referrerPolicy: { policy: "same-origin" },
  })
);

/** customise default helmet contentSecurityPolicy settings*/
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["https://swodts-3000.preview.csb.app/"],
      scriptSrc: ["'self'", "https://swodts-3000.preview.csb.app/"],
      styleSrc: ["'self'", "https://swodts-3000.preview.csb.app/"],
      connectSrc: ["'self'", "https://swodts-3000.preview.csb.app/"],
    },
  })
);
app.use("/public", express.static(process.cwd() + "/public"));

// const options = {
//   origin: ["*freecodecamp.org*", "https://swodts-3000.preview.csb.app/"],
// };
// app.use(cors(options));
app.use(cors({ origin: "*" })); //For FCC testing purposes only
// app.use(cors({ origin: "*freecodecamp.org*" })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route("/b/:board/").get(function (req, res) {
  res.sendFile(process.cwd() + "/views/board.html");
});
app.route("/b/:board/:threadid").get(function (req, res) {
  res.sendFile(process.cwd() + "/views/thread.html");
});

//Index page (static HTML)
app.route("/").get(function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// MongoClient.connect(process.env.MONGO_URI, {
//   useUnifiedTopology: true,
//   useNewUrlParser: true,
// })
//   .then((client) => {
//     const db = client.db("message-board");
//     const collection = db.collection("board_threads");
//     app.locals.db = db;
//     console.log("MongoDB is now connected");
//     console.log("the current database is: " + db.s.databaseName);
//   })
//   .catch((error) => {
//     console.log("MongoDB is not connected", error);
//   });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API
apiRoutes(app);

//Sample Front-end

//404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404).type("text").send("Not Found");
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if (process.env.NODE_ENV === "test") {
    console.log("Running Tests...");
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
        var error = e;
        console.log("Tests are not valid:");
        console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
