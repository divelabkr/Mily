const PostHog = jest.fn().mockImplementation(() => ({
  capture: jest.fn(),
  identify: jest.fn(),
  screen: jest.fn(),
  reset: jest.fn(),
}));

module.exports = PostHog;
module.exports.default = PostHog;
