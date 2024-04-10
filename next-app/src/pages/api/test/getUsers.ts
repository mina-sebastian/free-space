import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../libs/prismadb'

import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"


type ResponseData = {
  message: string
}

// EXAMPLE: http://localhost/api/test/getUsers
// This will return a list of users from the database
// if there are no users in the database it will return an empty string
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

    // this is how we check if the user is authenticated
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // this is how we fetch the users from the database
    let user = await prisma.user.findMany();
    // this is how we return the users with 200 status and a json
    res.status(200).json({ message: user.map((u) => `${u.email} ${u.name}`).join(', ')})
}