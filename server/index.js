import express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import jwt from 'express-jwt';
import jsonwebtoken from 'jsonwebtoken';
import OpticsAgent from 'optics-agent';

import { getSubscriptionDetails } from './subscriptions'; // make sure this imports before executableSchema!
import { JWT_SECRET } from './config';
import { User } from './data/connectors';
import { executableSchema } from './data/schema';
import { subscriptionLogic } from './data/logic';
import { groupLoader, userLoader } from './data/batch';

const GRAPHQL_HOST = '192.168.1.8';
const GRAPHQL_PORT = 8081;
const GRAPHQL_PATH = '/graphql';
const SUBSCRIPTIONS_PATH = '/subscriptions';
const app = express();


// as we have still no data, we use fixture with mock
// addMockFunctionsToSchema({
//  schema: executableSchema,
//  mocks: Mocks,
//  preserveResolvers: true,
// });

// 'context' must be an oject and cannot be undefined when using connectors
// app.use('/graphql', bodyParser.json(), graphqlExpress({
app.use('/graphql', OpticsAgent.middleware(), bodyParser.json(), jwt({
  secret: JWT_SECRET,
  credentialsRequired: false, // allow signup and login requests (and others) through the endpoint.
}), graphqlExpress(req => ({
  schema: OpticsAgent.instrumentSchema(executableSchema),
  context: {
    user: req.user ?
      User.findOne({ where: { id: req.user.id, version: req.user.version } }) :
      Promise.resolve(null),
    userLoader: userLoader(), // create a new dataloader for each request
    groupLoader: groupLoader(), // create a new dataloader for each request
    opticsContext: OpticsAgent.context(req), // for Apollo optics
  },
})));

app.use('/graphiql', graphiqlExpress({
  endpointURL: GRAPHQL_PATH,
  subscriptionsEndpoint: `ws://${GRAPHQL_HOST}:${GRAPHQL_PORT}${SUBSCRIPTIONS_PATH}`,
}));

const graphQLServer = createServer(app);

graphQLServer.listen(GRAPHQL_PORT, () => {
  console.log(`graphQL Server is running like the white rabbit on http://${GRAPHQL_HOST}:${GRAPHQL_PORT}${GRAPHQL_PATH}`);
  console.log(`graphQL Subscription is running like the black rabbit on ws://${GRAPHQL_HOST}:${GRAPHQL_PORT}${SUBSCRIPTIONS_PATH}`);
});

// eslint-disable-next-line no-unused-vars
const subscriptionServer = SubscriptionServer.create({
  schema: executableSchema,
  execute,
  subscribe,
  onConnect(connectionParams, websocket) {
    const userPromise = new Promise((res, rej) => {
      if (connectionParams.jwt) {
        jsonwebtoken.verify(connectionParams.jwt, JWT_SECRET, (err, decoded) => {
          if (err) {
            rej(new Error('Invalid Token'));
          }

          res(User.findOne({ where: { id: decoded.id, version: decoded.version } }));
        });
      } else {
        rej(new Error('No Token'));
      }
    });

    return userPromise.then((user) => {
      if (user) {
        return { user: Promise.resolve(user) };
      }

      return Promise.reject(new Error('No User'));
    });
  },
  onOperation(parsedMessage, baseParams) {
    // Need to implement this!!
    const { subscriptionName, args } = getSubscriptionDetails({
      baseParams,
      schema: executableSchema,
    });

    // We need to implement this too
    return subscriptionLogic[subscriptionName](baseParams, args, baseParams.context);
  },
}, {
  server: graphQLServer,
  path: SUBSCRIPTIONS_PATH,
});
