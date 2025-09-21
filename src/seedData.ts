import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// Firebase config - same as in firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export type CompetenceRow = { id: string; name: string; level: number }

// Sample competences covering various technology areas
const sampleCompetences = [
  // Frontend Technologies
  'React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Sass/SCSS',
  'Tailwind CSS', 'Material-UI', 'Bootstrap', 'Webpack', 'Vite', 'Next.js', 'Nuxt.js',
  
  // Backend Technologies
  'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot',
  'C#', '.NET Core', 'PHP', 'Laravel', 'Ruby', 'Ruby on Rails', 'Go', 'Rust',
  
  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase Firestore', 'SQLite',
  'Elasticsearch', 'DynamoDB', 'Cassandra',
  
  // Cloud & DevOps
  'AWS', 'Google Cloud Platform', 'Microsoft Azure', 'Docker', 'Kubernetes',
  'Jenkins', 'GitHub Actions', 'GitLab CI', 'Terraform', 'Ansible',
  
  // Mobile Development
  'React Native', 'Flutter', 'Swift (iOS)', 'Kotlin (Android)', 'Xamarin',
  
  // Data & Analytics
  'SQL', 'Python Data Science', 'R', 'Tableau', 'Power BI', 'Apache Spark',
  'Pandas', 'NumPy', 'TensorFlow', 'PyTorch',
  
  // Testing & Quality
  'Jest', 'Cypress', 'Selenium', 'Unit Testing', 'Integration Testing',
  'Test-Driven Development', 'Postman', 'JMeter',
  
  // Version Control & Collaboration
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack',
  
  // Design & UX
  'Figma', 'Adobe XD', 'Sketch', 'UI/UX Design', 'Responsive Design',
  'Accessibility (a11y)', 'Design Systems',
  
  // Project Management & Methodologies
  'Agile', 'Scrum', 'Kanban', 'Project Management', 'Code Review',
  'Technical Documentation', 'API Design', 'System Architecture'
]

// Sample user profiles with realistic names and varied skill distributions
const sampleUsers = [
  {
    userId: 'user_001_alice_johnson',
    ownerName: 'Alice Johnson',
    competences: [
      'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Git', 'Jest', 'Figma',
      'Docker', 'GraphQL', 'Material-UI', 'Express.js', 'MongoDB', 'GitHub Actions'
    ]
  },
  {
    userId: 'user_002_bob_smith',
    ownerName: 'Bob Smith',
    competences: [
      'Python', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
      'Git', 'Unit Testing', 'API Design', 'Linux', 'Nginx', 'Celery'
    ]
  },
  {
    userId: 'user_003_carol_davis',
    ownerName: 'Carol Davis',
    competences: [
      'Vue.js', 'JavaScript', 'PHP', 'Laravel', 'MySQL', 'Sass/SCSS', 'Webpack',
      'Git', 'Postman', 'UI/UX Design', 'Adobe XD', 'Responsive Design'
    ]
  },
  {
    userId: 'user_004_david_wilson',
    ownerName: 'David Wilson',
    competences: [
      'Java', 'Spring Boot', 'MySQL', 'Redis', 'Jenkins', 'Git', 'JUnit',
      'Maven', 'Microservices', 'REST APIs', 'Swagger', 'SonarQube'
    ]
  },
  {
    userId: 'user_005_eva_brown',
    ownerName: 'Eva Brown',
    competences: [
      'React Native', 'Flutter', 'Swift (iOS)', 'Kotlin (Android)', 'Firebase Firestore',
      'Git', 'Mobile UI/UX', 'App Store Deployment', 'Push Notifications'
    ]
  },
  {
    userId: 'user_006_frank_miller',
    ownerName: 'Frank Miller',
    competences: [
      'Python Data Science', 'Pandas', 'NumPy', 'TensorFlow', 'SQL', 'Tableau',
      'Jupyter Notebooks', 'Apache Spark', 'Machine Learning', 'Statistics'
    ]
  },
  {
    userId: 'user_007_grace_taylor',
    ownerName: 'Grace Taylor',
    competences: [
      'Angular', 'TypeScript', 'RxJS', 'NgRx', 'Jasmine', 'Karma', 'Protractor',
      'Git', 'Azure', 'CI/CD', 'SCSS', 'Bootstrap'
    ]
  },
  {
    userId: 'user_008_henry_anderson',
    ownerName: 'Henry Anderson',
    competences: [
      'C#', '.NET Core', 'Entity Framework', 'SQL Server', 'Azure', 'Git',
      'xUnit', 'SignalR', 'Web APIs', 'Blazor', 'Identity Server'
    ]
  },
  {
    userId: 'user_009_ivy_thomas',
    ownerName: 'Ivy Thomas',
    competences: [
      'Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'gRPC', 'Prometheus',
      'Git', 'Microservices', 'Load Balancing', 'Message Queues'
    ]
  },
  {
    userId: 'user_010_jack_jackson',
    ownerName: 'Jack Jackson',
    competences: [
      'Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Vercel', 'Prisma',
      'Supabase', 'Git', 'Cypress', 'Storybook', 'SEO', 'Performance Optimization'
    ]
  }
]

// Function to generate random skill level with realistic distribution
function getRandomSkillLevel(): number {
  const rand = Math.random()
  // Weighted distribution: more beginners and proficient, fewer experts and learners
  if (rand < 0.15) return 1 // Want to learn (15%)
  if (rand < 0.45) return 2 // Beginner (30%)
  if (rand < 0.85) return 3 // Proficient (40%)
  return 4 // Expert (15%)
}

// Function to create competence rows for a user
function createCompetenceRows(competenceNames: string[]): CompetenceRow[] {
  return competenceNames.map((name, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    level: getRandomSkillLevel()
  }))
}

// Main seeding function
export async function seedDatabase() {
  console.log('🌱 Starting database seeding...')
  
  try {
    for (const user of sampleUsers) {
      const competenceRows = createCompetenceRows(user.competences)
      
      const userDocRef = doc(db, 'users', user.userId)
      await setDoc(userDocRef, {
        ownerName: user.ownerName,
        competences: competenceRows,
        updatedAt: serverTimestamp(),
        seeded: true // Flag to identify seeded data
      })
      
      console.log(`✅ Added user: ${user.ownerName} with ${competenceRows.length} competences`)
    }
    
    console.log(`🎉 Successfully seeded ${sampleUsers.length} users to the database!`)
    console.log('📊 Competence distribution:')
    console.log('   - Want to learn: ~15%')
    console.log('   - Beginner: ~30%')
    console.log('   - Proficient: ~40%')
    console.log('   - Expert: ~15%')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✨ Seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}
