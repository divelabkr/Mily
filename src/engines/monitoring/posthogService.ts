import PostHog from 'posthog-react-native';

let _client: PostHog | null = null;

// __DEV__ is a React Native global; guard for non-RN environments (e.g., tests)
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;

export function init(): void {
  if (IS_DEV) return;

  const apiKey = process.env['EXPO_PUBLIC_POSTHOG_API_KEY'] ?? '';
  if (!apiKey) return;

  _client = new PostHog(apiKey, {
    host: 'https://app.posthog.com',
  });
}

export function identify(userId: string, properties?: Record<string, unknown>): void {
  if (!_client) return;
  _client.identify(userId, properties);
}

export function capture(event: string, properties?: Record<string, unknown>): void {
  if (!_client) return;
  _client.capture(event, properties);
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!_client) return;
  _client.capture('$exception', {
    $exception_message: error.message,
    $exception_type: error.name,
    $exception_stack_trace: error.stack,
    ...context,
  });
}

export function screen(screenName: string): void {
  if (!_client) return;
  _client.screen(screenName);
}

export function reset(): void {
  if (!_client) return;
  _client.reset();
}

// 테스트 전용: 내부 클라이언트 주입
export function _setClientForTest(client: PostHog | null): void {
  _client = client;
}
