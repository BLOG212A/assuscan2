import { ENV } from "./_core/env";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface AnalysisResult {
  contractType: string;
  mainCoverages: string[];
  amounts: {
    prime_mensuelle?: number;
    franchise?: number;
    plafond_garantie?: number;
  };
  exclusions: string[];
  optimizationScore: number;
  potentialSavings: number;
  coverageGaps: Array<{
    title: string;
    description: string;
    impact: string;
    solution: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    savings: number;
    priority: string;
  }>;
}

export async function analyzeContract(extractedText: string): Promise<AnalysisResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const prompt = `Tu es ClaireAI, l'intelligence artificielle d'AssurScan, expert en analyse de contrats d'assurance français.

Ta mission : Analyser ce contrat d'assurance et extraire les informations clés au format JSON structuré.

ANALYSE CE CONTRAT :
---
${extractedText}
---

RÉPONDS UNIQUEMENT AVEC CE JSON (aucun texte avant ou après) :
{
  "contractType": "type précis (auto/habitation/santé/vie/prévoyance/pro)",
  "mainCoverages": [
    "garantie 1",
    "garantie 2",
    "garantie 3"
  ],
  "amounts": {
    "prime_mensuelle": nombre,
    "franchise": nombre,
    "plafond_garantie": nombre
  },
  "exclusions": [
    "exclusion 1",
    "exclusion 2"
  ],
  "optimizationScore": nombre entre 0 et 100,
  "potentialSavings": nombre en euros par an,
  "coverageGaps": [
    {
      "title": "titre de la lacune",
      "description": "explication détaillée",
      "impact": "coût potentiel en cas de sinistre",
      "solution": "comment combler cette lacune"
    }
  ],
  "recommendations": [
    {
      "title": "titre de la recommandation",
      "description": "explication claire",
      "savings": nombre en euros,
      "priority": "haute/moyenne/basse"
    }
  ]
}

CRITÈRES D'ÉVALUATION DU SCORE :
- 90-100 : Excellent contrat, très bien optimisé
- 75-89 : Bon contrat, quelques améliorations possibles
- 50-74 : Contrat moyen, optimisations importantes disponibles
- 0-49 : Contrat sous-optimal, changement recommandé

SOIS PRÉCIS, FACTUEL ET ORIENTÉ ACTION.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://assurscan.fr",
        "X-Title": "AssurScan"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es ClaireAI, expert en analyse de contrats d'assurance français. Tu réponds uniquement en JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenRouter");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from AI");
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    throw error;
  }
}

export async function chatWithAI(
  userMessage: string,
  contractContext: {
    contractType: string;
    mainCoverages: string[];
    amounts: any;
    exclusions: string[];
    optimizationScore: number;
    potentialSavings: number;
    coverageGaps: any[];
  },
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const systemPrompt = `Tu es ClaireAI, l'assistant virtuel intelligent d'AssurScan, expert en assurance française.

CONTEXTE DU CONTRAT DE L'UTILISATEUR :
Type : ${contractContext.contractType}
Garanties : ${contractContext.mainCoverages.join(", ")}
Montants : Prime ${contractContext.amounts.prime_mensuelle}€/mois, Franchise ${contractContext.amounts.franchise}€
Exclusions : ${contractContext.exclusions.join(", ")}
Score : ${contractContext.optimizationScore}/100
Économies potentielles : ${contractContext.potentialSavings}€/an
Lacunes : ${contractContext.coverageGaps.length} détectées

INSTRUCTIONS :
- Réponds de manière claire, précise et pédagogique en français
- Base-toi UNIQUEMENT sur le contexte du contrat fourni
- Si tu ne sais pas, dis-le honnêtement et propose de contacter un expert humain
- Utilise des exemples concrets
- Reste professionnel mais accessible
- Si la question concerne des économies, sois précis sur les montants
- Si la question concerne une garantie, explique clairement ce qui est couvert ou non

RÉPONDS EN 2-3 PARAGRAPHES MAXIMUM.`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10), // Keep last 10 messages
      { role: "user", content: userMessage }
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://assurscan.fr",
        "X-Title": "AssurScan"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenRouter");
    }

    return content;
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    throw error;
  }
}
