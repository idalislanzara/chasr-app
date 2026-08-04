// Fictional demo profiles — clearly labeled, shown ONLY in demo mode.
// These are not real people and never appear in the real user grid.

export interface DemoProfile {
  id: string;
  name: string;
  age: number;
  pronouns: string;
  identity: string;
  tagline: string;
  bio: string;
  distance: string;
  height: string;
  bodyType: string;
  ethnicity: string;
  lookingFor: string[];
  interests: string[];
  lastActive: string;
  verified: boolean;
  online: boolean;
}

export const demoProfiles: DemoProfile[] = [
  {
    id: 'demo_ari',
    name: 'Ari',
    age: 26,
    pronouns: 'she/her',
    identity: 'Trans Woman',
    tagline: 'Coffee dates > text threads',
    bio: 'Music producer by day, chaos gremlin by night. Looking for someone to see live shows with and maybe more.',
    distance: '1.2 km',
    height: "5'7\"",
    bodyType: 'Slim',
    ethnicity: 'Latina',
    lookingFor: ['Dates', 'Chat'],
    interests: ['Music', 'Art', 'Tattoos'],
    lastActive: 'Online now',
    verified: true,
    online: true,
  },
  {
    id: 'demo_jules',
    name: 'Jules',
    age: 31,
    pronouns: 'they/them',
    identity: 'Non-Binary',
    tagline: 'Ask me about my dog',
    bio: 'Teacher, hiker, accidental plant hoarder. Down for adventures or a chill night in with good food.',
    distance: '3.4 km',
    height: "5'10\"",
    bodyType: 'Athletic',
    ethnicity: 'White',
    lookingFor: ['Dates', 'Friends', 'Relationship'],
    interests: ['Hiking', 'Dogs', 'Cooking'],
    lastActive: '12 min ago',
    verified: true,
    online: false,
  },
  {
    id: 'demo_marcus',
    name: 'Marcus',
    age: 28,
    pronouns: 'he/him',
    identity: 'Trans Man',
    tagline: 'New city, new coffee spots',
    bio: 'Just moved here for work. Would love a tour guide with good taste in ramen.',
    distance: '5.1 km',
    height: "5'11\"",
    bodyType: 'Average',
    ethnicity: 'Black',
    lookingFor: ['Dates', 'Friends'],
    interests: ['Foodie', 'Movies', 'Travel'],
    lastActive: 'Online now',
    verified: false,
    online: true,
  },
  {
    id: 'demo_sofia',
    name: 'Sofia',
    age: 24,
    pronouns: 'she/her',
    identity: 'Trans Woman',
    tagline: 'Gym + tattoos + you?',
    bio: 'Fitness trainer who loves gaming and karaoke. Looking for someone to build with, literally and emotionally.',
    distance: '2.8 km',
    height: "5'5\"",
    bodyType: 'Muscular',
    ethnicity: 'Mixed',
    lookingFor: ['Dates', 'Right Now'],
    interests: ['Fitness', 'Gaming', 'Karaoke'],
    lastActive: '2 min ago',
    verified: true,
    online: true,
  },
  {
    id: 'demo_noah',
    name: 'Noah',
    age: 34,
    pronouns: 'he/him',
    identity: 'Cis Man',
    tagline: 'Trans women are my type',
    bio: 'Engineer, dad joke enthusiast, loves cooking for someone special. Respect and kindness above all.',
    distance: '4.3 km',
    height: "6'1\"",
    bodyType: 'Average',
    ethnicity: 'White',
    lookingFor: ['Dates', 'Relationship'],
    interests: ['Cooking', 'Tech', 'Coffee'],
    lastActive: '38 min ago',
    verified: false,
    online: false,
  },
  {
    id: 'demo_elena',
    name: 'Elena',
    age: 29,
    pronouns: 'she/her',
    identity: 'Trans Woman',
    tagline: 'Happily myself, finally',
    bio: 'Nurse who loves travel, photography, and long dinners. Looking for genuine connection and mutual respect.',
    distance: '6.0 km',
    height: "5'9\"",
    bodyType: 'Curvy',
    ethnicity: 'Filipina',
    lookingFor: ['Dates', 'Relationship'],
    interests: ['Travel', 'Photography', 'Brunch'],
    lastActive: 'Online now',
    verified: true,
    online: true,
  },
];
