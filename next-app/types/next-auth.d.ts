import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      admin: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    admin: boolean;
  }

  export const { auth, handlers } = NextAuth({
    callbacks: {
      session({ session, token, user }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
            admin: user.admin,
          },
        }
      },
    },
  })
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    admin: boolean;
  }
}