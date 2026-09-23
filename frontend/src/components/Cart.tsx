import { useState, useEffect } from "react";
import { ArrowRight, Loader2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import type { Filament } from "../types";
import { useI18n } from "../i18n/I18nContext";
import { useNotify } from "../context/NotifyContext";
import {
  normalizeShippingInfo,
  validateShippingInfo,
} from "../utils/shippingValidation";
import CartItemsSection from "./cart/CartItemsSection";
import CheckoutSidebar from "./cart/CheckoutSidebar";
import type { ShippingAddress } from "./cart/types";

const DELIVERY_PRICE = 6.95;

export default function CheckoutPage() {
  const { t } = useI18n();
  const { notifyError, notifySuccess } = useNotify();
  const {
    cart,
    removeFromCart,
    updateCartItem,
    loading: cartLoading,
    error,
  } = useCart();

  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    city: "",
    postalCode: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const navigate = useNavigate();
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.count, 0);
  const total = subtotal + DELIVERY_PRICE;
  const materials = Array.from(new Set(filaments.map((f) => f.material)));

  useEffect(() => {
    if (error && error.includes("Your cart was updated elsewhere")) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const fetchFilaments = async () => {
      try {
        const res = await api.get("/filaments");
        setFilaments(res.data);
      } catch (err) {
        console.error("Failed to fetch filaments", err);
      }
    };
    fetchFilaments();
  }, []);

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handleUpdate = async (
    itemId: string,
    field: "material" | "color" | "count",
    value: string | number,
  ) => {
    try {
      const item = cart.find((i) => i.id === itemId);
      if (!item) return;

      const updatedCount = field === "count" ? Number(value) : item.count;
      const updatedMaterial =
        field === "material" ? String(value) : item.material;
      let updatedColor = field === "color" ? String(value) : item.color;

      if (field === "material") {
        updatedColor = filaments.find((f) => f.material === value)?.color || "";
      }

      await updateCartItem(itemId, updatedCount, updatedMaterial, updatedColor);
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  };

  const validateForm = (): boolean => {
    const errors = validateShippingInfo(address, t);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      notifyError(t("cart.empty"));
      return;
    }

    if (!validateForm()) {
      notifyError(t("quote.invalidShipping"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = normalizeShippingInfo(address);
      const res = await api.post("/payments/create", payload);

      navigate(`/orders/${res.data.orderId}`);
      notifySuccess(
        "Order created. Please complete the bank transfer using the instructions on your order.",
      );
    } catch (err) {
      console.error("Checkout Error:", err);
      notifyError(t("cart.checkoutFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <Loader2
            className="animate-spin text-emerald-600 mb-4 mx-auto"
            size={48}
          />
          <p className="text-gray-500">{t("cart.loading")}</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm inline-block">
            <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("cart.empty")}
            </h2>
            <p className="text-gray-500 mb-8">{t("cart.emptyDesc")}</p>
            <button
              onClick={() => navigate("/products")}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto"
            >
              {t("cart.goGallery")} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <Navbar />
      {showError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold animate-fade-in">
          {t("cart.conflict")}
        </div>
      )}
      <main className="site-main px-4 sm:px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingCart className="text-emerald-600" size={32} />
          {t("cart.finalize")}
        </h2>

        <form
          onSubmit={handleCheckout}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            <CartItemsSection
              cart={cart}
              filaments={filaments}
              materials={materials}
              t={t}
              onRemoveItem={handleRemoveItem}
              onUpdate={handleUpdate}
            />
          </div>

          <div className="space-y-6">
            <CheckoutSidebar
              subtotal={subtotal}
              deliveryPrice={DELIVERY_PRICE}
              total={total}
              address={address}
              validationErrors={validationErrors}
              isSubmitting={isSubmitting}
              cartLoading={cartLoading}
              t={t}
              onAddressChange={setAddress}
            />
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
