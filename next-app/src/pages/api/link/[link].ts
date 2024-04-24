// pages/api/link/[link].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from "../../../../libs/prismadb";

type ApiResponse = {
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { link } = req.query;

  if (!link) {
    return res.status(400).json({ error: 'Link parameter is required' });
  }

  try {
    const linkData = await prisma.link.findUnique({
      where: { path: link as string },
      include: {
        file: {
          select: {
            fileId: true,
            path: true,
            name: true, // Presupunând că "denumire" ar trebui să fie "name"
            deleted: true,
            size: true, // "dimensiune" a fost redenumit în "size"
            folder: true,
          }
        },
        folder: {
          include: {
            files: true,
            innerFolders: true
          }
        }
      }
    });

    if (!linkData) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (linkData.expires && new Date() > linkData.expires) {
      return res.status(403).json({ error: 'Link expired' });
    }

    res.status(200).json({ data: linkData });
  } catch (error) {
    console.error('Database or server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
