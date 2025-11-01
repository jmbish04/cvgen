import { CVDataSchema } from '../dist/schema/cv-schema.js';

// Test CV data
const testCV = {
  profile: {
    name: "Test User",
    position: "Software Engineer",
    email: "test@example.com",
    phone: "+1234567890",
    location: "San Francisco, CA",
  },
  summary: "This is a test summary that is longer than 10 characters.",
  education: [
    {
      institution: "Test University",
      degree: "Bachelor of Science",
      field_of_study: "Computer Science",
      end_date: "05/2020",
    }
  ],
  skills: {
    programming_languages: ["JavaScript", "TypeScript"],
    frameworks: ["React", "Node.js"],
  },
};

console.log('Testing CV schema validation...\n');

try {
  const result = CVDataSchema.parse(testCV);
  console.log('✅ Schema validation passed!');
  console.log('\nValidated CV data:');
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
} catch (error) {
  console.error('❌ Schema validation failed:');
  console.error(error.errors || error.message);
  process.exit(1);
}
