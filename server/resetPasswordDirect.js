const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

async function fixPasswords() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://mohamedsubhan155:SUBHAN1212S@auction-ai.yqevviv.mongodb.net/devforge-ai?appName=auction-ai';
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    // Hash plain text '123456' ONCE for direct collection update
    const singleHash = await bcrypt.hash('123456', 10);

    // Use updateMany directly to set the single hash without triggering Mongoose pre-save double-hashing
    await User.updateMany(
      { email: { $in: ['mohamedsubhan155@gmail.com', 'skg795223@gmail.com', 'sarah.dev@devforge.ai', 'marcus.qa@devforge.ai', 'elena.ai@devforge.ai', 'demo@devforge.ai'] } },
      { $set: { password: singleHash } }
    );

    console.log('Successfully set password to 123456 (single hashed).');

    // Test matchPassword method on mohamedsubhan155@gmail.com
    const testUser = await User.findOne({ email: 'mohamedsubhan155@gmail.com' }).select('+password');
    const isMatch = await testUser.matchPassword('123456');
    console.log('Password match test for mohamedsubhan155@gmail.com with 123456:', isMatch ? 'PASSED ✅' : 'FAILED ❌');

    const testUser2 = await User.findOne({ email: 'skg795223@gmail.com' }).select('+password');
    const isMatch2 = await testUser2.matchPassword('123456');
    console.log('Password match test for skg795223@gmail.com with 123456:', isMatch2 ? 'PASSED ✅' : 'FAILED ❌');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixPasswords();
