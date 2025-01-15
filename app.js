const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const globalErrorHandler = require('./src/controllers/errorController');
const AppError = require('./src/utils/appError');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');


const viewRouter = require('./src/routes/viewRouters');
const userRouter = require('./src/routes/userRouters');
const dummyRouter = require('./src/routes/dummyRouters');
const reviewRouter = require('./src/routes/reviewRouters');
const bookingRouter = require('./src/routes/bookingRouters');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src/views'));


// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *
// app.use(cors({
//   origin: 'http://localhost:3000',
// }));

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());s

app.use(express.static(path.join(__dirname, 'src/public')));

// Set security HTTP headers
app.use(helmet());

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws://localhost:*; frame-src 'self' https://js.stripe.com;"
  );
  next();
});

app.use((req, res, next) => {
  if (req.url.endsWith('.map')) {
    return res.status(404).send('Source map not found');
  }
  next();
});

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: {status: 'fail',
    message: 'Too many requests from this IP, please try again in an hour'
  },
  keyGenerator: (req) => {
    // Use the first IP in the X-Forwarded-For header (if present)
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  },
});
app.use('/api', limiter);
// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

// Compress all text sent to clients
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});
// Routes
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/dummies', dummyRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Error handling
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})
// Error handling
app.use(globalErrorHandler)

exports.app = app;
