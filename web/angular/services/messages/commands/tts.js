class
twake_TTS
{

	getVoice(lang)
	{

		lang = lang || "nolang";
		lang = lang.toLocaleLowerCase();

		var voices = window.speechSynthesis.getVoices();
		var candidate = null;
		var auto_candidate = null;

		for (var i = 0; i < voices.length; i++) {

			var langs_str = voices[i].lang.toLocaleLowerCase();
			var langs = langs_str.split("-");
			if (lang == langs_str || lang == langs[0] || lang == langs[1]) {
				if (candidate == null || voices[i].default) {
					candidate = voices[i];
				}
			}
			if (voices[i].default) {
				auto_candidate = voices[i];
			}

		}

		return candidate || auto_candidate;

	}

	say(text, lang)
	{

		var that = this;

		var voice = that.getVoice(lang);
		if (voice == null) {
			return;
		} else {
			var utterThis = new SpeechSynthesisUtterance(text);
			utterThis.voice = voice;
			utterThis.pitch = 1;
			utterThis.rate = 1;
			window.speechSynthesis.speak(utterThis);
		}

	}

	constructor(text, lang)
	{

		var that = this;

		if ('speechSynthesis' in window) {
			if (window.speechSynthesis.getVoices().length == 0) {
				window.speechSynthesis.onvoiceschanged = function () {
					that.say(text, lang);
				};
			} else {
				that.say(text, lang);
			}
		}
	}
}