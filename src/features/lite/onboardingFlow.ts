export type LiteOnboardingStep = 'trial_activated' | 'connection_opened' | 'subscription_added';

const LITE_ONBOARDING_FLOW_KEY = 'lite_onboarding_flow_v1';

interface LiteOnboardingFlowState {
  trial_activated: boolean;
  connection_opened: boolean;
  subscription_added: boolean;
}

const defaultState: LiteOnboardingFlowState = {
  trial_activated: false,
  connection_opened: false,
  subscription_added: false,
};

function getFlowStorageKey(userId?: number | null): string {
  return userId ? `${LITE_ONBOARDING_FLOW_KEY}_${userId}` : LITE_ONBOARDING_FLOW_KEY;
}

function readFlowState(userId?: number | null): LiteOnboardingFlowState {
  try {
    const raw = localStorage.getItem(getFlowStorageKey(userId));
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<LiteOnboardingFlowState>;
    return {
      trial_activated: !!parsed.trial_activated,
      connection_opened: !!parsed.connection_opened,
      subscription_added: !!parsed.subscription_added,
    };
  } catch {
    return defaultState;
  }
}

function writeFlowState(state: LiteOnboardingFlowState, userId?: number | null): void {
  try {
    localStorage.setItem(getFlowStorageKey(userId), JSON.stringify(state));
  } catch {
    // no-op
  }
}

export function getLiteOnboardingFlowState(userId?: number | null): LiteOnboardingFlowState {
  return readFlowState(userId);
}

export function markLiteOnboardingStep(
  step: LiteOnboardingStep,
  userId?: number | null,
): LiteOnboardingFlowState {
  const current = readFlowState(userId);
  const next = { ...current, [step]: true };
  writeFlowState(next, userId);
  return next;
}

export function resetLiteOnboardingFlowState(userId?: number | null): void {
  writeFlowState(defaultState, userId);
}
