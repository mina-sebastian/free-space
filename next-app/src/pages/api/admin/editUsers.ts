import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import Email from 'next-auth/providers/email';

// Type definition for the expected request body
type RequestBody = {
  userId: string;
  action: 'makeAdmin' | 'deleteUser';
};

// Type definition for the response data
type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
    // Ensure that only POST requests are handled
    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Authenticate the user
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || !session.user.admin) { // Check if the user is an admin
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, action } = req.body as RequestBody;

    try {
        if (action === 'makeAdmin') {
            // Update the user's role to admin
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { admin: true },
            });
            return res.status(200).json({ message: `User ${updatedUser.email} is now an admin.` });
        } else if (action === 'deleteUser') {
            // Check if the user is not an admin before deletion
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user.admin) {
                await prisma.user.delete({
                    where: { id: userId },
                });
                return res.status(200).json({ message: "User deleted successfully." });
            } else {
                return res.status(403).json({ message: "Cannot delete an admin user." });
            }
        } else {
            return res.status(400).json({ message: "Invalid action." });
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message });
    }
}
