import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { generateSalesKitPDF } from "@/utils/sales-kit-pdf";

const SalesKit = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <FileText className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Newsroomate — Sales Kit</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Baixe o material completo de apresentação do Newsroomate em formato PDF.
        </p>
        <Button size="lg" onClick={generateSalesKitPDF} className="gap-2">
          <Download className="h-5 w-5" />
          Baixar Sales Kit (PDF)
        </Button>
      </div>
    </div>
  );
};

export default SalesKit;
