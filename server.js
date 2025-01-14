const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});


dotenv.config({ path: './.env' });
const { app } = require('./app');

const DB = process.env.DATABASE_URL;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB Connection Successful');
  });

  
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on http://localhost:3000');
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION!💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully. 😶‍🌫️');
  server.close(() => {
    console.log('Process terminated! 💥');
  });
});