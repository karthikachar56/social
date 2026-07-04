import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  avatar:    { type: String, default: '' },
  phone:     { type: String, default: '' },
  otherDetails: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

export async function seedAdmins() {
  const admins = [
    { name: 'Alex Johnson',   email: 'alex@eventhub.com',  password: 'admin123' },
    { name: 'Sarah Williams', email: 'sarah@eventhub.com', password: 'admin123' },
    { name: 'Mike Chen',      email: 'mike@eventhub.com',  password: 'admin123' },
    { name: 'Emma Davis',     email: 'emma@eventhub.com',  password: 'admin123' },
    { name: 'James Brown',    email: 'james@eventhub.com', password: 'admin123' },
    { name: 'Priya Patel',    email: 'priya@eventhub.com', password: 'admin123' },
  ];
  
  for (const a of admins) {
    const exists = await Admin.findOne({ email: a.email });
    if (!exists) {
      const hashed = await bcrypt.hash(a.password, 10);
      await new Admin({ name: a.name, email: a.email, password: hashed }).save();
      console.log(`Seeded admin: ${a.email}`);
    }
  }
}

export default Admin;

