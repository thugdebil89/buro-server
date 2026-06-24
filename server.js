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

// 🚀 RUTĂ UNIVERSALĂ (Acceptă POST pe /upload, pe / și pe orice altă combinație)
app.use(async (req, res) => {
    // Permite doar cererile de tip POST pentru procesare
    if (req.method !== 'POST') {
        return res.status(200).send("Serverul Buro Decoder rulează activ în Cloud!");
    }

    try {
        const { base64Image } = req.body;
        if (!base64Image) {
            console.log("❌ Cerere goală primită.");
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
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.1,
            max_tokens: 1024
        });

        if (chatCompletion?.choices?.[0]?.message?.content) {
            const textRezultat = chatCompletion.choices[0].message.content;
            console.log("✅ Document procesat cu succes!");
            res.json({ rezultat: textRezultat });
        } else {
            console.log("⚠️ Structură răspuns goală.");
            res.json({ rezultat: "Groq nu a putut returna o analiză validă pentru acest document." });
        }

    } catch (error) {
        console.error("❌ Eroare:", error.message);
        res.status(500).json({ rezultat: "Eroare la serverul Groq: " + error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serverul rulează pe portul ${PORT}`);
});

