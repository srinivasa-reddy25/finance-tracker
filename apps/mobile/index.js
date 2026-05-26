/**
 * @format
 */

import { AppRegistry } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Must be registered at root level before AppRegistry
setBackgroundMessageHandler(getMessaging(), async _remoteMessage => {});

AppRegistry.registerComponent(appName, () => App);
