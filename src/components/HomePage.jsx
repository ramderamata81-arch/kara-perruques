import React from 'react';
import { motion } from 'framer-motion';
import ProductGrid from './ProductGrid';

// ── Icônes SVG inline (pas de dépendance) ──────────────────────────────────
const IconWhatsApp = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: "easeOut" }
});

const HomePage = () => {
  const whatsappUrl = "https://wa.me/2250769434390?text=Bonjour%20KARA%20!%20Je%20veux%20commander%20une%20perruque.";

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 40%, #581c87 80%, #d4af37 100%)',
        borderRadius: '0 0 32px 32px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '40px',
        padding: '48px 24px 48px',
      }}>
        {/* déco cercles */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'rgba(212,175,55,0.12)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', background: 'rgba(147,51,234,0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />

        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div {...fadeUp(0)} style={{ display: 'inline-block', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37', borderRadius: '100px', padding: '6px 20px', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '24px' }}>
            ✨ Boutique Premium — Abidjan
          </motion.div>

          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15, delayChildren: 0.5 }
              }
            }}
            style={{ color: 'white', fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: '900', lineHeight: 1.1, marginBottom: '24px', fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {Array.from("Welcome to ").map((char, index) => (
              <motion.span key={index} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
            <motion.span 
              variants={{ hidden: { opacity: 0, y: 20, scale: 0.8 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100 } } }}
              style={{ background: 'linear-gradient(90deg, #9333ea, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}
            >
              KARA
            </motion.span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px' }}>
            Un large choix de perruques de qualité, lace frontals, tissages... Trouvez le style qui révèle votre beauté unique. Livraison partout en CI.
          </motion.p>

          <motion.div {...fadeUp(0.3)} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#collection" style={{
              background: 'linear-gradient(135deg, #9333ea, #581c87)',
              color: 'white', padding: '16px 36px', borderRadius: '100px',
              fontWeight: '700', fontSize: '1rem', textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(147,51,234,0.4)',
              display: 'inline-block', transition: 'transform 0.2s',
            }}
              onMouseOver={e => e.target.style.transform='translateY(-2px)'}
              onMouseOut={e => e.target.style.transform='translateY(0)'}
            >
              Voir la Collection →
            </a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              color: 'white', padding: '16px 28px', borderRadius: '100px',
              fontWeight: '600', fontSize: '1rem', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: '10px',
            }}>
              <IconWhatsApp /> Commander sur WhatsApp
            </a>
          </motion.div>

        </div>
      </section>

      {/* ── COLLECTION ───────────────────────────────────────────────────── */}
      <section id="collection" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <ProductGrid />
      </section>

      {/* ── CTA WHATSAPP ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <motion.div {...fadeUp()} style={{
          maxWidth: '700px', margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, #1e1b4b, #581c87)',
          borderRadius: '32px', padding: '64px 40px',
          boxShadow: '0 20px 60px rgba(88,28,135,0.35)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%' }} />
          <h2 style={{ color: 'white', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '900', marginBottom: '16px' }}>
            Prête à sublimer votre look ? 💫
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '36px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 36px' }}>
            Contactez-nous sur WhatsApp pour un conseil personnalisé, passer commande ou pour toute question.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{
            background: '#25D366', color: 'white', padding: '18px 40px',
            borderRadius: '100px', fontWeight: '700', fontSize: '1.1rem',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 8px 32px rgba(37,211,102,0.4)',
          }}>
            <IconWhatsApp /> Commander sur WhatsApp
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
