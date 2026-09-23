import {PrivyClient} from "@privy-io/node";import {headers} from "next/headers";
function client(){const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID,appSecret=process.env.PRIVY_APP_SECRET;if(!appId||!appSecret)throw new Error("Privy server credentials are not configured");return new PrivyClient({appId,appSecret});}
export async function requirePrivyUserId(){const h=await headers();const raw=h.get("authorization");const token=raw?.startsWith("Bearer ")?raw.slice(7):null;if(!token)throw new Error("Authentication required");const claims=await client().verifyAuthToken(token);return claims.userId;}
