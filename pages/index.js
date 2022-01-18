import React, { useEffect } from "react";
import { 
  Heading, 
  Page, 
  Button,
  Card,
  CalloutCard,
  Layout,
  ResourceList,
  ResourceItem,
  Thumbnail,
  TextStyle,
  Loading,
  Frame, } from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";
import { Toast, ResourcePicker, useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";




const getTestHook = () => {
  const app = useAppBridge();

  useEffect(() => {
    getTestEndpoint();
  }, [])


  const getTestEndpoint = async () => {
    // setIsLoading(true);
    
    try {
      // console.log("RESPONSE DATA : TEST END-POINT: GET :: ", this.context);
      // const app = await useAppBridge();
      const token = await getSessionToken(app);

      console.log("RESPONSE DATA : TEST TOKEN: GET :: ", token);
      const res = await fetch("/test-endpoint", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const responseData = await res.json();

      console.log("RESPONSE DATA : TEST END-POINT: GET :: ", responseData);

      // if (responseData.status === "EMPTY_SETTINGS") {
      //   return;
      // }

      // if (responseData.status === "OK_SETTINGS") {
      //   setSettingsObj(responseData.data);
      //   return;
      // }

      // throw Error("Unknown settings status");
    } catch (err) {
      console.log(err);
      // setError(err.message);
    } finally {
      // setIsLoading(false);
    }
  };



  return {
    getTestEndpoint
  }

}



// class Index extends React.Component {

//   indexPagePrimaryAction = async () => {
//     console.log("ORDERS: ");

//     getTestHook();

//   }

  

//   // componentDidMount = () => {
    
//   // }

//   render() {
//     return (
//       <Page 
//         singleColumn title="60 Seconds | Welcome"
//         primaryAction={{
//           content: "Synchronise with 60",
//           onAction: this.indexPagePrimaryAction
//         }}
//       >
//         <small> Add some logo layout here</small>
        
//       </Page>
//     );
//   }
// };


const Index = () => {
  const {
    getTestEndpoint
  } = getTestHook();

  const indexPagePrimaryAction = async () => {
    console.log("ORDERS: ");

    await getTestEndpoint();

  }


  return (
    <Page 
      singleColumn title="60 Seconds | Welcome"
      primaryAction={{
        content: "Synchronise with 60",
        onAction: indexPagePrimaryAction
      }}
    >
      
      <small >Add some logo layout here</small>

      <div onClick={indexPagePrimaryAction}>
        Hello
      </div>
      
    </Page>
  );
};

export default Index;
