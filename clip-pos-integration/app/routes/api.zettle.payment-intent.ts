import { json } from "@remix-run/node";

type Body = {
  amount: number;
  currency: string;
};

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ ok: false, message: "Method not allowed" }, { status: 405 });
  }

  const body = (await request.json()) as Body;
  const amount = Number(body.amount ?? 0);
  const currency = String(body.currency ?? "MXN");

  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ ok: false, message: "Invalid amount" }, { status: 400 });
  }

  const paymentId = `mock_${Date.now()}`;
  return json({ ok: true, paymentId, message: `Mock approved ${amount} ${currency}` });
}
