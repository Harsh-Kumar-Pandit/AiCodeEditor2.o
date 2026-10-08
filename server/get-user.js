import "dotenv/config";
import prisma from "./src/db/prisma.js";

const user = await prisma.user.findUnique({
    where: {
        githubId: "190480124"
    },
    select: {
        id: true,
        username: true,
        githubId: true
    }
});

console.log(user);

await prisma.$disconnect();