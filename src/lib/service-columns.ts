export type ServiceColType = "text" | "integer";

export type ServiceColDef = {
  key: string;
  type: ServiceColType;
  notNull?: boolean;
};

// Mirrors the live `services` table columns. Keep this in sync with the
// INSERT column list in src/pages/api/admin/services/save.ts whenever a
// migration adds or removes a services column. `updated_at`/`created_at`
// are intentionally excluded — they're always server-generated.
export const SERVICE_COLUMNS: ServiceColDef[] = [
  { key: "id",                     type: "text",    notNull: true },
  { key: "slug",                   type: "text" },
  { key: "service_group",          type: "text" },
  { key: "name",                   type: "text",    notNull: true },
  { key: "description",            type: "text" },
  { key: "price_cents",            type: "integer", notNull: true },
  { key: "active",                 type: "integer", notNull: true },
  { key: "featured",               type: "integer", notNull: true },
  { key: "bulk_discount_eligible", type: "integer", notNull: true },
  { key: "bulk_discount_percent",  type: "integer", notNull: true },
  { key: "bulk_discount_min",      type: "integer", notNull: true },
  { key: "tags",                   type: "text" },
  { key: "notes",                  type: "text" },
  { key: "primary_image_key",      type: "text" },
  { key: "requires_group",         type: "integer", notNull: true },
  { key: "requires_service_id",    type: "text" },
  { key: "service_options",        type: "text" },
  { key: "stock",                  type: "integer", notNull: true },
  { key: "total_stock",            type: "integer", notNull: true },
  { key: "out_of_stock",           type: "integer", notNull: true },
];

export const SERVICE_COLUMN_KEYS = SERVICE_COLUMNS.map((c) => c.key);
