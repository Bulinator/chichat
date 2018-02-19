import { makeExecutableSchema } from 'graphql-tools';
import { Resolvers } from './resolvers';

export const Schema = [`
  # custom scalar (date isn't a default scalar in graphQL)
  scalar Date

  # input for creating groups
  input CreateGroupInput {
    name: String!
    userIds: [Int!]
  }

  type MessageConnection {
    edges: [MessageEdge]
    pageInfo: PageInfo!
  }

  type MessageEdge {
    cursor: String!
    node: Message!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  # group chat entity
  type Group {
    id: Int! # unique id for the group
    name: String! # name of the group
    users: [User]! # users in the group
    # messages: [Message] # messages sent to the group
    messages(first: Int, after: String, last: Int, before: String): MessageConnection
  }

  # user entity
  type User {
    id: Int! # unique id for user
    email: String! # unique email per users
    username: String # name show to others users
    messages: [Message] # message sent by user
    groups: [Group] # groups the user belongs to
    friends: [User] # users's friends/contact
    jwt: String # json web token access
  }

  # message chat entity
  type Message {
    id: Int! # unique id for message
    to: Group! # group message was sent in
    from: User! # user who sent the message
    text: String! # message text sent
    createdAt: Date! # when message was created
  }

  # build query for type
  type Query {
    # Return a user by their email or id
    user(email: String, id: Int): User

    # Return message sent by a user via userId
    # Or return messages sent to a group via groupId
    messages(groupId: Int, userId: Int): [Message]

    # Return a group by its id
    group(id: Int!): Group
  }

  # Update query; called Mutation
  type Mutation {
    # send a message to a group
    createMessage(text: String!, groupId: Int!): Message
    createGroup(group: CreateGroupInput!): Group
    deleteGroup(id: Int!): Group
    leaveGroup(id: Int!): Group
    updateGroup(id: Int!, name: String!): Group
    login(email: String!, password: String!): User
    signup(email: String!, password: String!, username: String): User
  }

  # live event subscription
  type Subscription {
    # Subscription fires on every message message
    # for any groups with one of these groupIds
    messageAdded(groupIds: [Int]): Message
    groupAdded(userId: Int): Group
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`];

export const executableSchema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: Resolvers,
});

export default executableSchema;
