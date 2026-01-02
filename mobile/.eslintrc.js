module.exports = {
  root: true,
  extends: ['@react-native'],
  rules: {
    // Avoid mass reformat churn; keep lint focused on correctness.
    'prettier/prettier': 'off',
  },
};
