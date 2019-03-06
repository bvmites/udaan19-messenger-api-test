const router = require('express').Router();
// const authenticate = require('./../middleware/authenticate.js');
const jwt = require('jsonwebtoken');
const {ObjectID} = require('mongodb');

const ParticipantSchema = require('../schema/participant');

const Validator = require('jsonschema').Validator;
const validator = new Validator();

const hashPassword = require('../utils/hashPassword');


module.exports = (db) => {
	const database = require('./../db/db.js')(db);

	//POST /create				for creating users
	router.post('/create', async (request, response) => {
		try {
			const {username, password} = request.body;
			const result = await database.create({username, password});
			response.status(200).json({message: 'User created.'});
		} catch (e) {
			response.status(500).json({message: e.message});
		}

	});

	// POST /login						for login
	router.post('/login', async (request, response) => {
		try {

			console.log(request.body);
			const {username, password} = request.body;
			const result = await database.get(username);
			const error = new Error();

			console.log(request.body);
			if (!(username && password)) {
				error.message = 'Invalid request';
				error.code = 'MissingCredentials';
				throw error;
			}

			if (result === null) {
				error.message = 'Invalid username or password';
				error.code = 'UserDoesntExist';
				throw error;
			}

			if (result.password.hash === hashPassword(password, result.password.salt, result.password.iterations)) {
				const payload = {
					user: {
						username
					}
				};
				const token = jwt.sign(payload, process.env.JWT_SECRET);
				response.status(200).json({token});
			}
			else {
				error.message = 'Invalid username or password';
				error.code = 'InvalidCredentials';
				throw error;
			}
		} catch (e) {
			console.log(e);
			if (e.code === 'MissingCredentials') {
				response.status(400);
			}
			else if (e.code in ['UserDoesntExist', 'InvalidCredentials']) {
				response.status(401);
			}
			else {
				response.status(500);
			}
			response.json({message: e.message});
		}
	});

	router.post('/round',/*authenticate,*/(req,res)=>{
		// database.round(req.id).then((manager)=>{
		try{
			var event = req.body.eventName;
			req.body.contacts.forEach((contact)=>{
				database.findParticipantAndUpdateRound(event,contact).then((participant)=>{}).catch((err)=>console.log(err))
			});
			database.addContacts(req.body.round,event,req.body.contacts).then((result)=>{}).catch((err)=>console.log(err));

			database.sendMessage(req.body.contacts,req.body.message,new ObjectID(req.body.eventID),res)
		}catch(e){
			console.log(e.message);
			res.status(400).send({
				error:"unable to update round!"
			})
		}
	});

	router.post('/attendance', /*authenticate,*/ async (req, res)=>{

		try{
			let phones = req.body.contacts;
			let eventName = req.body.eventName;
			let round = req.body.theRound;
			// console.log(round);
			let result = await database.getAttenddance(eventName).toArray();
			console.log(result);
			if(round === "1"){
				phones.forEach(phone=>{
					result[0].round_1.push(phone);
				})
			}else if(round === "2"){
				phones.forEach(phone=>{
					result[0].round_2.push(phone);
				})
			}else if(round === "3"){
				phones.forEach(phone=>{
					result[0].round_3.push(phone);
				})
			}
			console.log(result[0]);
			let answer = await database.setAttendance(result[0]);
			// console.log(answer);
			res.status(200).send({message:"attendance added"})

		}catch (e) {
			console.log(e.message)
		}
    });

	router.post('/addParticipant',/*authenticate,*/(req,res)=>{

		console.log(req.body);
		try{
			database.addParticipant(req.body);
			res.status(200).send({
				success:"Participant inserted"
			})
		} catch (e) {
			console.log(e);
			res.status(400).send(e);
		}
	});

	router.put('/update',/*authenticate,*/async (request, response) => {
		    try {
		        const error = new Error();
		        if (!validator.validate(request.body, ParticipantSchema).valid) {
		            error.message = 'Invalid input';
		            error.code = 'ValidationException';
		            throw error;
		        }
		        const updatedEvent = request.body;
		        const result = await database.update(updatedEvent);
		        // const insertedEvent = result.message.documents[0];
		        if (result.result.n === 0) {
		            error.message = 'The event with the specified Phone doesn\'t exist.';
		            error.code = 'EventNotFound';
		            throw error;
		        }
		        response.status(200).json({message: 'Participant updated'});
		    } catch (e) {
		        if (e.code === 'ValidationException') {
		            response.status(405).json({message: e.message});
		        } else if (e.code === 'EventNotFound') {
		            response.status(404).json({message: e.message});
		        } else {
		            response.status(500).json({message: e.message});
		        }
		    }
		});

	router.post('/get',/*authenticate,*/ async (request, response)=>{
		try{
			const phone = request.body.phone;
			const result = await database.getParticipants(phone);
			response.status(200).json(result);
		}catch (e) {
			response.status(500).json({message: e.message});
		}
	});

	router.post('/getall', /*authenticate,*/ async (request,response)=>{
		try{
			const phones = request.body.contacts;
			let result = [];
			let details = {};
			for(let i=0; i<phones.length; i++){
				details = await database.getParticipants(phones[i]);
				result.push(details);
			}
			// console.log(result);
			response.status(200).json({participants:result});
		}catch (e) {
			response.status(500).json({message:e.message});
		}
	});

	return router;
};