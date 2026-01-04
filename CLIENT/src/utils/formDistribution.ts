import { toast } from "sonner";

// ============================================================
// Form Distribution System
// ============================================================

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

class FormDistributionManager {
  private baseUrl: string;

  constructor(baseUrl: string = window.location.origin) {
    this.baseUrl = baseUrl;
  }

  // Generate form URL
  generateFormUrl(formId: string, shareToken?: string): string {
    const url = new URL(`${this.baseUrl}/forms/${formId}`);
    if (shareToken) {
      url.searchParams.set('token', shareToken);
    }
    return url.toString();
  }

  // Email distribution
  async distributeViaEmail(options: DistributionOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.createEmailTemplate(options);
      
      if (!options.emailList || options.emailList.length === 0) {
        throw new Error('Email list is required for email distribution');
      }

      // In a real implementation, this would call your backend email service
      const response = await fetch('/api/forms/distribute/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          formId: options.formId,
          emails: options.emailList,
          subject: template.subject,
          body: template.body,
          footer: template.footer
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send emails');
      }

      toast.success(`Form distributed to ${options.emailList.length} recipients via email`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to distribute via email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Generate shareable link
  generateShareableLink(formId: string, options: {
    expireInDays?: number;
    maxResponses?: number;
    allowMultipleSubmissions?: boolean;
  } = {}): string {
    const shareToken = this.generateShareToken();
    const url = this.generateFormUrl(formId, shareToken);
    
    // Store sharing metadata in localStorage for demo (in production, store in database)
    const shareData = {
      token: shareToken,
      formId,
      createdAt: new Date().toISOString(),
      expiresAt: options.expireInDays 
        ? new Date(Date.now() + options.expireInDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
      maxResponses: options.maxResponses,
      allowMultipleSubmissions: options.allowMultipleSubmissions ?? false
    };
    
    localStorage.setItem(`share_${shareToken}`, JSON.stringify(shareData));
    
    return url;
  }

  // Generate embed code
  generateEmbedCode(formId: string, options: {
    width?: string;
    height?: string;
    responsive?: boolean;
  } = {}): string {
    const width = options.width || '100%';
    const height = options.height || '600px';
    const formUrl = this.generateFormUrl(formId);
    
    if (options.responsive) {
      return `
<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;">
  <iframe 
    src="${formUrl}" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    title="Feedback Form"
    allowfullscreen>
  </iframe>
</div>`.trim();
    }
    
    return `
<iframe 
  src="${formUrl}" 
  width="${width}" 
  height="${height}" 
  style="border: none; border-radius: 8px;"
  title="Feedback Form"
  allowfullscreen>
</iframe>`.trim();
  }

  // Generate QR Code (in a real implementation, you'd use a QR code library)
  generateQRCode(formId: string): string {
    const formUrl = this.generateFormUrl(formId);
    // This would typically use a QR code service or library
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}`;
    return qrCodeUrl;
  }

  // Copy to clipboard utility
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Copied to clipboard!');
      return true;
    }
  }

  // Create email template
  private createEmailTemplate(options: DistributionOptions): EmailTemplate {
    const formUrl = this.generateFormUrl(options.formId);
    
    return {
      subject: `Please provide feedback: ${options.formTitle}`,
      body: `
Dear Recipient,

${options.customMessage || `We would appreciate your feedback on "${options.formTitle}".`}

Please take a few minutes to complete the form at the link below:

🔗 ${formUrl}

Your responses will help us improve our services.

Thank you for your time!
      `.trim(),
      footer: `
---
This email was sent via the Feedback Forms System.
If you have any questions, please contact the administrator.
      `.trim()
    };
  }

  // Generate share token
  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Social media sharing
  shareToSocialMedia(formId: string, platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp'): void {
    const formUrl = this.generateFormUrl(formId);
    const message = `Please provide feedback: ${'Your Form Title'}`;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(formUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(formUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(formUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + formUrl)}`
    };

    const shareUrl = urls[platform];
    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    toast.success(`Opening ${platform} sharing dialog...`);
  }
}

// Export singleton instance
export const formDistribution = new FormDistributionManager();

// Distribution dialog component
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
