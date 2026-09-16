# Pesca binaria

Gioco didattico in italiano per conversioni decimale/binario. Solo HTML, CSS e JavaScript, mobile first. Nessun server applicativo, tracciamento, CDN o dipendenza da installare.

## Pubblicazione su GitHub Pages

1. Crea un repository vuoto sul tuo account GitHub e carica questo repository (inclusa la cartella `docs`).
2. Apri **Settings → Pages**.
3. In **Build and deployment**, scegli **Deploy from a branch**.
4. Scegli il branch **main** e la cartella **/docs**, poi salva.
5. Condividi con gli studenti l'indirizzo HTTPS indicato da GitHub Pages. La pagina docente si trova allo stesso indirizzo seguito da `prof.html`.

Il sito funziona anche in un sottopercorso di GitHub Pages: tutti i riferimenti sono relativi. Non serve alcuna compilazione. La cartella `docs` contiene soltanto file pubblici, compresa la chiave pubblica.

**La chiave privata viene consegnata separatamente. Non aggiungerla mai al repository, nemmeno se privato.** Mantieni una copia al sicuro: senza quella chiave i LOG non si possono leggere.

## Regole

- Per convertire un numero decimale, pesca una volta ciascuna boccia necessaria: sono potenze di due.
- Non puoi annullare una pescata. La somma esatta vince, superare il numero rompe la rete.
- Dopo un errore si ripete lo stesso bersaglio. La boccia più grande supera sempre la capacità della rete, così una scelta sbagliata si può concludere rompendo volontariamente la rete.
- Ogni 4 vittorie aumenta la larghezza, da 4 fino a 8 bit (numeri da 1 a 255).
- Dopo 8 vittorie, una sfida ogni 3 chiede di leggere una configurazione di bit e scrivere il numero decimale. Sono contate anche le risposte inverse errate.
- Progressi e tentativo aperto sono salvati nel browser. Il LOG contiene i tentativi conclusi. La navigazione privata o la cancellazione dei dati del sito può cancellare i progressi.
- Non viene applicato un limite di tempo. I tempi misurano il periodo di apertura della sfida e riprendono da quanto salvato se si riapre il browser.

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

## Verifica locale

Con Node.js 22 o successivo: `npm test` (nessuna installazione necessaria).

Per aprire il sito localmente, servi `docs` da `http://localhost` (ad esempio `python3 -m http.server 8080 --directory docs`). Non aprire con doppio clic i file HTML: i moduli e Web Crypto richiedono un'origine web adatta. In produzione GitHub Pages usa HTTPS.

## Riferimenti

- [GitHub Pages: origine della pubblicazione](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Web Crypto: cifratura](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
- [Web Crypto: decifratura](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt)
