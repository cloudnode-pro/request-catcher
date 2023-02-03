document.addEventListener("DOMContentLoaded", () => {
    const showScreen = (screen: string) => {
        const screenToShow = document.querySelector(`[data-screen="${screen}"]`);
        if (screenToShow) {
            const screens = document.querySelectorAll("[data-screen]");
            for (const s of screens) {
                s.classList.add("hidden");
                s.classList.remove("flex");
            }
            screenToShow.classList.remove("hidden");
            screenToShow.classList.add("flex");
        }
    }

    /**
     * Request
     * @class
     */
    class Request {
        /**
         * Request ID
         * @readonly
         */
        public readonly id: string;

        /**
         * Raw data
         * @readonly
         */
        public readonly data: string;

        /**
         * Headers
         * @readonly
         */
        public readonly headers: string[];

        /**
         * Request method
         * @readonly
         */
        public readonly method: string;

        /**
         * Request URL
         * @readonly
         */
        public readonly url: URL;

        /**
         * IP address of the client
         * @readonly
         */
        public readonly ip: string;

        /**
         * IP address of the server (the back-end of this service)
         * @readonly
         */
        public readonly serverIp: string;

        /**
         * Date the request was received
         * @readonly
         */
        public readonly date: Date;

        /**
         * Namespace of this request
         * @readonly
         */
        public readonly namespace: string;

        /**
         * HTTP version
         * @example 1.1
         * @readonly
         */
        public readonly httpVersion: string;

        /**
         * Instantiate a new request
         * @param id Request ID
         * @param data Raw data
         * @param headers Headers
         * @param method Request method
         * @param url Request URL
         * @param senderIp IP address of the client
         * @param serverIp IP address of the server (the back-end of this service)
         * @param date Date the request was received
         * @param namespace Namespace of this request
         * @param httpVersion HTTP version
         */
        public constructor(id: string, data: string, headers: string[], method: string, url: URL, senderIp: string, serverIp: string, date: Date, namespace: string, httpVersion: string) {
            this.id = id;
            this.data = data;
            this.headers = headers;
            this.method = method;
            this.url = url;
            this.ip = senderIp;
            this.serverIp = serverIp;
            this.date = date;
            this.namespace = namespace;
            this.httpVersion = httpVersion;
        }

        /**
         * Get body of the request
         * @readonly
         */
        public get body(): string | undefined {
            return this.data.split("\r\n\r\n")[1];
        }

        /**
         * Format request as plain object
         */
        public toObject(): Record<string, any> {
            return {
                id: this.id,
                data: this.data,
                headers: this.headers,
                method: this.method,
                url: this.url.toString(),
                ip: this.ip,
                serverIp: this.serverIp,
                date: this.date.toISOString(),
                namespace: this.namespace
            };
        }

        /**
         * Format this request as JSON string
         */
        public toJSON(): string {
            return JSON.stringify(this.toObject());
        }

        /**
         * Create a new request from a JSON string
         * @param json JSON string
         * @static
         */
        public static fromJSON(json: string): Request {
            const obj = JSON.parse(json);
            return new Request(obj.id, obj.data, obj.headers, obj.method, new URL(obj.url), obj.ip, obj.serverIp, new Date(obj.date), obj.namespace, obj.httpVersion);
        }
    }

    /**
     * Request storage
     * @class
     * @singleton
     */
    class RequestStorage {
        /**
         * Class instance
         * @private
         * @static
         * @internal
         */
        private static instance: RequestStorage;

        private constructor() {}

        /**
         * Get instance
         * @static
         */
        public static getInstance(): RequestStorage {
            return this.instance ??= new RequestStorage();
        }

        /**
         * Requests
         * @private
         * @readonly
         */
        private readonly requests: Request[] = [];

        /**
         * Add a request
         * @param request Request
         */
        public add(request: Request): void {
            this.requests.push(request);
            this.save();
        }

        /**
         * Get all requests for namespace
         * @param namespace Namespace
         */
        public getForNamespace(namespace: string): Request[] {
            return this.requests.filter(r => r.namespace === namespace);
        }

        /**
         * Delete request
         * @param id Request ID
         */
        public delete(id: string): void {
            this.requests.splice(this.requests.findIndex(r => r.id === id), 1);
            this.save();
        }

        /**
         * Get request by ID
         * @param id Request ID
         */
        public get(id: string): Request | undefined {
            return this.requests.find(r => r.id === id);
        }

        /**
         * Delete oldest n requests. If n is not specified, all requests will be deleted.
         * @param [n] Number of requests to delete
         */
        public deleteOldest(n?: number): void {
            this.requests.splice(0, n ?? this.requests.length);
            this.save();
        }

        /**
         * Format as JSON string
         */
        public toJSON(): string {
            return JSON.stringify(this.requests.map(r => r.toObject()));
        }

        /**
         * Save to local storage
         */
        public save(): void {
            localStorage.setItem("requests", this.toJSON());
        }

        /**
         * Create a new request storage from a JSON string
         * @param json JSON string
         */
        public static fromJSON(json: string): RequestStorage {
            const obj = JSON.parse(json);
            const storage = RequestStorage.getInstance();
            storage.requests.push(...obj.map((r: Record<string, any>) => Request.fromJSON(JSON.stringify(r))));
            return storage;
        }
    }

    // determine which screen to show
    if (location.pathname === "/") showScreen("home");
    else {
        const namespace = location.pathname.slice(1);
        const sendUrl = location.protocol + "//" + location.host + "/s/" + namespace;
        // Load request storage from local storage
        const storage = localStorage.getItem("requests") ? RequestStorage.fromJSON(localStorage.getItem("requests")!) : RequestStorage.getInstance();
        const requests = storage.getForNamespace(namespace);
        if (requests.length === 0) {
            showScreen("empty");
            for (const link of document.querySelectorAll("[data-req-link]"))
                link.setAttribute("href", sendUrl);
            for (const url of document.querySelectorAll("[data-req-url], [data-req-link]")) {
                (url.querySelector("code") ?? url).textContent = sendUrl;
            }
        }
        else {
            showScreen("main");
        }

        // @ts-ignore
        const socket = io();
        console.log(namespace)
        socket.emit("namespace", namespace);
        socket.on("request", (id: string, senderIp?: string, serverIp?: string, serverPort?: number) => {
            console.log("Request begins", id, senderIp, serverIp, serverPort);
        });
        socket.on("data", (id: string, packet: ArrayBuffer) => {
            console.log("data:", id, new TextDecoder().decode(packet));
        });
        socket.on("end", (id: string, headers: string[], version: string, method: string, url: string) => {
            console.log("end:", id, headers, version, method, url);
        });
    }
});
