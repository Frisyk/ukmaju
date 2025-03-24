import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "./db/connection";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  // Hilangkan adapter untuk sementara selama pengembangan
  // Gunakan JWT strategy sebagai gantinya
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Data login tidak lengkap");
        }

        try {
          await dbConnect();
          // Cari user dan sertakan password untuk pemeriksaan
          const user = await User.findOne({ email: credentials.email }).select('+password');

          if (!user) {
            throw new Error("Email tidak terdaftar");
          }

          // Verifikasi password
          const isPasswordCorrect = await user.comparePassword(credentials.password);
          
          if (!isPasswordCorrect) {
            throw new Error("Password salah");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    // signUp: "/register",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // Jangan panik jika ada error MongoDB untuk sementara
  debug: process.env.NODE_ENV === "development",
}; 