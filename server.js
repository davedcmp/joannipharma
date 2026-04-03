"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT_DIR = __dirname;
const RESOURCES_DIR = path.join(ROOT_DIR, "Resources");
const VENDORS_FILE = path.join(RESOURCES_DIR, "vendors.json");
const INVENTORY_FILE = path.join(RESOURCES_DIR, "inventory.json");

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
};

const ensureDataFiles = () => {
	if (!fs.existsSync(RESOURCES_DIR)) {
		fs.mkdirSync(RESOURCES_DIR, { recursive: true });
	}

	if (!fs.existsSync(VENDORS_FILE)) {
		fs.writeFileSync(VENDORS_FILE, "[]", "utf8");
	}

	if (!fs.existsSync(INVENTORY_FILE)) {
		fs.writeFileSync(INVENTORY_FILE, "[]", "utf8");
	}
};

const sendJson = (res, statusCode, payload) => {
	res.writeHead(statusCode, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
	});
	res.end(JSON.stringify(payload));
};

const readJsonFile = (filePath) => {
	try {
		const raw = fs.readFileSync(filePath, "utf8");
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const writeJsonFile = (filePath, data) => {
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

const readRequestBody = (req) =>
	new Promise((resolve, reject) => {
		let body = "";

		req.on("data", (chunk) => {
			body += chunk;
			if (body.length > 1024 * 1024) {
				reject(new Error("Payload too large"));
			}
		});

		req.on("end", () => {
			resolve(body);
		});

		req.on("error", reject);
	});

const serveStatic = (req, res) => {
	const requestPath = req.url === "/" ? "/index.html" : req.url;
	const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^([.][.][/\\])+/, "");
	const filePath = path.join(ROOT_DIR, safePath);

	if (!filePath.startsWith(ROOT_DIR)) {
		res.writeHead(403);
		res.end("Forbidden");
		return;
	}

	fs.stat(filePath, (err, stats) => {
		if (err || !stats.isFile()) {
			res.writeHead(404);
			res.end("Not found");
			return;
		}

		const ext = path.extname(filePath).toLowerCase();
		res.writeHead(200, {
			"Content-Type": MIME_TYPES[ext] || "application/octet-stream",
			"Cache-Control": "no-store",
		});
		fs.createReadStream(filePath).pipe(res);
	});
};

const server = http.createServer(async (req, res) => {
	ensureDataFiles();

	console.log(`${req.method} ${req.url}`);

	if (req.url === "/api/vendors") {
		if (req.method === "GET") {
			sendJson(res, 200, readJsonFile(VENDORS_FILE));
			return;
		}

		if (req.method === "POST") {
			try {
				const body = await readRequestBody(req);
				const parsed = JSON.parse(body || "[]");
				if (!Array.isArray(parsed)) {
					sendJson(res, 400, { error: "Expected array" });
					return;
				}

				writeJsonFile(VENDORS_FILE, parsed);
				sendJson(res, 200, { ok: true });
			} catch {
				sendJson(res, 400, { error: "Invalid JSON payload" });
			}
			return;
		}

		res.writeHead(405);
		res.end("Method not allowed");
		return;
	}

	if (req.url === "/api/inventory") {
		if (req.method === "GET") {
			sendJson(res, 200, readJsonFile(INVENTORY_FILE));
			return;
		}

		if (req.method === "POST") {
			try {
				const body = await readRequestBody(req);
				const parsed = JSON.parse(body || "[]");
				if (!Array.isArray(parsed)) {
					sendJson(res, 400, { error: "Expected array" });
					return;
				}

				writeJsonFile(INVENTORY_FILE, parsed);
				sendJson(res, 200, { ok: true });
			} catch {
				sendJson(res, 400, { error: "Invalid JSON payload" });
			}
			return;
		}

		res.writeHead(405);
		res.end("Method not allowed");
		return;
	}

	serveStatic(req, res);
});

server.listen(PORT, () => {
	console.log(`Expiration Tracker server running at http://localhost:${PORT}`);
});
