import { pgTable, uuid, text, timestamp, numeric, integer, boolean, pgEnum, primaryKey } from "drizzle-orm/pg-core";

export const splitMode=pgEnum("split_mode",["equal","percentage"]);
export const tabStatus=pgEnum("tab_status",["active","closing","locked","settling","settled"]);
export const memberStatus=pgEnum("member_status",["pending","active","inactive","removed"]);
export const expenseStatus=pgEnum("expense_status",["active","disputed","void"]);
export const approvalKind=pgEnum("approval_kind",["join","inactive","remove","close"]);
export const fundingStatus=pgEnum("funding_status",["quoted","pending","completed","released","failed","expired"]);

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
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(), lockedAt:timestamp("locked_at",{withTimezone:true}), recurrence:text("recurrence")
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
export const claimStatus=pgEnum("claim_status",["draft","claiming","review","approved","cancelled"]);
export const receiptClaims=pgTable("receipt_claims",{
 id:uuid("id").defaultRandom().primaryKey(),tabId:uuid("tab_id").references(()=>tabs.id,{onDelete:"cascade"}).notNull(),
 payerId:uuid("payer_id").references(()=>users.id).notNull(),merchant:text("merchant"),receiptImageUrl:text("receipt_image_url"),
 currency:text("currency").notNull(),receiptTotal:numeric("receipt_total",{precision:18,scale:2}).notNull(),status:claimStatus("status").default("draft").notNull(),allocationVersion:integer("allocation_version").default(1).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),finalizedAt:timestamp("finalized_at",{withTimezone:true})
});
export const receiptItems=pgTable("receipt_items",{
 id:uuid("id").defaultRandom().primaryKey(),claimId:uuid("claim_id").references(()=>receiptClaims.id,{onDelete:"cascade"}).notNull(),
 label:text("label").notNull(),quantity:numeric("quantity",{precision:10,scale:3}).default("1").notNull(),
 unitPrice:numeric("unit_price",{precision:18,scale:2}),lineTotal:numeric("line_total",{precision:18,scale:2}).notNull(),
 extractionConfidence:numeric("extraction_confidence",{precision:5,scale:4}),position:integer("position").notNull()
});
export const itemClaims=pgTable("item_claims",{
 itemId:uuid("item_id").references(()=>receiptItems.id,{onDelete:"cascade"}).notNull(),userId:uuid("user_id").references(()=>users.id).notNull(),
 shareQuantity:numeric("share_quantity",{precision:10,scale:3}).default("1").notNull(),claimedAt:timestamp("claimed_at",{withTimezone:true}).defaultNow().notNull()
},t=>[primaryKey({columns:[t.itemId,t.userId]})]);
export const receiptApprovals=pgTable("receipt_approvals",{
 claimId:uuid("claim_id").references(()=>receiptClaims.id,{onDelete:"cascade"}).notNull(),userId:uuid("user_id").references(()=>users.id).notNull(),allocationVersion:integer("allocation_version").notNull(),
 approvedAt:timestamp("approved_at",{withTimezone:true}).defaultNow().notNull()
},t=>[primaryKey({columns:[t.claimId,t.userId]})]);
export const fundingOrders=pgTable("funding_orders",{
 id:uuid("id").defaultRandom().primaryKey(),userId:uuid("user_id").references(()=>users.id).notNull(),provider:text("provider").notNull(),providerOrderId:text("provider_order_id").unique(),externalReference:text("external_reference").unique().notNull(),currency:text("currency").notNull(),amountLocal:numeric("amount_local",{precision:18,scale:2}),feeLocal:numeric("fee_local",{precision:18,scale:2}),amountUsdc:numeric("amount_usdc",{precision:18,scale:6}).notNull(),rate:numeric("rate",{precision:24,scale:10}),destinationAddress:text("destination_address").notNull(),releaseChain:text("release_chain").notNull().default("base"),status:fundingStatus("status").default("quoted").notNull(),receiptNumber:text("receipt_number"),releaseTxHash:text("release_tx_hash"),failureReason:text("failure_reason"),createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),updatedAt:timestamp("updated_at",{withTimezone:true}).defaultNow().notNull()
});


export const tabWallets=pgTable("tab_wallets",{
 id:uuid("id").defaultRandom().primaryKey(),
 userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull().unique(),
 provider:text("provider").notNull().default("minisend"),
 providerWalletId:text("provider_wallet_id"),
 walletRef:text("wallet_ref").unique().notNull(),
 chain:text("chain").notNull(),
 address:text("address").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).defaultNow().notNull()
});

export const walletDeposits=pgTable("wallet_deposits",{
 id:uuid("id").defaultRandom().primaryKey(),
 userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
 walletId:uuid("wallet_id").references(()=>tabWallets.id,{onDelete:"set null"}),
 providerEventId:text("provider_event_id").unique().notNull(),
 walletRef:text("wallet_ref").notNull(),
 chain:text("chain").notNull(),
 token:text("token").notNull().default("USDC"),
 amount:numeric("amount",{precision:18,scale:6}).notNull(),
 txHash:text("tx_hash"),
 status:text("status").notNull().default("received"),
 rawPayload:text("raw_payload"),
 receivedAt:timestamp("received_at",{withTimezone:true}).defaultNow().notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});


export const savedGroups=pgTable("saved_groups",{
 id:uuid("id").defaultRandom().primaryKey(),ownerId:uuid("owner_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),name:text("name").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const savedGroupMembers=pgTable("saved_group_members",{
 groupId:uuid("group_id").references(()=>savedGroups.id,{onDelete:"cascade"}).notNull(),userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull()
},t=>[primaryKey({columns:[t.groupId,t.userId]})]);
export const paymentReminders=pgTable("payment_reminders",{
 id:uuid("id").defaultRandom().primaryKey(),tabId:uuid("tab_id").references(()=>tabs.id,{onDelete:"cascade"}).notNull(),senderId:uuid("sender_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),debtorId:uuid("debtor_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
