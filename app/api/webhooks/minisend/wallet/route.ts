import{createHmac,timingSafeEqual}from"crypto";import{NextResponse}from"next/server";

export const runtime="nodejs";

function signatureIsValid(raw:string,signature:string){
  const secret=process.env.MINISEND_WEBHOOK_SECRET;
  if(!secret)return false;
  const expected=createHmac("sha256",secret).update(raw,"utf8").digest("hex");
  const normalized=signature.replace(/^sha256=/i,"").trim();
  try{
    const a=Buffer.from(normalized,"hex"),b=Buffer.from(expected,"hex");
    return a.length===b.length&&timingSafeEqual(a,b);
  }catch{return false}
}

export async function POST(req:Request){
  const raw=await req.text();
  const signature=req.headers.get("x-minisend-signature")||"";

  if(!process.env.MINISEND_WEBHOOK_SECRET){
    return NextResponse.json({error:"MiniSend webhook secret is not configured"},{status:503});
  }
  if(!signatureIsValid(raw,signature)){
    return NextResponse.json({error:"Invalid MiniSend signature"},{status:401});
  }

  let payload:any;
  try{payload=JSON.parse(raw)}catch{
    return NextResponse.json({error:"Invalid JSON payload"},{status:400});
  }

  const event=String(payload?.event||payload?.type||payload?.event_type||"unknown");
  return NextResponse.json({ok:true,received:true,event});
}
