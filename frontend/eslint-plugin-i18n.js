const USER_FACING_ATTRIBUTES = new Set([
  "placeholder",
  "title",
  "aria-label",
  "aria-placeholder",
  "aria-description",
  "alt",
  "label",
  "helperText",
  "tooltip",
]);

const SYMBOL_OR_NUMBER_ONLY = /^[\d\s.,:/\-–—•%€$#+*()&;×|✓✔✕✖_<>="'`\\~^@[\]{}]+$/;
const HAS_WORD = /[a-zA-Z]{2,}/;
const IS_URL_OR_PATH = /^(https?:\/\/|\/api\/|\/)/;

const EXEMPT_TECHNICAL_WORDS = new Set([
  // Units of measurement
  "mm", "cm", "m", "g", "kg", "px", "rem", "em", "s", "ms", "min", "h", "hz", "khz",
  // Digital storage units
  "b", "kb", "mb", "gb", "tb",
  // Common 3D formats and technologies
  "stl", "3mf", "obj", "step", "stp", "glb", "gltf", "fdm", "sla", "sls",
  // Materials & trademarks
  "pla", "petg", "tpu", "abs", "asa", "pc", "hueforge",
  // Technical identifiers & acronyms
  "id", "url", "pdf", "vat", "bic", "iban",
]);


function isExemptString(val) {
  if (!val || typeof val !== "string") return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (SYMBOL_OR_NUMBER_ONLY.test(trimmed)) return true;
  if (IS_URL_OR_PATH.test(trimmed)) return true;

  // Extract all alphabetic words
  const words = trimmed.match(/[a-zA-Z]+/g);
  if (!words || words.length === 0) return true;

  // If every word in the string is a recognized technical unit / acronym, exempt it
  if (words.every((w) => EXEMPT_TECHNICAL_WORDS.has(w.toLowerCase()))) {
    return true;
  }

  return false;
}



function getCalleeName(node) {
  if (!node) return "";
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    const object = getCalleeName(node.object);
    const property = getCalleeName(node.property);
    return object ? `${object}.${property}` : property;
  }
  return "";
}

const noHardcodedJsx = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded user-facing text and attributes in JSX/TSX",
    },
    schema: [],
    messages: {
      hardcodedJsxText:
        "Hardcoded user-facing text '{{text}}' in JSX. Use t(\"...\") from useI18n() instead.",
      hardcodedJsxExpression:
        "Hardcoded user-facing string expression '{{text}}' in JSX. Use t(\"...\") from useI18n() instead.",
      hardcodedJsxAttribute:
        "Hardcoded user-facing attribute '{{attribute}}=\"{{value}}\"' in JSX. Use t(\"...\") from useI18n() instead.",
    },
  },
  create(context) {
    return {
      JSXText(node) {
        const text = node.value.trim();
        if (isExemptString(text)) return;
        if (HAS_WORD.test(text)) {
          context.report({
            node,
            messageId: "hardcodedJsxText",
            data: { text: text.length > 40 ? text.slice(0, 37) + "..." : text },
          });
        }
      },

      JSXExpressionContainer(node) {
        // Only inspect if parent is JSXElement (i.e. child text), not an attribute
        if (node.parent && node.parent.type !== "JSXElement") return;
        const expr = node.expression;
        if (expr && expr.type === "Literal" && typeof expr.value === "string") {
          const text = expr.value.trim();
          if (isExemptString(text)) return;
          if (HAS_WORD.test(text)) {
            context.report({
              node: expr,
              messageId: "hardcodedJsxExpression",
              data: { text: text.length > 40 ? text.slice(0, 37) + "..." : text },
            });
          }
        }
      },

      JSXAttribute(node) {
        const attrName = node.name && node.name.name;
        if (!attrName || !USER_FACING_ATTRIBUTES.has(attrName)) return;

        // Decorative alt="" is allowed
        if (attrName === "alt" && node.value && node.value.type === "Literal" && node.value.value === "") {
          return;
        }

        // Direct literal value: placeholder="Search"
        if (node.value && node.value.type === "Literal" && typeof node.value.value === "string") {
          const val = node.value.value.trim();
          if (isExemptString(val)) return;
          if (HAS_WORD.test(val)) {
            context.report({
              node: node.value,
              messageId: "hardcodedJsxAttribute",
              data: {
                attribute: attrName,
                value: val.length > 30 ? val.slice(0, 27) + "..." : val,
              },
            });
          }
        }

        // Expression literal: placeholder={"Search"}
        if (
          node.value &&
          node.value.type === "JSXExpressionContainer" &&
          node.value.expression &&
          node.value.expression.type === "Literal" &&
          typeof node.value.expression.value === "string"
        ) {
          const val = node.value.expression.value.trim();
          if (isExemptString(val)) return;
          if (HAS_WORD.test(val)) {
            context.report({
              node: node.value.expression,
              messageId: "hardcodedJsxAttribute",
              data: {
                attribute: attrName,
                value: val.length > 30 ? val.slice(0, 27) + "..." : val,
              },
            });
          }
        }
      },
    };
  },
};

