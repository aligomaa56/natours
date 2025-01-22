const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const { app } = require('./app');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds


const DB = process.env.DATABASE_URL;
const DB_OPTIONS = {
  autoIndex: process.env.NODE_ENV === 'development',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
};

let server = null;
let retryCount = 0;

const connectWithRetry = async () => {
  try {
    console.log(`Attempting database connection (attempt ${retryCount + 1})...`);
    await mongoose.connect(DB, DB_OPTIONS);
    console.log('Database connection established');
    
    mongoose.connection.on('connected', () => 
      console.log('Mongoose connection re-established'));
      
    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose connection lost. Attempting reconnect...');
      connectWithRetry();
    });

  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.warn(`Connection failed. Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry();
    }
    console.error('Maximum connection retries reached. Shutting down...');
    throw err;
  }
};

const startServer = async () => {
  try {
    await connectWithRetry();
    
    server = app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      gracefulShutdown('SERVER_ERROR');
    });

  } catch (err) {
    console.error('🔥 Critical startup failure:', err);
    process.exit(1);
  }
};

const gracefulShutdown = async (reason) => {
  console.log(`\n${reason} received. Initiating shutdown...`);
  
  try {
    if (server) {
      await server.close();
      console.log('HTTP server closed');
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Database connection closed');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Shutdown error:', err);
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => gracefulShutdown(signal));
});

startServer();