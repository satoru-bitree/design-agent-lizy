// Ambient declarations for side-effect / asset imports that Next's bundled
// types don't cover. Next only ships `*.module.css` typings (see
// node_modules/next/types/global.d.ts), so a plain `import "./globals.css"`
// has no declaration and stricter TS setups report TS2882
// ("Cannot find module or type declarations for side-effect import").
declare module "*.css";
