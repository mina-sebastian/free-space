import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import axios from 'axios';

// make sure to set the response limit to false
export const config = {
  api: {
    responseLimit: false,
  },
}

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

  let file = await prisma.file.findUnique({
    where: { fileId },
    include: {
      hashFile: true,
    },
  });

  if(!file){
    const link_file = await prisma.link.findUnique({
      where: { path: fileId },
      select:{
        file: {
          include: {
            hashFile: true
          }
        }
      }
    });
    if(link_file && link_file.file)
      file = link_file.file;
  }

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
