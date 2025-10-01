'use client';

import Image from 'next/image';
import { useState } from 'react';
import { databaseService } from '../lib/services/database-service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  Share2,
  Copy,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Link,
  QrCode,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Trip } from '../lib/storage';

interface TripSharingProps {
  trip: Trip;
  onUpdate: (updatedTrip: Trip) => void;
}

export function TripSharing({ trip, onUpdate }: TripSharingProps) {
  const [shareSettings, setShareSettings] = useState({
    includeExpenses: true,
    includePhotos: true,
    includeItinerary: true,
    includeDocuments: false,
    includeChecklist: false,
    publicLink: false,
    allowComments: false,
  });
  const [customMessage, setCustomMessage] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);

  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    const shareId = `${trip.id}-${Date.now()}`;
    return `${baseUrl}/shared/trip/${shareId}`;
  };

  const generateTripSummary = async () => {
    try {
      // Fetch expenses from transactions context (already available)
      const expenses = []; // Will be populated from transactions context
      const totalExpenses = expenses.reduce(
        (sum: number, expense: any) => sum + expense.amount,
        0
      );

      // Fetch itinerary data from API
      let itineraryItems = [];
      try {
        const itineraryResponse = await fetch(`/api/itinerary?tripId=${trip.id}`);
        if (itineraryResponse.ok) {
          itineraryItems = await itineraryResponse.json();
        }
      } catch (error) {
        console.error('Error fetching itinerary for sharing:', error);
      }

      // TODO: Implementar APIs para fotos, documentos e checklist
      const photos: any[] = []; // await fetchPhotos(trip.id)
      const documents: any[] = []; // await fetchDocuments(trip.id)
      const checklist: any[] = []; // await fetchChecklist(trip.id)

      return {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        duration: Math.ceil(
          (new Date(trip.endDate).getTime() -
            new Date(trip.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        totalExpenses: shareSettings.includeExpenses ? totalExpenses : null,
        photosCount: shareSettings.includePhotos ? photos.length : null,
        itineraryCount: shareSettings.includeItinerary ? itineraryItems.length : null,
        documentsCount: shareSettings.includeDocuments ? documents.length : null,
        checklistCount: shareSettings.includeChecklist ? checklist.length : null,
        participants: trip.participants?.length || 0,
      };
    } catch (error) {
      console.error('Error generating trip summary:', error);
      return {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        duration: Math.ceil(
          (new Date(trip.endDate).getTime() -
            new Date(trip.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        totalExpenses: null,
        photosCount: null,
        itineraryCount: null,
        documentsCount: null,
        checklistCount: null,
        participants: trip.participants?.length || 0,
      };
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado para a área de transferência!');
      } else {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          toast.success('Copiado para a área de transferência!');
        } catch (err) {
          toast.error('Não foi possível copiar. Copie manualmente o texto.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      toast.error('Erro ao copiar para a área de transferência');
    }
  };

  const shareViaEmail = async () => {
    const summary = await generateTripSummary();
    const subject = `Confira minha viagem para ${summary.destination}!`;
    const body = `
Olá!

Gostaria de compartilhar os detalhes da minha viagem para ${summary.destination}:

📍 Destino: ${summary.destination}
📅 Data: ${new Date(summary.startDate).toLocaleDateString('pt-BR')} - ${new Date(summary.endDate).toLocaleDateString('pt-BR')}
⏱️ Duração: ${summary.duration} dias
👥 Participantes: ${summary.participants}
${summary.totalExpenses ? `💰 Gastos totais: R$ ${summary.totalExpenses.toFixed(2)}` : ''}
${summary.photosCount ? `📸 Fotos: ${summary.photosCount}` : ''}
${summary.itineraryCount ? `🗺️ Itinerário: ${summary.itineraryCount} itens` : ''}

${customMessage ? `\n${customMessage}\n` : ''}
Confira mais detalhes: ${generateShareableLink()}

Abraços!
    `;

    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  const shareViaWhatsApp = async () => {
    const summary = await generateTripSummary();
    const message = `🌎 *Viagem para ${summary.destination}*

📅 *Data:* ${new Date(summary.startDate).toLocaleDateString('pt-BR')} - ${new Date(summary.endDate).toLocaleDateString('pt-BR')}
⏱️ *Duração:* ${summary.duration} dias
👥 *Participantes:* ${summary.participants}
${summary.totalExpenses ? `💰 *Gastos totais:* R$ ${summary.totalExpenses.toFixed(2)}` : ''}
${summary.photosCount ? `📸 *Fotos:* ${summary.photosCount}` : ''}
${summary.itineraryCount ? `🗺️ *Itinerário:* ${summary.itineraryCount} itens` : ''}

${customMessage ? `${customMessage}\n\n` : ''}Confira mais detalhes: ${generateShareableLink()}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`
    );
  };

  const shareViaFacebook = async () => {
    const summary = await generateTripSummary();
    const url = generateShareableLink();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(
        `Confira minha viagem para ${summary.destination}! ${summary.duration} dias de aventura ${summary.totalExpenses ? `com gastos de R$ ${summary.totalExpenses.toFixed(2)}` : ''}`
      )}`
    );
  };

  const shareViaTwitter = async () => {
    const summary = await generateTripSummary();
    const text = `🌎 Viagem para ${summary.destination}! ${summary.duration} dias de aventura ${summary.totalExpenses ? `com gastos de R$ ${summary.totalExpenses.toFixed(2)}` : ''} ${summary.itineraryCount ? `e ${summary.itineraryCount} atividades planejadas` : ''}`;
    const url = generateShareableLink();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    );
  };

  const generateQRCode = () => {
    const url = generateShareableLink();
    // Usando um serviço gratuito de QR Code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const exportTripData = async () => {
    try {
      // Fetch itinerary data from API
      let itineraryData = [];
      try {
        const itineraryResponse = await fetch(`/api/itinerary?tripId=${trip.id}`);
        if (itineraryResponse.ok) {
          itineraryData = await itineraryResponse.json();
        }
      } catch (error) {
        console.error('Error fetching itinerary for export:', error);
      }

      // TODO: Implementar APIs para despesas, fotos, documentos e checklist
      const expensesData: any[] = []; // await fetchExpenses(trip.id)
      const photosData: any[] = []; // await fetchPhotos(trip.id)
      const documentsData: any[] = []; // await fetchDocuments(trip.id)
      const checklistData: any[] = []; // await fetchChecklist(trip.id)

      const exportData = {
        trip: {
          id: trip.id,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.budget,
          currency: trip.currency,
          description: trip.description,
          participants: trip.participants,
        },
        expenses: shareSettings.includeExpenses ? expensesData : [],
        photos: shareSettings.includePhotos 
          ? photosData.map((photo: any) => ({
              ...photo,
              data: null, // Remove Base64 data for smaller file size
            }))
          : [],
        itinerary: shareSettings.includeItinerary ? itineraryData : [],
        documents: shareSettings.includeDocuments ? documentsData : [],
        checklist: shareSettings.includeChecklist ? checklistData : [],
        exportDate: new Date().toISOString(),
        customMessage,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `viagem-${trip.destination.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dados da viagem exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting trip data:', error);
      toast.error('Erro ao exportar dados da viagem');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Compartilhar Viagem</h2>
        <p className="text-muted-foreground">
          Compartilhe os detalhes da sua viagem com amigos e família
        </p>
      </div>

      {/* Share Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Compartilhamento</CardTitle>
          <CardDescription>
            Escolha quais informações incluir no compartilhamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-expenses">Incluir gastos</Label>
              <Switch
                id="include-expenses"
                checked={shareSettings.includeExpenses}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeExpenses: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-photos">Incluir fotos</Label>
              <Switch
                id="include-photos"
                checked={shareSettings.includePhotos}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includePhotos: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-itinerary">Incluir roteiro</Label>
              <Switch
                id="include-itinerary"
                checked={shareSettings.includeItinerary}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeItinerary: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-documents">Incluir documentos</Label>
              <Switch
                id="include-documents"
                checked={shareSettings.includeDocuments}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeDocuments: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-checklist">Incluir checklist</Label>
              <Switch
                id="include-checklist"
                checked={shareSettings.includeChecklist}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeChecklist: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="public-link">Link público</Label>
              <Switch
                id="public-link"
                checked={shareSettings.publicLink}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({ ...prev, publicLink: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagem Personalizada</CardTitle>
          <CardDescription>
            Adicione uma mensagem pessoal ao compartilhamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Escreva uma mensagem para acompanhar o compartilhamento da sua viagem..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Share Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Compartilhamento</CardTitle>
          <CardDescription>
            Escolha como deseja compartilhar sua viagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={shareViaEmail}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Mail className="h-6 w-6" />
              <span className="text-sm">Email</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaWhatsApp}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaFacebook}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Facebook className="h-6 w-6" />
              <span className="text-sm">Facebook</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaTwitter}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Twitter className="h-6 w-6" />
              <span className="text-sm">Twitter</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Direct Link */}
      <Card>
        <CardHeader>
          <CardTitle>Link Direto</CardTitle>
          <CardDescription>
            Copie o link para compartilhar diretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={generateShareableLink()}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(generateShareableLink())}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>QR Code da Viagem</DialogTitle>
                  <DialogDescription>
                    Escaneie este código para acessar os detalhes da viagem
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center py-4">
                  <Image
                    src={generateQRCode()}
                    alt="QR Code da viagem"
                    width={200}
                    height={200}
                    className="border rounded-lg"
                  />
                </div>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generateQRCode();
                    link.download = `qr-code-viagem-${trip.destination.replace(/\s+/g, '-').toLowerCase()}.png`;
                    link.click();
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar QR Code
                </Button>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={exportTripData}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trip Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia do Compartilhamento</CardTitle>
          <CardDescription>
            Veja como sua viagem será exibida para outros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{trip.destination}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(trip.startDate).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge variant="secondary">
                {generateTripSummary().duration} dias
              </Badge>
            </div>

            {trip.description && (
              <p className="text-sm mb-4">{trip.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {shareSettings.includeExpenses && (
                <Badge variant="outline">💰 Gastos incluídos</Badge>
              )}
              {shareSettings.includePhotos && (
                <Badge variant="outline">📸 Fotos incluídas</Badge>
              )}
              {shareSettings.includeItinerary && (
                <Badge variant="outline">🗺️ Roteiro incluído</Badge>
              )}
              {shareSettings.includeDocuments && (
                <Badge variant="outline">📄 Documentos incluídos</Badge>
              )}
              {shareSettings.includeChecklist && (
                <Badge variant="outline">✅ Checklist incluído</Badge>
              )}
            </div>

            {customMessage && (
              <div className="border-l-4 border-primary pl-4 italic text-sm">
                &quot;{customMessage}&quot;
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
