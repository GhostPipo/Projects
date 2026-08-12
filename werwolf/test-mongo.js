const mongoose = require('mongoose');

async function test() {
  try {
    console.log('Connecting...');
    await mongoose.connect('mongodb+srv://philippcrista_db_user:Drachenlord18@cluster0.llcjjej.mongodb.net/werwolf?appName=Cluster0', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

test();
