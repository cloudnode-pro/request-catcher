# request-catcher
Catch and debug HTTP packets or forward them to a local host

A public instance can be found at [req.cldn.pro](https://req.cldn.pro).

## Installation

```bash
# clone repository
git clone https://github.com/cloudnode-pro/request-catcher/
# navigate to the repository directory
cd request-catcher
# install dependencies
npm install
# build the software and run it
npm start:build
```

By default, an HTTP server will be started and listen on port 80. You can change that and also enable HTTPS by creating a `config.json` file or by passing command line arguments.

### Configuration
- `tls` - TLS options. If set, in addition to HTTP, the server will also serve HTTPS. Optional.
  - `cert` - Path to the TLS/SSL certificate or certificate chain
  - `key` - Path to the TLS/SSL private key
  - `port` - Port to use for HTTPS
- `port` - Port to use for HTTP
- `serverName` - Server name broadcasted in the Server HTTP header. Set to undefined to disable. Optional.

### Command line arguments
You can pass the following CLI args after `node .` or `npm start --`:
```
  -c, --cert <path>    Path to the TLS/SSL certificate or certificate chain
  -k, --key <path>     Path to the TLS/SSL private key
  -s, --https <port>   Port to use for HTTPS
  -p, --http <port>    Port to use for HTTP
  -n, --name <name>    Server name broadcasted in the Server HTTP header
```
