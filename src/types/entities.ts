// FILE: src/types/entities.ts
// This file centralizes core data entities like Project and User.

export interface Project {
    id: string;
    name: string;
    description: string;
    features: string[]; // Array of feature IDs
    createdAt: string;
    updatedAt: string;
    status: "active" | "archived" | "draft";
    authorName: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    projects: string[]; // Array of project IDs
} 