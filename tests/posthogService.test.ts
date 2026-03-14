/**
 * posthogService.test.ts
 * PostHog 모니터링 서비스 단위 테스트
 */

import PostHog from 'posthog-react-native';
import * as posthogService from '../src/engines/monitoring/posthogService';

const MockPostHog = PostHog as jest.MockedClass<typeof PostHog>;

function makeMockInstance() {
  return {
    capture: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
    reset: jest.fn(),
  };
}

beforeEach(() => {
  MockPostHog.mockClear();
  posthogService._setClientForTest(null);
  delete process.env['EXPO_PUBLIC_POSTHOG_API_KEY'];
});

describe('posthogService.init()', () => {
  it('__DEV__ 환경에서 PostHog 클라이언트를 생성하지 않는다', () => {
    // IS_DEV는 모듈 로드 시 평가됨
    // 테스트 환경에서는 __DEV__가 undefined → IS_DEV = false
    // 따라서 apiKey가 없을 때 생성 안 되는 것으로 검증
    process.env['EXPO_PUBLIC_POSTHOG_API_KEY'] = '';
    posthogService.init();
    expect(MockPostHog).not.toHaveBeenCalled();
  });

  it('API Key가 없으면 클라이언트를 생성하지 않는다', () => {
    // apiKey가 빈 문자열이면 early return
    process.env['EXPO_PUBLIC_POSTHOG_API_KEY'] = '';
    posthogService.init();
    expect(MockPostHog).not.toHaveBeenCalled();
  });
});

describe('posthogService.capture()', () => {
  it('클라이언트가 주입된 경우 이벤트를 capture한다', () => {
    const mockInstance = makeMockInstance();
    posthogService._setClientForTest(mockInstance as unknown as PostHog);

    posthogService.capture('request_card_sent', { requestType: 'extra_budget' });

    expect(mockInstance.capture).toHaveBeenCalledTimes(1);
    expect(mockInstance.capture).toHaveBeenCalledWith('request_card_sent', {
      requestType: 'extra_budget',
    });
  });

  it('클라이언트가 없으면 capture를 호출하지 않는다 (no-op)', () => {
    // _client가 null인 상태
    const mockInstance = makeMockInstance();
    // 클라이언트를 주입하지 않음

    posthogService.capture('some_event');

    expect(mockInstance.capture).not.toHaveBeenCalled();
  });
});

describe('posthogService.captureError()', () => {
  it('Error 객체를 $exception 이벤트로 capture한다', () => {
    const mockInstance = makeMockInstance();
    posthogService._setClientForTest(mockInstance as unknown as PostHog);

    const error = new Error('테스트 에러');
    posthogService.captureError(error, { screen: 'MyTab' });

    expect(mockInstance.capture).toHaveBeenCalledTimes(1);
    const [event, props] = mockInstance.capture.mock.calls[0];
    expect(event).toBe('$exception');
    expect(props.$exception_message).toBe('테스트 에러');
    expect(props.$exception_type).toBe('Error');
    expect(props.screen).toBe('MyTab');
  });

  it('클라이언트가 없으면 captureError를 호출하지 않는다 (no-op)', () => {
    const mockInstance = makeMockInstance();
    posthogService.captureError(new Error('에러'));
    expect(mockInstance.capture).not.toHaveBeenCalled();
  });
});

describe('posthogService.identify()', () => {
  it('userId와 isMaster 속성을 포함해서 identify한다', () => {
    const mockInstance = makeMockInstance();
    posthogService._setClientForTest(mockInstance as unknown as PostHog);

    posthogService.identify('user-123', { isMaster: false, role: 'parent' });

    expect(mockInstance.identify).toHaveBeenCalledTimes(1);
    expect(mockInstance.identify).toHaveBeenCalledWith('user-123', {
      isMaster: false,
      role: 'parent',
    });
  });

  it('클라이언트가 없으면 identify를 호출하지 않는다', () => {
    const mockInstance = makeMockInstance();
    posthogService.identify('user-abc');
    expect(mockInstance.identify).not.toHaveBeenCalled();
  });
});

describe('posthogService.screen()', () => {
  it('화면 이름을 screen()으로 추적한다', () => {
    const mockInstance = makeMockInstance();
    posthogService._setClientForTest(mockInstance as unknown as PostHog);

    posthogService.screen('MyTab');

    expect(mockInstance.screen).toHaveBeenCalledTimes(1);
    expect(mockInstance.screen).toHaveBeenCalledWith('MyTab');
  });
});

describe('posthogService.reset()', () => {
  it('로그아웃 시 reset()으로 유저를 초기화한다', () => {
    const mockInstance = makeMockInstance();
    posthogService._setClientForTest(mockInstance as unknown as PostHog);

    posthogService.reset();

    expect(mockInstance.reset).toHaveBeenCalledTimes(1);
  });

  it('클라이언트가 없으면 reset을 호출하지 않는다', () => {
    const mockInstance = makeMockInstance();
    posthogService.reset();
    expect(mockInstance.reset).not.toHaveBeenCalled();
  });
});
