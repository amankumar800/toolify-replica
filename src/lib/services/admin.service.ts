import { Tool, CategoryGroup } from '@/lib/types/tool';
import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';

// Path to the mock database file
// In production, this filesystem write will ONLY work if the host supports it (e.g. VPS).
// Vercel Serverless implies Read-Only file system except /tmp, so this is for Local Dev / VPS only.
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'mock-db.json');

interface DatabaseSchema {
    tools: Tool[];
    categoryGroups: CategoryGroup[];
}

/**
 * Reads the database from the filesystem.
 * This ensures we get the *fresh* data, not the cached build-time import.
 */
const readDb = async (): Promise<DatabaseSchema> => {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to read DB:", error);
        throw new Error("Database access failed");
    }
};

/**
 * Writes the database to the filesystem.
 */
const writeDb = async (data: DatabaseSchema): Promise<void> => {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error("Failed to write DB:", error);
        throw new Error("Database write failed");
    }
};

// --- CRUD Operations ---

export const getAllTools = async (): Promise<Tool[]> => {
    const db = await readDb();
    // Sort by date added desc by default for admin
    return db.tools.sort((a, b) =>
        new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime()
    );
};

export const getToolById = async (id: string): Promise<Tool | undefined> => {
    const db = await readDb();
    return db.tools.find(t => t.id === id);
};

export const createTool = async (toolData: Omit<Tool, 'id' | 'dateAdded' | 'verified' | 'savedCount' | 'reviewCount' | 'reviewScore'>): Promise<Tool> => {
    const db = await readDb();

    const newTool: Tool = {
        ...toolData,
        id: (db.tools.length + 1).toString(), // Simple numeric ID increment
        dateAdded: new Date().toISOString(),
        verified: false,
        savedCount: 0,
        reviewCount: 0,
        reviewScore: 0
    };

    db.tools.push(newTool);
    await writeDb(db);
    return newTool;
};

export const updateTool = async (id: string, updates: Partial<Tool>): Promise<Tool> => {
    const db = await readDb();
    const index = db.tools.findIndex(t => t.id === id);

    if (index === -1) {
        throw new Error("Tool not found");
    }

    const updatedTool = { ...db.tools[index], ...updates };
    db.tools[index] = updatedTool;

    await writeDb(db);
    return updatedTool;
};

export const deleteTool = async (id: string): Promise<void> => {
    const db = await readDb();
    const initialLength = db.tools.length;
    db.tools = db.tools.filter(t => t.id !== id);

    if (db.tools.length === initialLength) {
        throw new Error("Tool not found");
    }

    await writeDb(db);
};

// Dashboard Stats
export const getAdminStats = async () => {
    const db = await readDb();
    return {
        totalTools: db.tools.length,
        totalCategories: db.categoryGroups.reduce((acc, g) => acc + (g.categories?.length || 0), 0),
        recentTools: db.tools.slice(-5).reverse()
    };
};
