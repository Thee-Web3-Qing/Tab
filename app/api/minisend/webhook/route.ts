import{GET as health,POST as receive}from"../../webhooks/minisend/route";
export const runtime="nodejs";
export async function GET(){return health()}
export async function POST(req:Request){return receive(req)}
