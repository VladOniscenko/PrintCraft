import {
  CreditCard,
  Loader2,
  MapPin,
  Phone as PhoneIcon,
  Truck,
} from "lucide-react";
import type { ShippingAddress } from "./types";

interface CheckoutSidebarProps {
  subtotal: number;
  deliveryPrice: number;
  total: number;
  address: ShippingAddress;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  cartLoading: boolean;
  t: (key: string) => string;
  onAddressChange: (next: ShippingAddress) => void;
}

export default function CheckoutSidebar({
  subtotal,
  deliveryPrice,
  total,
  address,
  validationErrors,
  isSubmitting,
  cartLoading,
  t,
  onAddressChange,
}: CheckoutSidebarProps) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
      <div className="mb-8 space-y-3">
        <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">
          {t("cart.summary")}
        </h3>
        <div className="flex justify-between text-gray-500 text-sm">
          <span>{t("cart.subtotal")}</span>
          <span className="font-medium text-gray-900">
            €{subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-gray-500 text-sm">
          <span className="flex items-center gap-2">
            <Truck size={16} /> {t("cart.delivery")}
          </span>
          <span className="font-medium text-gray-900">
            €{deliveryPrice.toFixed(2)}
          </span>
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-between">
          <span className="font-black text-gray-900 text-lg">
            {t("cart.total")}
          </span>
          <span className="font-black text-emerald-600 text-lg">
            €{total.toFixed(2)}
          </span>
        </div>
      </div>

      <hr className="mb-8 border-gray-100" />

      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <MapPin className="text-emerald-600" size={20} /> {t("cart.shipping")}
      </h3>
      <div className="space-y-4">
        <InputField
          placeholder={t("quote.fullName")}
          value={address.fullName}
          error={validationErrors.fullName}
          onChange={(value) => onAddressChange({ ...address, fullName: value })}
        />

        <div>
          <div className="relative">
            <PhoneIcon
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />
            <input
              type="tel"
              placeholder={t("quote.phone")}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 ${
                validationErrors.phoneNumber
                  ? "border-red-300 focus:ring-red-400"
                  : "border-gray-200 focus:ring-emerald-500"
              }`}
              value={address.phoneNumber}
              onChange={(e) =>
                onAddressChange({ ...address, phoneNumber: e.target.value })
              }
            />
          </div>
          {validationErrors.phoneNumber && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.phoneNumber}
            </p>
          )}
        </div>

        <InputField
          placeholder={t("quote.street")}
          value={address.addressLine1}
          error={validationErrors.addressLine1}
          onChange={(value) =>
            onAddressChange({ ...address, addressLine1: value })
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <InputField
            placeholder={t("quote.city")}
            value={address.city}
            error={validationErrors.city}
            onChange={(value) => onAddressChange({ ...address, city: value })}
          />
          <InputField
            placeholder={t("quote.postalCode")}
            value={address.postalCode}
            error={validationErrors.postalCode}
            onChange={(value) =>
              onAddressChange({ ...address, postalCode: value })
            }
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || cartLoading}
        className={`w-full mt-8 bg-[#133827] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${
          isSubmitting || cartLoading
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-[#1c4d37]"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {t("cart.processing")}
          </>
        ) : (
          <>
            <CreditCard size={20} />
            Pay by bank transfer
          </>
        )}
      </button>
    </div>
  );
}

interface InputFieldProps {
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function InputField({ placeholder, value, error, onChange }: InputFieldProps) {
  return (
    <div>
      <input
        type="text"
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 ${
          error
            ? "border-red-300 focus:ring-red-400"
            : "border-gray-200 focus:ring-emerald-500"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
