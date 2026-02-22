import { renderHTML } from "openapi-renderer";

export default defineEventHandler(() => {
  return renderHTML({
    renderer: "scalar",
    spec: "/api/_openapi.json",
    meta: {
      title: "JS.GS API Reference",
    },
  });
});
