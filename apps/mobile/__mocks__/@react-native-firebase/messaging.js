module.exports = {
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
  onMessage: jest.fn(),
  onTokenRefresh: jest.fn(),
  requestPermission: jest.fn(() => Promise.resolve(1)),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
};
