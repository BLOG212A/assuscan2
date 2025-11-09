import { analyzeContract } from "./openrouter";
import { storagePut } from "./storage";

export async function scanContractFile(file: Buffer, fileName: string): Promise<{
  extractedText: string;
  fileUrl: string;
  analysis: any;
}> {
  // Upload file to S3
  const { url: fileUrl } = await storagePut(
    `contracts/${Date.now()}-${fileName}`,
    file,
    "application/pdf"
  );

  // For now, we'll use a mock OCR result
  // In production, you would use Tesseract.js here
  const extractedText = `
CONTRAT D'ASSURANCE AUTOMOBILE

Assuré : Jean Dupont
Véhicule : Renault Clio 2020
Immatriculation : AB-123-CD

GARANTIES INCLUSES :
- Responsabilité civile
- Dommages tous accidents
- Vol et incendie
- Protection juridique

MONTANTS :
Prime mensuelle : 45€
Franchise : 350€
Plafond de garantie : 50 000€

EXCLUSIONS :
- Conduite en état d'ivresse
- Catastrophes naturelles
- Usage professionnel du véhicule

Date de souscription : 01/01/2024
Échéance annuelle : 31/12/2024
  `.trim();

  // Analyze with AI
  const analysis = await analyzeContract(extractedText);

  return {
    extractedText,
    fileUrl,
    analysis
  };
}
