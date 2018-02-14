import { client, wsClient } from '../navigation';
import { SET_CURRENT_USER, LOGOUT } from '../constants/Constants';

export const setCurrentUser = user => ({
  type: SET_CURRENT_USER,
  user,
});

export const logout = () => {
  client.resetStore();
  // wsClient.unsubscribeAll(); // unsubscribe from all subscriptions
  // wsClient.close();
  return { type: LOGOUT };
};
