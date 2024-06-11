import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { createId } from '@paralleldrive/cuid2';

type ResponseData = {
  alreadyUploaded: string[];
  toUpload: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session && !session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // console.log('Received preprocess request:', req.body);

  const { files, outerFolderId } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  
  const alreadyUploaded: string[] = [];
  const toUpload: string[] = [];


  // const existingFiles = await prisma.fileHash.findMany({
  //   where: {
  //     hash: { in: fileHashes }
  //   },
  //   select: {
  //     hash: true,
  //     path: true,
  //     size: true
  //   }
  // });

  const folder = await prisma.folder.findFirst({
    where: {
      folderId: outerFolderId,
    },
    select: {
      folderId: true,
    }
  }) || await prisma.folder.create({
    data: {
      name: "Home",
      userId: session.user.id,
    }
  });

  
  for (const file of files) {
    try{
      const newAssignedId = `frspc-${createId()}`;
      await prisma.fileHash.create({
        data: {
          hash: file.hash,
          size: -1,
          path: newAssignedId,
        }
      })
      toUpload.push({
        ...file,
        gvnid: newAssignedId
      })
    }
    catch(e){
      // console.log(e);
      //get tags list for the file
      const tagsFH = await prisma.fileHash.findUnique({
        where: {
          hash: file.hash
        },
        select: {
          tags: {
            select: {
              name: true
            }
          }
        }
      });
      //create the file with the list of the tags
      await prisma.file.create({
        data: {
          name: file.name,
          hash: file.hash,
          userId: session.user.id,
          folderId: outerFolderId,
          tags: {
            connect: tagsFH.tags
          }
        }
      });
      alreadyUploaded.push(file.id);
    }
  }

  res.status(200).json({ alreadyUploaded, toUpload });
}
