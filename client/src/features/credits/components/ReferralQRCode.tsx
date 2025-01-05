import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ReferralQRCodeProps {
  code: string;
  size?: number;
}

export function ReferralQRCode({ code, size = 200 }: ReferralQRCodeProps) {
  const qrValue = `${window.location.origin}/referral/${code}`;

  const handleDownload = () => {
    const svg = document.getElementById("referral-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `referral-code-${code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card className="p-4 flex flex-col items-center gap-4 bg-purple-950/30 border-purple-500/30">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG
          id="referral-qr-code"
          value={qrValue}
          size={size}
          level="H"
          includeMargin
          imageSettings={{
            src: "/logo.png",
            x: undefined,
            y: undefined,
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>
      <Button 
        variant="outline" 
        className="w-full text-purple-200 border-purple-500/30 hover:bg-purple-500/20"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4 mr-2" />
        Download QR Code
      </Button>
    </Card>
  );
}
