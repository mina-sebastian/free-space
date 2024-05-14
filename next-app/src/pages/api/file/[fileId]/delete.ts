import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import axios from 'axios';

const sendDeleteRequest = async (path: string) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0'
    }
  }
  const resp = await axios.delete(path.replace('http://localhost', 'http://tusd:8080'), config);
  
  if (resp.statusText === 'OK') {
    throw new Error('Failed to delete folder');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  const session = await getServerSession(req, res, authOptions as any);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fileId } = req.query; // Extract fileId from request query parameters

  const fileToDelete = await prisma.file.findUnique({
    where: {
      fileId: fileId as string,
    },
    select: {
      path: true,
    }
  });

  if(!fileToDelete){
    return res.status(404).json({ message: 'File not found' });
  }

  try { 
    await sendDeleteRequest(fileToDelete.path);

    await prisma.file.delete({
      where: {
        fileId: fileId as string,
      },
    });

    res.status(200).json({ message: 'File successfully deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
