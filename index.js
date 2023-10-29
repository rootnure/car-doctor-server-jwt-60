const express = require('express');
const app = express();
const jwt = require('jsonwebtoken'); // to generate token
const cookieParser = require('cookie-parser'); // to view (visible format) token
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({ /* cors settings for token */
    origin: ['http://localhost:5173', 'http://localhost:5174'], // use from different origin (from server site)
    credentials: true // send permission of cookies to client side
}));
app.use(express.json());
app.use(cookieParser()); // using cookie-parse middleware

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3al0nc5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middleware (custom)
const logger = async (req, res, next) => {
    console.log('called', req.host, req.originalUrl);
    next();
}

// const verifyToken = async (req, res, next) => {
//     const token = req.cookies?.token;
//     console.log('verify token from middleware', token);
//     if (!token) { // checking if any token exists
//         return res.status(401).send({ message: 'Unauthorized' });
//     }
//     jwt.verify(token, process.env.CAR_DOCTOR_TOKEN_SECRET, (err, decoded) => {
//         // error
//         if (err) { // checking if any error (invalid token, expired token etc.) occur while decoding token
//             console.log(err);
//             return res.status(401).send({ message: 'Unauthorized' })
//         }
//         // if token is valid then it would be decoded
//         console.log('value in the token', decoded);
//         req.user = decoded; // token is valid and set to req
//         next(); // proceed for further functionalities
//     })
// }

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized' });
    }
    jwt.verify(token, process.env.CAR_DOCTOR_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services');
        const bookingsCollection = client.db('carDoctor').collection('bookings');

        // auth related api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(
                user, // PayLoad
                process.env.CAR_DOCTOR_TOKEN_SECRET, // secret
                { expiresIn: '1h' } // expiration info
            )

            res
                .cookie(
                    'token', // token name
                    token, // actual token
                    /* options */
                    {
                        httpOnly: true, // prevents client-side scripts from accessing data
                        secure: false // if website is https then use true
                    }
                )
                .send({ success: true }) // acknowledgement from server for client
        })

        // services related api
        app.get('/services', logger, async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray()
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };

            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })

        // bookings
        app.post('/booking', logger, async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        app.get('/bookings', logger, verifyToken, async (req, res) => {
            console.log(req.query.email);
            // console.log('token', req.cookies.token);
            console.log('from valid token', req.user);
            if (req.user.email !== req.query.email) { // check if token email & user email different
                return res.status(403).send({ message: 'Forbidden' })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        })

        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const updatedBooking = req.body;
            const filter = { _id: new ObjectId(id) }
            const modifiedData = {
                $set: {
                    ...updatedBooking
                }
            }
            const result = await bookingsCollection.updateOne(filter, modifiedData);
            // console.log(updatedBooking);
            res.send(result);
        })

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })


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
    res.send({ msg: 'Car Doctor server is online...' })
})

app.listen(port, () => {
    console.log(`Car Doctor server is running on port: ${port}`);
})