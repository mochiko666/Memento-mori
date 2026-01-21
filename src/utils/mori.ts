const messages = [
  "Memento mori.",
  "Remember that you will die.",
  "お前はいずれ死ぬのだ。それを忘れるな？",
];
export function memento(): string {
  const rand = Math.random();
  const chancejp = 0.06;
  const chanceen = 0.13;
  const message = messages[rand < chancejp ? 2 : rand < chanceen ? 1 : 0];
  return message || "Memento mori.";
}