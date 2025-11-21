// Run: npm run seed
require('dotenv').config();
const { MongoClient } = require('mongodb');


const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('Set MONGODB_URI in env');


const faqs = [
{ question: 'What are check-in and check-out timings?', answer: 'Check-in from 2:00 PM; check-out by 12:00 PM. Early check-in and late check-out are subject to availability.' },
{ question: 'Is breakfast included?', answer: 'Breakfast inclusion depends on the room rate. Please check your booking details or ask for breakfast add-on at reception.' },
{ question: 'Do you have free WiFi?', answer: 'Yes — complimentary high-speed WiFi is available across the property for all guests.' },
{ question: 'What is your cancellation policy?', answer: 'Cancellation policies vary by rate and season. Standard rates may allow free cancellation up to 24 hours before arrival.' },
{ question: 'Is parking available?', answer: 'Yes, we offer complimentary self-parking for hotel guests. Valet is available on request for a small fee.' },
{ question: 'Do you accept pets?', answer: 'Sorry, pets are not allowed except for service animals with prior notification.' }
];


(async () => {
const client = new MongoClient(uri);
try {
await client.connect();
const db = client.db();
const col = db.collection('faqs');
await col.deleteMany({});
await col.insertMany(faqs);
console.log('Seeded FAQs successfully');
process.exit(0);
} catch (e) {
console.error(e);
process.exit(1);
} finally {
await client.close();
}
})();