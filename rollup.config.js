import nodeResolve from 'rollup-plugin-node-resolve';
import babel       from 'rollup-plugin-babel';
import replace     from 'rollup-plugin-replace';
import commonjs    from 'rollup-plugin-commonjs';
import uglify      from 'rollup-plugin-uglify';
import copy from 'rollup-plugin-copy';

const env = process.env.NODE_ENV;

const config = {
  input: 'src/index.js',
  external: ['react', 'react-dom'],
  output: {
    format: 'umd',
    name: 'npmPackageES6Boilerplate',
  },

  plugins: [
    copy({
      verbose: true,
      "src/builtins.json": "lib/builtins.json",
      "src/OntologyStorage.json": "lib/OntologyStorage.json",
      "src/PropositionLedger.json": "lib/PropositionLedger.json",
      "src/RlayToken.json": "lib/RlayToken.json",
    }),
    nodeResolve(),
    babel({
      exclude: '**/node_modules/**',
      runtimeHelpers: true,
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    commonjs(),
  ],
};

if (env === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false,
      },
    }),
  );
}

export default config;
