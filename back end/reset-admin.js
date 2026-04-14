require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const hashed = await bcrypt.hash('Admin@1234', 10);
    await User.findOneAndUpdate(
      { role: 'admin' },
      { $set: { password: hashed, email: 'admin@gopaltrading.com', isActive: true } },
      { upsert: true, new: true }
    );
    console.log('✅ Admin password reset to: Admin@1234');
    process.exit(0);
  })
  .catch(e => { console.error('❌', e.message); process.exit(1); });
