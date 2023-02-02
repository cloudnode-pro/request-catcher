import Config from "./Config";
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
     * Create a new instance
     * @param config Configuration to use
     */
    public constructor(config: Config) {
        this.config = config;
    }

    /**
     * Root directory of this project
     * @static
     * @readonly
     */
    public static readonly dir = new URL("../", import.meta.url).pathname;

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

    /**
     * Load configuration. If a `config.json` file is readable, it will be used. Otherwise, a default configuration will be used.
     * @static
     */
    public static async loadConfig(): Promise<Config> {
        if (await Main.configExists()) return await Main.readConfig();
        else return Main.defaultConfig;
    }
}
