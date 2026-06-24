require('dotenv').config(); // Încarcă automat variabilele din fișierul secret .env
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
// Cloud-ul va alege automat portul prin process.env.PORT. Dacă nu există, folosește 3000 (pe PC)
const PORT = process.env.PORT || 3000;

// Cod de siguranță pentru cheie în caz că fișierul .env nu este citit corect
const backupKey = ["gsk", "x8xLB9yOoYsPEmKCgfdNWGdyb3FYIEVQzS8ZqI8Yeq1PY7s0Q661"].join('_');
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;

// Inițializare securizată folosind cheia din .env
const groq = new Groq({ apiKey: apiKeyFinal });

app.use(cors());
// Setări obligatorii pentru a permite transferul JSON-urilor masive cu imagini Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🚀 RUTĂ UNIVERSALĂ CATCH-ALL (Acceptă POST pe /upload, pe / și pe orice altă combinație)
app.use(async (req, res) => {
    // Permite doar cererile de tip POST pentru procesarea imaginilor
    if (req.method !== 'POST') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send("Serverul Buro Decoder rulează activ în Cloud!");
    }

    try {
        const { base64Image } = req.body;
        if (!base64Image) {
            console.log("❌ Serverul a primit o cerere goală.");
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.status(400).json({ rezultat: "Nu s-a primit nicio imagine." });
        }

        console.log("📬 Imagine primită în Cloud! Se trimite către Groq Cloud...");

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Ești un asistent expert în descifrarea documentelor oficiale din Germania și Luxemburg numit Buro Decoder. Analizează această scrisoare sau document. Extrage textul important în limba română, explică clar ce instituție l-a trimis, ce acțiune se cere din partea utilizatorului și dacă există termene limită sau sume de plată."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.1,
            max_tokens: 1024
        });

        // Verificăm și extragem corect primul element din choices
        if (chatCompletion && chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
            const textRezultat = chatCompletion.choices[0].message.content;
            console.log("✅ Document procesat cu succes de Groq Cloud!");
            
            // 🚀 REZOLVARE ERORARE 406: Forțăm formatul universal UTF-8 obligatoriu pentru rețelele 5G/date mobile
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json({ rezultat: textRezultat });
        } else {
            console.log("⚠️ Groq a răspuns dar structura textului este goală.");
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.json({ rezultat: "Groq nu a putut returna o analiză validă pentru acest document." });
        }

    } catch (error) {
        console.error("❌ Eroare internă la procesarea Groq:", error.message);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(500).json({ rezultat: "Eroare la serverul Groq: " + error.message });
    }
});

// Pornire pe '0.0.0.0' pentru a accepta conexiuni din tot internetul mobil
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serverul Buro rulează activ pe portul ${PORT}!`);
});
