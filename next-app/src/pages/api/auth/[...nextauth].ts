import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import prisma from '../../../../libs/prismadb';
import { PrismaAdapter } from "@auth/prisma-adapter"

// Configure NextAuth
export const authOptions: AuthOptions = {

adapter: PrismaAdapter(prisma) as any, // Prisma adapter for NextAuth

// Callbacks for session management
callbacks: {
  // Add user id and admin status to session
  async session({ session, token, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.admin = user.admin;
      }
      return session;
    },
},

// Providers to configure authentication providers
providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ]
}

export default NextAuth(authOptions)