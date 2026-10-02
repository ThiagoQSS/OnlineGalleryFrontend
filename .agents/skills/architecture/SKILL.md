---
name: architecture
description: Guidelines on how to organize React and Typescript code, including performance optimization and state management.
---

# Architecture & Performance Guidelines

## Project Structure
This project is built with **React 19** and **Next.js 16 (App Router)** using **TypeScript**.

- `app/`: Contains the Next.js routes, pages, and layout definitions using the App Router.
- `components/`: Contains reusable React components. Divided into modular folders like `albums/`, `photos/`, `modals/`, and `ui/`.
- `hooks/`: Contains custom React hooks for business logic and state management (e.g., `useAlbumDetails`, `usePhotos`).
- `services/`: Contains API integration logic and services (e.g., Axios calls in `albumService`).
- `types/`: Contains TypeScript definitions and interfaces (e.g., API DTOs in `types/api.ts`).

## State Management & Performance Optimization

### The Problem: Over-fetching and Unnecessary Re-renders
A common anti-pattern in the current architecture is performing full data refetches after minor state changes. For example, when inviting or excluding a user (email) from an Album, the app currently calls the API and then triggers a full refetch (`await fetchAlbum();`), which replaces the entire album object in the local state. This causes the entire page and all its children components (including all loaded photos) to re-render, leading to poor performance and an unpleasant user experience.

### The Solution: Local State Mutation & Optimistic Updates
Instead of re-fetching the entire dataset from the backend after a mutation, you should **mutate the local state directly** when the API call succeeds (or optimistically before it completes).

#### Example: Inviting/Removing a Collaborator
**Avoid this:**
```typescript
const inviteCollaborator = async (email: string) => {
    await albumService.inviteCollaborator(albumId, email);
    // BAD: Refetching the entire album causes all components to re-render
    await fetchAlbum(); 
};
```

**Do this instead:**
```typescript
const inviteCollaborator = async (email: string) => {
    // 1. Call API
    // Note: If the backend doesn't return the full user object, you may need to adjust the logic.
    await albumService.inviteCollaborator(albumId, email);
    
    // 2. Update local state directly without re-fetching
    setAlbum((prev) => {
        if (!prev) return prev;
        
        // Example fallback: create a partial user object if API doesn't return the exact DTO
        const novoConvidado = { id: Date.now(), email, nome: email.split("@")[0], dataNascimento: null };
        
        return {
            ...prev,
            convidados: [...prev.convidados, novoConvidado]
        };
    });
};
```

And for removing:
```typescript
const kickCollaborator = async (email: string) => {
    await albumService.kickCollaborator(albumId, email);
    
    setAlbum((prev) => {
        if (!prev) return prev;
        return {
            ...prev,
            convidados: prev.convidados.filter(c => c.email !== email)
        };
    });
};
```

### Key Guidelines for React Performance in this Project:
1. **Use Functional State Updates:** When updating arrays or objects in state based on the previous state, always use functional updates: `setState(prev => ...)` to avoid dependency issues and race conditions.
2. **Avoid Global Refetches for Local Mutations:** Only re-fetch data when absolutely necessary. For adds, edits, and deletes, manually update the local React state to reflect the changes instantly.
3. **Memoization:** Ensure that large lists of components (like photo grids) utilize `React.memo`, and wrap handlers in `useCallback` appropriately so they don't re-render unless their specific props change.
4. **Separation of Concerns:** Keep complex state logic in custom hooks (`hooks/`) and pure UI rendering in `components/`.
