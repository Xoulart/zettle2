import { redirect } from "@remix-run/node";

export async function loader() {
  const base = process.env.ZETTLE_OAUTH_BASE_URL!;
  const clientId = process.env.ZETTLE_OAUTH_CLIENT_ID!;
  const redirectUri = process.env.ZETTLE_REDIRECT_URI!;
  const scopes = process.env.ZETTLE_SCOPES ?? "";

  const state = String(Date.now());

  const url = new URL("/authorize", base);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);

  return redirect(url.toString());
}
