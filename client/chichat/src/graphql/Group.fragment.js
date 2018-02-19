import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './Message.fragment';

const GROUP_FRAGMENT = gql`
  fragment GroupFragment on Group {
    id
    name
    unreadCount
    lastRead {
      id
      createdAt
    }
    users {
      id
      username
    }
    messages(first: $first, last: $last, before: $before, after: $after) {
      edges {
        cursor
        node {
          ... MessageFragment
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default GROUP_FRAGMENT;
