# CapoVerso ETS: redesign

Una pagina unica, statica, senza dipendenze esterne a runtime. Font e GSAP sono ospitati in locale, quindi niente richieste a Google Fonts o CDN (scelta più adatta al GDPR).
Basta aprire `index.html` da un server statico (`python3 -m http.server`).

## Design system (dalla skill ui-ux-pro-max)
- **Prodotto:** Non-profit/Charity, pattern "Storytelling + Trust": hero con missione, prove (numeri, RUNTS, stampa) e CTA chiare.
- **Stile:** "Vibrant & Block-based" (indicato dalla skill per un pubblico giovane) con tocchi Neubrutalism: bordi spessi, ombre pop, card a blocchi.
- **Colori:** blu #1A3399 e azzurro #4DC8E8 del logo, più accenti giovani: giallo #FFD23F, corallo #FF5C4D, lime #B9F24A. Tema chiaro e scuro.
- **Tipografia:** Outfit (titoli) + Rubik (testo), dalla coppia "Startup Bold" della skill. Il corsivo Cormorant Garamond è un richiamo al sito attuale.
- **Motion (GSAP 3.13):** titolo SplitText, parola che ruota, parallax, manifesto che si accende con lo scroll, timeline orizzontale fissata (desktop), filtri con Flip. Tutto si disattiva con `prefers-reduced-motion`.
- **Interazioni:** foto trascinabili e "rimescola", filtri progetti, schede progetto in modale, schede delle fasi di Young Side (navigabili da tastiera), quiz "Che tipo di CapoVerso sei?" che precompila l'oggetto del form, copia IBAN, form con validazione inline, tema chiaro/scuro, marquee con pausa.

## Da completare prima della pubblicazione
1. **IBAN:** quello del sito attuale (`IT60 X054 2811 1010 0000 0123 456`) è un IBAN di esempio molto diffuso, non un conto reale. Inserire quello vero in `data-iban` (sezione `#sostienici`); il bottone "Copia IBAN" si attiva da solo.
2. **Form:** oggi apre il client di posta (`mailto:`). Se il sito attuale ha un endpoint di invio, collegarlo in `assets/js/main.js` (submit del form).
3. **Immagini:** `art-day.jpg` mostra un evento con polveri colorate (sembra il Color Party), mentre `color-party.jpg` è una locandina. Va verificato con l'associazione.
4. **Analytics:** il sito attuale usa GoatCounter (`gc.zgo.at`). Reinserire lo snippet con il proprio codice, se serve.
5. Privacy e Cookie Policy puntano a `/privacy-policy` e `/cookie-policy` del sito esistente.
