import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    select: false // Tidak menyertakan password dalam query default
  },
  image: String,
  emailVerified: Date,
}, { 
  timestamps: true 
});

// Method untuk membandingkan password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const user = this as IUser;
  return bcrypt.compare(candidatePassword, user.password || '');
};

// Hash password sebelum disimpan ke database
UserSchema.pre('save', async function(next) {
  const user = this as unknown as IUser;
  
  // Hanya hash password jika dimodifikasi atau baru
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    if (user.password) {
      user.password = await bcrypt.hash(user.password, salt);
    }
    next();
  } catch (error) {
    return next(error as Error);
  }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 