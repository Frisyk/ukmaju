import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: String,
  emailVerified: Date,
}, { 
  timestamps: true 
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 