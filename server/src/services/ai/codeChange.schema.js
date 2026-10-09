import { z } from "zod";

const createFileChange = z.object({
    operation: z.literal("create_file"),
    path: z.string().min(1),
    content: z.string()
});

const modifyFileChange = z.object({
    operation: z.literal("modify_file"),
    path: z.string().min(1),
    content: z.string()
});

const deleteFileChange = z.object({
    operation: z.literal("delete_file"),
    path: z.string().min(1)
});

export const codeChangesSchema = z.object({
    changes: z.array(
        z.discriminatedUnion("operation", [
            createFileChange,
            modifyFileChange,
            deleteFileChange
        ])
    ).min(1)
});