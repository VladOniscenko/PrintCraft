import { useState } from "react";
import {
  User,
  MapPin,
  Mail,
  Phone,
  Edit2,
  Check,
  X,
  Copy,
} from "lucide-react";
import type { OrderDetailsDto } from "../types";
import api from "../../../services/api";
import { useNotify } from "../../../context/NotifyContext";

interface CustomerShippingCardProps {
  order: OrderDetailsDto;
  onRefresh: () => Promise<void>;
}

export default function CustomerShippingCard({
  order,
  onRefresh,
}: CustomerShippingCardProps) {
  const { notifySuccess, notifyError } = useNotify();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Form states
  const customer = order.customer || {};
  const [fullName, setFullName] = useState(
    customer.fullName || order.fullName || "",
  );
  const [addressLine1, setAddressLine1] = useState(
    customer.addressLine1 || order.addressLine1 || "",
  );
  const [addressLine2, setAddressLine2] = useState(
    customer.addressLine2 || order.addressLine2 || "",
  );
  const [city, setCity] = useState(customer.city || order.city || "");
  const [postalCode, setPostalCode] = useState(
    customer.postalCode || order.postalCode || "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    customer.phoneNumber || order.phoneNumber || "",
  );

  const customerEmail = customer.email || order.customerEmail || "";

  const handleCopy = (text: string, type: "email" | "phone") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch(`/admin/orders/${order.id}/customer`, {
        fullName,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        postalCode,
        phoneNumber,
      });
      notifySuccess("Customer details updated successfully");
      setIsEditing(false);
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update customer details";
      notifyError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(customer.fullName || order.fullName || "");
    setAddressLine1(customer.addressLine1 || order.addressLine1 || "");
    setAddressLine2(customer.addressLine2 || order.addressLine2 || "");
    setCity(customer.city || order.city || "");
    setPostalCode(customer.postalCode || order.postalCode || "");
    setPhoneNumber(customer.phoneNumber || order.phoneNumber || "");
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-shadow hover:shadow">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
            <User size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Customer & Shipping
            </h3>
            <p className="text-xs text-slate-500">Contact & delivery address</p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-slate-600 hover:text-teal-700 flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={13} />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Address Line 2 (optional)
            </label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <X size={12} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Check size={12} />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3.5 text-xs">
          {/* Customer Name */}
          <div className="flex items-start gap-2.5">
            <User size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {customer.fullName || order.fullName}
              </p>
              {customer.userId && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Registered User
                </span>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="flex items-start gap-2.5">
            <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="text-slate-700 leading-relaxed">
              <p>{customer.addressLine1 || order.addressLine1}</p>
              {(customer.addressLine2 || order.addressLine2) && (
                <p className="text-slate-500">
                  {customer.addressLine2 || order.addressLine2}
                </p>
              )}
              <p className="font-medium text-slate-800">
                {customer.postalCode || order.postalCode}{" "}
                {customer.city || order.city}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={14} className="text-slate-400 shrink-0" />
              {customerEmail ? (
                <a
                  href={`mailto:${customerEmail}`}
                  className="text-teal-700 hover:underline truncate font-medium"
                  title={customerEmail}
                >
                  {customerEmail}
                </a>
              ) : (
                <span className="text-slate-400 italic">No email resolved</span>
              )}
            </div>
            {customerEmail && (
              <button
                type="button"
                onClick={() => handleCopy(customerEmail, "email")}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
                title="Copy Email"
              >
                {copiedEmail ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 min-w-0">
              <Phone size={14} className="text-slate-400 shrink-0" />
              {customer.phoneNumber || order.phoneNumber ? (
                <a
                  href={`tel:${customer.phoneNumber || order.phoneNumber}`}
                  className="text-slate-700 hover:underline truncate font-medium"
                >
                  {customer.phoneNumber || order.phoneNumber}
                </a>
              ) : (
                <span className="text-slate-400 italic">No phone number</span>
              )}
            </div>
            {(customer.phoneNumber || order.phoneNumber) && (
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    customer.phoneNumber || order.phoneNumber,
                    "phone",
                  )
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
                title="Copy Phone"
              >
                {copiedPhone ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
