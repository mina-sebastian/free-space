
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

  console.log("can edit din path: " + fetchedData.canEdit);

  const getFolderByPath = async (pathLink: string) => { // Function to get folder by path
    try {
      const response = await axios.post('/api/folder/getFolderByLinkAndPath', { pathLink }); // Send a POST request to the getFolderByPath API with the path
      setFetchedData(prevData => ({ ...prevData, ...response.data })); // Set the fetchedData state with the response data
    } catch (error) {
      console.error('Error getting folder by path:', error);
    }
  };

  React.useEffect(() => { // Fetch folder data on component mount
    const filepath = router.query.path as string[];
    // console.log("File path: " + filepath.join('/'));
    if (filepath) {
      getFolderByPath(filepath.join('/')); // Call getFolderByPath with the filepath
    }
    setRefetchId(cuid2.createId()); // Generate a new refetchId
  }, [router.query.path]);  // Update when the filepath changes

  const breadcrumbItems = React.useMemo(() => { // Generate breadcrumb items
    const path = router.query.path as string[]; // Extract the filepath from the router query
    return path ? path.filter(Boolean) : []; // Filter out any empty strings
  }, [router.query.path]);

  const handleBreadcrumbClick = (path: string) => { 
    router.push(`/l/${path}`); // Navigate to the specified path
  };

  return (
    <DefaultBg currentlyOpen={router.query.path} folderId={fetchedData?.folderId} refetchId={refetchId}>
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
              {index == 0 ? fetchedDataInit.folderName : item}
            </Link>
          ))}
        </Breadcrumbs>
      </div>
      <FileMenu linkId={fetchedDataInit.linkId} folders={fetchedData?.folders || []} files={fetchedData?.files || []} canEdit={fetchedDataInit.canEdit} />
    </DefaultBg>
  );
}

const generateRecursiveOuterFolder = (paths, sharedFolderId) => { // Function to generate a recursive outer folder
  if (paths.length <= 1) { // If there is only one path left
    return {
      name: paths[0],
      outerFolderId: sharedFolderId
    };
  }
  return {
    name: paths[0],
    outerFolder: generateRecursiveOuterFolder(paths.slice(1), sharedFolderId) // Recursively generate outer folders
  };
};

export async function getServerSideProps(context) { // Get server-side props
  const { req, res } = context; // Extract request and response from the context
  const session = await getServerSession(req, res, authOptions); // Retrieve the session using getServerSession with the provided authOptions
  
  const initPath: string[] = context.query.path; // Extract the path from the context query
  const linkId = initPath[0];


  const link = await prisma.link.findUnique({ // Find the link by linkId
    where: {
      path: linkId,
    },
    select: {
      folderId: true,
      fileId: true,
      permission: true,  // Include permission in the query,
      canSee: true,
      file: {
        select: {
          fileId: true,
          hashFile: {
            select: {
              size: true,
            },
          },
          name: true,
        },
      },
      folder: {
        select: {
          userId: true,
          name: true,
        }
      }
    },
  });

  if (!link || !link.folderId) {
    return { notFound: true }; // Return not found if the link or folderId is not found
  }
  
  if (!session && link.canSee == "AUTH") { // If the link requires authentication and no session is found
    return {
      redirect: {
        destination: '/Home',
        permanent: false,
      },
    };
  }

  const user = session != null? session.user : undefined; // Extract user information from the session
  

  // console.log("Path: ");
  // console.log(initPath);

  
  const path = initPath.slice(1); // Extract the path from the initPath
 
  // console.log("Link ID: " + linkId);

 

  let whereQuery = {}; // Initialize an empty object to store the folder query
  // console.log(path)
  if(!path || path.length === 0){ // If path is empty
    whereQuery = {
      folderId: link.folderId
    };
  }else{
  whereQuery = generateRecursiveOuterFolder([...path].reverse(), link.folderId); // Generate the outer folder query
  }

  // console.log("Where query: ");
  // console.log(whereQuery);

  const folder = await prisma.folder.findFirst({ // Find the folder based on the query
    select: {
      folderId: true,
      name: true,
      outerFolderId: true,
      userId: true,  // Includem userId pentru a verifica proprietatea
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
          userId: true,  // Includem și aici userId
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
      ...whereQuery,
    },
  });

  // console.log("Folder: ");
  // console.log(folder);

  if (!folder) {
    return { notFound: true };
  }

  const isOwner = user != undefined ? folder.userId === user.id : false; // Check if the user is the owner of the folder
  const canEdit = (link.permission === "EDIT") || isOwner; // Check if the user can edit the folder

  console.log("Can edit: " + canEdit); 

  return {
    props: {
      fetchedDataInit: { // Return the initial fetched data
        folders: folder.innerFolders,
        files: folder.files,
        folderId: folder.folderId,
        folderName: link.folder.name,
        canEdit: canEdit,
        linkId: linkId,
      },
    },
  };
}
