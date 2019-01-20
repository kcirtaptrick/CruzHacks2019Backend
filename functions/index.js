const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

var docs = {};

db.collection('questions').get().then(snapshot => {
	docs = JSON.parse(JSON.stringify(snapshot._docs()));
	return;
}).catch();

function ask(conv,string){
	conv.ask(string);
}

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    console.log(request.method)
    if (request.method !== "POST") {
        response.status(404).send("Cannot GET");
    } else {

        response.send(request.body)
    }
});


exports.getQuestion = functions.https.onRequest((request, response) => {
    if (request.method !== "GET") {
        response.status(400).send("Cannot POST");
    } else {
        var questions = db.collection('questions');

        questions.get().then(snapshot => {
                var docs = snapshot._docs();
                var randIndex = Math.floor((Math.random() * docs.length));
                // response.send(docs[randIndex])
                response.send({
                    _id: randIndex,
                    question: docs[randIndex]._fieldsProto.questionText.stringValue
                });
                return;
            }).catch()
            // response.send(request.body)
    }
    // response.status(400).send("You messed up");
    return;
})

exports.handleResponse = functions.https.onRequest((request, response) => {
    if (request.method === "POST") {
        var res = request.body.response;
        var id = request.body._id;
        // var question = request.body.question;
        var uid = request.body.uid;

        var userCol = db.collection('users');

        var userRef = userCol.doc(uid).get().then(doc => {
            var age = doc._fieldsProto.age.integerValue;
            var questions = db.collection("questions").get().then(snapshot => {
                var qDocs = snapshot._docs();
                var qId = qDocs[id]._ref._referencePath.segments[1];
                var qRef = db.collection("questions").doc(qId).update({
                    responses: admin.firestore.FieldValue.arrayUnion({
                        Age: age,
                        Response: res,
                        UID: uid
                    })
                })
                userCol.doc(uid).update({
                    questionsAns: 1 + Number(doc._fieldsProto.questionsAns.integerValue),
                    totalDonated: 0.001 + Number(doc._fieldsProto.totalDonated.doubleValue)
                })
                response.send(doc);
                return;
            }).catch();
            return;
        }).catch();
    }
})

exports.getUserAmount = functions.https.onRequest((request, response) => {
    var uid = request.body.uid;

    db.collection("users").doc(uid).get().then(doc => {
        // console.log(doc);
        response.send("" + doc._fieldsProto.totalDonated.doubleValue);
        return;
    }).catch()
})

const {
    dialogflow
} = require('actions-on-google');
// const functions = require('firebase-functions');
const app = dialogflow({
    debug: true
});


const WELCOME_INTENT = 'Default Welcome Intent';
const FALLBACK_INTENT = 'Default Fallback Intent';
const REQUEST_SURVEY = 'Survey Request';
const NOPE_INTENT = 'Nope';
const CURRENT_CASH_INTENT = "Current Cash";
const DONATOR_INTENT = "Donator";
const NUM_SURVEYS_INTENT = "Number Surveys";
const SKIP_INTENT = "Skip Survey";
const CLOSE_INTENT = "Close";
var want = true;
var response;

//checks to see if the Default Welcome Intent is invoked
app.intent(WELCOME_INTENT, (conv) => {
    conv.ask("Hello Welcome to Change for Change! Would you like to take a survey for charity?");
});
//greets the user and then asks the user if they want to take a survey
app.intent(REQUEST_SURVEY, (conv) => {
    getSurvey(conv);

    // conv.ask('/* Survey question goes here*/')
});

//checks to see if user wasnted to take the survey 
app.intent(NOPE_INTENT, (conv) => {
    want = false;
    conv.ask('Thank you for your contribution!');
});

//while(user !quit) => continue to invoke answers
for (var i = 0; i <= 20; i++) {
    if (want === true) {
        break;
    }
    getSurvey(conv);
}

//checks to see if user wants to know their current amount donated
app.intent(CURRENT_CASH_INTENT, (conv) => {
    conv.ask('You have donated a total of ' /*Current num Donated*/ );
});

//checks to see if user wants to know the charity they are donating to
app.intent(DONATOR_INTENT, (conv) => {
    conv.ask('You are donating to: ' /*Charity Name*/ );
});

//checks to see if user wants to know how many surveys they have taken 
app.intent(NUM_SURVEYS_INTENT, (conv) => {
    conv.ask('You have taken a total of ' + /*Number of Surveys*/ 'surveys');
});

//ends the program once envoked to close 
app.intent(CLOSE_INTENT, (conv) => {
    conv.close('Thank you for your contribution using Change for Change!');
})

//Helper fuctions for when user wants a survey
function getSurvey(conv) {
    app.intent(REQUEST_SURVEY, (conv) => {
   			conv.ask(docs[Math.floor(Math.random()*docs.length)]._fieldsProto.questionText.stringValue);
 
            if (response !== NOPE_INTENT && response !== SKIP_INTENT) {
                app.intent(REQUEST_SURVEY, (conv) => {
                    conv.ask('/* Survey question goes here*/')
                    response = conv.response();
                });

            } else if (response === NOPE_INTENT) {
                app.intent(NOPE_INTENT, (conv) => {
                    conv.ask('Thank you for your contribution!');
                    want = false;
                });
            } else {
                console.log()
            }
            return;
        // conv.ask(/* Survey question goes here*/) 
        });    

}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);