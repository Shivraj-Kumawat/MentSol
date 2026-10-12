import { useDeepLinking } from '@/hooks/useDeepLinking';

/**
 * Component that handles deep linking for the mobile app.
 * Must be rendered inside Router and Auth contexts.
 */
export const DeepLinkingHandler = () => {
  useDeepLinking();
  return null;
};
