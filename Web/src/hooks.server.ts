import type { Handle } from "@sveltejs/kit";
import { routeApexRequest } from "$lib/server/relay-router";

/** Route Relay-owned apex paths before SvelteKit handles family-site routes. */
export const handle: Handle = async ({ event, resolve }) => {
	const relayResponse = await routeApexRequest(
		event.request,
		() => event.platform?.env.RELAY_SERVICE,
	);
	return relayResponse ?? resolve(event);
};
