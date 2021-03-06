var express     = require('express')
, app           = express()
, db            = require('./config/database')
, secret        = require('./config/secret').secret
, expressWs     = require('express-ws')(app)
, bodyParser    = require('body-parser')
, morgan        = require('morgan')
, mongoose      = require('mongoose')
, passport      = require('passport')
, uploads       = require('./config/uploads').uploads
, user_routes   = require('./routes/user')
, basic_routes  = require('./routes/basic')
, jwt           = require('jwt-simple');

port = process.env.PORT || 8000;

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());

// check the API is up and running!
app.get('/', function(req, res) {
  res.send('Hello! The mindsprout api is up and running!');
});

// pass passport for configuration
require('./config/passport')(passport);


/*
//double check we have an ssl connection
function ensureSec(req, res, next) {
    if (req.headers['x-forwarded-proto'] == 'https') {
        return next();
    } else {
        console.log('NOT SSL PROTECTED! rejected connection.');
        res.redirect('https://' + req.headers.host + req.path);
    }
}

app.use(ensureSec);
*/




//authenticate all user routes with passport middleware, decode JWT to see
//which user it is and pass it to following routes as req.user
app.use('/user', passport.authenticate('jwt', {session:false}), user_routes.middleware);

//parse multipart/form-data
app.use('/user/upload', uploads);

//store info on site usage- log with ID if userRoute
app.use('/', basic_routes.engagementMiddleware);

// bundle our user routes
var userRoutes = express.Router();
app.use('/user', userRoutes);


//////////////////////////////generic routes (SSL but no token/verified user)

//landing page - authenticate (user home if authenticated, redirect to login)
app.post('/authenticate', basic_routes.postAuthenticate);

//register post
app.post('/register', basic_routes.postRegister);


///////////////////////////user routes (SSL and verified user, processed data)

//book list
userRoutes.get('/bookList', user_routes.getBookList);
userRoutes.post('/bookList', user_routes.postBookList);


/////////////////////////test user routes (return direct from DB for user)
/*
app.ws('/echo', function(ws, req) {
  ws.on('message', function(msg) {
    ws.send(msg);
  });
});
*/

//upload audio route and handle metadata
userRoutes.post('/upload', user_routes.postUpload);

//route to get all available raw audio analysis information for user
userRoutes.get('/metadata', user_routes.getMetadata);

//route to get all available audio analysis, by uploaded file, with recommendations
userRoutes.get('/data', user_routes.getRecordingData);

//route to get only info on latest recording, false if no data is available for latest recording
userRoutes.get('latest', user_routes.getLatestRecordingData);

//test authentication route
userRoutes.get('/test', function(req,res){
    console.log(req.user.email);
    res.json({here: 'you made it'});
});



// Start the server
app.listen(port);
console.log('Shaping young minds on port: ' + port);
