/**
 * Configuration
 * @interface
 */
export default interface Config {
    /**
     * TLS options. If set, in addition to HTTP, the server will also serve HTTPS
     */
    tls?: {
        /**
         * Path to the TLS/SSL certificate or certificate chain
         */
        cert: string;

        /**
         * Path to the TLS/SSL private key
         */
        key: string;

        /**
         * Port to use for HTTPS
         * @default 443
         */
        port: number;
    }

    /**
     * Port to use for HTTP
     * @default 80
     */
    port: number;

    /**
     * Server name broadcasted in the `Server` HTTP header. Set to `undefined` to disable.
     */
    serverName?: string;
}
