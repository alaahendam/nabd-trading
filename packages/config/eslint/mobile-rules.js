/**
 * Two lint rules for the mobile app that no published plugin offers.
 *
 * - `no-physical-direction`: styles say start and end, never left and right, so the layout
 *   mirrors by itself in right-to-left languages (Arabic).
 * - `require-accessibility`: a control that comes from React Native has a role and a label, so a
 *   screen reader can say what it is and what it does.
 */

/** Physical style keys and the logical key to use in their place. */
/** @type {Record<string, string>} */
const PHYSICAL_KEYS = {
  left: 'start',
  right: 'end',
  marginLeft: 'marginStart',
  marginRight: 'marginEnd',
  paddingLeft: 'paddingStart',
  paddingRight: 'paddingEnd',
  borderLeftWidth: 'borderStartWidth',
  borderRightWidth: 'borderEndWidth',
  borderLeftColor: 'borderStartColor',
  borderRightColor: 'borderEndColor',
  borderTopLeftRadius: 'borderTopStartRadius',
  borderTopRightRadius: 'borderTopEndRadius',
  borderBottomLeftRadius: 'borderBottomStartRadius',
  borderBottomRightRadius: 'borderBottomEndRadius',
};

/** @param {any} property The ESLint AST; its JSX nodes have no published types. */
const keyName = (property) => {
  if (property.computed) {
    return undefined;
  }
  if (property.key.type === 'Identifier') {
    return property.key.name;
  }
  return property.key.type === 'Literal' && typeof property.key.value === 'string'
    ? property.key.value
    : undefined;
};

/** @param {any} callee The ESLint AST; its JSX nodes have no published types. */
const isStyleSheetCreate = (callee) =>
  callee.type === 'MemberExpression' &&
  !callee.computed &&
  callee.object.type === 'Identifier' &&
  callee.object.name === 'StyleSheet' &&
  callee.property.type === 'Identifier' &&
  callee.property.name === 'create';

/** Is this node inside `StyleSheet.create(...)` or a JSX `style` attribute? */
/** @param {any} node The ESLint AST; its JSX nodes have no published types. */
const inStyle = (node) => {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === 'CallExpression' && isStyleSheetCreate(current.callee)) {
      return true;
    }
    if (
      current.type === 'JSXAttribute' &&
      current.name.type === 'JSXIdentifier' &&
      current.name.name === 'style'
    ) {
      return true;
    }
  }
  return false;
};

/** @type {import('eslint').Rule.RuleModule} */
const noPhysicalDirection = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      key: "'{{name}}' is a physical direction and does not mirror in right-to-left. Use '{{use}}'.",
      textAlign:
        "textAlign '{{value}}' is a physical direction. Use 'auto', which follows the language, or 'center'.",
    },
  },
  /** @param {any} context The rule context. */
  create: (context) => ({
    /** @param {any} node A property of an object literal. */
    Property(node) {
      if (node.parent.type !== 'ObjectExpression' || !inStyle(node)) {
        return;
      }
      const name = keyName(node);
      if (name !== undefined && Object.hasOwn(PHYSICAL_KEYS, name)) {
        context.report({ node, messageId: 'key', data: { name, use: PHYSICAL_KEYS[name] } });
        return;
      }
      if (
        name === 'textAlign' &&
        node.value.type === 'Literal' &&
        (node.value.value === 'left' || node.value.value === 'right')
      ) {
        context.report({ node, messageId: 'textAlign', data: { value: node.value.value } });
      }
    },
  }),
};

/** Components that need a role and a label, and the ones that only need a label. */
const ROLE_AND_LABEL = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
  'Button',
  'Switch',
]);
const LABEL_ONLY = new Set(['TextInput']);
const ROLE_PROPS = ['accessibilityRole', 'role'];
const LABEL_PROPS = [
  'accessibilityLabel',
  'aria-label',
  'accessibilityLabelledBy',
  'aria-labelledby',
];

/** @type {import('eslint').Rule.RuleModule} */
const requireAccessibility = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      missing:
        '<{{name}}> needs {{needs}} so a screen reader can describe it (accessibilityRole and accessibilityLabel, or role and aria-label).',
    },
  },
  /** @param {any} context The rule context. */
  create: (context) => {
    // The names this file imported from react-native, by the local name they go by.
    const fromReactNative = new Map();
    return {
      /** @param {any} node An import declaration. */
      ImportDeclaration(node) {
        if (node.source.value !== 'react-native') {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            fromReactNative.set(specifier.local.name, specifier.imported.name);
          }
        }
      },
      /** @param {any} node A JSX opening element. */
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') {
          return;
        }
        const component = fromReactNative.get(node.name.name);
        const needsRole = component !== undefined && ROLE_AND_LABEL.has(component);
        const needsLabel = needsRole || (component !== undefined && LABEL_ONLY.has(component));
        if (!needsLabel) {
          return;
        }
        /** @type {any[]} */
        const attributes = node.attributes;
        // A spread may carry the props; it cannot be checked, so it is not an error.
        if (attributes.some((attribute) => attribute.type === 'JSXSpreadAttribute')) {
          return;
        }
        const given = new Set(
          attributes.flatMap((attribute) =>
            attribute.name.type === 'JSXIdentifier' ? [attribute.name.name] : [],
          ),
        );
        const hasRole = ROLE_PROPS.some((name) => given.has(name));
        const hasLabel = LABEL_PROPS.some((name) => given.has(name));
        if ((needsRole && !hasRole) || !hasLabel) {
          const needs =
            needsRole && !hasRole && !hasLabel
              ? 'a role and a label'
              : hasLabel
                ? 'a role'
                : 'a label';
          context.report({ node, messageId: 'missing', data: { name: node.name.name, needs } });
        }
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
export const mobileRules = {
  meta: { name: 'nabd-mobile' },
  rules: {
    'no-physical-direction': noPhysicalDirection,
    'require-accessibility': requireAccessibility,
  },
};
