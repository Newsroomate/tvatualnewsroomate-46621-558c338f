import { Button } from "@/components/ui/button";
import { Download, Monitor, Smartphone, Shield, Zap, Users, Radio, Eye, LayoutGrid } from "lucide-react";
import { generateSalesKitPDF } from "@/utils/sales-kit-pdf";

import telaEspelho from "@/assets/sales/tela-espelho.jpg";
import telaPauta from "@/assets/sales/tela-pauta.jpg";
import telaLauda from "@/assets/sales/tela-lauda.jpg";
import telaTeleprompter from "@/assets/sales/tela-teleprompter.jpg";
import telaTpCustom from "@/assets/sales/tela-tp-custom.jpg";
import telaMenu from "@/assets/sales/tela-menu.jpg";
import telaAcoes from "@/assets/sales/tela-acoes.jpg";

const features = [
  {
    title: "Espelho em Tempo Real",
    desc: "Edição colaborativa do espelho com atualização instantânea. Organize blocos e matérias com drag-and-drop.",
    image: telaEspelho,
    icon: LayoutGrid,
  },
  {
    title: "Pautas e Repórter no Campo",
    desc: "O repórter acessa suas pautas e escreve textos diretamente pelo celular, de qualquer lugar com internet.",
    image: telaPauta,
    icon: Smartphone,
  },
  {
    title: "Editor de Laudas",
    desc: "Edite cabeça, corpo, GC e metadados da matéria lado a lado com o espelho. Tudo integrado.",
    image: telaLauda,
    icon: Eye,
  },
  {
    title: "Teleprompter Integrado",
    desc: "Teleprompter profissional no navegador com controle de velocidade, cores e modo tela cheia.",
    image: telaTeleprompter,
    icon: Monitor,
  },
  {
    title: "TP Customizável",
    desc: "Cores personalizáveis para cabeça, retranca e tipo de material. Fonte ajustável até 196px.",
    image: telaTpCustom,
    icon: Zap,
  },
];

const SalesKit = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 px-6 text-center bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            NEWSROOMATE
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-90">
            A redação inteira na palma da mão.
          </p>
          <p className="text-base md:text-lg opacity-70 max-w-xl mx-auto">
            Plataforma 100% web que unifica espelho, pautas, teleprompter e integrações em um único ambiente colaborativo e em tempo real.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={generateSalesKitPDF}
            className="gap-2 mt-4"
          >
            <Download className="h-5 w-5" />
            Baixar Sales Kit (PDF)
          </Button>
        </div>
      </section>

      {/* Toolbar preview */}
      <section className="py-12 px-6 bg-muted">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Barra de Ações</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Todas as ferramentas que o editor precisa em um clique: criar blocos, exportar, reordenar e visualizar.
          </p>
          <img
            src={telaAcoes}
            alt="Barra de ações do Newsroomate"
            className="rounded-xl shadow-lg border mx-auto"
            loading="lazy"
          />
        </div>
      </section>

      {/* Features alternating */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          {features.map((f, i) => {
            const Icon = f.icon;
            const reversed = i % 2 !== 0;
            return (
              <div
                key={f.title}
                className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-10`}
              >
                <div className="md:w-1/2 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">{f.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                <div className="md:w-1/2">
                  <img
                    src={f.image}
                    alt={f.title}
                    className="rounded-xl shadow-xl border w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Menu + integrations row */}
      <section className="py-16 px-6 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/3 flex justify-center">
              <img
                src={telaMenu}
                alt="Menu Principal"
                className="rounded-xl shadow-lg border max-w-[280px] w-full"
                loading="lazy"
              />
            </div>
            <div className="md:w-2/3 space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">Tudo em um só lugar</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: LayoutGrid, title: "Espelho Geral", desc: "Visão consolidada de todos os telejornais." },
                  { icon: Radio, title: "vMix / WhatsApp", desc: "Receba e modere mensagens do público ao vivo." },
                  { icon: Shield, title: "Permissões Granulares", desc: "4 perfis com controle por ação e por telejornal." },
                  { icon: Users, title: "Para qualquer redação", desc: "TVs, webjornais, universidades — a partir de 4 pessoas." },
                ].map((item) => {
                  const IC = item.icon;
                  return (
                    <div key={item.title} className="p-4 rounded-lg bg-background border space-y-2">
                      <div className="flex items-center gap-2">
                        <IC className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{item.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para transformar sua redação?
          </h2>
          <p className="text-lg opacity-80">
            Entre em contato e agende uma demonstração gratuita.
          </p>
          <div className="space-y-2 opacity-70 text-sm">
            <p>contato@newsroomate.com.br</p>
            <p>www.newsroomate.com.br</p>
          </div>
          <Button
            size="lg"
            variant="secondary"
            onClick={generateSalesKitPDF}
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            Baixar Sales Kit (PDF)
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SalesKit;
