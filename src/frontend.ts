document.addEventListener("DOMContentLoaded", () => {
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
         * Get raw headers
         * @readonly
         */
        public get rawHeaders(): string {
            return this.data.split("\r\n\r\n")[0]!;
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
                namespace: this.namespace,
                httpVersion: this.httpVersion
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

        /**
         * Render request as HTML on the page
         */
        public render(): void {
            const methodColours: Record<string, { bg: string, text: string }> = {
                GET: {
                    bg: "bg-green-200",
                    text: "text-green-800"
                },
                POST: {
                    bg: "bg-blue-200",
                    text: "text-blue-800"
                },
                PUT: {
                    bg: "bg-orange-200",
                    text: "text-orange-800"
                },
                PATCH: {
                    bg: "bg-amber-200",
                    text: "text-amber-800"
                },
                DELETE: {
                    bg: "bg-red-200",
                    text: "text-red-800"
                },
                HEAD: {
                    bg: "bg-indigo-200",
                    text: "text-indigo-800"
                },
                OPTIONS: {
                    bg: "bg-sky-200",
                    text: "text-sky-800"
                },
                unknown: {
                    bg: "bg-slate-200",
                    text: "text-slate-800"
                }
            }

            const formattedMethod = document.querySelector(`[data-req="formatted-method"]`);
            if (formattedMethod) {
                formattedMethod.textContent = this.method;
                const colours = methodColours[this.method] ?? methodColours.unknown!;
                formattedMethod.classList.add(colours.bg, colours.text);
            }

            const senderIp = document.querySelector(`[data-req="sender-ip"]`);
            if (senderIp) senderIp.textContent = this.ip.startsWith("::ffff:") ? this.ip.slice(7) : this.ip;

            const id = document.querySelector(`[data-req="id"]`);
            if (id) id.textContent = this.id;

            const date = document.querySelector(`[data-req="date"]`);
            if (date) date.innerHTML = `<time datetime="${this.date.toISOString()}">${this.date.toLocaleDateString(navigator.language, {month: 'short', day: 'numeric', year: 'numeric', hour: "numeric", minute: "numeric"})}</time>`;

            const method = document.querySelector(`[data-req="method"]`);
            if (method) method.textContent = this.method;

            const formattedUrl = document.querySelector(`[data-req="formatted-url"]`);
            if (formattedUrl) {
                for (const child of formattedUrl.children) child.remove();
                const protocol = document.createElement("span");
                protocol.classList.add("text-slate-500");
                protocol.textContent = this.url.protocol + "//";
                formattedUrl.appendChild(protocol);
                const main = document.createElement("span");
                main.classList.add("text-slate-900");
                main.textContent = this.url.host + this.url.pathname;
                formattedUrl.appendChild(main);
                const searchParams = Object.fromEntries(this.url.searchParams);
                if (Object.keys(searchParams).length > 0) {
                    const query: HTMLSpanElement[] = [];
                    const questionMark = document.createElement("span");
                    questionMark.classList.add("text-slate-500");
                    questionMark.textContent = "?";
                    query.push(questionMark);
                    const ampersand = () => {
                        const amp = document.createElement("span");
                        amp.classList.add("text-slate-500");
                        amp.textContent = "&";
                        return amp;
                    }
                    for (const i in Object.entries(searchParams)) {
                        const index = Number(i);
                        const [key, value] = Object.entries(searchParams)[index]!;
                        const keySpan = document.createElement("span");
                        keySpan.classList.add("text-blue-600");
                        keySpan.textContent = key;
                        query.push(keySpan);
                        const equals = document.createElement("span");
                        equals.classList.add("text-slate-500");
                        equals.textContent = "=";
                        query.push(equals);
                        if (value) {
                            const valueSpan = document.createElement("span");
                            valueSpan.classList.add("text-slate-900");
                            valueSpan.textContent = value;
                            query.push(valueSpan);
                        }
                        if (index < Object.entries(searchParams).length - 1) query.push(ampersand());
                    }
                    formattedUrl.append(...query);
                }
            }

            const scheme = document.querySelector(`[data-req="scheme"]`);
            if (scheme) scheme.textContent = this.url.protocol.slice(0, -1);

            const host = document.querySelector(`[data-req="host"]`);
            if (host) host.textContent = this.url.host;

            const path = document.querySelector(`[data-req="path"]`);
            if (path) path.textContent = this.url.pathname;

            const formattedQuery = document.querySelector(`[data-req="formatted-query"]`);
            if (formattedQuery) {
                const searchParams = Object.fromEntries(this.url.searchParams);
                if (Object.keys(searchParams).length > 0) {
                    formattedQuery.classList.remove("hidden");
                    for (const child of formattedQuery.children) child.remove();
                    for (const [key, value] of Object.entries(searchParams)) {
                        // <li><span class="text-blue-600 mr-1">query:</span> <span class="text-slate-900">data</span></li>
                        const li = document.createElement("li");
                        const keySpan = document.createElement("span");
                        keySpan.classList.add("text-blue-600", "mr-1");
                        keySpan.textContent = key + ":";
                        li.appendChild(keySpan);
                        if (value) {
                            li.appendChild(document.createTextNode(" "));
                            const valueSpan = document.createElement("span");
                            valueSpan.classList.add("text-slate-900");
                            valueSpan.textContent = value;
                            li.appendChild(valueSpan);
                        }
                        formattedQuery.appendChild(li);
                    }
                }
                else formattedQuery.classList.add("hidden");
            }

            const serverAddress = document.querySelector(`[data-req="server-address"]`);
            if (serverAddress) serverAddress.textContent = this.serverIp.startsWith("::ffff:") ? this.serverIp.slice(7) : this.serverIp;

            const httpVersion = document.querySelector(`[data-req="http-version"]`);
            if (httpVersion) httpVersion.textContent = `HTTP/${this.httpVersion}`;

            const formattedHeaders = document.querySelector(`[data-req="formatted-headers"]`);
            if (formattedHeaders) {
                //this.headers = ["header-name", "value", "header-name", "value", ...]
                const headerNames = this.headers.filter((_, i) => i % 2 === 0);
                const headerValues = this.headers.filter((_, i) => i % 2 === 1);
                const headers: [string, string][] = [];
                const capitalise = (str: string) => str.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("-");
                for (const i in headerNames) headers.push([capitalise(headerNames[i]!), headerValues[i]!]);
                const sortedHeaders = headers.sort((a, b) => a[0].localeCompare(b[0]));

                // <li><span class="text-blue-600 mr-1">Host:</span> <span class="text-slate-900">req.cldn.pro</span></li>
                for (const child of formattedHeaders.children) child.remove();
                for (const [key, value] of sortedHeaders) {
                    const li = document.createElement("li");
                    const keySpan = document.createElement("span");
                    keySpan.classList.add("text-blue-600", "mr-1");
                    keySpan.textContent = key + ":";
                    li.appendChild(keySpan);
                    li.appendChild(document.createTextNode(" "));
                    const valueSpan = document.createElement("span");
                    valueSpan.classList.add("text-slate-900");
                    valueSpan.textContent = value;
                    li.appendChild(valueSpan);
                    formattedHeaders.appendChild(li);
                }
            }

            const rawHeaders = document.querySelector(`[data-req="raw-headers"]`);
            if (rawHeaders) rawHeaders.textContent = this.rawHeaders;
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
         * Get list of namespaces
         */
        public getNamespaces(): string[] {
            return [...new Set(this.requests.map(r => r.namespace))].reverse();
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
         * Delete namespace
         * @param namespace Namespace
         */
        public deleteNamespace(namespace: string): void {
            for (const request of this.getForNamespace(namespace)) this.delete(request.id);
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

    /**
     * Screens
     * @class
     */
    class Screen {
        /**
         * Render a screen
         * @param name Screen name
         * @static
         */
        public static render(name: "home" | "empty" | "main"): void {
            const screen = this.show(name);
            if (!screen) return;
            const namespace = getNamespace();
            const sendUrl = location.protocol + "//" + location.host + "/s/" + namespace;
            switch (name) {
                case "home": {
                    const namespacesList = screen.querySelector("[data-req-namespaces]");
                    if (namespacesList) {
                        for (const child of namespacesList.children) child.remove();
                        
                        const namespaces = storage.getNamespaces();
                        if (namespaces.length === 0) {
                            namespacesList.classList.add("hidden");
                            namespacesList.classList.remove("flex");
                        }
                        else {
                            namespacesList.classList.add("flex");
                            namespacesList.classList.remove("hidden");

                            for (const ns of namespaces) {
                                const requests = storage.getForNamespace(ns).length;

                                const item = document.createElement("div");
                                item.classList.add("flex", "justify-between", "rounded-xl", "bg-slate-100", "p-3", "transition-opacity");

                                const text = document.createElement("div");
                                item.appendChild(text);

                                const title = document.createElement("p");
                                title.classList.add("text-slate-900", "font-medium");
                                text.appendChild(title);

                                const link = document.createElement("a");
                                link.setAttribute("href", "/" + ns);
                                link.textContent = ns;
                                title.appendChild(link);

                                const subtitle = document.createElement("p");
                                subtitle.classList.add("text-sm", "text-slate-500");
                                subtitle.textContent = requests + " request" + (requests === 1 ? "" : "s");
                                text.appendChild(subtitle);

                                const button = document.createElement("button");
                                button.classList.add("text-slate-400", "hover:text-slate-500");
                                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" /></svg>`;
                                button.addEventListener("click", () => {
                                    storage.deleteNamespace(ns);
                                    item.classList.add("opacity-0");
                                    setTimeout(() => {
                                        item.remove();
                                        if (namespacesList.children.length === 0) {
                                            namespacesList.classList.add("hidden");
                                            namespacesList.classList.remove("flex");
                                        }
                                    }, 300);
                                });
                                item.appendChild(button);

                                namespacesList.appendChild(item);
                            }
                        }
                    }
                    break;
                }
                case "empty": {
                    for (const link of screen.querySelectorAll("[data-req-link]"))
                        link.setAttribute("href", sendUrl);
                    for (const url of screen.querySelectorAll("[data-req-url], [data-req-link]")) {
                        (url.querySelector("code") ?? url).textContent = sendUrl;
                    }
                    break;
                }
                case "main": {
                    const requests = storage.getForNamespace(namespace);
                    if (requests.length === 0) Screen.render("empty");
                    else requests[requests.length - 1]!.render();

                    socket.emit("namespace", namespace);
                    break;
                }
            }
        }

        /**
         * Get screen by name
         * @param name Screen name
         * @private
         * @static
         */
        private static get(name: "home" | "empty" | "main"): Element | null {
            return document.querySelector(`[data-screen="${name}"]`);
        }

        /**
         * Show screen
         * @param name Screen name or element
         * @private
         * @static
         */
        private static show(name: "home" | "empty" | "main" | HTMLElement): Element | void {
            const screenToShow = typeof name === "string" ? this.get(name) : name;
            if (screenToShow) {
                const screens = document.querySelectorAll("[data-screen]");
                for (const s of screens) {
                    s.classList.add("hidden");
                    s.classList.remove("flex");
                }
                screenToShow.classList.remove("hidden");
                screenToShow.classList.add("flex");
                return screenToShow;
            }
        }
    }

    /**
     * Get namespace from URL
     */
    const getNamespace = (): string => {
        return location.pathname.slice(1);
    }

        // @ts-ignore
    const socket = io();
    const storage = localStorage.getItem("requests") ? RequestStorage.fromJSON(localStorage.getItem("requests")!) : RequestStorage.getInstance();

    const buildingRequests: Record<string, Partial<{id: string, namespace: string, senderIp: string, serverIp: string, serverPort: number, date: Date, headers: string[], version: string, method: string, url: string, data: ArrayBuffer[]}>> = {};

    socket.on("request", (id: string, namespace: string, senderIp: string, serverIp: string, serverPort: number, date: string) => {
        buildingRequests[id] = {id, namespace, senderIp, serverIp, serverPort, date: new Date(date)};
    });
    socket.on("data", (id: string, packet: ArrayBuffer) => {
        const req = buildingRequests[id];
        if (!req) return;
        if (!req.data) req.data = [];
        req.data.push(packet);
    });
    socket.on("end", (id: string, headers: string[], version: string, method: string, url: string, protocol: string) => {
        const req = buildingRequests[id];
        if (!req) return;
        req.headers = headers;
        req.version = version;
        req.method = method;
        req.url = protocol + "://" + location.host + url;
        if ([req.id, req.namespace, req.senderIp, req.serverIp, req.serverPort, req.date, req.data].some(v => v === undefined)) return;
        const request = new Request(id, req.data!.map(d => new TextDecoder().decode(d)).join(""), req.headers, req.method, new URL(req.url), req.senderIp!, req.serverIp! + ":" + req.serverPort, req.date!, req.namespace!, req.version);
        delete buildingRequests[id];
        storage.add(request);
        if (storage.getForNamespace(req.namespace!).length === 1) Screen.render("main");
    });

    // switch for toggling between parsed and raw headers
    const switchHeaders = document.querySelector(`[data-req="switch-headers"]`);
    const formattedHeaders = document.querySelector(`[data-req="formatted-headers"]`);
    const rawHeaders = document.querySelector(`[data-req="raw-headers"]`);
    if (switchHeaders && formattedHeaders && rawHeaders) {
        const switchHeadersFn = () => {
            if ((switchHeaders as HTMLInputElement).checked) {
                formattedHeaders.classList.add("hidden");
                rawHeaders.classList.remove("hidden");
            }
            else {
                formattedHeaders.classList.remove("hidden");
                rawHeaders.classList.add("hidden");
            }
        };
        switchHeaders.addEventListener("change", () => {
            switchHeadersFn();
        });
        switchHeadersFn();
    }

    // determine which screen to show
    if (location.pathname === "/") Screen.render("home");
    else Screen.render("main");
});
