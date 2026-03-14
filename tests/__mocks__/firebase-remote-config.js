const mockConfigInstance = {
  defaultConfig: {},
  settings: { minimumFetchIntervalMillis: 0 },
};

const getRemoteConfig = jest.fn(() => mockConfigInstance);
const fetchAndActivate = jest.fn().mockResolvedValue(true);
const getBoolean = jest.fn((_config, _key) => false);
const getString = jest.fn((_config, _key) => '');

module.exports = {
  getRemoteConfig,
  fetchAndActivate,
  getBoolean,
  getString,
};
