import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ── Users ────────────────────────────────────────────────
  const userData = [
    { email: "alice@sportsdeck.com", username: "alice", password: "$2b$10$hashedpassword1", role: "ADMIN" },
    { email: "bob@sportsdeck.com", username: "bob", password: "$2b$10$hashedpassword2" },
    { email: "charlie@sportsdeck.com", username: "charlie", password: "$2b$10$hashedpassword3" },
    { email: "diana@sportsdeck.com", username: "diana", password: "$2b$10$hashedpassword4" },
    { email: "evan@sportsdeck.com", username: "evan", password: "$2b$10$hashedpassword5" },
    { email: "fiona@sportsdeck.com", username: "fiona", password: "$2b$10$hashedpassword6" },
    { email: "george@sportsdeck.com", username: "george", password: "$2b$10$hashedpassword7" },
    { email: "hannah@sportsdeck.com", username: "hannah", password: "$2b$10$hashedpassword8" },
    { email: "ivan@sportsdeck.com", username: "ivan", password: "$2b$10$hashedpassword9" },
    { email: "julia@sportsdeck.com", username: "julia", password: "$2b$10$hashedpassword10" },
    { email: "kevin@sportsdeck.com", username: "kevin", password: "$2b$10$hashedpassword11" },
    { email: "laura@sportsdeck.com", username: "laura", password: "$2b$10$hashedpassword12" },
    { email: "mike@sportsdeck.com", username: "mike", password: "$2b$10$hashedpassword13" },
    { email: "spammer@sportsdeck.com", username: "spammer99", password: "$2b$10$hashedpassword14", is_banned: true },
    { email: "troll@sportsdeck.com", username: "troll123", password: "$2b$10$hashedpassword15", is_banned: true },
  ];

  const users = [];
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    users.push(user);
    console.log(`User created: ${u.username}`);
  }

  const [alice, bob, charlie, diana, evan, fiona, george, hannah, ivan, julia, kevin, laura, mike, spammer, troll] = users;

  // ── User Follows ─────────────────────────────────────
  const userFollows = [
    { followerId: bob.id, followingId: alice.id },
    { followerId: charlie.id, followingId: alice.id },
    { followerId: diana.id, followingId: bob.id },
    { followerId: evan.id, followingId: alice.id },
    { followerId: alice.id, followingId: bob.id },
    { followerId: fiona.id, followingId: charlie.id },
    { followerId: george.id, followingId: diana.id },
  ];
  for (const uf of userFollows) {
    await prisma.userFollow.create({ data: uf });
  }
  console.log("User follows created");

  // ── Teams ─────────────────────────────────────────────
  const ajax = await prisma.team.upsert({
  where: { name: "Ajax" },
  update: {},
  create: {
        name: "Ajax",
        externalId: 123,  // unique ID for this team
        logo: "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam_logo.svg"
    },
    });

    const psv = await prisma.team.upsert({
    where: { name: "PSV Eindhoven" },
    update: {},
    create: {
        name: "PSV Eindhoven",
        externalId: 456,
        logo: "https://upload.wikimedia.org/wikipedia/en/2/20/PSV_Eindhoven_logo.svg"
    },
    });

    const feyenoord = await prisma.team.upsert({
    where: { name: "Feyenoord" },
    update: {},
    create: {
        name: "Feyenoord",
        externalId: 789,
        logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Feyenoord_Logo.svg"
    },
    });

    console.log("Teams created");
}

main()
  .then(() => console.log("Generated data"))
  .catch((err) => {
    console.error("Error importing data:", err);
  });