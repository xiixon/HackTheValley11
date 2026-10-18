import Constants from 'expo-constants';
import { Platform } from 'react-native';

const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
// Local simulator and browser sessions must not inherit the physical iPhone's
// USB address from .env.local (which Expo merges at runtime).
const localHost = Platform.OS === 'web' && typeof location !== 'undefined' ? location.hostname : metroHost;
const localDevelopmentApi = __DEV__ && (Platform.OS === 'ios' || Platform.OS === 'web') &&
  (localHost === '127.0.0.1' || localHost === 'localhost')
  ? 'http://127.0.0.1:3000' : undefined;

export const apiUrl = (localDevelopmentApi ?? process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')).replace(/\/+$/, '');
