import type { BetterAuthPlugin } from "better-auth";
import { createLink } from "./routes/create-link";
import { deleteLink } from "./routes/delete-link";
import { getAnalytics } from "./routes/get-analytics";
import { getLink } from "./routes/get-link";
import { listLinks } from "./routes/list-links";
import { listEvents } from "./routes/list-events";
import { updateLink } from "./routes/update-link";

export const link = () => {
  return {
    id: "link",
    schema: {
      link: {
        fields: {
          domainId: {
            type: "string",
            required: false,
            references: {
              model: "domain",
              field: "id",
              onDelete: "set null",
            },
            index: true,
          },
          shortCode: {
            type: "string",
            required: true,
            index: true,
          },
          originalUrl: {
            type: "string",
            required: true,
          },
          userId: {
            type: "string",
            required: false,
            references: {
              model: "user",
              field: "id",
              onDelete: "set null",
            },
            index: true,
          },
          organizationId: {
            type: "string",
            required: false,
            references: {
              model: "organization",
              field: "id",
              onDelete: "set null",
            },
            index: true,
          },
          title: {
            type: "string",
            required: false,
          },
          description: {
            type: "string",
            required: false,
          },
          status: {
            type: "string",
            required: true,
            defaultValue: "active",
          },
          expiresAt: {
            type: "date",
            required: false,
          },
          createdAt: {
            type: "date",
            required: true,
          },
          updatedAt: {
            type: "date",
            required: true,
          },
        },
        modelName: "link",
      },
    },
    endpoints: {
      createLink: createLink(),
      getAnalytics: getAnalytics(),
      getLink: getLink(),
      listLinks: listLinks(),
      listEvents: listEvents(),
      updateLink: updateLink(),
      deleteLink: deleteLink(),
    },
  } satisfies BetterAuthPlugin;
};
