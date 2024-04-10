import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import prisma from '../../../../libs/prismadb';
import { PrismaAdapter } from "@auth/prisma-adapter"

export const authOptions = {

adapter: PrismaAdapter(prisma),

providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ]
}

export default NextAuth(authOptions)