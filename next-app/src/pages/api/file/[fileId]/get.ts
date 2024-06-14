import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import axios from 'axios';

// make sure to set the response limit to false
export const config = {
  api: {
    responseLimit: false,
  },
}

// Type definitions for the file object
type FileType = {
  fileId: string; 
  name: string;
  url: string;
};

// Type definitions for the response data
type ResponseData = {
  file?: FileType;
  message?: string;
};

// API handler to download a file
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { fileId } = req.query; // Extract fileId from request query parameters

  if (!fileId || typeof fileId !== 'string') { // Check if fileId is missing or invalid
    return res.status(400).json({ message: 'Bad Request: Missing or invalid fileId' });
  }

  let file = await prisma.file.findUnique({ // Find the file by fileId
    where: { fileId },
    include: {
      hashFile: true,
    },
  });

  if(!file){
    const link_file = await prisma.link.findUnique({ // Find the file by fileId
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

  const fileUrl = getFileUrl(file.hashFile.path); // Get the file URL

  try {
    // Fetch the file from the TUS server
    const response = await axios.get(fileUrl, {
      headers: {
        'Tus-Resumable': '1.0.0'
      },
      responseType: 'arraybuffer',
    });

    console.log(response.headers)
    for(const key in response.headers){ // Set the headers in the response
      res.setHeader(key, response.headers[key])
    }
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
}

function getFileUrl(filePath: string): string {
  return `http://tusd:8080/files/${filePath}`; // Return the file URL
}
