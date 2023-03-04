// UI Elements
let btnCancel, btnTest, btnSpeak, btnGpt, buttons;
// Speech API
let recog, utterance;
// Params
let delay, scale, timer;

const Init = () => {
	btnCancel = document.getElementById('cancel');
	
	btnTest = document.getElementById('test');
	btnSpeak = document.getElementById('speak');
	btnGpt = document.getElementById('gpt');
	throbber = document.querySelector('.throbber');

	buttons = [btnSpeak, btnGpt, btnTest];

	recog = new webkitSpeechRecognition();
	utterance = new SpeechSynthesisUtterance('');

	delay = 50;
	scale = 8;
	timer = null;

	ChangeState('waiting');

	btnSpeak.addEventListener('click', Listen);
	btnTest.addEventListener('click', GetHelp);
	btnCancel.addEventListener('click', Reset);
	btnGpt.addEventListener('click', () => QueryAndSpeak('Make up a random sentence.'));

	InitSpeechEvents();
};

const InitSpeechEvents = () => {
	recog.onresult = (event) => {
		if(
			!event ||
			!event.results ||
			!event.results.length ||
			!event.results[0] ||
			!event.results[0].length ||
			!event.results[0][0].transcript
		) {
			SayIt("I was not able to hear you. Please try again.");
			Reset();
		} else {
			let query = event.results[0][0].transcript;
			console.log(query);
			QueryAndSpeak(query);
		}
	};
	
	utterance.onboundary = (e) => {
		console.log(e);
		throbber.style.animation = 'none';

		const spokenWord = e.utterance.text.substring(e.charIndex, e.charIndex+e.charLength);
		const nextChar = e.utterance.text.substring(e.charIndex+e.charLength, e.charIndex+e.charLength+1)
		const charsRemaining = e.utterance.text.length - (e.charIndex+1);
	
		if(/[,.?]/.test(spokenWord)) {
			throbber.style.transform = '';
		} else {
			console.log(spokenWord, nextChar, charsRemaining);
			throbber.style.transform = `scale(${scale})`;
			if(timer) clearTimeout(timer);
			timer = setTimeout(() => {
				//console.log('shrink')
				throbber.style.transform = 'scale(1)';
			}, spokenWord.length * delay);
		}
	};
	
	utterance.addEventListener('start', console.log('utteranceStart'));
	utterance.addEventListener('end', () => {
		console.log('utteranceEnd');
		Reset();
	});
};

const GetHelp = () => {
	SayIt(`
		Hello there. 
		I am G P T 9000, a voice interface for the Chat G P T natural language model by Open A I. 
		To interact with me, press the microphone button to the left and say something. 
		Or, press the dice button on the right and I'll say something random.
	`);
};

const Listen = () => {
	ChangeState('listening');
	recog.start()
};

const Reset = () => {
	ChangeState('waiting');
	throbber.style.animation = '';
	speechSynthesis.cancel();
	recog.stop();
};

const QueryAndSpeak = (query) => {
	QueryGPT(query)
		.then(
			(response) => SayIt(response)
		);
};

const QueryGPT = (query) => {
	ChangeState('sending', query);

	let options = {
		body: 'query=' + query,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		method: 'post',
	};

	return fetch('https://proxygpt.greenzeta.com', options)
		.then(response => response.json())
		.then(data => data.choices[0].message.content);
};

const SayIt = (txtScript) => {
	ChangeState('speaking', txtScript);

	utterance.text = txtScript;
	speechSynthesis.speak(utterance);
};

const ChangeState = (newState, value) => {
	const validStates = ['listening', 'speaking','sending'];
	if(validStates.includes(newState)) {
		throbber.dataset.state = newState;
		buttons.forEach(btn => btn.setAttribute('disabled', 'true'));
		btnCancel.removeAttribute('disabled');
	} else {
		throbber.dataset.state = 'waiting';
		buttons.forEach(btn => btn.removeAttribute('disabled'));
		btnCancel.setAttribute('disabled', 'true');
	}
	AnalyticsEvent(newState, value);
};

const AnalyticsEvent = (type, value) => {
	switch(type) {
		case 'listening':
			break;
		case 'speaking':
			gtag('event', 'Speech API', {
				'event_category': 'speak',
				'event_label': value.substring(0, 10),
				'value': 1
			});
			break;
		case 'sending':
			gtag('event', 'GPT Query', {
				'event_category': 'query',
				'event_label': value.substring(0, 10),
				'value': 1
			});
			break;
		default:
			break;
	}
};

window[ addEventListener ? 'addEventListener' : 'attachEvent' ]
( addEventListener ? 'load' : 'onload', Init )