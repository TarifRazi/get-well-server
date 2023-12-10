const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleWare
app.use(cors())
app.use(express.json())

console.log(process.env.DB_USER)
console.log(process.env.DB_PASS)





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s33xtra.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const userCollection = client.db("get-well").collection("users");
    const servicesCollection = client.db("get-well").collection("services");
    const doctorsCollection = client.db("get-well").collection("doctors");
    const appointmentCollection = client.db("get-well").collection("appointment");
    const testCollection = client.db("get-well").collection("tests");


    app.get('/services', async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // get specific id data
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result)
    })

    app.get('/doctors', async (req, res) => {
      const cursor = doctorsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })



    // appointment collection

    app.get('/appointment', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await appointmentCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/appointment/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await appointmentCollection.deleteMany(query)
      res.send(result)
    })

    app.post('/appointment', async (req, res) => {
      const appointmentDoctor = req.body
      const result = await appointmentCollection.insertOne(appointmentDoctor)
      res.send(result)
    })

    // tests collections

    app.get('/tests', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await testCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/tests/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await testCollection.deleteMany(query)
      res.send(result)
    })

    app.post('/tests', async (req, res) => {
      const bookedTests = req.body
      const result = await testCollection.insertOne(bookedTests);
      res.send(result)
    })


    // user related api

    app.post('/users', async(req, res)=>{
      const user = req.body;
      // check email already exist or not. (need this for social login/registration)
      const query = {email:user.email}
      const existUser = await userCollection.findOne(query)
      if (existUser) {
        return res.send({message:'user already registered', insertedId:null})
      }

      const result = await userCollection.insertOne(user);
      res.send(result)
    })

    app.get('/users', async(req, res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })


    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('get well server is running')
})

app.listen(port, () => {
  console.log(`get well running on port ${port}`)
})