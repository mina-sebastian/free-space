import type { NextApiRequest, NextApiResponse } from 'next'
 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type ResponseData = {
  message: string
}
// EXAMPLE: http://localhost:3000/api/addUser
// This will add a user to the database and return a message
// if the user was added successfully
// or an error message if the user was not added
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
    try{
      let user = await prisma.user.create({
          data: {
            name: 'Alice',
            email: 'alice@s.unibuc.ro',
          },
        }
      )
      return res.status(200).json({ message: "Added: "+user.email + ' ' + user.name})
    }catch(e){
      console.log(e)
      return res.status(500).json({message: "Error: "+e.message})
    }
    
    
}