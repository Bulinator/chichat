export const Schema = [`
  # custom scalar (date isn't a default scalar in graphQL)
  scalar Date

  # group chat entity
  type Group {
    id: Int! # unique id for the group
    name: String! # name of the group
    users: [User]! # users in the group
    messages: [Message] # messages sent to the group
  }

  # user entity
  type User {
    id: Int! # unique id for user
    email: String! # unique email per users
    username: String # name show to others users
    messages: [Message] # message sent by user
    groups: [Group] # groups the user belongs to
    friends: [User] # users's friends/contact
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
    createMessage(text: String!, userId: Int!, groupId: Int!): Message
    createGroup(name: String!, userIds: [Int!], userId: Int!): Group
    deleteGroup(id: Int!): Group
    leaveGroup(id: Int! userId: Int!): Group
    updateGroup(id: Int! name: String!): Group
  }

  schema {
    query: Query
    mutation: Mutation
  }
`];

export default Schema;
