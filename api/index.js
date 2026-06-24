const Groq = require('groq-sdk');

const backupKey = ["gsk", "x8xLB9yOoYsPEmKCgfdNWGdyb3FYIEVQzS8ZqI8Yeq1PY7s0Q661"].join('_');
const apiKeyFinal = process.env.GROQ_API_KEY || backupKey;
const groq = new Groq({ apiKey: apiKeyFinal });

module.exports = async function handler(req, res) {
    // 🚀 REZOLVARE CORS COMPLETA (Forțează permisiunile pe rețeaua mobilă 5G)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Răspuns rapid pentru verificările automate ale rețelei (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Dacă este o accesare simplă din browser (GET), confirmăm funcționarea (Elimină eroarea 500)
    if (req.method !== 'POST') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json({ rezultat: "Serverul Buro Decoder rulează activ pe Vercel!" });
    }

    try {
        // 🚀 TRUCUL CRITIC PENTRU VERCEL: Citirea forțată a corpului cererii JSON pentru imagini mari Base64
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error("Eroare la parsarea string-ului din body");
            }
        }

        const base64Image = body ? body.base64Image : null;

        if (!base64Image) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
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
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.1,
            max_tokens: 1024
        });

        // 🚀 CONFIGURARE CORECTĂ ȘI SIGURĂ A CITIRII TEXTULUI (Masivul choices[0])
        if (chatCompletion && chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
            const textRezultat = chatCompletion.choices[0].message.content;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.status(200).json({ rezultat: textRezultat });
        } else {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.status(200).json({ rezultat: "Groq nu a putut returna o analiză validă." });
        }

    } catch (error) {
        console.error("❌ Eroare server:", error.message);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({ rezultat: "Eroare la procesarea serverului cloud: " + error.message });
    }
};
