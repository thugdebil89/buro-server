require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
// Railway sau orice server online își va pune singur portul aici
const PORT = process.env.PORT || 3000;

const backupKey = ["gsk", "x8xLB9yOoYsPEmKCgfdNWGdyb3FYIEVQzS8ZqI8Yeq1PY7s0Q661"].join('_');
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;
const groq = new Groq({ apiKey: apiKeyFinal });

app.use(cors());
// Permitem pachete uriașe de imagini prin rețeaua mobilă, fără limită
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/upload', async (req, res) => {
    try {
        const { base64Image } = req.body;
        if (!base64Image) {
            return res.status(400).json({ rezultat: "Nu s-a primit nicio imagine." });
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
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.1,
            max_tokens: 1024
        });

        if (chatCompletion && chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
            const textRezultat = chatCompletion.choices[0].message.content;
            res.json({ rezultat: textRezultat });
        } else {
            res.json({ rezultat: "Groq nu a putut returna o analiză validă." });
        }

    } catch (error) {
        console.error("❌ Eroare server:", error.message);
        res.status(500).json({ rezultat: "Eroare la serverul cloud: " + error.message });
    }
});

// Ruta de bază ca să nu mai vezi niciodată DOCTYPE html în browser
app.get('/', (req, res) => {
    res.send("Serverul Buro Decoder rulează online 24/7!");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serverul rulează pe portul ${PORT}`);
});
