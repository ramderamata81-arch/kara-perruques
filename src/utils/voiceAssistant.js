export const speakText = (text, onStart, onEnd) => {
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  let voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0 && speechSynthesis.onvoiceschanged !== undefined) {
    voices = window.speechSynthesis.getVoices();
  }

  let frenchVoice = null;
  const frVoices = voices.filter(v => v.lang.startsWith("fr"));
  
  if (frVoices.length > 0) {
    frenchVoice = frVoices.find(v => 
      v.localService === true && (
        v.name.includes("Amelie") || 
        v.name.includes("Audrey") ||
        v.name.includes("Aurelie") ||
        v.name.includes("Alice") ||
        v.name.includes("Margot") ||
        v.name.includes("Google")
      )
    );

    if (!frenchVoice) {
      frenchVoice = frVoices.find(v => 
        v.name.includes("Amelie") || 
        v.name.includes("Audrey") ||
        v.name.includes("Aurelie") ||
        v.name.includes("Alice") ||
        v.name.includes("Margot") ||
        v.name.includes("Google")
      );
    }
    
    if (!frenchVoice) {
      frenchVoice = frVoices.find(v => !v.name.includes("Thomas")) || frVoices[0];
    }
  }

  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }
  
  utterance.lang = "fr-FR";
  utterance.rate = 1.0; 
  utterance.pitch = 1.0; 
  
  if (onStart) utterance.onstart = onStart;
  
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  
  utterance.onerror = (e) => {
    console.error("Erreur de synthèse vocale", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
