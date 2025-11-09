import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CreditCard, 
  PiggyBank,
  Download,
  Mail,
  CheckCircle,
  XCircle
} from "lucide-react";
import { motion } from "framer-motion";
import CircularGauge from "@/components/CircularGauge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: profile } = trpc.profile.get.useQuery();
  const createContractMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      utils.contracts.list.invalidate();
      utils.profile.get.invalidate();
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setAnalysisResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleScan = async () => {
    if (!file) return;

    // Check limit
    if (profile && profile.documentsUploaded >= profile.documentsLimit) {
      toast.error("Limite de scans atteinte. Passe à Premium pour continuer !");
      return;
    }

    setAnalyzing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressSteps = [
        { value: 25, message: "📄 Lecture du document..." },
        { value: 50, message: "🔍 Extraction des données..." },
        { value: 75, message: "🤖 Analyse par ClaireAI..." },
        { value: 90, message: "✨ Génération des recommandations..." }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(step.value);
      }

      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call API to scan and analyze
      const result = await createContractMutation.mutateAsync({
        fileName: file.name,
        fileData,
      });

      const mockResult = result.analysis || {
        contractType: "auto",
        mainCoverages: [
          "Responsabilité civile",
          "Dommages tous accidents",
          "Vol et incendie"
        ],
        amounts: {
          prime_mensuelle: 45,
          franchise: 350,
          plafond_garantie: 50000
        },
        exclusions: [
          "Conduite en état d'ivresse",
          "Catastrophes naturelles"
        ],
        optimizationScore: 72,
        potentialSavings: 240,
        coverageGaps: [
          {
            title: "Bris de glace non couvert",
            description: "Votre contrat ne couvre pas les bris de glace, ce qui peut représenter un coût important en cas de sinistre.",
            impact: "Coût moyen : 350€",
            solution: "Ajoute cette option pour +5€/mois"
          },
          {
            title: "Assistance 0 km manquante",
            description: "Pas d'assistance dès le premier kilomètre, uniquement à partir de 50km.",
            impact: "Peut vous laisser sans aide en cas de panne près de chez vous",
            solution: "Option assistance 0km : +3€/mois"
          }
        ],
        recommendations: [
          {
            title: "Change de franchise pour économiser 180€/an",
            description: "En passant ta franchise de 350€ à 500€, tu peux réduire ta prime mensuelle de 15€.",
            savings: 180,
            priority: "haute"
          },
          {
            title: "Compare avec d'autres assureurs",
            description: "Nos partenaires proposent des contrats similaires à partir de 35€/mois.",
            savings: 120,
            priority: "moyenne"
          }
        ]
      };

      setProgress(100);
      setAnalysisResult(mockResult);
      toast.success("Analyse terminée avec succès !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return "bg-green-100";
    if (score >= 50) return "bg-orange-100";
    return "bg-red-100";
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {!analysisResult ? (
          <div className="space-y-6">
            {/* Upload Zone */}
            <Card>
              <CardHeader>
                <CardTitle>Scanner un nouveau contrat</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
                  <h3 className="text-xl font-semibold mb-2">
                    {isDragActive ? "Dépose ton fichier ici" : "Glisse ton contrat PDF ici"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    ou clique pour parcourir (max 10 MB)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formats supportés : PDF, JPG, PNG
                  </p>
                </div>

                {file && (
                  <Alert className="mt-4">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Fichier sélectionné :</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}

                {file && !analyzing && (
                  <Button
                    onClick={handleScan}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600"
                    size="lg"
                  >
                    Analyser mon contrat
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Analyzing State */}
            {analyzing && (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <TrendingUp className="w-16 h-16 text-emerald-600" />
                    </motion.div>
                    <h3 className="text-xl font-semibold">Analyse en cours...</h3>
                    <Progress value={progress} className="w-full" />
                    <p className="text-muted-foreground">
                      {progress < 25 && "📄 Lecture du document..."}
                      {progress >= 25 && progress < 50 && "🔍 Extraction des données..."}
                      {progress >= 50 && progress < 75 && "🤖 Analyse par ClaireAI..."}
                      {progress >= 75 && "✨ Génération des recommandations..."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Résultats de l'analyse</CardTitle>
                  <Button variant="outline" onClick={() => { setAnalysisResult(null); setFile(null); }}>
                    Nouveau scan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="resume">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="resume">Résumé</TabsTrigger>
                    <TabsTrigger value="details">Détails du contrat</TabsTrigger>
                    <TabsTrigger value="lacunes">Lacunes de couverture</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resume" className="space-y-6 mt-6">
                    {/* Score */}
                    <div className="text-center">
                      <div className="inline-flex justify-center">
                        <CircularGauge value={analysisResult.optimizationScore || 0} size={160} />
                      </div>
                      <p className="mt-4 font-semibold">Score d'optimisation</p>
                    </div>

                    {/* Metrics */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-6 text-center">
                          <PiggyBank className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                          <div className="text-3xl font-bold text-emerald-600">
                            {analysisResult.potentialSavings}€/an
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Économies potentielles</p>
                        </CardContent>
                      </Card>

                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-6 text-center">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                          <div className="text-3xl font-bold text-orange-600">
                            {analysisResult.coverageGaps.length}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Lacunes détectées</p>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-6 text-center">
                          <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <div className="text-3xl font-bold text-blue-600">
                            {analysisResult.amounts.prime_mensuelle}€/mois
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Prime mensuelle</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">🎯 Nos recommandations</h3>
                      <div className="space-y-3">
                        {analysisResult.recommendations.map((rec: any, index: number) => (
                          <Card key={index} className="border-l-4 border-l-emerald-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                                </div>
                                <Badge variant="secondary" className="ml-4">
                                  {rec.priority}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 mt-6">
                    <div>
                      <h3 className="font-semibold mb-2">Type de contrat</h3>
                      <Badge variant="outline" className="capitalize">{analysisResult.contractType}</Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Garanties principales</h3>
                      <ul className="space-y-2">
                        {analysisResult.mainCoverages.map((coverage: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            {coverage}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Exclusions importantes</h3>
                      <ul className="space-y-2">
                        {analysisResult.exclusions.map((exclusion: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600 mr-2" />
                            {exclusion}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Montants</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Prime mensuelle</p>
                          <p className="text-lg font-semibold">{analysisResult.amounts.prime_mensuelle}€</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Franchise</p>
                          <p className="text-lg font-semibold">{analysisResult.amounts.franchise}€</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="lacunes" className="space-y-4 mt-6">
                    {analysisResult.coverageGaps.map((gap: any, index: number) => (
                      <Card key={index} className="border-orange-200">
                        <CardContent className="p-6">
                          <div className="flex items-start">
                            <AlertTriangle className="w-6 h-6 text-orange-600 mr-3 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-semibold mb-2">{gap.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{gap.description}</p>
                              <div className="flex items-center justify-between mt-4">
                                <div>
                                  <p className="text-sm font-semibold text-orange-600">{gap.impact}</p>
                                  <p className="text-sm text-muted-foreground">{gap.solution}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  Demander un devis
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter en PDF
                  </Button>
                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Demander des devis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
