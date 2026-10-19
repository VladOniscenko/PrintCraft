export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode: string;
  label?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
}
