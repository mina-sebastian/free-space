// pages/link/[link].tsx
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';

interface LinkProps {
  data?: any;  // Define data types more specifically based on your application needs
  error?: string;
}

const LinkPage: NextPage<LinkProps> = ({ data, error }) => { // Define the LinkPage component
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Assuming `data` contains the details to be displayed
  return (
    <div>
      <h1>Resource Details</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => { // Define the getServerSideProps function
  const { link } = context.params!;
  try {
    const res = await axios.get(`/api/link/${link}`); // Fetch data from the API endpoint
    return { props: { data: res.data.data } }; // Return the fetched data as props
  } catch (error) {
    return { props: { error: error.response?.data?.error || "An unexpected error occurred" } }; // Return an error message if an error occurs
  }
};

export default LinkPage;












// // pages/link/[link].tsx
// import { GetServerSideProps, NextPage } from 'next';
// import axios from "axios";

// interface LinkData {
//   file?: {
//     fileId: number;
//     path: string;
//     denumire: string;
//     deleted: boolean;
//     dimensiune: Float32Array;
//     folder?: any;
//   };
//   folder?: {
//     files: any[];
//     innerFolders: any[];
//   };
// }

// interface LinkProps {
//   data?: LinkData;
//   error?: string;
// }

// const LinkPage: NextPage<LinkProps> = ({ data, error }) => {
//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   return (
//     <div>
//       <h1>Resource Details</h1>
//       <pre>{JSON.stringify(data, null, 2)}</pre>
//     </div>
//   );
// }

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const { link } = context.params!;
//   try {
//     const res = await axios.get(`http://localhost:3000/api/link/${link}`);
//     return { props: { data: res.data.data } };
//   } catch (error) {
//     return { props: { error: error.response?.data?.error || "An unexpected error occurred" } };
//   }
// };

// export default LinkPage;


