const RELAY_ORIGIN = "https://relay.codeloud.xyz";
const RELAY_UNAVAILABLE_BODY = "Relay is temporarily unavailable.";

const SERVICE_PATH_PREFIXES = [
	"/.well-known/oauth-protected-resource",
	"/.well-known/oauth-authorization-server",
	"/.well-known/openid-configuration",
] as const;

const REDIRECT_PATHS = new Set([
	"/account",
	"/apply",
	"/beta/review",
	"/beta/status",
	"/consent",
	"/login",
	"/signup",
	"/workspace-select",
]);

const REDIRECT_PATH_PREFIXES = ["/api/auth", "/api/beta", "/api/relay"] as const;

type RelayApexRoute = "service" | "redirect" | "web";

/** Minimal Worker Service Binding contract required by the apex router. */
export interface RelayServiceBinding {
	fetch(request: Request): Response | Promise<Response>;
}

/** Resolve the binding only after routing selects a service-owned path. */
export type RelayServiceBindingResolver = () => RelayServiceBinding | undefined;

/**
 * Route one apex request to Relay or leave it for the CodeLoud family site.
 * Stateful browser and API paths redirect to Relay's canonical host so auth
 * cookies and OAuth callbacks never split across two origins.
 */
export async function routeApexRequest(
	request: Request,
	resolveRelay: RelayServiceBindingResolver,
): Promise<Response | null> {
	const url = new URL(request.url);
	switch (classifyRelayRoute(url.pathname)) {
		case "web":
			return null;
		case "redirect":
			return redirectToRelay(url);
		case "service": {
			const relay = resolveRelay();
			if (!relay) return relayUnavailable();
			try {
				return await relay.fetch(canonicalRelayRequest(request, url));
			} catch {
				console.error("relay service binding request failed", {
					pathname: url.pathname,
				});
				return relayUnavailable();
			}
		}
	}
}

function classifyRelayRoute(pathname: string): RelayApexRoute {
	if (pathname === "/mcp" || matchesAnyPrefix(pathname, SERVICE_PATH_PREFIXES)) return "service";
	if (REDIRECT_PATHS.has(pathname) || matchesAnyPrefix(pathname, REDIRECT_PATH_PREFIXES))
		return "redirect";
	return "web";
}

function matchesAnyPrefix(pathname: string, prefixes: readonly string[]): boolean {
	return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function canonicalRelayRequest(request: Request, requestUrl: URL): Request {
	const target = canonicalRelayUrl(requestUrl);
	const forwarded = new Request(target, request);
	forwarded.headers.set("host", target.host);
	return forwarded;
}

function canonicalRelayUrl(requestUrl: URL): URL {
	const target = new URL(requestUrl.pathname, RELAY_ORIGIN);
	target.search = requestUrl.search;
	return target;
}

function redirectToRelay(requestUrl: URL): Response {
	return new Response(null, {
		status: 307,
		headers: {
			"cache-control": "no-store",
			location: canonicalRelayUrl(requestUrl).toString(),
		},
	});
}

function relayUnavailable(): Response {
	return new Response(RELAY_UNAVAILABLE_BODY, {
		status: 503,
		headers: {
			"cache-control": "no-store",
			"content-type": "text/plain; charset=utf-8",
			"retry-after": "30",
		},
	});
}