const UI_FUNCTION_NAMES = new Set([
  "notify",
  "notifySuccess",
  "notifyError",
  "notifyInfo",
  "toast",
  "toast.success",
  "toast.error",
  "toast.warning",
  "toast.info",
  "setError",
  "setFormError",
  "setErrorMessage",
  "setFileError",
  "alert",
  "window.alert",
  "confirm",
  "window.confirm",
  "prompt",
  "window.prompt",
]);

const noHardcodedUiStrings = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded user-facing strings in UI APIs like toast, notify, alert, confirm",
    },
    schema: [],
    messages: {
      hardcodedCall:
        "Hardcoded user-facing string '{{text}}' passed to {{callee}}(). Use t(\"...\") from useI18n() instead.",
      hardcodedTemplate:
        "Hardcoded user-facing string template passed to {{callee}}(). Use t(\"...\", vars) from useI18n() instead.",
      hardcodedTitle:
        "Hardcoded document.title '{{text}}'. Use translation keys or SeoManager instead.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = getCalleeName(node.callee);
        if (!UI_FUNCTION_NAMES.has(callee)) return;

        // For notify("success", message) or notify("error", message), the message is arg[1]
        // For other functions, message is arg[0]
        const argIndex = callee === "notify" && node.arguments.length >= 2 ? 1 : 0;
        const targetArg = node.arguments[argIndex];
        if (!targetArg) return;

        if (targetArg.type === "Literal" && typeof targetArg.value === "string") {
          const val = targetArg.value.trim();
          if (isExemptString(val)) return;
          if (HAS_WORD.test(val)) {
            context.report({
              node: targetArg,
              messageId: "hardcodedCall",
              data: {
                callee,
                text: val.length > 35 ? val.slice(0, 32) + "..." : val,
              },
            });
          }
        } else if (targetArg.type === "TemplateLiteral") {
          const hasHardcodedText = targetArg.quasis.some(
            (q) => !isExemptString(q.value.raw) && HAS_WORD.test(q.value.raw)
          );
          if (hasHardcodedText) {
            context.report({
              node: targetArg,
              messageId: "hardcodedTemplate",
              data: { callee },
            });
          }
        }
      },

      AssignmentExpression(node) {
        const left = node.left;
        if (
          left.type === "MemberExpression" &&
          getCalleeName(left.object) === "document" &&
          getCalleeName(left.property) === "title"
        ) {
          const right = node.right;
          if (right.type === "Literal" && typeof right.value === "string") {
            const val = right.value.trim();
            if (isExemptString(val)) return;
            if (HAS_WORD.test(val)) {
              context.report({
                node: right,
                messageId: "hardcodedTitle",
                data: { text: val.length > 35 ? val.slice(0, 32) + "..." : val },
              });
            }
          }
        }
      },
    };
  },
};

export default {
  meta: {
    name: "eslint-plugin-i18n",
    version: "1.0.0",
  },
  rules: {
    "no-hardcoded-jsx": noHardcodedJsx,
    "no-hardcoded-ui-strings": noHardcodedUiStrings,
  },
};
