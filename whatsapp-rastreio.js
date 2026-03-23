// ============================================================
// Sistema de Rastreamento de Encomendas via WhatsApp
// Desenvolvido por:
//   Íkaro Henrique Marçal Alexandre
//   Matheus Kioshi Fernandes Numata
//
// © 2026 - Todos os direitos reservados.
// ============================================================

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios  = require("axios");

const DADOS_URL = "http://localhost:5000/dados";

// ── Função de rastreamento ────────────────────────────────────
// Substitua esta função pela integração com a API de sua preferência.
async function obterStatus(codigo) {
    // Exemplo de chamada a uma API de rastreamento:
    //
    // const response = await axios.post("https://sua-api.com/rastrear", {
    //     code: codigo
    // }, {
    //     headers: { Authorization: "Apikey SUA_CHAVE" }
    // });
    // return response.data.status;

    // Retorno fictício para demonstração:
    const opcoes = [
        "Objeto postado",
        "Objeto em trânsito",
        "Objeto saiu para entrega",
        "Objeto entregue ao destinatário",
        "Tentativa de entrega não efetuada",
    ];
    const idx = [...codigo].reduce((a, c) => a + c.charCodeAt(0), 0) % opcoes.length;
    return opcoes[idx];
}

// ── Cliente WhatsApp ──────────────────────────────────────────
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./whatsapp_session" }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--disable-gpu"],
    },
    webVersionCache: { type: "local" },
});

client.on("qr", (qr) => {
    console.log("\n📱 Escaneie o QR Code com seu WhatsApp:\n");
    qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
    console.log("✅ WhatsApp conectado. Iniciando rastreamento...\n");

    let dados;
    try {
        const res = await axios.get(DADOS_URL, { timeout: 10_000 });
        dados = res.data;
    } catch (e) {
        console.error("❌ Não foi possível conectar ao backend:", e.message);
        process.exit(1);
    }

    // Percorre todos os destinatários e códigos cadastrados
    for (const [destinatario, contatos] of Object.entries(dados)) {
        for (const [numero, codigos] of Object.entries(contatos)) {
            const lista = Array.isArray(codigos) ? codigos : [codigos];
            const resultados = [];

            for (const codigo of lista) {
                const status = await obterStatus(codigo);
                resultados.push({ codigo, status });
                console.log(`📦 ${codigo} → ${status}`);
            }

            const linhas = resultados
                .map(({ codigo, status }) => `📦 *Código:* ${codigo}\n   *Status:* ${status}`)
                .join("\n\n");

            const agora = new Date().toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
            });

            const mensagem =
                `*🚚 RASTREAMENTO DE ENCOMENDA(S)*\n\n` +
                `${linhas}\n\n` +
                `📅 ${agora}\n` +
                `_Enviado automaticamente._`;

            const numeroFormatado = numero.replace(/\D/g, "") + "@c.us";

            try {
                await client.sendMessage(numeroFormatado, mensagem);
                console.log(`✅ Mensagem enviada para ${numero} (${destinatario})`);
            } catch (e) {
                console.error(`❌ Erro ao enviar para ${numero}:`, e.message);
            }

            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log("\n✅ Rastreamento concluído. Encerrando...");
    process.exit(0);
});

client.on("auth_failure", (msg) => {
    console.error("❌ Falha na autenticação:", msg);
    process.exit(1);
});

client.initialize();
