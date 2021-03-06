var express = require('express')
var morgan = require('morgan')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')

var ejs = require('ejs')
var engine = require('ejs-mate')

var session = require('express-session')
var cookieParser = require('cookie-parser')
var flash = require('express-flash')

var MongoStore = require('connect-mongo')(session)

var passport = require('passport')

var secret = require('./config/secret')
var User = require('./models/user')
var Category = require('./models/category')

var cartLength = require('./middlewares/middlewares')

var app = express()

mongoose.connect(secret.database)

app.use(express.static(__dirname + '/public'))
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: secret.secretKey,
	store: new MongoStore({
		url: secret.database,
		autoReconnect: true
	})
}))
app.use(flash())
app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.use(passport.initialize())
app.use(passport.session())
app.use(function(req, res, next) {
	res.locals.user = req.user
	next()
})

app.use(cartLength)

app.use(function(req, res, next) {
	Category.find({}, function(err, categories) {
		if (err) return next(err)
		res.locals.categories = categories
		next()
	})
})

var mainRoutes = require('./routes/main')
app.use(mainRoutes)

var userRoutes = require('./routes/user')
app.use(userRoutes)

var adminRoutes = require('./routes/admin')
app.use(adminRoutes)

var settingsRoutes = require('./routes/settings')
app.use('/settings', settingsRoutes)

var searchRoutes = require('./routes/search')
app.use('/instant', searchRoutes)

var apiRoutes = require('./api/api')
app.use('/api', apiRoutes)

app.use(function (req, res, next) {
	res.status(400)
	res.render('error', {
		error: '404: File Not Found'
	})
})

app.use(function (err, req, res, next) {
	res.status(500)
	res.render('error', {
		error: '500: Internal Server Error'
	})
})

app.listen(secret.port, function() {
	console.log('Node.js listening on port ' + secret.port)
})
