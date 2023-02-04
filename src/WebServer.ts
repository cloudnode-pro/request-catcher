import Main from "./Main";
import http from "node:http";
import https from "node:https";
import * as net from "node:net";
import * as crypto from "node:crypto";
import * as io from "socket.io";
import Mustache from "mustache";

/**
 * Web server
 * @class
 * @implements Main
 */
export default class WebServer {
    /**
     * Main instance
     * @readonly
     */
    public readonly main: Main;

    /**
     * Ports to listen on
     * @readonly
     */
    public readonly ports: {http: number, https?: number};

    /**
     * SSL/TLS certificate
     * @readonly
     */
    public readonly cert?: Buffer;

    /**
     * SSL/TLS private key
     * @readonly
     */
    public readonly key?: Buffer;

    /**
     * Web servers
     * @readonly
     */
    public readonly servers: {http: http.Server, https?: https.Server, websocket: io.Server};

    /**
     * Map socket remote port -> request ID
     * @readonly
     */
    public readonly connections = new Map<number, {req: string, time: number}>();

    /**
     * Static files
     * @example `{"/path/to/file.txt": {type: "text/plain", data: Buffer.from("Hello, world!")} }`
     * @readonly
     */
    public readonly staticFiles: Record<string, {type: string, data: Buffer}>;

    /**
     * Pre-processed home page
     * @readonly
     */
    public get home(): string {
        const home = this.staticFiles["/"];
        if (home) return Mustache.render(home.data.toString(), {
           random: crypto.randomBytes(18).toString("base64").replaceAll("/", "").slice(0, 16),
        });
        return "UI not available";
    }

    /**
     * Instantiate a new web server
     * @param main Main instance
     * @param staticFiles Static files
     * @param portHttp HTTP port
     * @param [portHttps=443] HTTPS port
     * @param [cert] SSL/TLS certificate
     * @param [key] SSL/TLS private key
     */
    public constructor(main: Main, staticFiles: Record<string, {type: string, data: Buffer}>, portHttp: number, portHttps = 443, cert?: Buffer, key?: Buffer) {
        this.main = main;
        this.staticFiles = staticFiles;
        this.ports = {http: portHttp, https: portHttps};
        this.cert = cert;
        this.key = key;

        const srv = {
            http: http.createServer(this.requestHandler.bind(this)),
            https: cert && key ? https.createServer({cert, key}, this.requestHandler.bind(this)) : undefined
        } as const;

        this.servers = {
            http: srv.http,
            https: srv.https,
            websocket: new io.Server(srv.https ?? srv.http)
        }

        this.servers.http.on("connection", this.connectionHandler.bind(this));
        if (this.servers.https) this.servers.https.on("secureConnection", this.connectionHandler.bind(this));

        this.servers.http.listen(portHttp);
        if (this.servers.https) this.servers.https.listen(portHttps);

        this.websocketHandler();
    }

    /**
     * Handle websocket connection
     * @private
     * @internal
     */
    private websocketHandler(): void {
        this.servers.websocket.on("connection", socket => {
            socket.on("namespace", (namespace: string) => {
                socket.join(namespace);
            });
        });
    }

    /**
     * Clean up old connections in map
     * @private
     * @internal
     */
    public cleanUpConnections(): void {
        const now = Date.now();
        for (const [port, {time}] of this.connections)
            if (now - time > 30000) this.connections.delete(port);
    }

    /**
     * Get request ID from incoming message
     * @param req Incoming message
     */
    public getRequestId(req: http.IncomingMessage): string | undefined {
        const socket = req.socket;
        const port = socket.remotePort;
        if (!port) return;
        const connection = this.connections.get(port);
        if (!connection) return;
        this.connections.delete(port);
        return connection.req;
    }

    /**
     * Request handler
     * @param req Request
     * @param res Response
     */
    public requestHandler(req: http.IncomingMessage, res: http.ServerResponse): void {
        if (!req.url) {
            res.writeHead(400, {"Content-Type": "text/plain"});
            res.end("bad request");
        }
        else if (req.url.startsWith("/s/")) return this.respondToSRequest(req, res);
        else if (req.url !== "/" && req.url in this.staticFiles) {
            const file = this.staticFiles[req.url!]!;
            res.writeHead(200, {"Content-Type": file.type});
            res.end(file.data);
        }
        else {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(this.home);
        }
    }

    /**
     * Respond to a /s/ request
     * @param req Request
     * @param res Response
     * @param [n=0] Number of retries
     */
    public respondToSRequest(req: http.IncomingMessage, res: http.ServerResponse, n = 0): void {
        const requestId = this.getRequestId(req);
        if (!requestId && n < 3) {
            setTimeout(() => this.respondToSRequest(req, res, n + 1), 50);
        }
        else if (!requestId) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.end("internal server error");
        }
        else {
            const namespace = req.url!.slice(3, req.url!.indexOf("?") === -1 ? undefined : req.url!.indexOf("?"));
            res.writeHead(204);
            res.end();
            this.servers.websocket.to(namespace).emit("end", requestId, req.rawHeaders, req.httpVersion, req.method, req.url, req.socket.localPort === this.ports.https ? "https" : "http");
        }
    }

    /**
     * Connection handler
     * @param socket Socket
     */
    public connectionHandler(socket: net.Socket): void {
        let socketId: string;
        let requestId: string;
        socket.on("data", (packet: Buffer) => {
            // first packet
            if (socket.bytesRead === packet.length) {
                const parts = packet.toString().split(" ");
                if (parts.length < 2) return;
                const url = parts[1]!;
                if (url.startsWith("/s/")) {
                    socketId = url.slice(3, url.indexOf("?") === -1 ? undefined : url.indexOf("?"));
                    requestId = crypto.randomBytes(18).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
                    const port = socket.remotePort;
                    if (port) this.connections.set(port, {req: requestId, time: Date.now()});
                    this.servers.websocket.to(socketId).emit("request", requestId, socketId, socket.remoteAddress, socket.localAddress, socket.localPort, new Date().toISOString());
                }
            }
            if (socketId) {
                this.servers.websocket.to(socketId).emit("data", requestId, packet);
            }
        });
    }
}