import "server-only";
import { randomInt } from "node:crypto";

// Easy to read aloud and type: no look-alike characters (0/O, 1/l/I).
const WORDS = [
  "river", "tiger", "eagle", "lotus", "maple", "comet", "delta", "ember", "falcon", "harbor",
  "island", "jasmine", "kite", "lantern", "meadow", "nectar", "orbit", "pepper", "quartz", "rocket",
  "saffron", "tulip", "violet", "willow", "zephyr", "banyan", "coral", "dune", "forest", "garnet",
];

export function generatePassword() {
  const w = () => WORDS[randomInt(WORDS.length)];
  return `${w()}-${w()}-${randomInt(20, 99)}`;
}
