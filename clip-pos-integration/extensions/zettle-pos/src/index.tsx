import {
  reactExtension,
  Button,
  Screen,
  Text,
  Stack,
  useApi,
  useCart,
} from "@shopify/ui-extensions-react/point-of-sale";
import { useMemo, useState } from "react";

type PaymentResponse = {
  ok: boolean;
  paymentId?: string;
  message?: string;
};

const EXTENSION = "pos.action.render";

export default reactExtension(EXTENSION, () => <ZettlePayAction />);

function ZettlePayAction() {
  const api = useApi();
  const cart = useCart();

  const [status, setStatus] = useState<
    "idle" | "processing" | "approved" | "declined" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const total = useMemo(() => {
    const amount =
      // @ts-expect-error - POS cart shape can vary
      cart?.cost?.totalAmount?.amount ??
      // @ts-expect-error - fallback
      cart?.total?.amount ??
      0;

    const currency =
      // @ts-expect-error - POS cart shape can vary
      cart?.cost?.totalAmount?.currencyCode ??
      // @ts-expect-error - fallback
      cart?.total?.currencyCode ??
      "MXN";

    return { amount: Number(amount), currency: String(currency) };
  }, [cart]);

  async function onPay() {
    setStatus("processing");
    setError(null);
    setPaymentId(null);

    try {
      const res = await fetch("/api/zettle/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total.amount,
          currency: total.currency,
        }),
      });

      const data = (await res.json()) as PaymentResponse;

      if (!data.ok) {
        setStatus("declined");
        setError(data.message ?? "Payment declined");
        return;
      }
      await fetch("/api/shopify/draft-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: data.paymentId,
          note: "Created from POS action",
          items: [
            { title: "POS Sale (placeholder)", quantity: 1, price: total.amount },
          ],
        }),
      });
      setPaymentId(data.paymentId ?? null);
      setStatus("approved");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Unexpected error");
    }
  }

  return (
    <Screen name="Zettle Pay">
      <Stack spacing="loose">
        <Text variant="titleLarge">Cobrar con Zettle</Text>
        <Text>
          Total: {total.amount.toFixed(2)} {total.currency}
        </Text>

        {status === "idle" && <Button onPress={onPay}>Cobrar ahora</Button>}

        {status === "processing" && <Text>Procesando pago…</Text>}

        {status === "approved" && (
          <>
            <Text variant="titleMedium">✅ Pago aprobado</Text>
            {paymentId ? <Text>Payment ID: {paymentId}</Text> : null}
            <Button onPress={() => api.navigation.dismiss()}>Cerrar</Button>
          </>
        )}

        {status === "declined" && (
          <>
            <Text variant="titleMedium">❌ Pago rechazado</Text>
            {error ? <Text>{error}</Text> : null}
            <Button onPress={() => setStatus("idle")}>Intentar de nuevo</Button>
          </>
        )}

        {status === "error" && (
          <>
            <Text variant="titleMedium">⚠️ Error</Text>
            {error ? <Text>{error}</Text> : null}
            <Button onPress={() => setStatus("idle")}>Reintentar</Button>
          </>
        )}
      </Stack>
    </Screen>
  );
}
