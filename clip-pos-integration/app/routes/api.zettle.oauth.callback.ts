import { json } from "@remix-run/node";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return json({ ok: false, error }, { status: 400 });
  if (!code) return json({ ok: false, error: "Missing code" }, { status: 400 });

  const tokenUrl = new URL("/token", process.env.ZETTLE_OAUTH_BASE_URL!).toString();

  const clientId = process.env.ZETTLE_OAUTH_CLIENT_ID!;
  const clientSecret = process.env.ZETTLE_OAUTH_CLIENT_SECRET!;
  const redirectUri = process.env.ZETTLE_REDIRECT_URI!;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    return json({ ok: false, status: resp.status, data }, { status: 400 });
  }

  // TODO: save access_token / refresh_token to database or session
  return json({ ok: true, state, token: data });
}
