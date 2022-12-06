let createError = require('http-errors'),
    express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    favicon = require('serve-favicon'),
    rateLimit = require('express-rate-limit');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

global.globalController = require('./tools/controller');
global.globalRatelimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1,
    message: `Only one request per 5 minute(s) possible.`
});

let adminRouter = require('./routes/admin'),
    viewersRouter = require('./routes/viewers'),
    loginRouter = require('./routes/login'),
    app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

app.use('/admin', adminRouter);
app.use('/', viewersRouter);
app.use('/login', loginRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
