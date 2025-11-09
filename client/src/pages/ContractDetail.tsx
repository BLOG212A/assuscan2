import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Download,
  Mail,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  PiggyBank
} from "lucide-react";
import CircularGauge from "@/components/CircularGauge";

export default function ContractDetail() {
  const [, params] = useRoute("/dashboard/contract/:id");
  const contractId = params?.id || "";

  const { data: contract, isLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: !!contractId }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold mb-2">Contrat introuvable</h2>
          <p className="text-muted-foreground mb-6">Ce contrat n'existe pas ou a été supprimé.</p>
          <Button asChild>
            <Link href="/dashboard/contracts">Retour à mes contrats</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/contracts">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{contract.fileName}</h1>
              <p className="text-muted-foreground capitalize">
                {contract.contractType || "Type inconnu"} • {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('fr-FR') : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/chat?contract=${contract.id}`}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Discuter avec ClaireAI
              </Link>
            </Button>
          </div>
        </div>

        {/* Score & Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="inline-flex justify-center">
                  <CircularGauge value={contract.optimizationScore || 0} size={160} />
                </div>
                <p className="mt-4 font-semibold">Score d'optimisation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(contract.optimizationScore || 0) >= 75 ? "Excellent contrat" : 
                   (contract.optimizationScore || 0) >= 50 ? "Bon contrat" : 
                   "Contrat à optimiser"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 text-center">
              <PiggyBank className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <div className="text-3xl font-bold text-emerald-600">
                {contract.potentialSavings || 0}€/an
              </div>
              <p className="text-sm text-muted-foreground mt-1">Économies potentielles</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-3xl font-bold text-orange-600">
                {contract.coverageGaps?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Lacunes détectées</p>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Coverages */}
          <Card>
            <CardHeader>
              <CardTitle>Garanties principales</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {contract.mainCoverages?.map((coverage: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    {coverage}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Exclusions */}
          <Card>
            <CardHeader>
              <CardTitle>Exclusions importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {contract.exclusions?.map((exclusion: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-600 mr-2" />
                    {exclusion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Amounts */}
        <Card>
          <CardHeader>
            <CardTitle>Montants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Prime mensuelle</p>
                <p className="text-2xl font-bold">{contract.amounts?.prime_mensuelle || 0}€</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Franchise</p>
                <p className="text-2xl font-bold">{contract.amounts?.franchise || 0}€</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plafond de garantie</p>
                <p className="text-2xl font-bold">{contract.amounts?.plafond_garantie || 0}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Gaps */}
        {contract.coverageGaps && contract.coverageGaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Lacunes de couverture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.coverageGaps.map((gap: any, index: number) => (
                <div key={index} className="border-l-4 border-l-orange-500 pl-4 py-2">
                  <h4 className="font-semibold mb-1">{gap.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{gap.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-600">{gap.impact}</p>
                      <p className="text-sm text-muted-foreground">{gap.solution}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Demander un devis
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {contract.recommendations && contract.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Recommandations ClaireAI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.recommendations.map((rec: any, index: number) => (
                <div key={index} className="border-l-4 border-l-emerald-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {rec.priority}
                    </Badge>
                  </div>
                  {rec.savings > 0 && (
                    <p className="text-sm font-semibold text-emerald-600 mt-2">
                      Économie : {rec.savings}€/an
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Extracted Text */}
        {contract.extractedText && (
          <Card>
            <CardHeader>
              <CardTitle>Texte extrait du contrat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {contract.extractedText}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
