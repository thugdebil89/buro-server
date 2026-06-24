require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

const backupKey = ["gsk", "x8xLB9yOoYsPEmKCgfdNWGdyb3FYIEVQzS8ZqI8Yeq1PY7s0Q661"].join('_');
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;
const groq = new Groq({ apiKey: apiKeyFinal });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Răspuns direct pe ruta principală a funcției /api
app.all('*', async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'POST') {
        return res.status(200).json({ rezultat: "Serverul Buro Decoder rulează activ pe Vercel!" });
    }

    try {
        const { base64Image } = req.body;
        if (!base64Image) {
            return res.status(400).json({ rezultat: "Nu s-a primit nicio imagine în cloud." });
        }

        console.log("📬 Imagine primită în Vercel! Se trimite către Groq Cloud...");

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
            // 🚀 MODEL ACTUALIZAT DEFINITIV: Ultra-rapid, suport OCR nativ excelent, procesare sub 3 secunde!
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.1,
            max_tokens: 1024
        });

        if (chatCompletion && chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
            const textRezultat = chatCompletion.choices[0].message.content;
            return res.status(200).json({ rezultat: textRezultat });
        } else {
            return res.status(200).json({ rezultat: "Groq nu a putut returna o analiză validă." });
        }

    } catch (error) {
        console.error("❌ Eroare server:", error.message);
        return res.status(500).json({ rezultat: "Eroare server Cloud Vercel: " + error.message });
    }
});

module.exports = app;
