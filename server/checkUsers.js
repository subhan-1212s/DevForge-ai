const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

async function check() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://mohamedsubhan155:SUBHAN1212S@auction-ai.yqevviv.mongodb.net/devforge-ai?appName=auction-ai';
    await mongoose.connect(mongoUri);
    const users = await User.find({}, 'name email createdAt');
    console.log('Registered Users in DB:');
    console.log(users);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
