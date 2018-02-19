import gql from 'graphql-tag';

import GROUP_FRAGMENT from './Group.fragment';

const CREATE_GROUP_MUTATION = gql`
  mutation createGroup($group: CreateGroupInput!, $first: Int = 1, $after: String, $last: Int, $before: String) {
    createGroup(group: $group) {
      ... GroupFragment
    }
  }
  ${GROUP_FRAGMENT}
`;

export default CREATE_GROUP_MUTATION;
