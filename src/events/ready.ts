import { Events } from "discord.js";

export const Handler: EventHandler = {
  name: Events.ClientReady,
  once: true,
  async execute(client: ExtendedClient) {
    console.log(`Ready! Logged in as ${client.user?.tag}`);
  },
};
