import { prisma } from "../src/lib/prisma";

const CODES = [
  { code: "BETA-AGENCIA-01", label: "Beta agencia 01", maxUses: 50 },
  { code: "BETA-AGENCIA-02", label: "Beta agencia 02", maxUses: 50 },
  { code: "BETA-CREADOR-01", label: "Beta creador 01", maxUses: 50 },
  { code: "DEMO-001", label: "Demo (5 usos)", maxUses: 5 },
];

async function main() {
  for (const c of CODES) {
    await prisma.inviteCode.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log(`Seed OK: ${CODES.length} códigos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
