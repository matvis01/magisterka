// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

// Provide a default export for build tooling expecting a module entry
export default function bootstrap() {
	mount(() => <StartClient />, document.getElementById("app")!);
}

// Also auto-run when directly loaded in browser
if (typeof window !== 'undefined') {
	bootstrap();
}
