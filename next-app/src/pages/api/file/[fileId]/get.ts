import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import axios from 'axios';
import { buffer } from 'stream/consumers';

type FileType = {
  fileId: string; 
  name: string;
  url: string;
};

type ResponseData = {
  file?: FileType;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { fileId } = req.query;

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ message: 'Bad Request: Missing or invalid fileId' });
  }

  const file = await prisma.file.findUnique({
    where: { fileId },
    include: {
      hashFile: true,
    },
  });

  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }

  const fileUrl = getFileUrl(file.hashFile.path);

  try {
    const response = await axios.get(fileUrl, {
      headers: {
        'Tus-Resumable': '1.0.0'
      },
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(response.data, 'binary');

    console.log(response.headers)
    for(const key in response.headers){
      res.setHeader(key, response.headers[key])
    }
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
}

function getFileUrl(filePath: string): string {
  return `http://tusd:8080/files/${filePath}`;
}
