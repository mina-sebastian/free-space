import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../libs/prismadb';

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { name, email, image } = req.body;

    let user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        image: image,
      },
    });

    return res.status(200).json({ message: "Added: " + user.email + ' ' + user.name });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error: " + e.message });
  }
}
