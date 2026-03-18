// Allow CSS file imports (e.g. from @xterm/xterm)
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
