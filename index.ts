import Main from "./src/Main.js";

const main = new Main(await Main.getConfigFromArgs());
await main.start();
