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
	utterance = new SpeechSynthesisUtterance("");

	delay = 50;
	scale = 7;
	timer = null;

	throbber.dataset.state = "waiting";

	InitSpeechEvents();
	InitUiEvents();
};

const InitSpeechEvents = () => {
	recog.onresult = (event) => {
		console.log(event.results[0][0].transcript);
		let query = event.results[0][0].transcript;
		//SayIt(response);
		QueryGPT(query).then((response) => SayIt(response));
	};
	
	utterance.onboundary = (e) => {
		console.log(e);
		const spokenWord = e.utterance.text.substring(e.charIndex, e.charIndex+e.charLength);
		const nextChar = e.utterance.text.substring(e.charIndex+e.charLength, e.charIndex+e.charLength+1)
		const charsRemaining = e.utterance.text.length - (e.charIndex+1);
		//let throbberSize = 10 * charLength;
	
		
		if(/[,.?]/.test(spokenWord)) {
			//throbber.style.transform = 'scale(0)';
		} else {
			console.log(spokenWord, nextChar, charsRemaining);
			throbber.style.transform = `scale(${scale})`;
			if(timer) clearTimeout(timer);
			timer = setTimeout(() => {
				//console.log('shrink')
				throbber.style.transform = 'scale(0)';
			}, spokenWord.length * delay);
		}
	
		//if (/[,.?\-]/.test(rspace))
	
		// throbber.style.transform = 'scale(0)';
	
		// if(!/[,.?]/.test(nextChar) && charsRemaining > 0) 
		//  	setTimeout(() => throbber.style.transform = 'scale(10)', 50);
	};
	
	utterance.addEventListener('start', () => {
		DisableButtons();
		console.log('utteranceStart');
		//throbber.style.transform = 'scale(5)';
	});
	utterance.addEventListener('end', () => {
		console.log('utteranceEnd');
		EnableButtons();
		throbber.style.transform = 'scale(1)';
		
	});
};

const InitUiEvents = () => {
	btnSpeak.addEventListener('click', () => {
		DisableButtons();
		//SayIt('This button has not been programmed to do anything... yet.');
		throbber.dataset.state = "listening";
		recog.start();
	});
	
	btnTest.addEventListener('click', () => {
		DisableButtons();
		//SayIt('this is a much longer test. there is one long unbroken sentence that keeps moving from topic to topic it is quite hypnotic.');
		SayIt(`
			Hello there. I'm GPT 9000, a voice interface for the Chat GPT natural language model by Open A I. To interact with me, press the microphone button to the left and say something. Or, press the dice button on the right and I'll say something random.
		`);
	});
	
	btnCancel.addEventListener('click', () => {
		speechSynthesis.cancel();
		throbber.style.transform = 'scale(1)';
		EnableButtons();
	});
	
	btnGpt.addEventListener('click', () => {
		DisableButtons();
		QueryGPT("Make up a random sentence.").then((response) => SayIt(response));
	});
};



//const voice = new SpeechSynthesisVoice();
//voice.default = true;
//voice.lang = "en-US";
//voice.localService = true;
//voice.name = "Microsoft David - English (United States)";
//voice.voiceURI = "Microsoft David - English (United States)";

//utterance.voice = voice;

const DisableButtons = () => {
	buttons.forEach(btn => btn.setAttribute('disabled', 'true'));
	btnCancel.removeAttribute('disabled')
};

const EnableButtons = () => {
	throbber.dataset.state = "waiting";
	buttons.forEach(btn => btn.removeAttribute('disabled'));
	btnCancel.setAttribute('disabled', 'true');
};

const QueryGPT = (query) => {
	throbber.dataset.state = "sending";
	let options = {
		body: "query=" + query + "",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		method: "post",
	};

	return fetch('https://proxygpt.greenzeta.com', options)
		.then(response => response.json())
		.then(
			data => data.choices[0].message.content
		);

};

const SayIt = (txtScript) => {
	utterance.text = txtScript;
	throbber.dataset.state = "speaking";
		speechSynthesis.speak(utterance);
};

window[ addEventListener ? 'addEventListener' : 'attachEvent' ]
( addEventListener ? 'load' : 'onload', Init )