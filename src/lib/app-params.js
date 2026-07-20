const isNode = typeof window === 'undefined';

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

const getStorage = () => {
  if (isNode) return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  return window.localStorage;
};

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) {
    return defaultValue;
  }
  const storage = getStorage();
  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''
    }${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }
  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }
  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }
  return null;
};

const getAppParams = () => {
  const storage = getStorage();
  if (getAppParamValue('clear_access_token') === 'true') {
    storage.removeItem('base44_access_token');
    storage.removeItem('token');
  }
  return {
    appId: getAppParamValue('app_id', { defaultValue: process.env.NEXT_PUBLIC_BASE44_APP_ID }),
    token: getAppParamValue('access_token', { removeFromUrl: true }),
    fromUrl: isNode ? '' : getAppParamValue('from_url', { defaultValue: window.location.href }),
    functionsVersion: getAppParamValue('functions_version', { defaultValue: process.env.NEXT_PUBLIC_BASE44_FUNCTIONS_VERSION }),
    appBaseUrl: getAppParamValue('app_base_url', { defaultValue: process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL }),
  };
};

// Lazy singleton — evaluated only on first access (in browser)
let _appParams = null;
export const appParams = new Proxy({}, {
  get(_, key) {
    if (!_appParams) {
      _appParams = getAppParams();
    }
    return _appParams[key];
  },
});
