import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion, DataType } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
const koaBody = require("koa-body");

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (_, topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  

  const handleRequest = async (ctx) => {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    console.log("TESTING : ", session)
    // console.log("TESTING : ", ctx)
    await handle(ctx.req, ctx.res);

    // console.log("TESTING : ", session)
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };


  // router.get("/register-shop", async (ctx) => {
  //   const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
  //   // const shop = session;

  //   axios.get("https://60-seconds-server.com/register-newshop",{...formdata}).then({

  //   });
  // })

  router.get("/test-endpoint", async (ctx) => {
    console.log("session: Attempting....: ")
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    // const shop = session;

    // This shop hasn't been seen yet, go through OAuth to create a session
    // if (session === undefined || ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
    //   ctx.redirect(`/auth?shop=${shop}`);
    //   return;
    // }

    // const shopSettings = ACTIVE_SHOPIFY_SHOPS[shop].settings;

    // if (!shopSettings.productId) {
    //   ctx.status = 200;
    //   ctx.body = {
    //     status: "EMPTY_SETTINGS",
    //     data: undefined,
    //   };
    //   return;
    // }
    console.log("session:GET: ", session);


    const sessionToReturn = {
      shopId: session.id,
      shop: session.shop,
      scope: session.scope
    }
    console.log("session:GET: to rerun: ", sessionToReturn);
    // console.log("session:GET: ", ctx);
    const client = new Shopify.Clients.Rest(session.shop, session.accessToken);

    // const productDetails = await client.get({
    //   path: `products/${shopSettings.productId}`,
    //   type: DataType.JSON,
    // });

    const shopProducts = await client.get({
      path: 'products',
      type: DataType.JSON,
    });

    const shopCustomers = await client.get({
      path: 'customers',
      type: DataType.JSON,
    });

    // const shopOrders = await client.get({
    //   path: 'orders',
    //   type: DataType.JSON,
    // });

    ctx.body = {
      status: "OK_REQUEST",
      data: {
        session: sessionToReturn,
        products: shopProducts.body,
        customers: shopCustomers.body,
        currentUser: session.onlineAccessInfo.associated_user
        // orders: shopOrders.body,
      },
    };
    ctx.status = 200;
  });

  // router.post("/test-endpoint", async (ctx) => {
  //   const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
  //   const shop = session.shop;

  //   // This shop hasn't been seen yet, go through OAuth to create a session
  //   // if (session === undefined || ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
  //   //   ctx.redirect(`/auth?shop=${shop}`);
  //   //   return;
  //   // }

  //   // const productIdStruct = JSON.parse(ctx.request.body).productId.split("/");
  //   // const productId = productIdStruct[productIdStruct.length - 1];

  //   // ACTIVE_SHOPIFY_SHOPS[shop].settings = { productId };

  //   // const client = new Shopify.Clients.Rest(session.shop, session.accessToken);

  //   // const productDetails = await client.get({
  //   //   path: `products/${productId}`,
  //   //   type: DataType.JSON,
  //   // });

  //   ctx.body = {
  //     status: "OK_SETTINGS",
  //     data: productDetails.body.product,
  //   };
  //   ctx.status = 200;
  // });

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });
  

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(koaBody());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
