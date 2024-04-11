import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

type ResponseData = {
  message: string;
};

// EXAMPLE: http://localhost/api/test/addUsers
// This will try to add a user to the database
// This is called endpoint
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method Not Allowed" });
    }

    // this is how we check if the user is authenticated
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        //take the fields from the request body
        const { name, email, image } = req.body;

        // this is how we add a user to the database
        let user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                image: image,
            },
        });

        // this is how we return the user with 200 status and a json
        return res.status(200).json({ message: "Added: " + user.email + ' ' + user.name });
    } catch (e) {
        // this is how we return an error with 500 status and a json
        console.error(e);
        return res.status(500).json({ message: e.message });
    }
}
