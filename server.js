require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Folosim direct cheia ta funcțională ca backup direct în cod ca să fim siguri că nu e de la .env
const backupKey = "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";
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;
const groq = new Groq({ apiKey: apiKeyFinal });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/upload', async (req, res) => {
    // Forțăm întotdeauna răspuns de tip JSON ca să distrugem definitiv eroarea DOCTYPE HTML pe telefon
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        const { base64Image } = req.body;
        if (!base64Image) {
            return res.status(200).json({ rezultat: "Eroare: Telefonul a trimis un pachet gol (fără imagine)." });
        }

        console.log("📬 Imagine primită în Cloud! Se trimite către Groq...");

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
            // 🚀 Modelul vizual stabil și rapid garantat de Groq
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.1,
            max_tokens: 1024
        });

        if (chatCompletion && chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
            const textRezultat = chatCompletion.choices[0].message.content;
            return res.status(200).json({ rezultat: textRezultat });
        } else {
            return res.status(200).json({ rezultat: "Eroare: Groq a procesat imaginea dar a returnat un răspuns gol." });
        }

    } catch (error) {
        console.error("❌ Eroare server:", error.message);
        // Chiar dacă crapă Groq, returnăm eroarea tot ca JSON curat, eliminând eroarea DOCTYPE HTML!
        return res.status(200).json({ 
            rezultat: "⚠️ A crăpat conexiunea cu Groq în Cloud!\n\nMotivul exact: " + error.message + "\n\n(Dacă zice 'Unauthorized' sau 'Invalid API Key', înseamnă că trebuie să generezi o cheie nouă din contul Groq)." 
        });
    }
});

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ rezultat: "Serverul Buro Decoder rulează online 24/7 pe Railway!" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serverul rulează pe portul ${PORT}`);
});
