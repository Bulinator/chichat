import gql from 'graphql-tag';

import GROUP_FRAGMENT from './Group.fragment';

export const GROUP_QUERY = gql`
  query group($groupId: Int!, $messageConnection: ConnectionInput) {
    group(id: $groupId) {
      ... GroupFragment
    }
  }
  ${GROUP_FRAGMENT}
`;

export default GROUP_QUERY;
