import { Events } from "discord.js";

const handler: EventHandler = {
  name: Events.ClientReady,
  once: true,
  async execute(client: ExtendedClient) {
    console.log(`Ready! Logged in as ${client.user?.tag}`);
  },
};

export { handler };
