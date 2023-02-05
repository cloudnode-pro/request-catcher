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
         * @private
         */
        #data: Uint8Array;

        /**
         * Raw data
         * @readonly
         */
        public get data(): Uint8Array {
            return this.#data;
        }

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
        public constructor(id: string, data: Uint8Array, headers: string[], method: string, url: URL, senderIp: string, serverIp: string, date: Date, namespace: string, httpVersion: string) {
            this.id = id;
            this.#data = data;
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
            return String.fromCharCode(...this.data).split("\r\n\r\n")[0]!;
        }

        /**
         * Format request as plain object
         */
        public toObject(): Record<string, string | number | boolean | (string | number | boolean)[]> {
            return {
                id: this.id,
                data: arrayBufferToBase64(this.data),
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
            return new Request(obj.id, base64ToArrayBuffer(obj.data), obj.headers, obj.method, new URL(obj.url), obj.ip, obj.serverIp, new Date(obj.date), obj.namespace, obj.httpVersion);
        }

        /**
         * Request method colours
         * @readonly
         * @static
         */
        public static readonly methodColours: Record<string, {bg: string, text: string}> = {
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
        };

        /**
         * Render request as HTML on the page
         */
        public render(): void {
            const formattedMethod = document.querySelector(`[data-req="formatted-method"]`);
            if (formattedMethod) {
                formattedMethod.textContent = this.method;
                const colours = Request.methodColours[this.method] ?? Request.methodColours.unknown!;
                formattedMethod.classList.remove(...Object.values(Request.methodColours).map(colour => [colour.bg, colour.text]).flat());
                formattedMethod.classList.add(colours.bg, colours.text);
            }

            const senderIp = document.querySelector(`[data-req="sender-ip"]`);
            if (senderIp) senderIp.textContent = this.ip.startsWith("::ffff:") ? this.ip.slice(7) : this.ip;

            const id = document.querySelector(`[data-req="id"]`);
            if (id) id.textContent = this.id;

            const date = document.querySelector(`[data-req="date"]`);
            if (date) date.innerHTML = `<time datetime="${this.date.toISOString()}">${this.date.toLocaleDateString(navigator.language, {month: 'short', day: 'numeric', year: 'numeric', hour: "numeric", minute: "numeric"})}</time>`;

            const deleteButton = document.querySelector(`button[data-req-delete]`);
            if (deleteButton) (deleteButton as HTMLButtonElement).dataset.reqDelete = this.id;

            const method = document.querySelector(`[data-req="method"]`);
            if (method) method.textContent = this.method;

            const formattedUrl = document.querySelector(`[data-req="formatted-url"]`);
            if (formattedUrl) {
                while (formattedUrl.firstChild) formattedUrl.removeChild(formattedUrl.firstChild);
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
                    while (formattedQuery.firstChild) formattedQuery.removeChild(formattedQuery.firstChild);
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
                const headerNames = this.headers.filter((_, i) => i % 2 === 0);
                const headerValues = this.headers.filter((_, i) => i % 2 === 1);
                const headers: [string, string][] = [];
                const capitalise = (str: string) => str.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("-");
                for (const i in headerNames) headers.push([capitalise(headerNames[i]!), headerValues[i]!]);
                const sortedHeaders = headers.sort((a, b) => a[0].localeCompare(b[0]));

                while (formattedHeaders.firstChild) formattedHeaders.removeChild(formattedHeaders.firstChild);
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

            // body
            const body = document.querySelector(`[data-req="body"]`);
            if (body) {
                while (body.firstChild) body.removeChild(body.firstChild);
                if (this.body) {
                    const head = document.createElement("div");
                    head.classList.add("flex", "items-center", "justify-between", "bg-slate-100", "p-2");
                    body.appendChild(head);

                    const p = document.createElement("p");
                    p.classList.add("text-sm", "leading-none", "text-slate-900");
                    const contentTypeHeaderIndex = this.headers.findIndex(h => h.toLowerCase() === "content-type");
                    const contentType = contentTypeHeaderIndex !== -1 ? this.headers[contentTypeHeaderIndex + 1] : "application/octet-stream";

                    /** @see https://stackoverflow.com/a/20732091/7089726 */
                    function humanFileSize(size: number): string {
                        const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
                        return Number((size / Math.pow(1000, i)).toFixed(2)) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
                    }

                    p.innerHTML = `${contentType} <span aria-hidden="true">&middot;</span> ${humanFileSize(new TextEncoder().encode(this.body).byteLength)}`;
                    head.appendChild(p);

                    const div = document.createElement("div");
                    head.appendChild(div);

                    const label = document.createElement("label");
                    label.classList.add("flex", "items-center", "space-x-2");
                    div.appendChild(label);

                    const span = document.createElement("span");
                    span.classList.add("text-sm", "text-slate-900");
                    span.textContent = "Raw";
                    label.appendChild(span);

                    const input = document.createElement("input");
                    input.type = "checkbox";
                    input.classList.add("peer", "sr-only");
                    label.appendChild(input);

                    const switchDiv = document.createElement("div");
                    switchDiv.classList.add("before:transition", "relative", "inline-flex", "h-5", "w-10", "flex-shrink-0", "cursor-pointer", "rounded-full", "border-2", "border-transparent", "bg-slate-200", "transition-colors", "duration-200", "ease-in-out", "before:block", "before:h-4", "before:w-4", "before:translate-x-0", "before:transform", "before:rounded-full", "before:bg-white", "before:shadow", "before:ring-0", "before:duration-200", "before:ease-in-out", "before:content-['']", "peer-checked:bg-blue-600", "peer-checked:before:translate-x-5");
                    label.appendChild(switchDiv);

                    const container = document.createElement("div");
                    body.appendChild(container);

                    const formatted = document.createElement("div");
                    formatted.classList.add("hidden");
                    container.appendChild(formatted);

                    const raw = document.createElement("div");
                    container.appendChild(raw);

                    const pre = document.createElement("pre");
                    pre.classList.add("w-full", "border-0", "py-3", "px-4", "text-sm", "overflow-auto", "text-slate-900");
                    raw.appendChild(pre);

                    const code = document.createElement("code");
                    code.textContent = this.body;
                    pre.appendChild(code);
                }
                else {
                    const div = document.createElement("div");
                    div.classList.add("flex", "h-64", "bg-slate-50");
                    body.appendChild(div);

                    const p = document.createElement("p");
                    p.classList.add("m-auto", "text-slate-500", "text-lg", "sm:text-2xl");
                    p.textContent = "No payload for this request";
                    div.appendChild(p);
                }
            }

            // raw
            const raw = document.querySelector(`[data-req="raw"]`);
            if (raw) raw.textContent = this.data;
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
            this.renderList();
        }

        /**
         * Render list of requests on `main` screen
         */
        public renderList(): void {
            const list = document.querySelector(`[data-requests]`);
            if (!list) return;
            const namespace = getNamespace();
            if (namespace.length <= 0) return;
            const requests = this.getForNamespace(namespace).sort((a, b) => b.date.getTime() - a.date.getTime());
            if (requests.length <= 0) return Screen.render("empty");
            while (list.firstChild) list.removeChild(list.firstChild);
            for (const request of requests) {
                const div = document.createElement("div");
                div.classList.add("cursor-pointer", "p-3", "hover:bg-slate-100");
                div.addEventListener("click", () => request.render());

                const title = document.createElement("p");
                title.classList.add("flex", "items-center", "space-x-2");
                div.appendChild(title);

                const method = document.createElement("span");
                const methodColours: {bg: string, text: string} = Request.methodColours[request.method] ?? Request.methodColours.unknown!;
                method.classList.add("rounded-full", methodColours.bg, "px-3", "py-0.5", "text-sm", "font-medium", methodColours.text);
                method.textContent = request.method;
                title.appendChild(method);

                const ip = document.createElement("span");
                ip.classList.add("font-medium", "text-slate-700");
                ip.textContent = request.ip.startsWith("::ffff:") ? request.ip.slice(7) : request.ip;
                title.appendChild(ip);

                const subtitle = document.createElement("p");
                subtitle.classList.add("mt-1", "text-sm", "text-slate-500");
                div.appendChild(subtitle);

                subtitle.appendChild(document.createTextNode(`#${request.id} `));

                const separator = document.createElement("span");
                separator.setAttribute("aria-hidden", "true");
                separator.textContent = "·";
                subtitle.appendChild(separator);

                const date = document.createElement("time");
                date.setAttribute("datetime", request.date.toISOString());
                date.textContent = request.date.toLocaleDateString(navigator.language, {month: 'short', day: 'numeric', year: 'numeric', hour: "numeric", minute: "numeric"});
                subtitle.appendChild(date);

                list.appendChild(div);
            }
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
                        while (namespacesList.firstChild) namespacesList.removeChild(namespacesList.firstChild);
                        
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
                                usePushState(link);

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

                    const link = screen.querySelector("[data-req-random]");
                    if (link) {
                        link.setAttribute("href", "/" + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(n => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[n % 62]).join(""));
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

                    storage.renderList();

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

    const buildingRequests: Record<string, Partial<{id: string, namespace: string, senderIp: string, serverIp: string, serverPort: number, date: Date, headers: string[], version: string, method: string, url: string, data: Uint8Array}>> = {};

    socket.on("request", (id: string, namespace: string, senderIp: string, serverIp: string, serverPort: number, date: string) => {
        buildingRequests[id] = {id, namespace, senderIp, serverIp, serverPort, date: new Date(date)};
    });
    socket.on("data", (id: string, packet: ArrayBuffer) => {
        const req = buildingRequests[id];
        if (!req) return;
        else if (!req.data) req.data = new Uint8Array(packet);
        else req.data = mergeUint8Arrays(req.data, packet);
    });
    socket.on("end", (id: string, headers: string[], version: string, method: string, url: string, protocol: string) => {
        const req = buildingRequests[id];
        if (!req) return;
        req.headers = headers;
        req.version = version;
        req.method = method;
        req.url = protocol + "://" + location.host + url;
        if ([req.id, req.namespace, req.senderIp, req.serverIp, req.serverPort, req.date, req.data].some(v => v === undefined)) return;
        const request = new Request(id, req.data!, req.headers, req.method, new URL(req.url), req.senderIp!, req.serverIp! + ":" + req.serverPort, req.date!, req.namespace!, req.version);
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

    // delete button
    const deleteButton = document.querySelector(`[data-req-delete]`);
    if (deleteButton) deleteButton.addEventListener("click", () => {
        storage.delete((deleteButton as HTMLButtonElement).dataset.reqDelete!);
        Screen.render("main");
    });

    // determine which screen to show
    const renderScreen = () => {
        if (location.pathname === "/") Screen.render("home");
        else Screen.render("main");
    }

    renderScreen();

    // make link work with pushState
    const usePushState = (a: HTMLAnchorElement) => {
        if (a.target === "_blank" || !a.href.startsWith(location.origin)) return;
        a.addEventListener("click", e => {
            e.preventDefault();
            history.pushState({}, "", a.href);
            renderScreen();
        });
    }

    for (const a of document.querySelectorAll("a[href]") as NodeListOf<HTMLAnchorElement>) usePushState(a);

    // tabs
    const tabContainers = document.querySelectorAll("[data-tabs]");
    for (const tabContainer of tabContainers) {
        const tabTriggers = tabContainer.querySelectorAll("[data-tab-open]");
        const buttons: HTMLElement[] = [];
        let select: HTMLSelectElement | null = null;
        for (const tabTrigger of tabTriggers) {
            if (tabTrigger.tagName === "SELECT" && (tabTrigger as HTMLSelectElement).dataset.tabOpen === "") {
                select = tabTrigger as HTMLSelectElement;
                select.addEventListener("change", () => openTab(select!.value));
            }
            else {
                buttons.push(tabTrigger as HTMLElement);
                tabTrigger.addEventListener("click", () => openTab((tabTrigger as HTMLElement).dataset.tabOpen!));
            }
        }

        const tabActivate = buttons.find(b => b.dataset.tabActivate !== undefined);

        const activeClasses = tabActivate ? Array.from(tabActivate.classList) : [];
        const inactiveClasses = Array.from(buttons.find(b => b.dataset.tabActivate === undefined)?.classList ?? []);

        const openTab = (name: string): HTMLElement | undefined => {
            const tab = tabContainer.querySelector(`[data-tab="${name}"]`) as HTMLElement | null;
            if (!tab) return;
            if (select) select.value = name;
            for (const button of buttons) {
                if (button.dataset.tabOpen === name) {
                    button.classList.remove(...inactiveClasses);
                    button.classList.add(...activeClasses);
                }
                else {
                    button.classList.remove(...activeClasses);
                    button.classList.add(...inactiveClasses);
                }
            }
            tabContainer.querySelectorAll("[data-tab]").forEach(t => t.classList.add("hidden"));
            tab.classList.remove("hidden");
            return tab;
        };

        if (tabActivate) {
            openTab(tabActivate.dataset.tabOpen!);
            tabActivate.removeAttribute("data-tab-activate");
        }
    }

    /**
     * Convert Uint8Array to base64 encoded string
     *
     * Based on https://gist.github.com/jonleighton/958841
     * @param bytes
     * @returns base64 encoded string
     */
    function arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
        let result = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        const bytes = new Uint8Array(buffer);
        const length = bytes.byteLength - bytes.byteLength % 3;

        let a: number, b: number, c: number, d: number;
        let chunk: number;

        // loop bytes in chunks of 3
        for (let i = 0; i < length; i += 3) {
            chunk = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
            a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
            c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
            d = chunk & 63; // 63 = 2^6 - 1

            result += characters[a]! + characters[b] + characters[c] + characters[d];
        }

        // remaining bytes and padding
        if (bytes.byteLength % 3 === 1) {
            chunk = bytes[length]!;
            a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
            b = (chunk & 3) << 4; // 3 = 2^2 - 1
            result += characters[a]! + characters[b] + "==";
        }
        else if (bytes.byteLength % 3 === 2) {
            chunk = (bytes[length]! << 8) | bytes[length + 1]!;
            a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008) >> 4; // 1008 = (2^6 - 1) << 4
            c = (chunk & 15) << 2; // 15 = 2^4 - 1
            result += characters[a]! + characters[b] + characters[c] + "=";
        }

        return result;
    }

    /**
     * Convert base64 encoded string to Uint8Array
     *
     * Based on https://github.com/danguer/blog-examples/blob/master/js/base64-binary.js
     * @param base64
     * @returns Uint8Array
     */
    function base64ToArrayBuffer(base64: string): Uint8Array {
        // remove padding characters
        base64 = base64.replace(/[^A-Za-z\d+\/]/g, "");

        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        const length = Math.floor((base64.length / 4) * 3);
        const uint8 = new Uint8Array(length);

        // loop bytes in chunks of 3
        for (let i = 0, j = 0; i < length; i += 3) {
            const a = characters.indexOf(base64[j++]!);
            const b = characters.indexOf(base64[j++]!);
            const c = characters.indexOf(base64[j++]!);
            const d = characters.indexOf(base64[j++]!);

            const chr1 = (a << 2) | (b >> 4);
            const chr2 = ((b & 15) << 4) | (c >> 2);
            const chr3 = ((c & 3) << 6) | d;

            uint8[i] = chr1;
            if (c !== 64) uint8[i + 1] = chr2;
            if (d !== 64) uint8[i + 2] = chr3;
        }

        return uint8;
    }

    /**
     * Merge Uint8Arrays
     * @param array1
     * @param array2
     * @returns merged array
     */
    function mergeUint8Arrays(array1: Uint8Array | ArrayBuffer, array2: Uint8Array | ArrayBuffer): Uint8Array {
        const a1: number[] = Array.from(new Uint8Array(array1));
        const a2: number[] = Array.from(new Uint8Array(array2));
        return new Uint8Array(a1.concat(a2));
    }
});
