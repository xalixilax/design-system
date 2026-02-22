await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },
});
