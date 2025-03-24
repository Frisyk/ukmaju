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
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            // Untuk demo, kita akan membuat user baru
            const newUser = await User.create({
              email: credentials.email,
              name: credentials.email.split('@')[0],
            });
            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
            };
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
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