// FILE: src/types/entities.ts
// This file centralizes core data entities like Project and User.

import type { Feature } from './gherkin';

export interface Project {
    id: string;
    name: string;
    description: string;
    features: string[]; // Array of feature IDs
    createdAt: string;
    updatedAt: string;
    status: string;
    authorName: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    projects: string[]; // Array of project IDs
}

export interface ProjectWithFeatures extends Omit<Project, 'features'> {
    features: Feature[];
} 