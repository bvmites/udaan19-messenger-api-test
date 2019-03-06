const {MongoClient} = require('mongodb')
const {SHA256} = require('crypto-js')

MongoClient.connect(process.env.DB,(err,client)=>{
	if (err) {
    	return console.log('Unable to connect to MongoDB server');
  	}
  	console.log('Connected to MongoDB server');
  	var db=client.db('Udaan-19')
  	
  	db.collection('events').find({}).toArray().then((docs)=>{
  		docs.forEach((doc)=>{
  			doc.managers.forEach((manager)=>{
  				db.collection('eventManagers').insertOne({
  					id:manager.phone,
					name:manager.name,
					password: SHA256(manager.phone+process.env.SECRET).toString(),
					eventName:doc.eventName
				})
  			})
  		})
  	},(e)=>{
  		console.log(e)
  	})
})