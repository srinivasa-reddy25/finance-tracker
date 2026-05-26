/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Must be registered at the root level before AppRegistry
messaging().setBackgroundMessageHandler(async _remoteMessage => {});

AppRegistry.registerComponent(appName, () => App);
