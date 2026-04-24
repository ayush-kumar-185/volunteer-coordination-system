const fs = require('fs');
const path = require('path');

const NEIGHBORHOODS = ['Lajpat Nagar', 'Karol Bagh', 'Vasant Kunj', 'Saket', 'Rohini', 'Dwarka', 'Hauz Khas', 'Janakpuri'];
const CATEGORIES = ['Water', 'Roads', 'Electricity', 'Sanitation', 'Health', 'Other'];

const volunteers = [];
for(let i=1; i<=50; i++) {
  volunteers.push({
    id: `vol_${i}`,
    name: `Volunteer ${i}`,
    skills: CATEGORIES.sort(() => 0.5 - Math.random()).slice(0, 2),
    lat: 28.50 + Math.random() * 0.25,
    lng: 77.10 + Math.random() * 0.20,
    neighborhood: NEIGHBORHOODS[Math.floor(Math.random() * NEIGHBORHOODS.length)],
    active: Math.random() > 0.2
  });
}

const dataDir = path.join(__dirname, 'src/data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
}
fs.writeFileSync(path.join(dataDir, 'volunteers.json'), JSON.stringify(volunteers, null, 2));
console.log("src/data/volunteers.json generated with 50 records.");
