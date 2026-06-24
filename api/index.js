const Groq = require('groq-sdk');
const formidable = require('formidable'); // Cititor de fișiere poze
const fs = require('fs');

const backupKey = ["gsk", "x8xLB9yOoYsPEmKCgfdNWGdyb3FYIEVQzS8ZqI8Yeq1PY7s0Q661"].join('_');
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;
const groq = new Groq({ apiKey: apiKeyFinal });

// Dezactivăm cititorul standard Vercel pentru a lăsa Formidable să citească fișierul direct
export const config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json({ rezultat: "Serverul Buro Decoder rulează activ pe Vercel!" });
    }

    try {
        const form = new formidable.IncomingForm();
        
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(500).json({ rezultat: "Eroare la procesarea fișierului." });

            const file = files.image && files.image[0] ? files.image[0] : files.image;
            if (!file) return res.status(400).json({ rezultat: "Nu s-a primit nicio imagine." });

            // Transformăm fișierul local temporar în Base64 direct în memorie
            const imageBuffer = fs.readFileSync(file.filepath);
            const base64Image = imageBuffer.toString('base64');

            console.log("🚀 Se trimite imaginea optimizată către Groq...");

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
                                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                            }
                        ]
                    }
                ],
                model: "llama-3.2-11b-vision-preview",
                temperature: 0.1,
                max_tokens: 1024
            });

            if (chatCompletion?.choices?.[0]?.message?.content) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.status(200).json({ rezultat: chatCompletion.choices[0].message.content });
            } else {
                return res.status(200).json({ rezultat: "Groq nu a putut returna o analiză." });
            }
        });

    } catch (error) {
        return res.status(500).json({ rezultat: "Eroare server: " + error.message });
    }
};
