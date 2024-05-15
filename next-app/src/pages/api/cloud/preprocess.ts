import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

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

  console.log('Received preprocess request:', req.body);

  const { files, outerFolderId } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  const fileHashes = files.map(file => file.hash);
  const existingFiles = await prisma.fileHash.findMany({
    where: {
      hash: { in: fileHashes }
    },
    select: {
      hash: true,
      path: true,
      size: true
    }
  });

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

  const alreadyUploaded: string[] = [];
  const toUpload: string[] = [];

  for (const file of files) {
    const existingFile = existingFiles.find(existingFile => existingFile.hash === file.hash);
    if (existingFile) {
      alreadyUploaded.push(file.id);
      await prisma.file.create({
        data: {
          name: file.name,
          hash: file.hash,
          userId: session.user.id,
          folderId: outerFolderId
        }
      });
    } else {
      toUpload.push(file.id);
    }
  }

  res.status(200).json({ alreadyUploaded, toUpload });
}
