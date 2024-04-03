import type { NextApiRequest, NextApiResponse } from 'next'
 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type ResponseData = {
  message: string
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
    // Create a new user with a new post
    let user = await prisma.user.create({
        data: {
            name: 'Alice',
            email: 'alice@s.unibuc.ro',
            posts: {
                create: { title: 'Hello World' },
            },
        },
    })
    res.status(200).json({ message: user.toString()})
}