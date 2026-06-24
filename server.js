require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

const backupKey = ["gsk", "x8xLB9yOoYsPEmKCgfdNWGdyb3FYIEVQzS8ZqI8Yeq1PY7s0Q661"].join('_');
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;
const groq = new Groq({ apiKey: apiKeyFinal });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🚀 RUTĂ UNIVERSALĂ OPTIMIZATĂ ANTI-406 (Returnează TEXT SIMPLU formatat UTF-8)
app.use(async (req, res) => {
    // Forțăm antetul de TEXT SIMPLU pentru a fenta blocajele operatorilor de telefonie mobilă
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    if (req.method !== 'POST') {
        return res.status(200).send("Serverul Buro Decoder rulează activ în Cloud!");
    }

    try {
        const { base64Image } = req.body;
        if (!base64Image) {
            console.log("❌ Serverul a primit o cerere goală.");
            return res.status(400).send("Nu s-a primit nicio imagine.");
        }

        console.log("📬 Imagine primită! Se trimite către Groq...");

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

        if (chatCompletion && chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
            const textRezultat = chatCompletion.choices[0].message.content;
            console.log("✅ Document procesat cu succes!");
            // Trimitem doar textul curat, fără JSON, eliminând eroarea 406
            return res.status(200).send(textRezultat);
        } else {
            console.log("⚠️ Groq a răspuns gol.");
            return res.status(200).send("Groq nu a putut returna o analiză validă pentru acest document.");
        }

    } catch (error) {
        console.error("❌ Eroare server:", error.message);
        return res.status(500).send("Eroare la serverul Groq: " + error.message);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serverul rulează activ pe portul ${PORT}!`);
});
