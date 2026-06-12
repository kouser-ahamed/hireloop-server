const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion,ObjectId } = require("mongodb");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//Start Here Import the MongoClient class from the mongodb package

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db(process.env.DATABASE_NAME);
    const jobCollection = database.collection("jobs");
    const companyCollection = database.collection("companies");

    // job get api Recruter can see all jobs, but a candidate can only see active jobs
    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyID) {
        query.companyID = req.query.companyID;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // job post api Recruter can post a job
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });

    //companay related api

    // // Recruter can see her all added comapnaies
    //   app.get("/api/my/companies", async (req, res) => {
    //       const query = {};
    //       if(req.query.recruiterId){
    //           query.recruiterID = req.query.recruiterId;
    //       }
    //       const result = await companyCollection.findOne(query);
    //       res.send(result);
    //   })

    app.get("/api/my/companies", async (req, res) => {
      try {
        const recruiterId = req.query.recruiterId;

        if (!recruiterId) {
          return res.status(400).json({
            message: "recruiterId is required",
          });
        }

        const result = await companyCollection.findOne({
          recruiterId: recruiterId,
        });

        return res.json(result || null);
      } catch (error) {
        console.error("Get recruiter company error:", error);

        return res.status(500).json({
          message: "Failed to get recruiter company",
        });
      }
    });


    app.patch("/api/companies/:id", async (req, res) => {
  const id = req.params.id;
  const updatedCompany = req.body;
  delete updatedCompany._id;
  const result = await companyCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updatedCompany, updatedAt: new Date() } }
  );
  res.json(result);
});

    // Recruter can add a company
    app.post("/api/companies", async (req, res) => {
      const company = req.body;
      const result = await companyCollection.insertOne(company);
      res.send(result);
    });





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// End Here

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
