import { useEffect, useState } from "react";
import {
  User,
  Lock,
  MapPin,
  Save,
  Loader2,
  Mail,
  Phone,
  Plus,
  Edit2,
  Trash2,
  Star,
  Shield,
} from "lucide-react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import api from "../../services/api";
import { useI18n } from "../../i18n/I18nContext";
import { useNotify } from "../../context/NotifyContext";

export interface UserData {
  id: string;
  name: string;
  email: string;
}

export interface AddressData {
  id?: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  label: string;
  isDefault: boolean;
}

const emptyAddress: AddressData = {
  fullName: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  label: "",
  isDefault: false,
};

export default function Profile() {
  const { t } = useI18n();
  const { notifySuccess, notifyError } = useNotify(); // Using your global notification context

  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    id: "",
    name: "",
    email: "",
  });

  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [currentAddress, setCurrentAddress] =
    useState<AddressData>(emptyAddress);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfileData = async () => {
    try {
      // 1. Fetch User Data
      const userResponse = await api.get("/auth/me");
      setUserData({
        id: userResponse.data.id,
        name: userResponse.data.name,
        email: userResponse.data.email,
      });

      // 2. Fetch All Addresses
      const addressesResponse = await api.get("/me/addresses");
      setAddresses(addressesResponse.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const openNewAddressForm = () => {
    setCurrentAddress({ ...emptyAddress, fullName: userData.name });
    setIsAddressFormOpen(true);
  };

  const openEditAddressForm = (address: AddressData) => {
    setCurrentAddress(address);
    setIsAddressFormOpen(true);
  };

  const closeAddressForm = () => {
    setIsAddressFormOpen(false);
    setCurrentAddress(emptyAddress);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);

    try {
      const payload = {
        fullName: currentAddress.fullName || userData.name,
        phoneNumber: currentAddress.phoneNumber,
        addressLine1: currentAddress.addressLine1,
        addressLine2: currentAddress.addressLine2,
        city: currentAddress.city,
        postalCode: currentAddress.postalCode,
        label: currentAddress.label || "Home",
        isDefault: currentAddress.isDefault || addresses.length === 0, // Make default if it's the first one
      };

      if (currentAddress.id) {
        await api.put(`/me/addresses/${currentAddress.id}`, payload);
      } else {
        await api.post("/me/addresses", payload);
      }

      await fetchProfileData(); // Refresh list
      notifySuccess(t("profile.updateSuccess")); // Show success toast
      closeAddressForm();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      notifyError(backendMessage || t("profile.updateError")); // Show backend error or fallback toast
      console.error(error);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm(t("profile.deleteConfirm"))) return;

    try {
      await api.delete(`/me/addresses/${id}`);
      await fetchProfileData();
      notifySuccess(t("profile.addressDeleted"));
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      notifyError(backendMessage || t("profile.deleteError"));
      console.error(error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/me/addresses/${id}/default`);
      await fetchProfileData();
      notifySuccess(t("profile.defaultAddressSuccess"));
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      notifyError(backendMessage || t("profile.updateDefaultError"));
      console.error(error);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notifyError(t("profile.passwordMismatch"));
      return;
    }

    setSavingPassword(true);

    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      notifySuccess(t("profile.passwordSuccess"));
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      // This will grab the "Incorrect current password" from your C# backend!
      const backendMessage = error?.response?.data?.message;
      notifyError(backendMessage || t("profile.passwordError"));
      console.error(error);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="site-shell bg-gray-50/30 min-h-screen flex flex-col">
      <Navbar />

      <main className="site-main max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-grow w-full">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="site-heading text-3xl font-bold tracking-tight text-gray-900">
              {t("profile.title")}
            </h1>
            <p className="site-subheading mt-1 text-gray-500">
              {t("profile.subtitle")}
            </p>
          </div>
          <div className="hidden sm:block p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <User size={32} className="text-emerald-600" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
            <p className="font-medium">{t("profile.loading")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Personal & Address Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Account Overview Card */}
              <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <User size={20} className="text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("profile.personalDetails")}
                  </h2>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        {t("profile.accountName")}
                      </label>
                      <input
                        type="text"
                        value={userData.name}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />{" "}
                        {t("profile.email")}
                      </label>
                      <input
                        type="email"
                        value={userData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Book Card */}
              <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                      <MapPin size={20} className="text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {t("profile.addressBook")}
                    </h2>
                  </div>
                  {!isAddressFormOpen && (
                    <button
                      onClick={openNewAddressForm}
                      className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Plus size={16} />{" "}
                      {t("profile.addNewAddress")}
                    </button>
                  )}
                </div>

                <div className="p-8">
                  {isAddressFormOpen ? (
                    /* Form View */
                    <form onSubmit={handleSaveAddress} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            {t("profile.addressLabel")}
                          </label>
                          <input
                            type="text"
                            name="label"
                            placeholder={t("profile.labelPlaceholder")}
                            value={currentAddress.label}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            {t("profile.recipientName")}
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={currentAddress.fullName}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />{" "}
                            {t("profile.phone")}
                          </label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={currentAddress.phoneNumber}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            {t("profile.addressLine1")}
                          </label>
                          <input
                            type="text"
                            name="addressLine1"
                            value={currentAddress.addressLine1}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            {t("profile.addressLine2")}
                          </label>
                          <input
                            type="text"
                            name="addressLine2"
                            value={currentAddress.addressLine2}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            {t("profile.city")}
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={currentAddress.city}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            {t("profile.postalCode")}
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={currentAddress.postalCode}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={closeAddressForm}
                          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                          {t("profile.cancel")}
                        </button>
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="flex-2 flex justify-center items-center gap-2 bg-[#133827] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#1c4d37] transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {savingAddress ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                          {t("profile.saveChanges")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* List View */
                    <div className="space-y-4">
                      {addresses.length === 0 ? (
                        <div className="text-center py-10">
                          <MapPin
                            size={40}
                            className="mx-auto text-gray-200 mb-3"
                          />
                          <p className="text-gray-500">
                            {t("profile.noAddresses")}
                          </p>
                        </div>
                      ) : (
                        addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`p-5 rounded-2xl border-2 transition-all ${address.isDefault ? "border-emerald-500 bg-emerald-50/30" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-bold text-gray-900">
                                    {address.label || t("profile.defaultAddressLabel")}
                                  </h4>
                                  {address.isDefault && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Star size={10} fill="currentColor" />{" "}
                                      {t("profile.defaultBadge")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                  {address.fullName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {address.addressLine1} {address.addressLine2}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {address.postalCode} {address.city}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {address.phoneNumber}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditAddressForm(address)}
                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteAddress(address.id!)
                                    }
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                {!address.isDefault && (
                                  <button
                                    onClick={() =>
                                      handleSetDefault(address.id!)
                                    }
                                    className="text-xs font-bold text-gray-400 hover:text-gray-900 underline underline-offset-2"
                                  >
                                    {t("profile.makeDefault")}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Password Change */}
            <div className="lg:col-span-1">
              <form
                onSubmit={handleUpdatePassword}
                className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden sticky top-6"
              >
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <Lock size={20} className="text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("profile.security")}
                  </h2>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      {t("profile.currentPassword")}
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      {t("profile.newPassword")}
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      {t("profile.confirmPassword")}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {savingPassword ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Shield size={18} />
                    )}
                    {t("profile.updatePassword")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
