import { prisma } from "../../lib/prisma.js";

import users from "../seed-data/users.json" with { type: "json" };

export async function seedUsers() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        email: user.email,
        password: user.password,
        active: user.active,
      },
      create: {
        username: user.username,
        email: user.email,
        password: user.password,
        active: user.active,
      },
    });
  }
}
