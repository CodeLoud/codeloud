import { describe, expect, it } from "vitest";
import { routeApexRequest, type RelayServiceBinding } from "$lib/server/relay-router";

const RELAY_ORIGIN = "https://relay.codeloud.xyz";

function serviceBinding(
	handler: (request: Request) => Response | Promise<Response>,
): RelayServiceBinding {
	return { fetch: handler };
}

describe("CodeLoud apex Relay routing", () => {
	it("leaves family-site paths with SvelteKit", async () => {
		const result = await routeApexRequest(new Request("https://codeloud.xyz/relay"), () => {
			throw new Error("family-site routes must not read platform bindings during prerendering");
		});

		expect(result).toBeNull();
	});

	it("forwards MCP requests through the service binding on Relay's canonical origin", async () => {
		const forwarded: Request[] = [];
		const response = new Response("relay mcp", {
			status: 202,
			headers: { "x-relay": "bound" },
		});
		const result = await routeApexRequest(
			new Request("https://codeloud.xyz/mcp?cursor=next", {
				method: "POST",
				headers: {
					authorization: "Bearer relay_pat_test",
					"content-type": "application/json",
					host: "codeloud.xyz",
				},
				body: '{"jsonrpc":"2.0"}',
			}),
			() =>
				serviceBinding((request) => {
					forwarded.push(request);
					return response;
				}),
		);

		expect(result).toBe(response);
		const forwardedRequest = forwarded[0];
		if (!forwardedRequest) throw new Error("expected a forwarded request");
		expect(forwardedRequest.url).toBe(`${RELAY_ORIGIN}/mcp?cursor=next`);
		expect(forwardedRequest.method).toBe("POST");
		expect(forwardedRequest.headers.get("authorization")).toBe("Bearer relay_pat_test");
		expect(forwardedRequest.headers.get("host")).toBe("relay.codeloud.xyz");
		expect(await forwardedRequest.text()).toBe('{"jsonrpc":"2.0"}');
	});

	it.each([
		"/.well-known/oauth-protected-resource/mcp",
		"/.well-known/oauth-authorization-server/api/auth",
		"/.well-known/openid-configuration/api/auth",
	])("forwards Relay metadata path %s", async (pathname) => {
		let forwardedUrl = "";
		const result = await routeApexRequest(new Request(`https://codeloud.xyz${pathname}`), () =>
			serviceBinding((request) => {
				forwardedUrl = request.url;
				return new Response("metadata");
			}),
		);

		expect(result?.status).toBe(200);
		expect(forwardedUrl).toBe(`${RELAY_ORIGIN}${pathname}`);
	});

	it.each([
		"/account",
		"/login",
		"/signup",
		"/consent",
		"/workspace-select",
		"/beta/status",
		"/beta/review",
		"/apply",
		"/api/auth/get-session",
		"/api/beta/status",
		"/api/relay/workspaces",
	])("redirects stateful Relay path %s to its canonical host", async (pathname) => {
		const result = await routeApexRequest(
			new Request(`https://codeloud.xyz${pathname}?from=apex`),
			() => {
				throw new Error("redirect routes do not require the service binding");
			},
		);

		expect(result?.status).toBe(307);
		expect(result?.headers.get("location")).toBe(`${RELAY_ORIGIN}${pathname}?from=apex`);
		expect(result?.headers.get("cache-control")).toBe("no-store");
	});

	it("fails closed when the Relay binding is unavailable", async () => {
		const result = await routeApexRequest(new Request("https://codeloud.xyz/mcp"), () => undefined);

		expect(result).toMatchObject({ status: 503 });
		expect(result?.headers.get("cache-control")).toBe("no-store");
		expect(result?.headers.get("retry-after")).toBe("30");
	});

	it("turns a rejected binding call into a bounded unavailable response", async () => {
		const result = await routeApexRequest(new Request("https://codeloud.xyz/mcp"), () =>
			serviceBinding(() => Promise.reject(new Error("binding unavailable"))),
		);

		expect(result).toMatchObject({ status: 503 });
		expect(await result?.text()).toBe("Relay is temporarily unavailable.");
	});
});
