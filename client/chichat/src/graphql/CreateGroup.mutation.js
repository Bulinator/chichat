import gql from 'graphql-tag';

import GROUP_FRAGMENT from './Group.fragment';

const CREATE_GROUP_MUTATION = gql`
  mutation createGroup($group: CreateGroupInput!, $messageConnection: ConnectionInput = { first: 1 }) {
    createGroup(group: $group) {
      ... GroupFragment
    }
  }
  ${GROUP_FRAGMENT}
`;

export default CREATE_GROUP_MUTATION;
