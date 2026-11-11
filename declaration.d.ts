// https://linguinecode.com/post/how-to-fix-cannot-find-module-css-scss-nextjs
// https://nextjs.org/docs/basic-features/typescript
/*
 * instead of editing next-env.d.ts, you can include additional types by adding a new file e.g. additional.d.ts and then referencing it in the include array in your tsconfig.json
 */


declare module '*.css';
declare module 'formik';