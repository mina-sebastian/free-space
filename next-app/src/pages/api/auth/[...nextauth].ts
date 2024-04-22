import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import prisma from '../../../../libs/prismadb';
import { PrismaAdapter } from "@auth/prisma-adapter"

export const authOptions = {

adapter: PrismaAdapter(prisma),

callbacks: {
  async session({ session, user, token }: any) {
    session.user.admin = user.admin
    session.user.id = user.id
    return session
  },
},

providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ]
}

export default NextAuth(authOptions)