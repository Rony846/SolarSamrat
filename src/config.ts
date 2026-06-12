// Backend base URL. Solar Samrat reuses the MuscleGrid CRM backend (which hosts
// the /samrat/* API + admin control plane). Release builds MUST use HTTPS
// (Apple ATS blocks plain http). Override with EXPO_PUBLIC_API_URL for staging.
const PROD_API = 'https://newcrm.musclegrid.in/api';
const DEV_API = 'http://187.127.158.147:8080/api';

export const API_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ||
  (__DEV__ ? DEV_API : PROD_API);

export const PRIVACY_POLICY_URL = 'https://musclegrid.in/policies/privacy-policy';
export const TERMS_URL = 'https://musclegrid.in/policies/terms-of-service';
