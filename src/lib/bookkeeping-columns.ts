export type BookkeepingColType = "text" | "integer";

export type BookkeepingColDef = {
  key: string;
  type: BookkeepingColType;
  notNull?: boolean;
};

// Mirrors the live `bookkeeping` table columns — see db/2026-06-19_stock_bookkeeping.sql.
// `created_at`/`updated_at` are intentionally excluded — always server-generated.
export const BOOKKEEPING_COLUMNS: BookkeepingColDef[] = [
  { key: "id",           type: "text",    notNull: true },
  { key: "type",         type: "text",    notNull: true },
  { key: "service_id",   type: "text" },
  { key: "name",         type: "text",    notNull: true },
  { key: "amount_cents", type: "integer", notNull: true },
  { key: "quantity",     type: "integer", notNull: true },
  { key: "total_cents",  type: "integer", notNull: true },
  { key: "order_id",     type: "text" },
  { key: "notes",        type: "text" },
  { key: "occurred_at",  type: "text",    notNull: true },
];
