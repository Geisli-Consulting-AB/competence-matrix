#!/usr/bin/env node

// Standalone database seeding script for the competence matrix
// This script can be run with: npm run seed
// Uses Firebase Admin SDK to bypass security rules during seeding

import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get project ID from environment
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("❌ Missing VITE_FIREBASE_PROJECT_ID in .env file");
  console.error("💡 Make sure your .env file contains the Firebase project ID");
  process.exit(1);
}

// Initialize Firebase Admin SDK
// This will use Application Default Credentials or Firebase CLI credentials
try {
  admin.initializeApp({
    projectId: projectId,
  });
  console.log("✅ Firebase Admin SDK initialized");
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
  console.error(
    "💡 Make sure you are logged in with Firebase CLI: firebase login",
  );
  process.exit(1);
}

const db = admin.firestore();

// Sample competences covering various technology areas
const sampleCompetences = [
  // Frontend Technologies
  "React",
  "Vue.js",
  "Angular",
  "JavaScript",
  "TypeScript",
  "HTML/CSS",
  "Sass/SCSS",
  "Tailwind CSS",
  "Material-UI",
  "Bootstrap",
  "Webpack",
  "Vite",
  "Next.js",
  "Nuxt.js",

  // Backend Technologies
  "Node.js",
  "Express.js",
  "Python",
  "Django",
  "Flask",
  "Java",
  "Spring Boot",
  "C#",
  ".NET Core",
  "PHP",
  "Laravel",
  "Ruby",
  "Ruby on Rails",
  "Go",
  "Rust",

  // Databases
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Firebase Firestore",
  "SQLite",
  "Elasticsearch",
  "DynamoDB",
  "Cassandra",

  // Cloud & DevOps
  "AWS",
  "Google Cloud Platform",
  "Microsoft Azure",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "GitHub Actions",
  "GitLab CI",
  "Terraform",
  "Ansible",

  // Mobile Development
  "React Native",
  "Flutter",
  "Swift (iOS)",
  "Kotlin (Android)",
  "Xamarin",

  // Data & Analytics
  "SQL",
  "Python Data Science",
  "R",
  "Tableau",
  "Power BI",
  "Apache Spark",
  "Pandas",
  "NumPy",
  "TensorFlow",
  "PyTorch",

  // Testing & Quality
  "Jest",
  "Cypress",
  "Selenium",
  "Unit Testing",
  "Integration Testing",
  "Test-Driven Development",
  "Postman",
  "JMeter",

  // Version Control & Collaboration
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Jira",
  "Confluence",
  "Slack",

  // Design & UX
  "Figma",
  "Adobe XD",
  "Sketch",
  "UI/UX Design",
  "Responsive Design",
  "Accessibility (a11y)",
  "Design Systems",

  // Project Management & Methodologies
  "Agile",
  "Scrum",
  "Kanban",
  "Project Management",
  "Code Review",
  "Technical Documentation",
  "API Design",
  "System Architecture",
];

