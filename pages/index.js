import React, { useEffect, useState, useCallback } from "react";
import { 
  Heading, 
  Page, 
  Button,
  Card,
  CalloutCard,
  DataTable,
  Layout,
  Link,
  ResourceList,
  ResourceItem,
  Thumbnail,
  TextStyle,
  Loading,
  Frame,
  Form,
  FormLayout,
  Checkbox,
  Autocomplete,
  TextField,
  Subheading
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";
import { Toast, ResourcePicker, useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";


/**
 * DEFAULT VARIABLES
 */
const DEFAULT_APP_STATES =  {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
}




const getAppSettings = () => {
  const app = useAppBridge();
  const [appState, setAppState] = useState({
    status: DEFAULT_APP_STATES.PENDING,
    message: DEFAULT_APP_STATES.PENDING
  });

  const [merchantDetails, setMerchantDetails] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [shopInventory, setShopInventory] = useState("");


  useEffect(() => {
    getTestEndpoint();
  }, [])


  const getTestEndpoint = async () => {
    setAppState(DEFAULT_APP_STATES.PENDING);
    
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
      
      if(responseData && responseData.data){
        //Set mechant Details
        if(responseData.data.session){
          setMerchantDetails({
            shopDetails: responseData.data.session,
            isRegistered: false
          });
        }

        if(responseData.data.currentUser){
          setCurrentUser(responseData.data.currentUser);
        }

        if(responseData.data.products && responseData.data.customers){
          setShopInventory({
            products: responseData.data.products.products,
            customers: responseData.data.customers.customers
          });
        }

        setAppState(DEFAULT_APP_STATES.SUCCESS);

      };

    } catch (err) {
      console.log(err);
      setAppState(DEFAULT_APP_STATES.ERROR);
    } finally {
      // setIsLoading(false);
    }
  };

  return {
    appState,
    currentUser,
    merchantDetails,
    shopInventory,
    setAppState,
    setMerchantDetails,
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


const AppLoading = (props) => {
  return(
    <Page>
      <div style={{ height: "100px" }}>
        <Frame>
          <Loading />
        </Frame>
      </div>
    </Page>
  );
};


const AppError = (props) => {
  return(
    <Page
      singleColumn 
      title="60 Seconds | Something's Gone Wrong"
    >
      <div style={{ height: "100px" }}>
        <Frame>
          <Loading />
        </Frame>
      </div>
    </Page>
  );
};


const UnregisteredMerchant = (props) => {
  const [newsletter, setNewsletter] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = useCallback((_event) => {
    // setEmail('');
    // setNewsletter(false);
    console.log("Attempting to Submit Registration....");
    props.handleSubmitRegistration();
  }, []);

  const handleNewsLetterChange = useCallback(
    (value) => setNewsletter(value),
    [],
  );

  const handleEmailChange = useCallback((value) => setEmail(value), []);

  return (
    <Page 
      singleColumn title="60 Seconds | Register Your Shop"
      // primaryAction={{
      //   content: "Synchronise with 60",
      //   onAction: indexPagePrimaryAction
      // }}
    >
      
      
      <Form onSubmit={handleSubmit}>
        <FormLayout>
          <Subheading>Shop Details</Subheading>
          <TextField
            label="Store Name"
            // value={value}
            // onChange={handleChange}
            autoComplete="off"
          />
          
          <hr/>
          <Subheading>Owner Details</Subheading>

          <FormLayout>
            <FormLayout.Group>
              <TextField
              label="First Name"
              // value={value}
              // onChange={handleChange}
              autoComplete="off"
            /> 

            <TextField
              label="Last Name"
              // value={value}
              // onChange={handleChange}
              autoComplete="off"
            />   
            </FormLayout.Group>
          </FormLayout>

          <TextField
            value={email}
            onChange={handleEmailChange}
            label="Email"
            type="email"
            autoComplete="email"
            helpText={
              <span>
                We’ll use this email address to inform you on future changes to
                Polaris, if you sign up to our Newsletters
              </span>
            }
          />

          <hr/>
          <Subheading>Newsletters</Subheading>

          <Checkbox
            label="Sign me up for 60 Seconds Weekly Newsletter"
            checked={newsletter}
            onChange={handleNewsLetterChange}
          />  

          <hr/>
          <Subheading>Terms and Conditions</Subheading>
          <Checkbox
            label="I accept the terms and conditions"
            checked={newsletter}
            onChange={handleNewsLetterChange}
            helpText={
              <span>
                Please read <Link url="https://help.shopify.com/manual">the full terms and conditions here</Link> and accept to proceed.
              </span>
            }
          /> 

          <Button submit>Submit</Button>
        </FormLayout>
      </Form>
      
    </Page>
    
  );
};




const RegisteredMerchant = (props) => {
  // const shopName = props && props.merchantDetails && props.merchantDetails.shop

  console.log("Registered merchant: Shop Details: ", props.merchantDetails)
  console.log("Registered merchant: Shop Inventory: ", props.shopInventory)


  const rows = props.shopInventory.products.map((product, index) => {
      // return [product.id, product.title, product.status, new Date(product.created_at).toUTCString(), new Date(product.updated_at).toUTCString()]
      return [index+1, product.title, product.status, new Date(product.created_at).toUTCString(), new Date(product.updated_at).toUTCString()]
      // return [product.id, product.title, product.status, 0, 0]
    });
  

  console.log("rows: ", rows)



  // const rows = [
  //   // ...props.shopInvetory.products.pro,
  //   ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00'],
  //   ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00'],
  //   [
  //     'Navy Merino Wool Blazer with khaki chinos and yellow belt',
  //     '$445.00',
  //     124518,
  //     32,
  //     '$14,240.00',
  //   ],
  // ];

  return(
    <Page 
      singleColumn title={`60 Seconds | Welcome ${props.currentUser.first_name}`}
      // primaryAction={{
      //   content: "Synchronise with 60",
      //   onAction: indexPagePrimaryAction
      // }}
    >
      <Heading>
        ALL PRODUCTS
      </Heading>

      <hr/>
      <Card>
        <DataTable
          columnContentTypes={[
            'numeric',
            'text',
            'text',
            'numeric',
            'numeric',
          ]}
          headings={[
            'ID',
            'Product',
            'Status',
            'Created At',
            'Updated At',
          ]}
          rows={rows}
          totals={['', '', '', 255, '$155,830.00']}
        />
      </Card>
      
    </Page>
  )

}



const AppJourney = (props) => {
  
  const handleSubmitRegistration = () => {
    console.log("Submitting Registration Details...");

    props.setMerchantDetails({
      shopDetails: props.merchantDetails.shopDetails,
      isRegistered: true
    });

    console.log("Updating Registration Details...");
  };

  if(props && props.merchantDetails && props.merchantDetails.isRegistered === true){
    return (
      <RegisteredMerchant 
        merchantDetails={props.merchantDetails} 
        currentUser={props.currentUser}
        shopInventory={props.shopInventory}
      />
    );
  } else {
    return (
      <UnregisteredMerchant handleSubmitRegistration={handleSubmitRegistration}/>
    )
  }
}



const Index = () => {
  const {
    appState,
    currentUser,
    merchantDetails,
    shopInventory, 
    setAppState,
    setMerchantDetails,
    getTestEndpoint
  } = getAppSettings();

  const indexPagePrimaryAction = async () => {
    console.log("ORDERS: ");

    await getTestEndpoint();

  }

  const renderAppJourney = () => {
    switch(appState) {
      case DEFAULT_APP_STATES.PENDING:
        return (<AppLoading />);

      case DEFAULT_APP_STATES.ERROR:
        return (<AppError />);
      
      case DEFAULT_APP_STATES.SUCCESS:
        return (
          <AppJourney 
            merchantDetails={merchantDetails} 
            setMerchantDetails={setMerchantDetails}
            currentUser={currentUser}
            shopInventory={shopInventory}
          />
        )
      
      default:
        return (<AppLoading />);
    }
  }

  // if(appState === DEFAULT_APP_STATES.PENDING){
  //   return
  // }
  return (
    <div>
      {renderAppJourney()}

    </div>
    
    
  );
};

export default Index;
