import type { Project, ProjectSummary } from "./project-types";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Mobile App",
    key: "MOB",
    description: `Native iOS and Android client for Acme customers. This project covers everything from onboarding flows to offline sync.

## Goals
- Ship v2.0 by Q3 with crash rate below 0.1%
- Support offline-first workflows for field teams
- Align all screens with the **Design System**

## Stack
React Native, Expo, and shared Rivet API clients.`,
    color: "#4F46E5",
    status: "active",
    visibility: "public",
    defaultAssignee: null,
    createdBy: "Ada Lovelace",
    createdAt: new Date("2026-01-12"),
  },
  {
    id: "p2",
    name: "Backend API",
    key: "API",
    description: `Core REST and GraphQL services powering the Rivet platform.

## Focus areas
- Multi-tenant auth with org-scoped RLS
- Issue and project APIs consumed by web and mobile
- Rate limiting tied to billing tiers

Built for reliability first — **99.9% uptime** is the baseline, not the ceiling.`,
    color: "#0891B2",
    status: "active",
    visibility: "public",
    defaultAssignee: null,
    createdBy: "Ada Lovelace",
    createdAt: new Date("2026-01-12"),
  },
  {
    id: "p3",
    name: "Design System",
    key: "DS",
    description: `Shared components, tokens, and documentation for product UI across Rivet.

## What's inside
- Token scales for color, spacing, and typography
- Chakra-based primitives with Rivet branding
- Storybook docs for designers and engineers

The source of truth for how Rivet **looks and feels**.`,
    color: "#DB2777",
    status: "active",
    visibility: "private",
    defaultAssignee: "Ada Lovelace",
    createdBy: "Grace Hopper",
    createdAt: new Date("2026-02-03"),
  },
  {
    id: "p4",
    name: "Website Redesign",
    key: "WEB",
    description: "",
    color: "#16A34A",
    status: "active",
    visibility: "public",
    defaultAssignee: null,
    createdBy: "Ada Lovelace",
    createdAt: new Date("2026-07-01"),
  },
];

export const MOCK_PROJECT_SUMMARIES: ProjectSummary[] = MOCK_PROJECTS.map(
  ({ id, name, key, color }) => ({ id, name, key, color })
);

export function findProjectById(id: string): Project | undefined {
  return MOCK_PROJECTS.find((project) => project.id === id);
}

export async function fetchProjectMock(id: string): Promise<Project | null> {
  await new Promise((resolve) => setTimeout(resolve, 280));
  return findProjectById(id) ?? null;
}