// Sample user profiles with realistic names and varied skill distributions
const sampleUsers = [
  {
    userId: "user_001_alice_johnson",
    ownerName: "Alice Johnson",
    competences: [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "AWS",
      "Git",
      "Jest",
      "Figma",
      "Docker",
      "GraphQL",
      "Material-UI",
      "Express.js",
      "MongoDB",
      "GitHub Actions",
    ],
  },
  {
    userId: "user_002_bob_smith",
    ownerName: "Bob Smith",
    competences: [
      "Python",
      "Django",
      "PostgreSQL",
      "Redis",
      "Docker",
      "Kubernetes",
      "AWS",
      "Git",
      "Unit Testing",
      "API Design",
      "Linux",
      "Nginx",
      "Celery",
    ],
  },
  {
    userId: "user_003_carol_davis",
    ownerName: "Carol Davis",
    competences: [
      "Vue.js",
      "JavaScript",
      "PHP",
      "Laravel",
      "MySQL",
      "Sass/SCSS",
      "Webpack",
      "Git",
      "Postman",
      "UI/UX Design",
      "Adobe XD",
      "Responsive Design",
    ],
  },
  {
    userId: "user_004_david_wilson",
    ownerName: "David Wilson",
    competences: [
      "Java",
      "Spring Boot",
      "MySQL",
      "Redis",
      "Jenkins",
      "Git",
      "JUnit",
      "Maven",
      "Microservices",
      "REST APIs",
      "Swagger",
      "SonarQube",
    ],
  },
  {
    userId: "user_005_eva_brown",
    ownerName: "Eva Brown",
    competences: [
      "React Native",
      "Flutter",
      "Swift (iOS)",
      "Kotlin (Android)",
      "Firebase Firestore",
      "Git",
      "Mobile UI/UX",
      "App Store Deployment",
      "Push Notifications",
    ],
  },
  {
    userId: "user_006_frank_miller",
    ownerName: "Frank Miller",
    competences: [
      "Python Data Science",
      "Pandas",
      "NumPy",
      "TensorFlow",
      "SQL",
      "Tableau",
      "Jupyter Notebooks",
      "Apache Spark",
      "Machine Learning",
      "Statistics",
    ],
  },
  {
    userId: "user_007_grace_taylor",
    ownerName: "Grace Taylor",
    competences: [
      "Angular",
      "TypeScript",
      "RxJS",
      "NgRx",
      "Jasmine",
      "Karma",
      "Protractor",
      "Git",
      "Azure",
      "CI/CD",
      "SCSS",
      "Bootstrap",
    ],
  },
  {
    userId: "user_008_henry_anderson",
    ownerName: "Henry Anderson",
    competences: [
      "C#",
      ".NET Core",
      "Entity Framework",
      "SQL Server",
      "Azure",
      "Git",
      "xUnit",
      "SignalR",
      "Web APIs",
      "Blazor",
      "Identity Server",
    ],
  },
  {
    userId: "user_009_ivy_thomas",
    ownerName: "Ivy Thomas",
    competences: [
      "Go",
      "PostgreSQL",
      "Redis",
      "Docker",
      "Kubernetes",
      "gRPC",
      "Prometheus",
      "Git",
      "Microservices",
      "Load Balancing",
      "Message Queues",
    ],
  },
  {
    userId: "user_010_jack_jackson",
    ownerName: "Jack Jackson",
    competences: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vercel",
      "Prisma",
      "Supabase",
      "Git",
      "Cypress",
      "Storybook",
      "SEO",
      "Performance Optimization",
    ],
  },
  {
    userId: "user_011_karen_white",
    ownerName: "Karen White",
    competences: [
      "Ruby",
      "Ruby on Rails",
      "PostgreSQL",
      "Redis",
      "Sidekiq",
      "RSpec",
      "Git",
      "Heroku",
      "REST APIs",
      "ActiveRecord",
      "Devise",
    ],
  },
  {
    userId: "user_012_liam_garcia",
    ownerName: "Liam Garcia",
    competences: [
      "Rust",
      "WebAssembly",
      "PostgreSQL",
      "Actix-web",
      "Tokio",
      "Serde",
      "Git",
      "Docker",
      "Systems Programming",
      "Performance Optimization",
    ],
  },
  {
    userId: "user_013_maria_rodriguez",
    ownerName: "Maria Rodriguez",
    competences: [
      "Figma",
      "Adobe XD",
      "Sketch",
      "UI/UX Design",
      "Design Systems",
      "Prototyping",
      "User Research",
      "Accessibility (a11y)",
      "Responsive Design",
      "Design Thinking",
    ],
  },
  {
    userId: "user_014_noah_lee",
    ownerName: "Noah Lee",
    competences: [
      "Terraform",
      "Ansible",
      "AWS",
      "Kubernetes",
      "Docker",
      "Jenkins",
      "Prometheus",
      "Grafana",
      "Linux",
      "Bash Scripting",
      "Infrastructure as Code",
    ],
  },
  {
    userId: "user_015_olivia_martin",
    ownerName: "Olivia Martin",
    competences: [
      "Agile",
      "Scrum",
      "Kanban",
      "Jira",
      "Confluence",
      "Project Management",
      "Stakeholder Management",
      "Risk Assessment",
      "Team Leadership",
      "Product Strategy",
    ],
  },
];

// Function to generate random skill level with realistic distribution
function getRandomSkillLevel() {
  const rand = Math.random();
  // Weighted distribution: more beginners and proficient, fewer experts and learners
  if (rand < 0.15) return 1; // Want to learn (15%)
  if (rand < 0.45) return 2; // Beginner (30%)
  if (rand < 0.85) return 3; // Proficient (40%)
  return 4; // Expert (15%)
}

// Function to create competence rows for a user
function createCompetenceRows(competenceNames) {
  return competenceNames.map((name, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    level: getRandomSkillLevel(),
  }));
}

// Main seeding function
async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  console.log(`📊 Target: ${sampleUsers.length} users`);

  try {
    let totalCompetences = 0;

    for (let i = 0; i < sampleUsers.length; i++) {
      const user = sampleUsers[i];
      const competenceRows = createCompetenceRows(user.competences);
      totalCompetences += competenceRows.length;

      const userDocRef = db.collection("users").doc(user.userId);
      await userDocRef.set({
        ownerName: user.ownerName,
        competences: competenceRows,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        seeded: true, // Flag to identify seeded data
        seedDate: new Date().toISOString(),
      });

      console.log(
        `✅ [${i + 1}/${sampleUsers.length}] Added user: ${user.ownerName} with ${competenceRows.length} competences`,
      );
    }

    console.log("\n🎉 Successfully seeded the database!");
    console.log(`👥 Users added: ${sampleUsers.length}`);
    console.log(`🎯 Total competences: ${totalCompetences}`);
    console.log("📊 Skill level distribution:");
    console.log("   - Want to learn: ~15%");
    console.log("   - Beginner: ~30%");
    console.log("   - Proficient: ~40%");
    console.log("   - Expert: ~15%");
    console.log(
      "\n💡 You can now test the application with these sample users!",
    );
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
