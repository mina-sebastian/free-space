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
    
    let user = await prisma.user.findMany({
      include:{
        posts: true
      }
    });
  res.status(200).json({ message: user.map((u) => u.name).join(', ')})
}