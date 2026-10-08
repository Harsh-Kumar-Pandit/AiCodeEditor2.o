const ignoredDirectories = [
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage"
];

const allowedExtensions = [
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".css",
    ".html"
];

const ignoredFiles = [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
];

export const shouldIndexFile = (filePath) => {
    const parts = filePath.split("/");

    if (ignoredFiles.includes(parts[parts.length - 1])) {
        return false;
    }

    const containsIgnoredDirectory = parts.some((part) =>
        ignoredDirectories.includes(part)
    );

    if (containsIgnoredDirectory) {
        return false;
    }

    const lowerPath = filePath.toLowerCase();

    return allowedExtensions.some((extension) =>
        lowerPath.endsWith(extension)
    );
};