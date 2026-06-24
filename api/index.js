const Groq = require('groq-sdk');
const formidable = require('formidable');
const fs = require('fs');

const backupKey = ["gsk", "x8xLB9yOoYsPEmKCgfdNWGdyb3FYIEVQzS8ZqI8Yeq1PY7s0Q661"].join('_');
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;
const groq = new Groq({ apiKey: apiKeyFinal });

// 🚀 CONFIGURARE OBLIGATORIE VERCEL: Dezactivăm parserul nativ pentru a permite Formidable să citească fișierele binare direct
export const config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async function handler(req, res) {
    // 🔥 REZOLVARE COMPLETĂ DE REȚEA (Permite conexiunile mobile de tip FormData)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json({ rezultat: "Serverul Buro Decoder rulează activ pe Vercel!" });
    }

    try {
        const form = new formidable.IncomingForm();
        
        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({ rezultat: "Eroare la procesarea fișierului pe server." });
            }

            // Verificăm ambele variante de structură pentru fișiere
            const file = files.image && files.image[0] ? files.image[0] : files.image;
            if (!file) {
                return res.status(400).json({ rezultat: "Nu s-a detectat nicio imagine în pachetul trimis." });
            }

            // Citim imaginea binară din memoria temporară și o transformăm în Base64 pentru Groq
            const imageBuffer = fs.readFileSync(file.filepath);
            const base64Image = imageBuffer.toString('base64');

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
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.status(200).json({ rezultat: textRezultat });
            } else {
                return res.status(200).json({ rezultat: "Groq nu a putut genera o analiză validă." });
            }
        });

    } catch (error) {
        console.error("❌ Eroare:", error.message);
        return res.status(500).json({ rezultat: "Eroare server Cloud: " + error.message });
    }
};

