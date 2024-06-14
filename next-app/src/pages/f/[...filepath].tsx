import * as React from 'react';
import DefaultBg from "../../../components/DefaultBg";
import FileMenu from "../../../components/main/FileMenu";
import axios from 'axios';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/router';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import cuid2 from '@paralleldrive/cuid2';

// Define the FolderPath component
export default function FolderPath({ fetchedDataInit }) {
  const router = useRouter(); // Initialize router for navigation
  const [fetchedData, setFetchedData] = React.useState<any>(fetchedDataInit); // Initialize fetchedData state
  const [refetchId, setRefetchId] = React.useState("initial"); // Initialize refetchId state

  const getFolderByPath = async (path: string) => { // Function to get folder by path
    try {
      const response = await axios.post('/api/folder/getFolderByPath', { path }); // Send a POST request to the getFolderByPath API with the path
      setFetchedData(response.data); // Set the fetchedData state with the response data
    } catch (error) {
      console.error('Error getting folder by path:', error);
    }
  };

  React.useEffect(() => { // Fetch folder data on component mount
    const filepath = router.query.filepath;
    if (filepath) {
      getFolderByPath(filepath as string); // Call getFolderByPath with the filepath
    }
    setRefetchId(cuid2.createId()); // Generate a new refetchId
  }, [router.query.filepath]); // Update when the filepath changes

  const breadcrumbItems = React.useMemo(() => { // Generate breadcrumb items
    const path = router.query.filepath as string[]; // Extract the filepath from the router query
    return path ? path.filter(Boolean) : []; // Filter out any empty strings
  }, [router.query.filepath]); // Update when the filepath changes

  const handleBreadcrumbClick = (path: string) => { 
    router.push(`/f/${path}`); // Navigate to the specified path
  };

  return (
    <DefaultBg currentlyOpen={router.query.filepath} folderId={fetchedData?.folderId} refetchId={refetchId}>
      <div role="presentation">
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          {breadcrumbItems.map((item, index) => ( // Map over the breadcrumb items
            <Link
              key={index}
              underline="hover"
              color={index === breadcrumbItems.length - 1 ? "text.primary" : "inherit"}
              href="#"
              onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { // Handle breadcrumb click
                event.preventDefault(); // Prevent default anchor click behavior
                handleBreadcrumbClick(breadcrumbItems.slice(0, index + 1).join('/')); // Call handleBreadcrumbClick with the clicked path
              }}
              aria-current={index === breadcrumbItems.length - 1 ? "page" : undefined} // Set aria-current attribute
            >
              {item}
            </Link>
          ))}
        </Breadcrumbs>
      </div>
      <FileMenu folders={fetchedData?.folders || []} files={fetchedData?.files || []} canEdit={true}/>
    </DefaultBg>
  );
}

const generateRecursiveOuterFolder = (paths) => { // Function to generate a recursive outer folder
  if (paths.length <= 1) {
    return {
      name: paths[0],
      outerFolder: null // If there is only one path left
    };
  }
  return {
    name: paths[0],
    outerFolder: generateRecursiveOuterFolder(paths.slice(1)) // Recursively generate outer folders
  };
};

export async function getServerSideProps(context) { // Get server-side props
  const { req, res } = context;
  const session = await getServerSession(req, res, authOptions); // Retrieve the session using getServerSession with the provided authOptions
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const user = session.user; // Extract user information from the session
  const path = context.query.filepath; // Extract the filepath from the context query

  const userDb = await prisma.user.findUnique({ // Find the user by email
    where: {
      email: session.user.email,
    },
  });

  const homeFolder = await prisma.folder.findFirst({ // Find the home folder for the user
    where: {
      userId: userDb.id,
      outerFolderId: null,
      name: "Home",
    },
  });

  const binFolder = await prisma.folder.findFirst({ // Find the bin folder for the user
    where: {
      userId: userDb.id,
      outerFolderId: null,
      name: "Bin",
    },
  });

  if (!homeFolder) {
    await prisma.folder.create({ // Create the home folder for the user
      data: {
        name: "Home",
        userId: userDb.id,
      },
    });
  }

  if (!binFolder) {
    await prisma.folder.create({ // Create the bin folder for the user
      data: {
        name: "Bin",
        userId: userDb.id,
      },
    });
  }

  const whereQuery = generateRecursiveOuterFolder([...path].reverse()); // Generate the recursive outer folder based on the path

  const folder = await prisma.folder.findFirst({ // Retrieve the folder based on the query
    select: {
      folderId: true,
      name: true,
      outerFolderId: true,
      innerFolders: {
        select: {
          folderId: true,
          name: true,
          outerFolderId: true,
        },
      },
      files: {
        select: {
          fileId: true,
          hashFile: {
            select: {
              size: true,
            },
          },
          name: true,
          user: {
            select: {
              image: true,
              name: true,
              email: true,
            },
          },
          folderId: true,
        },
      },
    },
    where: {
      userId: user.id,
      ...whereQuery,
    },
  });

  if (!folder) {
    return { notFound: true };
  }

  return {
    props: {
      fetchedDataInit: { // Return the initial fetched data
        folders: folder.innerFolders,
        files: folder.files,
        folderId: folder.folderId,
      },
    },
  };
}
