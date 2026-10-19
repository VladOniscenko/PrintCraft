import admin from "../locales/en/admin.json";
import breadcrumb from "../locales/en/breadcrumb.json";
import cityPage from "../locales/en/cityPage.json";
import colors from "../locales/en/colors.json";
import common from "../locales/en/common.json";
import faq from "../locales/en/faq.json";
import filamentPainting from "../locales/en/filamentPainting.json";
import footer from "../locales/en/footer.json";
import forgot from "../locales/en/forgot.json";
import hero from "../locales/en/hero.json";
import home from "../locales/en/home.json";
import legal from "../locales/en/legal.json";
import login from "../locales/en/login.json";
import materials from "../locales/en/materials.json";
import modelFiles from "../locales/en/modelFiles.json";
import modelViewer from "../locales/en/modelViewer.json";
import models from "../locales/en/models.json";
import nav from "../locales/en/nav.json";
import notFound from "../locales/en/notFound.json";
import orderDetail from "../locales/en/orderDetail.json";
import orderStatus from "../locales/en/orderStatus.json";
import orders from "../locales/en/orders.json";
import profile from "../locales/en/profile.json";
import quote from "../locales/en/quote.json";
import recent from "../locales/en/recent.json";
import reset from "../locales/en/reset.json";
import root from "../locales/en/root.json";
import seo from "../locales/en/seo.json";
import shipping from "../locales/en/shipping.json";
import signup from "../locales/en/signup.json";
import viewer3d from "../locales/en/viewer3d.json";

export const canonicalTranslations = {
  ...root,
  admin,
  breadcrumb,
  cityPage,
  colors,
  common,
  faq,
  filamentPainting,
  footer,
  forgot,
  hero,
  home,
  legal,
  login,
  materials,
  modelFiles,
  modelViewer,
  models,
  nav,
  notFound,
  orderDetail,
  orderStatus,
  orders,
  profile,
  quote,
  recent,
  reset,
  seo,
  shipping,
  signup,
  viewer3d,
};

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8];

export type Leaves<T, D extends number = 6> = [D] extends [never]
  ? never
  : T extends string | number | boolean
    ? ""
    : T extends object
      ? {
          [K in keyof T & string]: Leaves<T[K], Prev[D]> extends ""
            ? `${K}`
            : `${K}.${Leaves<T[K], Prev[D]>}`;
        }[keyof T & string]
      : never;

export type TranslationSchema = typeof canonicalTranslations;
export type TranslationKey = Leaves<TranslationSchema>;

export type TranslationNamespace =
  | "admin"
  | "breadcrumb"
  | "cityPage"
  | "colors"
  | "common"
  | "faq"
  | "filamentPainting"
  | "footer"
  | "forgot"
  | "hero"
  | "home"
  | "legal"
  | "login"
  | "materials"
  | "modelFiles"
  | "modelViewer"
  | "models"
  | "nav"
  | "notFound"
  | "orderDetail"
  | "orderStatus"
  | "orders"
  | "profile"
  | "quote"
  | "recent"
  | "reset"
  | "seo"
  | "shipping"
  | "signup"
  | "viewer3d";

