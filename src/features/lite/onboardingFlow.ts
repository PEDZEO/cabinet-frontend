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

function readFlowState(): LiteOnboardingFlowState {
  try {
    const raw = localStorage.getItem(LITE_ONBOARDING_FLOW_KEY);
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

function writeFlowState(state: LiteOnboardingFlowState): void {
  try {
    localStorage.setItem(LITE_ONBOARDING_FLOW_KEY, JSON.stringify(state));
  } catch {
    // no-op
  }
}

export function getLiteOnboardingFlowState(): LiteOnboardingFlowState {
  return readFlowState();
}

export function markLiteOnboardingStep(step: LiteOnboardingStep): LiteOnboardingFlowState {
  const current = readFlowState();
  const next = { ...current, [step]: true };
  writeFlowState(next);
  return next;
}

export function resetLiteOnboardingFlowState(): void {
  writeFlowState(defaultState);
}
