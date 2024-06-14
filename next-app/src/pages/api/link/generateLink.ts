import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import prisma from "../../../../libs/prismadb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import cuid2 from '@paralleldrive/cuid2';

// Define response data type
type ResponseData = {
  message: string,
  link?: string,
  error?: string
}

// Default API handler function
export default async function generateLink(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData> // Response type that includes a message string and optionally a link
) {
  const session = await getServerSession(req, res, authOptions) // Retrieve the session using getServerSession with the provided authOptions

  if (!session || !session.user) {
    return res.status(401).json({ message: "Unauthorized" }); // Return unauthorized if no session found
  }

  const {type, permissions, canSee } = req.body; // Extract type, permissions and canSee from request body
  const id = req.body.id; // Extract id from request body

  if (!id || !type || !permissions || !canSee) {
    return res.status(400).json({ message: "Resource ID, type, permission and canSee are required" }); // Return bad request if any of the required fields are missing
  }

  
  const accessKey = cuid2.createId() // Generate a unique access key
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // Set expiration date to 30 days from now

  let link;

  try {
    if (type === 'file') { // Check if the resource type is a file
      console.log('file', id);
      const file = await prisma.file.findUnique({ // Retrieve the file by id
        where: { fileId: id, userId: session.user.id}
      });

      if (!file) {
        return res.status(404).json({ message: "File not found" }); // Return a 404 error if the file is not found
      }

      link = await prisma.link.create({
        data: { path: accessKey, expires: expiresAt, permission: permissions, canSee: canSee, fileId: id } // Create a link with the provided access key, expiration date, permissions, and file id
      });
      const baseUrl = 'http://localhost/v'; // Adjust this as necessary
      return res.status(200).json({ message: "Link generated successfully", link: `${baseUrl}/${accessKey}` });
  
    } else if (type === 'folder') {
      const folder = await prisma.folder.findUnique({ // Retrieve the folder by id
        where: { folderId: id, user:{email: session.user.email} }
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" }); // Return a 404 error if the folder is not found
      }

      link = await prisma.link.create({ // Create a link with the provided access key, expiration date, permissions, and folder id
        data: { path: accessKey, expires: expiresAt, permission: permissions, canSee: canSee, folderId: id }
      });

      const baseUrl = 'http://localhost/l'; // Adjust this as necessary
      return res.status(200).json({ message: "Link generated successfully", link: `${baseUrl}/${accessKey}` });
  
    } else {
      return res.status(400).json({ message: "Invalid resource type" }); // Return a 400 error if the resource type is invalid
    }


  } catch (error) {
    console.log(req.body);
    console.log(error);
    return res.status(500).json({ message: "Server error", error: error.message }); // Return a 500 error with the error message
  }
}
