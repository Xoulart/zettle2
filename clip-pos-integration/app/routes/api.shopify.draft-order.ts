import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Body esperado desde la POS extension (puedes mandar lineItems reales después)
type Body = {
  customerEmail?: string;
  currency?: string;
  paymentId?: string;
  note?: string;
  items?: Array<{ title: string; quantity: number; price: number }>;
};

const DRAFT_ORDER_CREATE = `#graphql
mutation DraftOrderCreate($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder {
      id
      name
      invoiceUrl
    }
    userErrors { field message }
  }
}
`;

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ ok: false, message: "Method not allowed" }, { status: 405 });
  }

  const { admin } = await authenticate.admin(request);
  const body = (await request.json()) as Body;

  const items = body.items ?? [
    { title: "POS Sale (placeholder)", quantity: 1, price: 0 },
  ];

  const lineItems = items.map((i) => ({
    title: i.title,
    quantity: i.quantity,
    originalUnitPrice: i.price, // en la moneda de la tienda
  }));

  const notePieces = [
    body.note ?? "",
    body.paymentId ? `ZETTLE_PAYMENT_ID=${body.paymentId}` : "",
  ].filter(Boolean);

  const input: any = {
    email: body.customerEmail,
    note: notePieces.join("\n"),
    lineItems,
  };

  const resp = await admin.graphql(DRAFT_ORDER_CREATE, { variables: { input } });
  const data = await resp.json();

  const result = data?.data?.draftOrderCreate;
  const errors = result?.userErrors ?? [];

  if (errors.length) {
    return json({ ok: false, message: errors.map((e: any) => e.message).join("; ") }, { status: 400 });
  }

  return json({
    ok: true,
    draftOrderId: result.draftOrder.id,
    draftOrderName: result.draftOrder.name,
    invoiceUrl: result.draftOrder.invoiceUrl,
  });
}
