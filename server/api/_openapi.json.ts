import { auth } from "~~/server/utils/auth";

export default defineEventHandler(async () => {
  const openAPISchema = await auth.api.generateOpenAPISchema();

  return {
    ...openAPISchema,
    info: {
      title: "JS.GS API Reference",
    },
  };
});
