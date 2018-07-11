const Alexa = require('alexa-sdk');
const config = require('./config');
const _ = require('lodash');

function launchRequest() {
    this.response.speak('Hello, Welcome to the music book. Please choose the chapter you want to listen? You can say play one or two or three')
        .listen('Sorry! I din\'t get that, Can you choose the chapter again?');
    this.emit(':responseReady');
}

function helpHandler() {
    this.response.speak('You can start listening to chapters by saying play one, two or three. and start asking questions if any. ')
        .listen('Sorry! I din\'t get that, Can you choose again?');
    this.emit(':responseReady');
}

function fallbackHandler() {
    this.response.speak('Sorry! I don\'t know that. You can start listening to chapters by saying play one, two or three. and start asking questions. ')
        .listen('Sorry! I din\'t get that, Can you choose again?');
    this.emit(':responseReady');
}

function handleQA() {
    const intentObj = this.event.request.intent;
    if (config.QA[intentObj.name]) {
        this.response.speak(_.sample(config.QA[intentObj.name]));
        this.emit(':responseReady');
    } else {
        this.response.speak(_.sample(config.NOQA)).listen('');
        this.emit(':responseReady');
    }
}

function playMusicIntent() {
    const intentObj = this.event.request.intent;
    if (intentObj.slots['chapterTitle'] && intentObj.slots['chapterTitle'].value
        && intentObj.slots['chapterTitle'].resolutions && intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority
        && intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority.length > 0
        && intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values
        && intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values.length > 0
        && intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values[0].value
        && intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values[0].value.id) {
        const behavior = 'REPLACE_ALL';
        const url = config.PLAYBACK_URLS[intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values[0].value.id];
        const token = intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values[0].value.id;
        const offsetInMilliseconds = 0;
        this.attributes['playingChapter'] = intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values[0].value.id;
        if (url) {
            this.response.speak('Now playing chapter ' + intentObj.slots['chapterTitle'].resolutions.resolutionsPerAuthority[0].values[0].value.id)
                .audioPlayerPlay(behavior, url, token, null, offsetInMilliseconds);
            this.emit(':responseReady');
        } else {
            this.emit(':delegate');
        }
    } else {
        this.emit(':delegate');
    }
}

function playbackStarted() {
    console.log('Alexa begins playing the audio stream');
    this.emit(':responseReady');
}

function playbackFinished() {
    console.log("Playback finished");
    this.emit(':responseReady');
}

function playbackStopped() {
    console.log("Playback stopped");
    this.emit(':responseReady');
}

function playbackFailed() {
    this.response.speak("Sorry! Im unable to play the chapter you have selected.")
        .audioPlayerStop();
    this.emit(':responseReady');
}

function playbackNearlyFinished() {
    console.log("Playback nearly finished");
    this.emit(':responseReady');
}

function exitHandler() {
    if (this.event.context.AudioPlayer && this.event.context.AudioPlayer.playerActivity === 'PLAYING') {
        this.response.speak("Ok.. Bye! happy learning!")
            .audioPlayerStop();
        this.emit(':responseReady');
    } else {
        this.response.speak("Ok. Good bye. Comeback soon!").audioPlayerStop();
        this.emit(':responseReady');
    }
}

function unhandled() {
    this.response.speak("Sorry! I could'nt answer that right now!");
    this.emit(':responseReady');
}

function sessionEndedRequest() {
    this.response.speak("Ok. Good bye. Comeback soon!");
    this.emit(':responseReady');
}

const handlers = {
    'LaunchRequest': launchRequest,
    'AMAZON.HelpIntent': helpHandler,
    'AMAZON.FallbackIntent': fallbackHandler,
    'PlayChapter': playMusicIntent,
    'SessionEndedRequest': sessionEndedRequest,
    'AMAZON.CancelIntent': exitHandler,
    'AMAZON.StopIntent': exitHandler,
    'AMAZON.PauseIntent': exitHandler,
    'AMAZON.StartOverIntent': exitHandler,
    'AMAZON.ResumeIntent': exitHandler,
    'AMAZON.RepeatIntent': exitHandler,
    'PlaybackStarted': playbackStarted,
    'PlaybackFinished': playbackFinished,
    'PlaybackStopped': playbackStopped,
    'PlaybackNearlyFinished': playbackNearlyFinished,
    'PlaybackFailed': playbackFailed,
    'Unhandled': unhandled
};

var qaHandlers = {};

_.forOwn(config.QA, function (value, key) {
    qaHandlers[key] = handleQA;
});

exports.handler = function (event, context, callback) {
    console.log("***********EVENT***********", JSON.stringify(event));
    const alexa = Alexa.handler(event, context);
    alexa.appId = config.APP_ID;
    alexa.registerHandlers(handlers, qaHandlers);
    alexa.execute();
};