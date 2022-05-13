require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const expressLayouts = require('express-ejs-layouts')
const path = require('path')
const port = process.env.PORT || 3000
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDBStore = require('connect-mongo')
const passport = require('passport')
const Emitter = require('events')

// COnnect to MongoDB
mongoose.connect('mongodb://localhost:27017/pizza', { useNewUrlParser: true })

// Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

// Session config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoDBStore.create({
        // mongoURL: 'mongodb://localhost:27017/pizza', // process.env.MONGO_CONNECTION_URL
        client: mongoose.connection.getClient()
    }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))

// const FirebaseStore = require('connect-session-firebase')(session);
// const firebase = require('firebase-admin');
// const ref = firebase.initializeApp({
//   credential: firebase.credential.cert('seeds.json'),
//   databaseURL: 'https://seeds-d5092-default-rtdb.firebaseio.com/'
// });

// app.use(session({
//     store: new FirebaseStore({
//       database: ref.database()
//     }),
//     secret: process.env.COOKIE_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { maxAge: 1000 * 60 * 60 * 24 }
// }))

// Passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

// Assets
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: false })) // if true you can receive nested objects
app.use(express.json())

// Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    app.locals.user = req.user
    next()
})

// set template engine
app.use(expressLayouts)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

require('./routes/web')(app)

app.use((req, res) => {
    res.status(404).render('errors/404')
})

const server = app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`)
})

const io = require('socket.io')(server)
io.on('connection', (socket) => {
    // Join
    socket.on('join', (orderId) => {
        socket.join(orderId)
    })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})