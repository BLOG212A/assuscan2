import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  Eye, 
  MessageCircle, 
  Trash2, 
  FileText,
  Search,
  Car,
  Home as HomeIcon,
  Heart,
  Briefcase,
  FileQuestion
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Contracts() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: contracts, isLoading } = trpc.contracts.list.useQuery({
    type: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteMutation = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      utils.contracts.list.invalidate();
      utils.profile.get.invalidate();
      toast.success("Contrat supprimé avec succès");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
  };

  const filteredContracts = contracts?.filter(contract => {
    if (searchQuery) {
      return contract.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }) || [];

  const getContractIcon = (type: string | null) => {
    switch (type) {
      case "auto": return <Car className="w-5 h-5" />;
      case "habitation": return <HomeIcon className="w-5 h-5" />;
      case "santé": return <Heart className="w-5 h-5" />;
      case "pro": return <Briefcase className="w-5 h-5" />;
      default: return <FileQuestion className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-600";
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number | null) => {
    if (!score) return "bg-gray-100";
    if (score >= 75) return "bg-green-100";
    if (score >= 50) return "bg-orange-100";
    return "bg-red-100";
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "actif":
        return <Badge className="bg-green-100 text-green-700">Actif</Badge>;
      case "resilie":
        return <Badge className="bg-red-100 text-red-700">Résilié</Badge>;
      case "a_renouveler":
        return <Badge className="bg-orange-100 text-orange-700">À renouveler</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un contrat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de contrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="habitation">Habitation</SelectItem>
                  <SelectItem value="santé">Santé</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="resilie">Résilié</SelectItem>
                  <SelectItem value="a_renouveler">À renouveler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Aucun contrat scanné</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Aucun contrat ne correspond à vos critères"
                  : "Commence par scanner ton premier contrat"}
              </p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  Scanner mon premier contrat
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract, index) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                          {getContractIcon(contract.contractType)}
                        </div>
                        <div>
                          <Badge variant="outline" className="capitalize mb-1">
                            {contract.contractType || "Inconnu"}
                          </Badge>
                        </div>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>

                    <h3 className="font-semibold mb-2 truncate" title={contract.fileName || ""}>
                      {contract.fileName || "Sans nom"}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4">
                      {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('fr-FR') : "Date inconnue"}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <div className={`text-2xl font-bold ${getScoreColor(contract.optimizationScore)}`}>
                          {contract.optimizationScore || 0}/100
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Économies</p>
                        <div className="text-2xl font-bold text-emerald-600">
                          {contract.potentialSavings || 0}€
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/contract/${contract.id}`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      <Link href={`/dashboard/chat?contract=${contract.id}`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(contract.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contrat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le contrat et toutes les conversations associées seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
