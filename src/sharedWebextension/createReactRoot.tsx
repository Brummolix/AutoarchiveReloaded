import { createRoot, Root } from "react-dom/client";

export function createReactRoot(): Root {
	const domNode = document.getElementById("react");
	if (domNode == null) {
		throw new Error("no element react");
	}
	return createRoot(domNode);
}
