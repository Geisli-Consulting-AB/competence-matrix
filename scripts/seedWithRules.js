#!/usr/bin/env node

// Temporary seeding script that modifies Firestore rules for seeding
// This script will:
// 1. Backup current rules
// 2. Deploy temporary permissive rules
// 3. Run the seeding
// 4. Restore original rules

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validate config
const missingVars = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error(
    "\n💡 Make sure to create a .env file with your Firebase configuration",
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// Temporary permissive rules for seeding
const tempRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary permissive rules for seeding
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

// Main seeding function
async function seedDatabase() {
  console.log("🌱 Starting database seeding with temporary rules...");
  console.log(`📊 Target: ${sampleUsers.length} users`);

  // Backup original rules
  console.log("📋 Backing up original Firestore rules...");
  const originalRules = fs.readFileSync("firestore.rules", "utf8");
  fs.writeFileSync("firestore.rules.backup", originalRules);

  try {
    // Write temporary rules
    console.log("🔓 Deploying temporary permissive rules...");
    fs.writeFileSync("firestore.rules", tempRules);
    execSync("firebase deploy --only firestore:rules", { stdio: "inherit" });

    // Wait a moment for rules to propagate
    console.log("⏳ Waiting for rules to propagate...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Seed the database
    let totalCompetences = 0;

    for (let i = 0; i < sampleUsers.length; i++) {
      const user = sampleUsers[i];
      const competenceRows = createCompetenceRows(user.competences);
      totalCompetences += competenceRows.length;

      const userDocRef = doc(db, "users", user.userId);
      await setDoc(userDocRef, {
        ownerName: user.ownerName,
        competences: competenceRows,
        updatedAt: serverTimestamp(),
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
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    // Restore original rules
    console.log("\n🔒 Restoring original Firestore rules...");
    fs.writeFileSync("firestore.rules", originalRules);
    execSync("firebase deploy --only firestore:rules", { stdio: "inherit" });

    // Clean up backup file
    fs.unlinkSync("firestore.rules.backup");

    console.log("✅ Original rules restored");
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
