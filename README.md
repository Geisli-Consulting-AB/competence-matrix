# Competence Matrix

A React + TypeScript application for managing and tracking team competencies. Built with Vite, Material-UI, and Firebase.

## Features

- 🔐 Google Authentication
- 📊 Competence tracking with 4 skill levels (Want to learn, Beginner, Proficient, Expert)
- 🔄 Real-time data synchronization with Firebase Firestore
- 📱 Responsive Material-UI design
- 🌱 Database seeding with sample data

## Quick Start

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Seed the database with sample data:**

   ```bash
   npm run seed
   ```

   This will populate your Firebase database with 15 sample users and their competencies using your existing `.env` configuration.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Database Structure

The application stores data in Firestore with the following structure:

```
users/{userId}
├── ownerName: string
├── competences: array
│   ├── id: string
│   ├── name: string
│   └── level: number (1-4)
├── updatedAt: timestamp
└── seeded?: boolean
```

## Skill Levels

- **Level 1**: Want to learn
- **Level 2**: Beginner
- **Level 3**: Proficient
- **Level 4**: Expert

## Sample Data

The seeding script creates 15 diverse user profiles with competencies across various technology domains:

- **Frontend**: React, Vue.js, Angular, TypeScript, Material-UI, etc.
- **Backend**: Node.js, Python, Java, C#, Go, Ruby, etc.
- **Databases**: PostgreSQL, MongoDB, Redis, Firebase, etc.
- **Cloud & DevOps**: AWS, Docker, Kubernetes, CI/CD, etc.
- **Mobile**: React Native, Flutter, iOS, Android
- **Data Science**: Python, TensorFlow, Tableau, etc.
- **Design & UX**: Figma, Adobe XD, UI/UX Design
- **Project Management**: Agile, Scrum, Leadership

Each user has 8-15 competencies with realistic skill level distributions:

- Want to learn: ~15%
- Beginner: ~30%
- Proficient: ~40%
- Expert: ~15%

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
