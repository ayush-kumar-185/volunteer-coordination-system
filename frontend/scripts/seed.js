import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  try {
    const needsPath = path.join(__dirname, '../src/data/community_needs.json');
    const volunteersPath = path.join(__dirname, '../src/data/volunteers.json');

    const needsData = await fs.readFile(needsPath, 'utf8');
    const volunteersData = await fs.readFile(volunteersPath, 'utf8');

    const needs = JSON.parse(needsData);
    const volunteers = JSON.parse(volunteersData);

    let seededNeeds = 0;
    let seededVolunteers = 0;
    let failed = 0;

    console.log(`Starting to seed ${needs.length} community needs...`);
    for (let i = 0; i < needs.length; i++) {
      console.log(`Seeding record ${i + 1}/${needs.length}...`);
      try {
        const response = await fetch('http://localhost:3000/api/needs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(needs[i]),
        });

        if (response.ok) {
          seededNeeds++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    console.log(`Starting to seed ${volunteers.length} volunteers...`);
    for (let i = 0; i < volunteers.length; i++) {
      console.log(`Seeding volunteer ${i + 1}/${volunteers.length}...`);
      try {
        const response = await fetch('http://localhost:3000/api/volunteers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(volunteers[i]),
        });

        if (response.ok) {
          seededVolunteers++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    console.log(`\nSeeded ${seededNeeds} needs, ${seededVolunteers} volunteers. ${failed} failed.`);
  } catch (error) {
    console.error('Error during seeding:', error.message);
  }
}

seed();
