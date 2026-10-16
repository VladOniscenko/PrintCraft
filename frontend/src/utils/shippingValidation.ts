import type { TranslationKey } from "../i18n/translations";

export type ShippingInfo = {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  postalCode: string;
};

export function normalizeShippingInfo(input: ShippingInfo): ShippingInfo {
  const normalizeWhitespace = (value: string) =>
    value.trim().replace(/\s+/g, " ");
  const phoneDigits = input.phoneNumber.replace(/\D/g, "");
  const phoneNumber = input.phoneNumber.trim().startsWith("+")
    ? `+${phoneDigits}`
    : phoneDigits;

  return {
    fullName: normalizeWhitespace(input.fullName),
    phoneNumber,
    addressLine1: normalizeWhitespace(input.addressLine1),
    city: normalizeWhitespace(input.city),
    postalCode: normalizeWhitespace(input.postalCode).toUpperCase(),
  };
}

// t functie toegevoegd als parameter
export function validateShippingInfo(
  input: ShippingInfo,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const normalized = normalizeShippingInfo(input);

  const nameRegex = /^[\p{L}][\p{L}\p{M}\s'.-]*$/u;
  const phoneRegex = /^\+?[0-9\s().-]+$/;
  const addressRegex = /^[\p{L}\p{M}0-9\s,'.\-/#]+$/u;
  const cityRegex = /^[\p{L}\p{M}\s'.-]+$/u;
  const postalRegex = /^[A-Za-z0-9][A-Za-z0-9\s-]{1,11}$/;

  if (!normalized.fullName) {
    errors.fullName = t("shipping.error.fullNameRequired");
  } else if (
    normalized.fullName.length < 2 ||
    normalized.fullName.length > 100
  ) {
    errors.fullName = t("shipping.error.fullNameLength");
  } else if (!nameRegex.test(normalized.fullName)) {
    errors.fullName = t("shipping.error.fullNameInvalid");
  }

  if (!input.phoneNumber.trim()) {
    errors.phoneNumber = t("shipping.error.phoneRequired");
  } else if (!phoneRegex.test(input.phoneNumber.trim())) {
    errors.phoneNumber = t("shipping.error.phoneInvalid");
  } else if (
    normalized.phoneNumber.replace(/\D/g, "").length < 7 ||
    normalized.phoneNumber.replace(/\D/g, "").length > 15
  ) {
    errors.phoneNumber = t("shipping.error.phoneLength");
  }

  if (!normalized.addressLine1) {
    errors.addressLine1 = t("shipping.error.addressRequired");
  } else if (
    normalized.addressLine1.length < 5 ||
    normalized.addressLine1.length > 120
  ) {
    errors.addressLine1 = t("shipping.error.addressLength");
  } else if (!addressRegex.test(normalized.addressLine1)) {
    errors.addressLine1 = t("shipping.error.addressInvalid");
  }

  if (!normalized.city) {
    errors.city = t("shipping.error.cityRequired");
  } else if (normalized.city.length < 2 || normalized.city.length > 80) {
    errors.city = t("shipping.error.cityLength");
  } else if (!cityRegex.test(normalized.city)) {
    errors.city = t("shipping.error.cityInvalid");
  }

  if (!normalized.postalCode) {
    errors.postalCode = t("shipping.error.postalRequired");
  } else if (
    normalized.postalCode.length < 3 ||
    normalized.postalCode.length > 12
  ) {
    errors.postalCode = t("shipping.error.postalLength");
  } else if (!postalRegex.test(normalized.postalCode)) {
    errors.postalCode = t("shipping.error.postalInvalid");
  }

  return errors;
}
