const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleWare
app.use(cors())
app.use(express.json())

// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)





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


    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })

    // middleWare
    const verifyToken = (req, res, next) => {
      console.log('from verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized user' });
      }

      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized user' });
        }
        req.decoded = decoded;
        next();
      });
    };


    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;

      const query = { email: email }
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden user' })
      }
      next()
    }


    app.get('/services', async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.post('/services', verifyToken, verifyAdmin, async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service)
      res.send(result)
    })

    // get specific id data
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result)
    })

    app.delete('/services/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    })

    app.patch('/services/:id', async (req, res) => {
      const service = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          title: service.title,
          description: service.description,
          cost: service.cost,
          availableDate: service.availableDate,
          discount: service.discount,
          image: service.image,
          slots: service.slots
        }
      }

      const result = await servicesCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.get('/doctors', async (req, res) => {
      const cursor = doctorsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.post('/doctors', verifyToken, verifyAdmin, async (req, res) => {
      const doctor = req.body;
      const result = await doctorsCollection.insertOne(doctor)
      res.send(result)
    })

    app.get('/doctors/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await doctorsCollection.findOne(query);
      res.send(result)
    })

    app.patch('/doctors/:id', async (req, res) => {
      const doctor = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          name: doctor.name,
            specialization: doctor.specialization,
            qualification: doctor.qualification,
            visit_fee: doctor.visit_fee,
            image: doctor.image,
            details: doctor.details,
            schedule: doctor.schedule
        }
      }

      const result = await doctorsCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.delete('/doctors/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await doctorsCollection.deleteOne(query);
      res.send(result);
    })



    // appointment collection

    app.get('/appointment', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await appointmentCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/appointment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
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

    app.delete('/tests/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await testCollection.deleteMany(query)
      res.send(result)
    })

    app.post('/tests', async (req, res) => {
      const bookedTests = req.body
      const result = await testCollection.insertOne(bookedTests);
      res.send(result)
    })




    // user related api

    app.get('/users', verifyToken,  async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // check email already exist or not. (need this for social login/registration)
      const query = { email: user.email }
      const existUser = await userCollection.findOne(query)
      if (existUser) {
        return res.send({ message: 'user already registered', insertedId: null })
      }

      const result = await userCollection.insertOne(user);
      res.send(result)
    })




    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;

        if (email !== req.decoded.email) {
          return res.status(403).send({ message: 'forbidden access' });
        }

        const query = { email: email }
        const user = await userCollection.findOne(query);

        if (user) {
          admin = user?.role === 'admin';
        }

        res.send({ admin });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    // app.get('/user/:email', async(req, res)=>{
    //   const email = req.params.email;
    //   const query = {email: email}
    //   const result = await userCollection.findOne(query)
    //   res.send(result);
    // })


    app.delete('/users/:id', verifyToken,  async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    app.patch('/users/admin/:id',verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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