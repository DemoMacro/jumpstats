import type { BetterAuthPlugin } from "better-auth";
import { createDomain } from "./routes/create-domain";
import { deleteDomain } from "./routes/delete-domain";
import { getDomain } from "./routes/get-domain";
import { listDomains } from "./routes/list-domains";
import { updateDomain } from "./routes/update-domain";
import { verifyDomain } from "./routes/verify-domain";

export const domain = () => {
  return {
    id: "domain",
    schema: {
      domain: {
        fields: {
          domainName: {
            type: "string",
            required: true,
            unique: true,
            index: true,
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
          status: {
            type: "string",
            required: true,
            defaultValue: "pending",
          },
          verificationToken: {
            type: "string",
            required: false,
          },
          verifiedAt: {
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
        modelName: "domain",
      },
    },
    endpoints: {
      createDomain: createDomain(),
      getDomain: getDomain(),
      listDomains: listDomains(),
      updateDomain: updateDomain(),
      deleteDomain: deleteDomain(),
      verifyDomain: verifyDomain(),
    },
  } satisfies BetterAuthPlugin;
};
