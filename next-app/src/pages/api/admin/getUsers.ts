import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

type UserData = {
  email: string | null;
  name: string | null;
  admin: boolean;
};

type ResponseData = {
  users: UserData[];
};

// Endpoint to fetch all users from the database
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string }>
) {
    // Ensure the user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch all users from the database
    const users = await prisma.user.findMany({
        select: { // Specify fields to select for reducing payload and enhancing privacy
            id: true,
            email: true,
            name: true,
            admin: true,
            image: true
        }
    });

    // Return the list of users
    if (users.length > 0) {
      res.status(200).json({ users });
    } else {
      res.status(200).json({ users: [] }); // Return an empty array if no users found
    }
}
