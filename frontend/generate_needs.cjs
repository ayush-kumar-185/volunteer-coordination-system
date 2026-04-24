const fs = require('fs');
const path = require('path');

const NEIGHBORHOODS = ['Lajpat Nagar', 'Karol Bagh', 'Vasant Kunj', 'Saket', 'Rohini', 'Dwarka', 'Hauz Khas', 'Janakpuri'];
const CATEGORIES = ['Water', 'Roads', 'Electricity', 'Sanitation', 'Health', 'Other'];

const needs = [];
const typos = ['streat', 'woter', 'elecricity', 'broken', 'borken', 'plz', 'help'];
for(let i=1; i<=50; i++) {
  needs.push({
    id: `need_${i}`,
    timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    location: `${NEIGHBORHOODS[Math.floor(Math.random() * NEIGHBORHOODS.length)]}, Block ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    urgency: Math.floor(Math.random() * 10) + 1,
    description: `The ${CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].toLowerCase()} is really bad here. Need ${typos[Math.floor(Math.random() * typos.length)]} fix ASAP!`,
    people_affected: Math.floor(Math.random() * 500) + 10,
    status: 'open'
  });
}

const dataDir = path.join(__dirname, 'src/data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
}
fs.writeFileSync(path.join(dataDir, 'community_needs.json'), JSON.stringify(needs, null, 2));
console.log("src/data/community_needs.json generated with 50 records.");
