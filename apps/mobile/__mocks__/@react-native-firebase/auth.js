module.exports = {
  getAuth: jest.fn(() => ({ currentUser: null })),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  getIdToken: jest.fn(() => Promise.resolve('mock-token')),
  GoogleAuthProvider: { credential: jest.fn() },
  onAuthStateChanged: jest.fn(),
};
