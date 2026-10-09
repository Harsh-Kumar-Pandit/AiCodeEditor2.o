import { shouldIndexFile } from "./src/services/rag/fileFilter.js";

const paths = [
    "client/src/App.jsx",
    "server/src/app.js",
    "README.md",
    "client/package.json",
    "client/package-lock.json",
    "server/package-lock.json",
    "node_modules/react/index.js",
    ".git/config"
];

for (const path of paths) {
    console.log(path, "=>", shouldIndexFile(path));
}

console.log(
    "backend/main.py =>",
    shouldIndexFile("backend/main.py")
);

console.log(
    ".env =>",
    shouldIndexFile(".env")
);

console.log(
    ".env.local =>",
    shouldIndexFile(".env.local")
);