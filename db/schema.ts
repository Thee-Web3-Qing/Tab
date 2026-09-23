import { pgTable, uuid, text, timestamp, numeric, integer, boolean, pgEnum, primaryKey } from "drizzle-orm/pg-core";

export const splitMode=pgEnum("split_mode",["equal","percentage"]);
export const tabStatus=pgEnum("tab_status",["active","closing","locked","settling","settled"]);
export const memberStatus=pgEnum("member_status",["pending","active","inactive","removed"]);
export const expenseStatus=pgEnum("expense_status",["active","disputed","void"]);
export const approvalKind=pgEnum("approval_kind",["join","inactive","remove","close"]);

export const users=pgTable("users",{
 id:uuid("id").defaultRandom().primaryKey(), privyId:text("privy_id").unique(), name:text("name").notNull(),
 email:text("email"), preferredCurrency:text("preferred_currency").notNull().default("NGN"),
 walletAddress:text("wallet_address"), createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const tabs=pgTable("tabs",{
 id:uuid("id").defaultRandom().primaryKey(), name:text("name").notNull(), emoji:text("emoji"),
 creatorId:uuid("creator_id").references(()=>users.id).notNull(), splitMode:splitMode("split_mode").notNull(),
 status:tabStatus("status").default("active").notNull(), ledgerVersion:integer("ledger_version").default(1).notNull(),
 inviteCode:text("invite_code").unique().notNull(), inviteGeneration:integer("invite_generation").default(1).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(), lockedAt:timestamp("locked_at",{withTimezone:true})
});
export const members=pgTable("tab_members",{
 tabId:uuid("tab_id").references(()=>tabs.id,{onDelete:"cascade"}).notNull(), userId:uuid("user_id").references(()=>users.id).notNull(),
 status:memberStatus("status").default("pending").notNull(), percentage:numeric("percentage",{precision:6,scale:3}),
 joinedAt:timestamp("joined_at",{withTimezone:true}), inactiveAt:timestamp("inactive_at",{withTimezone:true})
},t=>[primaryKey({columns:[t.tabId,t.userId]})]);
export const expenses=pgTable("expenses",{
 id:uuid("id").defaultRandom().primaryKey(), tabId:uuid("tab_id").references(()=>tabs.id,{onDelete:"cascade"}).notNull(),
 payerId:uuid("payer_id").references(()=>users.id).notNull(), description:text("description").notNull(), category:text("category"),
 originalAmount:numeric("original_amount",{precision:18,scale:2}).notNull(), originalCurrency:text("original_currency").notNull(),
 fxRateToUsd:numeric("fx_rate_to_usd",{precision:24,scale:10}).notNull(), lockedUsdValue:numeric("locked_usd_value",{precision:18,scale:6}).notNull(),
 paidAt:timestamp("paid_at",{withTimezone:true}).notNull(), fxTimestamp:timestamp("fx_timestamp",{withTimezone:true}).notNull(),
 proofUrl:text("proof_url"), status:expenseStatus("status").default("active").notNull(), createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const beneficiaries=pgTable("expense_beneficiaries",{
 expenseId:uuid("expense_id").references(()=>expenses.id,{onDelete:"cascade"}).notNull(), userId:uuid("user_id").references(()=>users.id).notNull()
},t=>[primaryKey({columns:[t.expenseId,t.userId]})]);
export const disputes=pgTable("disputes",{
 id:uuid("id").defaultRandom().primaryKey(), expenseId:uuid("expense_id").references(()=>expenses.id,{onDelete:"cascade"}).notNull(),
 raisedBy:uuid("raised_by").references(()=>users.id).notNull(), reason:text("reason").notNull(), note:text("note"), resolved:boolean("resolved").default(false).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(), resolvedAt:timestamp("resolved_at",{withTimezone:true})
});
export const approvals=pgTable("approvals",{
 id:uuid("id").defaultRandom().primaryKey(), tabId:uuid("tab_id").references(()=>tabs.id,{onDelete:"cascade"}).notNull(),
 userId:uuid("user_id").references(()=>users.id).notNull(), kind:approvalKind("kind").notNull(), subjectUserId:uuid("subject_user_id").references(()=>users.id),
 ledgerVersion:integer("ledger_version").notNull(), approvedAt:timestamp("approved_at",{withTimezone:true}).defaultNow().notNull()
});
export const settlements=pgTable("settlements",{
 id:uuid("id").defaultRandom().primaryKey(), tabId:uuid("tab_id").references(()=>tabs.id).notNull(), fromUserId:uuid("from_user_id").references(()=>users.id).notNull(),
 toUserId:uuid("to_user_id").references(()=>users.id).notNull(), amountUsd:numeric("amount_usd",{precision:18,scale:6}).notNull(),
 amountUsdc:numeric("amount_usdc",{precision:18,scale:6}).notNull(), arcTxHash:text("arc_tx_hash"), settledAt:timestamp("settled_at",{withTimezone:true})
});