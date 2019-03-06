let MongoClient = require('mongodb').MongoClient;
let dotenv = require('dotenv');

dotenv.config();

(async ()=>{
    const client =await MongoClient.connect(process.env.DB,{ useNewUrlParser:true });
    const db = client.db('Udaan-19');

    let events = await db.collection('events').find({}).toArray();
    // console.log(events);

    let eventAtt = [];

    events.forEach(event=>{
        eventAtt.push({
            eventName: event.eventName,
            round_1: [],
            round_2: [],
            round_3: []
        });
    });
    // console.log(eventAtt);

    let AttendanceEvents = await db.collection('Event-Attendance').insertMany(eventAtt);
    
})();