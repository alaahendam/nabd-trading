import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { afterAll, describe, it } from 'vitest';

import { mobileRules } from './mobile-rules.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const rules = mobileRules.rules;

tester.run('no-physical-direction (LNT-01)', rules['no-physical-direction'], {
  valid: [
    {
      name: 'logical keys in a style sheet',
      code: `StyleSheet.create({ box: { marginStart: 4, paddingEnd: 8, start: 0, end: 0 } });`,
    },
    {
      name: 'textAlign auto and center',
      code: `StyleSheet.create({ a: { textAlign: 'auto' }, b: { textAlign: 'center' } });`,
    },
    { name: 'a key called left outside any style', code: `const point = { left: 1, right: 2 };` },
    { name: 'a non-string key', code: `StyleSheet.create({ box: { [name]: 1 } });` },
    { name: 'a numeric key', code: `StyleSheet.create({ box: { 1: 1 } });` },
    {
      name: 'logical keys in a style prop',
      code: `const a = <View style={{ marginStart: 1 }} />;`,
    },
    { name: 'another call named create', code: `Other.create({ box: { left: 1 } });` },
    {
      name: 'a style sheet through a computed callee',
      code: `StyleSheet[create]({ box: { left: 1 } });`,
    },
    { name: 'a prop that is not style', code: `const a = <View other={{ left: 1 }} />;` },
  ],
  invalid: [
    {
      name: 'marginLeft in a style sheet',
      code: `StyleSheet.create({ box: { marginLeft: 4 } });`,
      errors: [{ messageId: 'key', data: { name: 'marginLeft', use: 'marginStart' } }],
    },
    {
      name: 'every physical key is caught, in a style prop too',
      code: `const a = <View style={[{ left: 0 }, { paddingRight: 1 }, { borderTopRightRadius: 2 }]} />;`,
      errors: [
        { messageId: 'key', data: { name: 'left', use: 'start' } },
        { messageId: 'key', data: { name: 'paddingRight', use: 'paddingEnd' } },
        { messageId: 'key', data: { name: 'borderTopRightRadius', use: 'borderTopEndRadius' } },
      ],
    },
    {
      name: 'a quoted key',
      code: `StyleSheet.create({ box: { 'marginRight': 4 } });`,
      errors: [{ messageId: 'key', data: { name: 'marginRight', use: 'marginEnd' } }],
    },
    {
      name: "textAlign 'left'",
      code: `StyleSheet.create({ text: { textAlign: 'left' } });`,
      errors: [{ messageId: 'textAlign', data: { value: 'left' } }],
    },
    {
      name: "textAlign 'right'",
      code: `const a = <Text style={{ textAlign: 'right' }} />;`,
      errors: [{ messageId: 'textAlign', data: { value: 'right' } }],
    },
  ],
});

tester.run('require-accessibility (LNT-02)', rules['require-accessibility'], {
  valid: [
    {
      name: 'a Pressable with role and label',
      code: `import { Pressable } from 'react-native';
const a = <Pressable accessibilityRole="button" accessibilityLabel="Add" />;`,
    },
    {
      name: 'the aria forms',
      code: `import { Pressable } from 'react-native';
const a = <Pressable role="button" aria-label="Add" />;`,
    },
    {
      name: 'a TextInput needs only a label',
      code: `import { TextInput } from 'react-native';
const a = <TextInput aria-label="Search" />;`,
    },
    {
      name: 'a renamed import is still checked',
      code: `import { Pressable as Tap } from 'react-native';
const a = <Tap role="button" aria-labelledby="title" />;`,
    },
    {
      name: 'a namespaced attribute does not count as a role or a label',
      code: `import { Pressable } from 'react-native';
const a = <Pressable xml:lang="en" role="button" aria-label="Add" />;`,
    },
    {
      name: 'a spread may carry the props',
      code: `import { Pressable } from 'react-native';
const a = <Pressable {...props} />;`,
    },
    {
      name: "the app's own Button is not React Native's",
      code: `import { Button } from '../shared/ui';
const a = <Button label="Add" />;`,
    },
    {
      name: 'a component that is not a control',
      code: `import { View } from 'react-native';
const a = <View />;`,
    },
    {
      name: 'a namespaced element',
      code: `import { Pressable } from 'react-native';
const a = <Pressable.Inner />;`,
    },
    {
      name: 'a default import is not checked',
      code: `import RN from 'react-native';
const a = <RN.Pressable />;`,
    },
    {
      name: 'an import from somewhere else with the same name',
      code: `import { Pressable } from 'other-library';
const a = <Pressable />;`,
    },
  ],
  invalid: [
    {
      name: 'a Pressable with nothing',
      code: `import { Pressable } from 'react-native';
const a = <Pressable />;`,
      errors: [{ messageId: 'missing', data: { name: 'Pressable', needs: 'a role and a label' } }],
    },
    {
      name: 'a label but no role',
      code: `import { TouchableOpacity } from 'react-native';
const a = <TouchableOpacity accessibilityLabel="Add" />;`,
      errors: [{ messageId: 'missing', data: { name: 'TouchableOpacity', needs: 'a role' } }],
    },
    {
      name: 'a role but no label',
      code: `import { Switch } from 'react-native';
const a = <Switch role="switch" />;`,
      errors: [{ messageId: 'missing', data: { name: 'Switch', needs: 'a label' } }],
    },
    {
      name: 'a TextInput with no label',
      code: `import { TextInput } from 'react-native';
const a = <TextInput placeholder="Search" />;`,
      errors: [{ messageId: 'missing', data: { name: 'TextInput', needs: 'a label' } }],
    },
    {
      name: 'a renamed import is checked under its local name',
      code: `import { Button as Tap } from 'react-native';
const a = <Tap title="Go" />;`,
      errors: [{ messageId: 'missing', data: { name: 'Tap', needs: 'a role and a label' } }],
    },
  ],
});
