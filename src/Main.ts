import Config from "./Config";
import WebServer from "./WebServer.js";
import fs from "node:fs/promises";
import path from "path";

/**
 * Main class
 * @class
 */
export default class Main {
    /**
     * Configuration to use
     * @readonly
     */
    public readonly config: Readonly<Config>;

    /**
     * Web server
     * @readonly
     */
    public webServer?: WebServer;

    /**
     * Create a new instance
     * @param config Configuration to use
     */
    public constructor(config: Config) {
        this.config = config;
    }

    /**
     * Start web server
     */
    public async start(): Promise<void> {
        const cert = this.config.tls?.cert ? await fs.readFile(this.config.tls.cert) : undefined;
        const key = this.config.tls?.key ? await fs.readFile(this.config.tls.key) : undefined;
        const staticFiles: Record<string, {type: string, data: Buffer}> = {
            "/": {type: "text/html", data: await fs.readFile(path.join(Main.dir, "index.html"))},
            "/frontend.js": {type: "text/javascript", data: await fs.readFile(path.join(Main.dir, "src", "frontend.js"))},
            "/main.css": {type: "text/css", data: await fs.readFile(path.join(Main.dir, "css", "main.css"))},
        };
        this.webServer = new WebServer(this, staticFiles, this.config.port, this.config.tls?.port, cert, key);
    }

    /**
     * Root directory of this project
     * @static
     * @readonly
     */
    public static readonly dir = new URL("../", import.meta.url).pathname;

    /**
     * Load configuration. If a `config.json` file is readable, it will be used. Otherwise, a default configuration will be used.
     * @static
     */
    public static async loadConfig(): Promise<Config> {
        if (await Main.configExists()) return await Main.readConfig();
        else return Main.defaultConfig;
    }

    /**
     * Get config options from command line arguments
     *  --cert, -c  {@link Config.tls.cert}
     *  --key, -k   {@link Config.tls.key}
     *  --https, -s {@link Config.tls.port}
     *  --http, -p  {@link Config.port}
     *  --name, -n  {@link Config.serverName}
     * @param [args=process.argv] Arguments to parse
     * @static
     */
    public static async getConfigFromArgs(args: string[] = process.argv): Promise<Config> {
        const parsedArgs = Main.parseArgs(args);
        const cliOptions = Main.mergeAliases(parsedArgs, {
            cert: ["c"],
            key: ["k"],
            https: ["s"],
            http: ["p"],
            name: ["n"]
        }) as {cert?: string | string[] | true, key?: string | string[] | true, https?: string | string[] | true, http?: string | string[] | true, name?: string | string[] | true};
        const config = await Main.loadConfig();
        if (config.tls) {
            if (cliOptions.cert) config.tls.cert = String(cliOptions.cert);
            if (cliOptions.key) config.tls.key = String(cliOptions.key);
            if (cliOptions.https && !Number.isNaN(Number(cliOptions.https))) config.tls.port = Number(cliOptions.https);
        }
        else if ([cliOptions.cert, cliOptions.key, cliOptions.https].every(v => v !== undefined)) {
            config.tls = {
                cert: String(cliOptions.cert),
                key: String(cliOptions.key),
                port: Number(cliOptions.https)
            };
        }
        if (cliOptions.http && !Number.isNaN(Number(cliOptions.http))) config.port = Number(cliOptions.http);
        if (cliOptions.name) config.serverName = String(cliOptions.name);
        return config;
    }

    /**
     * Parse command line arguments
     * @param args Arguments to parse
     * @private
     * @static
     */
    private static parseArgs(args: string[]): Record<string, string | string[] | true> {
        const result: Record<string, string | string[] | true> = {};
        for (const index in args) {
            const i = Number(index);
            const arg = args[i]!;
            if (Main.argIsKey(arg)) {
                const slashCount = arg.startsWith("--") ? 2 : 1;
                const hasImmediateValue = arg.indexOf("=") !== -1;
                const key = arg.slice(slashCount, hasImmediateValue ? arg.indexOf("=") : undefined);
                const nextArg = args[i + 1];
                const value = hasImmediateValue ? arg.slice(arg.indexOf("=") + 1) : nextArg && !Main.argIsKey(nextArg) ? nextArg : true;
                if (result[key] === undefined) result[key] = value;
                else if (typeof value === "string" && Array.isArray(result[key])) (result[key] as string[]).push(value);
                else if (typeof value === "string" && typeof result[key] === "string") result[key] = [result[key] as string, value];
            }
        }
        return result;
    }

    /**
     * Merge alias keys
     * @param args Parsed arguments
     * @param aliases Aliases to merge
     * @returns Merged arguments
     * @private
     * @static
     */
    private static mergeAliases(args: Record<string, string | string[] | true>, aliases: Record<string, string | string[]>): Record<string, string | string[] | true> {
        const result: Record<string, string | string[] | true> = {};
        for (const key of Object.keys(aliases)) {
            const alias: string[] = Array.isArray(aliases[key]) ? aliases[key] as string[] : [aliases[key] as string];
            alias.push(key);
            for (const aliasKey of alias) {
                if (args[aliasKey] !== undefined) {
                    result[key] = args[aliasKey]!;
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Whether the provided argument string is a key
     * @private
     * @static
     * @internal
     */
    private static argIsKey(arg: string): boolean {
        return /^--?([a-zA-Z\d_-]+)(?:=(.*))?$/.test(arg);
    }

    /**
     * Default configuration
     * @private
     * @static
     * @readonly
     * @internal
     */
    private static readonly defaultConfig: Config = {
        port: 80,
        serverName: "cldn"
    }

    /**
     * Check if a `config.json` file is readable
     * @private
     * @static
     * @internal
     */
    private static async configExists(): Promise<boolean> {
        try {
            await fs.access(path.join(Main.dir, "config.json"), fs.constants.R_OK);
            return true;
        }
        catch {return false}
    }

    /**
     * Read configuration from `config.json` file
     * @private
     * @static
     * @internal
     */
    private static async readConfig(): Promise<Config> {
        return JSON.parse(await fs.readFile(path.join(Main.dir, "config.json"), "utf8"));
    }
}
