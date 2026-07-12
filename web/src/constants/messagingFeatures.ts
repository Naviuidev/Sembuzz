/** Feature codes selected on Super Admin → Create School; drive school-admin messaging pipeline. */
export const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';
export const INDIVIDUAL_MESSAGING_CODE = 'INDIVIDUAL_MESSAGING';

export const MESSAGING_FEATURE_CODES = [
  GROUP_MESSAGING_CODE,
  INDIVIDUAL_MESSAGING_CODE,
] as const;

export type MessagingFeatureCode = (typeof MESSAGING_FEATURE_CODES)[number];

export function schoolHasMessagingFeature(
  features: Array<{ code: string }> | undefined,
): boolean {
  if (!features?.length) return false;
  return features.some((f) =>
    MESSAGING_FEATURE_CODES.includes(f.code as MessagingFeatureCode),
  );
}

export function schoolHasGroupMessaging(
  features: Array<{ code: string }> | undefined,
): boolean {
  return Boolean(features?.some((f) => f.code === GROUP_MESSAGING_CODE));
}

export function schoolHasIndividualMessaging(
  features: Array<{ code: string }> | undefined,
): boolean {
  return Boolean(features?.some((f) => f.code === INDIVIDUAL_MESSAGING_CODE));
}
