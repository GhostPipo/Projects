require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const START_PORT = Number(process.env.PORT) || 3001;

async function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    console.error('Server start failed', err);
    process.exit(1);
  });
}

async function bootstrap() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    startServer(START_PORT);
  } catch (error) {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  }
}

bootstrap();
