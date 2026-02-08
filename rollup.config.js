const resolve=require('@rollup/plugin-node-resolve');
const commonjs=require('@rollup/plugin-commonjs');
const terser=require('@rollup/plugin-terser');

const isProduction=process.env.NODE_ENV==='production';

module.exports=[
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'auto'
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      isProduction&&terser()
    ].filter(Boolean),
    external: ['axios','form-data']
  },
  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.mjs',
      format: 'es'
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      isProduction&&terser()
    ].filter(Boolean),
    external: ['axios','form-data']
  }
];
