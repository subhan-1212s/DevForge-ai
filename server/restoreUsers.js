const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Workspace = require('./models/Workspace');

async function restore() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://mohamedsubhan155:SUBHAN1212S@auction-ai.yqevviv.mongodb.net/devforge-ai?appName=auction-ai';
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Restore/Create mohamedsubhan155@gmail.com
    let user1 = await User.findOne({ email: 'mohamedsubhan155@gmail.com' });
    if (!user1) {
      user1 = await User.create({
        name: 'Mohamed Subhan',
        email: 'mohamedsubhan155@gmail.com',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
      });
      console.log('Restored user: mohamedsubhan155@gmail.com');
    } else {
      user1.password = hashedPassword;
      await user1.save();
      console.log('Updated user password: mohamedsubhan155@gmail.com');
    }

    // 2. Restore/Create skg795223@gmail.com
    let user2 = await User.findOne({ email: 'skg795223@gmail.com' });
    if (!user2) {
      user2 = await User.create({
        name: 'SKG Admin',
        email: 'skg795223@gmail.com',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
      });
      console.log('Restored user: skg795223@gmail.com');
    } else {
      user2.password = hashedPassword;
      await user2.save();
      console.log('Updated user password: skg795223@gmail.com');
    }

    // Attach Demo Workspace to both accounts as Owner 👑
    const demoWs = await Workspace.findOne({ inviteCode: 'DEVFORGE' });
    if (demoWs) {
      [user1, user2].forEach(u => {
        const isMember = demoWs.members.some(m => m.user.toString() === u._id.toString());
        if (!isMember) {
          demoWs.members.push({ user: u._id, role: 'owner' });
        } else {
          const mem = demoWs.members.find(m => m.user.toString() === u._id.toString());
          if (mem) mem.role = 'owner';
        }
      });

      await demoWs.save();

      await User.updateMany(
        { _id: { $in: [user1._id, user2._id] } },
        { $addToSet: { workspaces: demoWs._id } }
      );
      console.log('Attached demo workspace to both accounts as Owner.');
    }

    console.log('\n======================================================');
    console.log('✅ ACCOUNTS RESTORED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Account 1:');
    console.log('  Email:    mohamedsubhan155@gmail.com');
    console.log('  Password: Password123!');
    console.log('  Role:     Workspace Owner 👑');
    console.log('Account 2:');
    console.log('  Email:    skg795223@gmail.com');
    console.log('  Password: Password123!');
    console.log('  Role:     Workspace Owner 👑');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Restore failed:', err);
    process.exit(1);
  }
}

restore();
