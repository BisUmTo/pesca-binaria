# Pesca binaria III — anteprima da collaudare

V3 illustrata del gioco didattico in italiano per conversioni decimale/binario. Solo HTML, CSS e JavaScript, mobile first. Nessun server applicativo, tracciamento, CDN o dipendenza da installare.

## Pubblicazione su GitHub Pages

1. Crea un repository vuoto sul tuo account GitHub e carica questo repository (inclusa la cartella `docs`).
2. Apri **Settings → Pages**.
3. In **Build and deployment**, scegli **Deploy from a branch**.
4. Scegli il branch **v3-immersive** e la cartella **/docs**, poi salva.
5. Condividi con gli studenti l'indirizzo HTTPS indicato da GitHub Pages. La pagina docente si trova allo stesso indirizzo seguito da `prof.html`.

Il sito funziona anche in un sottopercorso di GitHub Pages: tutti i riferimenti sono relativi. Non serve alcuna compilazione. La cartella `docs` contiene soltanto file pubblici, compresa la chiave pubblica.

**La chiave privata viene consegnata separatamente. Non aggiungerla mai al repository, nemmeno se privato.** Mantieni una copia al sicuro: senza quella chiave i LOG non si possono leggere.

## Novità della v3

- Fondali illustrati per telefono e computer, logo dedicato, biglie di vetro colorate con dimensioni crescenti. Le biglie volano nella rete illustrata e il bit corrispondente si accende. Una rete strappata compare dopo il superamento.
- Nome, progressi, preferenze, aiuto e download del LOG raccolti nel menu; comandi del gioco in primo piano.
- Fila dei pesi in ordine decrescente: biglie nere e bit 0 all’inizio, colore della biglia e bit 1 dopo la pesca.
- Comandi di tocco fermi, anche mentre le immagini delle biglie oscillano. Non serve trascinare.
- Suoni brevi con interruttore, impostazione per ridurre le animazioni e rispetto di `prefers-reduced-motion`.
- Controlli da tastiera e indicazioni testuali: il colore non è l’unico segnale.
- Biglia massima 1024. Ai livelli avanzati può far parte di una soluzione con obiettivo superiore a 1024.
- La stessa chiave privata della v1 continua a funzionare. La pagina docente v2 legge LOG v1 e v2. Una partita v1 già aperta si conclude con le sue regole, poi usa quelle della v2.
- Nessun servizio o dipendenza di compilazione. Illustrazioni generate con ImageGen; suoni Kenney CC0, font Fredoka OFL e icone Phosphor MIT. Origini e licenze in `docs/assets/licenses`, `docs/assets/v3/manifest.json` e pagina pubblica `credits.html`. Gli asset generati non sono dichiarati CC0.

Il branch `main` conserva la v1, `v2-arcade` la v2, `v3-immersive` questa anteprima della v3. Il formato dei LOG resta v2: il numero di versione grafica è indipendente. Nessuna pubblicazione remota è stata eseguita.

**Stato: bozza implementata, collaudo visivo bloccato.** La v3 non è certificata come fedele al mockup o pronta per la lezione. Vedi `design-qa.md`.

## Regole

- Per convertire un numero decimale, pesca una volta ciascuna boccia necessaria: sono potenze di due.
- Non puoi annullare una pescata. La somma esatta vince, superare il numero rompe la rete.
- Dopo un errore si ripete lo stesso bersaglio.
- Ogni 4 vittorie aumenta la larghezza, da 4 fino a 11 bit (numeri da 1 a 2047, biglia massima 1024).
- Dopo 8 vittorie, una sfida ogni 3 chiede di leggere una configurazione di bit e scrivere il numero decimale. Sono contate anche le risposte inverse errate.
- Progressi e tentativo aperto sono salvati nel browser. Il LOG contiene i tentativi conclusi. La navigazione privata o la cancellazione dei dati del sito può cancellare i progressi.
- Non viene applicato un limite di tempo. I tempi misurano il periodo di apertura della sfida e riprendono da quanto salvato se si riapre il browser. Nella v2 sono escluse le attese delle animazioni durante le quali non si può pescare: ridurre le animazioni non dà un vantaggio nel premio velocità.

## Consegna e classifica

Lo studente scarica un `.pesca-log` e lo allega a Classroom. Il docente apre `prof.html`, seleziona la sua chiave privata e importa tutti i LOG (selezione multipla). Chiave e LOG sono elaborati soltanto nel browser: nessun upload remoto.

La classifica combina nome e classe ignorando maiuscole e spazi ripetuti. Per gli omonimi usa identificativi distinti. I tentativi vengono deduplicati mediante ID anche fra esportazioni sovrapposte. File con lo stesso ID e dati contrastanti vengono respinti. Premi a pari merito:

- **Pesca lampo:** tempo minimo per vincere alla prima prova con almeno 3 bocce distinte.
- **Rete più sicura:** minore percentuale di reti rotte, almeno 20 tentativi di pesca conclusi.
- **Instancabile:** maggior numero di tentativi conclusi, incluse le conversioni inverse e le prove non riuscite.

La tabella riporta anche tutti i tentativi, le reti rotte e le inverse riuscite. È esportabile come CSV.

## Cifratura e limiti

Ogni esportazione usa AES-256-GCM con chiave casuale e IV casuale a 96 bit. La chiave AES viene cifrata con RSA-OAEP SHA-256 e chiave pubblica RSA a 3072 bit. L'area docente verifica il possesso della chiave privata con una prova di cifratura/decifratura prima di consentire la lettura dei LOG.

La cifratura protegge la riservatezza, e AES-GCM rileva alterazioni di un file cifrato esistente. **Non prova l'autenticità dell'autore né della partita.** Chi legge il codice pubblico può costruire nuovi LOG coerenti e cifrarli con la chiave pubblica. Il browser e i progressi locali sono sotto il controllo dello studente. I controlli di coerenza non costituiscono una certificazione antifrode. Un'autenticazione autorevole richiederebbe un servizio fidato lato server, escluso da questo progetto.

La pagina docente è un file statico pubblico. La protezione effettiva riguarda la decifratura dei dati: nessuna chiave privata è nel sito e nessuna informazione della classifica esiste sul server.

## Verifica e usabilità

I 12 test automatici controllano tempi equi con o senza animazioni, calcoli, limite 1024, progressione, menu, biglie nella rete, cambio di bit, flusso di pesca/errore/ripetizione, conversioni inverse, LOG cifrati e classifica. L’integrazione usa un DOM simulato: non verifica l’impaginazione di un browser reale.

Anche il nuovo tentativo di verifica visiva/interattiva in browser è stato bloccato in questo ambiente da un controllo di accesso del browser indisponibile. Prima della lezione controllare il sito pubblicato su un telefono: layout a 320–430 px, ultimo livello con 11 posizioni, tocco, suoni (anche su Safari), tastiera e zoom al 200%. Non è dichiarato un collaudo visivo completo.

## Verifica locale

Con Node.js 22 o successivo: `npm test` (nessuna installazione necessaria).

Per aprire il sito localmente, servi `docs` da `http://localhost` (ad esempio `python3 -m http.server 8080 --directory docs`). Non aprire con doppio clic i file HTML: i moduli e Web Crypto richiedono un'origine web adatta. In produzione GitHub Pages usa HTTPS.

## Riferimenti

- [GitHub Pages: origine della pubblicazione](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Web Crypto: cifratura](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
- [Web Crypto: decifratura](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt)
