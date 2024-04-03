import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../libs/prismadb'

type ResponseData = {
  message: string
}

// EXAMPLE: http://localhost:3000/api/test
// This will return a list of users from the database
// if there are no users in the database it will return an empty string
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
    let user = await prisma.user.findMany();
    res.status(200).json({ message: user.map((u) => `${u.email} ${u.name}`).join(', ')})
}