import * as React from 'react';
import DefaultBg from "../../../components/DefaultBg";
import WelcomeBg from "../../../components/main/WelcomeBg";
import { useSession} from "next-auth/react"
import { useRouter } from 'next/router'
import FileMenu from "../../../components/main/FileMenu";
import axios from 'axios';

export default function FolderPath() {

  const { data: session } = useSession();
  const router = useRouter()
  const [fetchedData, setFetchedData] = React.useState<any>(null); // State to store fetched data

  const getFolderByPath = async (path: any) => {
    const response = await axios.post('/api/folder/getFolderByPath', {
      path
    });
    console.log("response", response.data);
    setFetchedData(response.data);
  }

  React.useEffect(() => {
    if(router.query.filepath){
      getFolderByPath(router.query.filepath);
    }
  }, [router.query.filepath]);


  
  return (
    <DefaultBg currentlyOpen={router.query.filepath}>
        <FileMenu folders={fetchedData?.folders || []} files={fetchedData?.files || []} />
    </DefaultBg>
  );
}
