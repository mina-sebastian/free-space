import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import prisma from "../../../../libs/prismadb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

type ResponseData = {
  message: string,
  link?: string,
  error?: string
}

export default async function generateLink(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const {type, permissions } = req.body;
  const id = parseInt(req.body.id);

  if (!id || !type) {
    return res.status(400).json({ message: "Resource ID and type are required" });
  }

  const accessKey = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  let link;

  try {
    if (type === 'file') {
      const file = await prisma.file.findUnique({
        where: { fileId: id, user:{email: session.user.email} }
      });

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      link = await prisma.link.create({
        data: { path: accessKey, expires: expiresAt, permission: permissions, fileId: id }
      });
    } else if (type === 'folder') {
      const folder = await prisma.folder.findUnique({
        where: { folderId: id, user:{email: session.user.email} }
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      link = await prisma.link.create({
        data: { path: accessKey, expires: expiresAt, permission: permissions, folderId: id }
      });
    } else {
      return res.status(400).json({ message: "Invalid resource type" });
    }

    const baseUrl = 'http://localhost/api/link'; // Adjust this as necessary
    return res.status(200).json({ message: "Link generated successfully", link: `${baseUrl}/${accessKey}` });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
