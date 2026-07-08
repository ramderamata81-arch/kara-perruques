import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

const VoiceAssistantButton = ({ product }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // On évite toLocaleString qui crée des espaces insécables faisant parfois bugger la voix
    const formatPrice = (price) => price.toString();

    let textToSpeak = `Ceci est la perruque ${product.nom}. `;
    if (product.enPromo && product.prixPromo) {
      textToSpeak += `Son prix promo est de ${formatPrice(product.prixPromo)} francs CFA, au lieu de ${formatPrice(product.prix)} francs. `;
    } else {
      textToSpeak += `Son prix est de ${formatPrice(product.prix)} francs CFA. `;
    }
    textToSpeak += `Si elle vous plait, cliquez sur le gros bouton vert WhatsApp en bas pour passer commande.`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    let frenchVoice = null;
    const frVoices = voices.filter(v => v.lang.startsWith("fr"));
    
    if (frVoices.length > 0) {
      // Priorité 1: Une voix féminine locale (pas besoin d'internet = pas de coupure)
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

      // Priorité 2: N'importe quelle voix féminine reconnue
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
      
      // Priorité 3: La première voix française disponible (en évitant la masculine par défaut d'Apple si possible)
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
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggleSpeech}
      className={`w-full py-4 px-6 rounded-full font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-sm hover:-translate-y-1 ${
        isPlaying 
        ? "bg-purple-100 text-purple-700 border-2 border-purple-300 animate-pulse" 
        : "bg-brand/10 hover:bg-brand/20 text-brand border-2 border-transparent"
      }`}
    >
      {isPlaying ? (
        <>
          <VolumeX size={24} className="animate-bounce" />
          Arreter l assistant vocal
        </>
      ) : (
        <>
          <Volume2 size={24} className={voices.length === 0 ? "animate-spin" : "animate-pulse"} />
          Ecouter la description
        </>
      )}
    </button>
  );
};

export default VoiceAssistantButton;
