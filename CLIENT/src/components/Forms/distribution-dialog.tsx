import React from 'react';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../Reusable_components/dialog";
import { Button } from "../Reusable_components/button";
import { Label } from "../Reusable_components/label";
import { Input } from "../Reusable_components/input";
import { Textarea } from "../Reusable_components/textarea";
import { formDistribution } from "../../utils/formDistribution";

interface DistributionOptions {
  formId: string;
  formTitle: string;
  formUrl: string;
  emailList?: string[];
  customMessage?: string;
  embeddedCode?: boolean;
  qrCode?: boolean;
}

interface EmailTemplate {
  subject: string;
  body: string;
  footer: string;
}

export const DistributionDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formTitle: string;
}> = ({ open, onOpenChange, formId, formTitle }) => {
  const [selectedMethod, setSelectedMethod] = React.useState<'link' | 'email' | 'embed' | 'qr' | 'social'>('link');
  const [emailList, setEmailList] = React.useState('');
  const [shareUrl, setShareUrl] = React.useState('');
  const [embedCode, setEmbedCode] = React.useState('');
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');

  React.useEffect(() => {
    if (open && formId) {
      const url = formDistribution.generateShareableLink(formId);
      setShareUrl(url);
      
      const embed = formDistribution.generateEmbedCode(formId, { responsive: true });
      setEmbedCode(embed);
      
      const qrCode = formDistribution.generateQRCode(formId);
      setQrCodeUrl(qrCode);
    }
  }, [open, formId]);

  const handleEmailDistribution = async () => {
    const emails = emailList.split(',').map(email => email.trim()).filter(email => email);
    
    if (emails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    const result = await formDistribution.distributeViaEmail({
      formId,
      formTitle,
      formUrl: shareUrl,
      emailList: emails
    });

    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Distribute Feedback Form</DialogTitle>
          <DialogDescription>
            Share "{formTitle}" with your target audience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Distribution Methods */}
          <div className="flex gap-2">
            {[
              { id: 'link', label: 'Share Link' },
              { id: 'email', label: 'Email' },
              { id: 'embed', label: 'Embed' },
              { id: 'qr', label: 'QR Code' },
              { id: 'social', label: 'Social' }
            ].map(method => (
              <Button
                key={method.id}
                variant={selectedMethod === method.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMethod(method.id as any)}
              >
                {method.label}
              </Button>
            ))}
          </div>

          {/* Share Link */}
          {selectedMethod === 'link' && (
            <div className="space-y-3">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly />
                <Button 
                  onClick={() => formDistribution.copyToClipboard(shareUrl)}
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Share this link with anyone who should complete the form
              </p>
            </div>
          )}

          {/* Email Distribution */}
          {selectedMethod === 'email' && (
            <div className="space-y-3">
              <Label>Email Addresses</Label>
              <Textarea
                placeholder="Enter email addresses separated by commas..."
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                rows={3}
              />
              <Button onClick={handleEmailDistribution} className="w-full">
                Send Emails
              </Button>
            </div>
          )}

          {/* Embed Code */}
          {selectedMethod === 'embed' && (
            <div className="space-y-3">
              <Label>Embed Code</Label>
              <Textarea
                value={embedCode}
                readOnly
                rows={6}
                className="font-mono text-sm"
              />
              <Button 
                onClick={() => formDistribution.copyToClipboard(embedCode)}
                variant="outline"
                className="w-full"
              >
                Copy Embed Code
              </Button>
            </div>
          )}

          {/* QR Code */}
          {selectedMethod === 'qr' && (
            <div className="space-y-3 text-center">
              <Label>QR Code</Label>
              <div className="flex justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="border rounded-lg"
                  style={{ maxWidth: '200px' }}
                />
              </div>
              <Button 
                onClick={() => formDistribution.copyToClipboard(shareUrl)}
                variant="outline"
                className="w-full"
              >
                Copy Link
              </Button>
            </div>
          )}

          {/* Social Media */}
          {selectedMethod === 'social' && (
            <div className="space-y-3">
              <Label>Share on Social Media</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'twitter', label: 'Twitter', color: 'bg-blue-500' },
                  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
                  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
                  { id: 'whatsapp', label: 'WhatsApp', color: 'bg-green-500' }
                ].map(platform => (
                  <Button
                    key={platform.id}
                    onClick={() => formDistribution.shareToSocialMedia(formId, platform.id as any)}
                    className={`${platform.color} hover:opacity-90 text-white`}
                  >
                    Share on {platform.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
