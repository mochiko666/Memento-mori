import { Events } from "discord.js";

const name = Events.ClientReady;
const once = true;
async function execute(client: ExtendedClient) {
  console.log(`Logged in as ${client.user?.tag}.`);
}

export { execute, name, once };
