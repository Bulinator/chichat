import express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import jwt from 'express-jwt';

import { JWT_SECRET } from './config';
import { User } from './data/connectors';
import { executableSchema } from './data/schema';

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
app.use('/graphql', bodyParser.json(), jwt({
  secret: JWT_SECRET,
  credentialsRequired: false, // allow signup and login requests (and others) through the endpoint.
}), graphqlExpress(req => ({
  schema: executableSchema,
  context: {
    user: req.user ?
      User.findOne({ where: { id: req.user.id, version: req.user.version } }) :
      Promise.resolve(null),
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
}, {
  server: graphQLServer,
  path: SUBSCRIPTIONS_PATH,
});
