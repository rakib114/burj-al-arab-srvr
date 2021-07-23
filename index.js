const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
require('dotenv').config()
// console.log(process.env.DB_PASS);

const port = 5000;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

var serviceAccount = require("./config/burj-al-arab-c3a82-firebase-adminsdk-khykm-a62d458446.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


const { MongoClient } = require("mongodb");
const uri =
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.irvi8.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
client.connect((err) => {
    const bookingsCollection = client.db("burjAlArab").collection("bookings");

    app.post("/addBooking", (req, res) => {
        const newBooking = req.body;
        bookingsCollection.insertOne(newBooking).then((result) => {
            res.send((result.acknowledged = true));
        });
        console.log(newBooking);
    });
    app.get("/bookings", (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith("Bearer")) {
            const idToken = bearer.split(" ")[1];
            // console.log({ idToken });
            // idToken comes from the client app
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    if (tokenEmail == req.query.email) {
                        bookingsCollection
                            .find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents);
                            });
                    } else {
                        res.statusCode(401).send("UnAuthorized access");
                    }
                })
                .catch((error) => {
                    res.statusCode(401).send("UnAuthorized access");
                });
        } else {
            res.statusCode(401).send("UnAuthorized access");
        }
    });
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port);
