import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Bot, 
  User as UserIcon,
  FileText,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export default function Chat() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialContractId = searchParams.get('contract');

  const [selectedContractId, setSelectedContractId] = useState<string>(initialContractId || "");
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: contracts } = trpc.contracts.list.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.chat.history.useQuery(
    { contractId: selectedContractId },
    { enabled: !!selectedContractId }
  );

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: () => {
      refetchHistory();
      setMessage("");
      setIsTyping(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'envoi du message");
      setIsTyping(false);
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!message.trim() || !selectedContractId) return;

    setIsTyping(true);
    await sendMutation.mutateAsync({
      contractId: selectedContractId,
      message: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "Suis-je couvert pour le vol ?",
    "Combien coûte un sinistre ?",
    "Puis-je résilier maintenant ?",
    "Quelle est ma franchise ?",
  ];

  const selectedContract = contracts?.find(c => c.id === selectedContractId);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)]">
        <div className="grid md:grid-cols-4 gap-6 h-full">
          {/* Sidebar - Contract Selection */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Contexte de conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedContractId} onValueChange={setSelectedContractId}>
                <div className="space-y-3">
                  {contracts?.map((contract) => (
                    <div key={contract.id} className="flex items-start space-x-2">
                      <RadioGroupItem value={contract.id} id={contract.id} className="mt-1" />
                      <Label
                        htmlFor={contract.id}
                        className="flex-1 cursor-pointer text-sm leading-tight"
                      >
                        <div className="font-medium truncate">{contract.fileName}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {contract.contractType || "Inconnu"}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {contracts?.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aucun contrat scanné
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-3 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-emerald-600" />
                    Assistant ClaireAI
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pose toutes tes questions sur tes contrats
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Propulsé par GPT-4o
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {!selectedContractId ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Sélectionne un contrat</h3>
                    <p className="text-muted-foreground">
                      Choisis un contrat dans la liste pour commencer à discuter avec ClaireAI
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-4">
                      {(!history || history.length === 0) && (
                        <div className="space-y-4">
                          <div className="text-center py-8">
                            <Bot className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
                            <p className="text-muted-foreground mb-6">
                              Bonjour ! Je suis ClaireAI, ton assistant d'analyse d'assurance.
                              <br />
                              Comment puis-je t'aider avec ton contrat <strong>{selectedContract?.contractType}</strong> ?
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {suggestedQuestions.map((question, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setMessage(question)}
                                className="text-left justify-start h-auto py-3 px-4"
                              >
                                {question}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <AnimatePresence>
                        {history?.map((msg, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-emerald-600" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                msg.role === "user"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-900"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className="text-xs mt-2 opacity-70">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ""}
                              </p>
                            </div>
                            {msg.role === "user" && (
                              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                                <UserIcon className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="bg-slate-100 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-3">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Pose une question sur ton contrat..."
                        className="resize-none"
                        rows={2}
                        disabled={isTyping}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!message.trim() || isTyping}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 shrink-0"
                        size="icon"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {message.length}/500 caractères
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
