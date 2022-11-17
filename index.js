const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());
require("dotenv").config();

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nxaiqcz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function dbConnect() {
  try {
    client.connect();
    console.log("database is connected");
  } catch (error) {
    console.log(`databse cannot connected for ${error} `);
  }
}
dbConnect();

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const Services = client.db("VisaConsultant").collection("services");
const Reviews = client.db("VisaConsultant").collection("reviews");

//jwt
app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
  res.send({ token });
});

//for post service
app.post("/services", async (req, res) => {
  try {
    const result = await Services.insertOne(req.body);

    if (result.insertedId) {
      res.send({
        success: true,
        message: `Successfully created the ${req.body.name} with id ${result.insertedId}`,
      });
    } else {
      res.send({
        success: false,
        error: "Couldn't create the service",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//for display services
app.get("/services", async (req, res) => {
  try {
    const cursor = Services.find({}).sort({ date: -1 });
    const products = await cursor.toArray();

    res.send({
      success: true,
      message: "Successfully got the data",
      data: products,
    });
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//for service details Page
app.get("/service/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Services.findOne({ _id: ObjectId(id) });

    res.send({
      success: true,
      data: product,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//insert review data
app.post("/post-review", async (req, res) => {
  try {
    const result = await Reviews.insertOne(req.body);

    if (result.insertedId) {
      res.send({
        success: true,
        message: `Successfully created the ${req.body.user_name} with id ${result.insertedId}`,
      });
    } else {
      res.send({
        success: false,
        error: "Couldn't create the review",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

// display reviews
app.get("/review/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const cursor = Reviews.find({ service_id: id }).sort({ date: -1 });
    const reviews = await cursor.toArray();

    res.send({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//display my Reviews
app.get("/myreviews", verifyJWT, async (req, res) => {
  try {
    const decoded = req.decoded;
    // console.log("inside my review api", decoded);
    if (decoded.email !== req.query.email) {
      res.status(403).send({ message: "unauthorized access" });
    }
    let query = {};
    if (req.query.email) {
      query = {
        email: req.query.email,
      };
    }
    const cursor = Reviews.find(query);
    const reviews = await cursor.toArray();

    res.send({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//review delete
app.delete("/reviewdelete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Reviews.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount) {
      res.send({
        success: true,
        message: `Successfully deleted`,
      });
    } else {
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//edit review
app.get("/mreview/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cursor = Reviews.find({ _id: ObjectId(id) });
    const reviews = await cursor.toArray();

    res.send({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.patch("/review-edit/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Reviews.updateOne(
      { _id: ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount) {
      res.send({
        success: true,
        message: `successfully updated ${req.body.name}`,
      });
    } else {
      res.send({
        success: false,
        error: "Couldn't update  the product",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("server is running");
});
app.listen(port, () => {
  console.log(`asign11 is running on  : ${port}`);
});
