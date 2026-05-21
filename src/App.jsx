import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ClickAwayListener } from "@mui/material";

export function App() {
  const [avaliacao, setAvaliacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [contagem, setContagem] = useState(null);
  const [status, setStatus] = useState({ tipo: null, mensagem: "" });

  const [dadosChamado, setDadosChamado] = useState({
    nomeUsuario: "",
    numero: "",
    mensagem: "",
    dataAbertura: "",
    dataTermino: "",
    rawAbertura: null,
    rawTermino: null,
  });

  const primaryColor = "#142B4D";
  const dangerColor = "#D12029";

  const emojis = [
    { value: "ruim", label: "RUIM", icon: "😞", pontuacao: 1 },
    { value: "regular", label: "REGULAR", icon: "😐", pontuacao: 2 },
    { value: "bom", label: "BOM", icon: "😊", pontuacao: 3 },
    { value: "excelente", label: "EXCELENTE", icon: "🤩", pontuacao: 4 },
  ];

  const formatarParaBD = (dataString) => {
    if (!dataString) return null;
    const d = new Date(dataString);
    if (isNaN(d.getTime())) return null;

    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const hora = String(d.getHours()).padStart(2, "0");
    const minuto = String(d.getMinutes()).padStart(2, "0");
    const segundo = String(d.getSeconds()).padStart(2, "0");

    return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
  };

  useEffect(() => {
    const fetchChamado = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const numeroChamado = params.get("chamado");

        if (!numeroChamado) {
          setLoading(false);
          return;
        }

        const response = await fetch(`https://arenavidros.com.br/api/atendimento`);
        const dados = await response.json();
        const chamadoEncontrado = dados.find(
          (item) => String(item.numero) === String(numeroChamado),
        );

        if (chamadoEncontrado) {
          setDadosChamado({
            nomeUsuario: chamadoEncontrado.nomeUsuario || "Não informado",
            numero: chamadoEncontrado.numero || "",
            mensagem: chamadoEncontrado.mensagem || "Sem mensagem",
            dataAbertura: chamadoEncontrado.data_abertura
              ? new Date(chamadoEncontrado.data_abertura).toLocaleString("pt-BR")
              : "",
            dataTermino: chamadoEncontrado.dataTermino
              ? new Date(chamadoEncontrado.dataTermino).toLocaleString("pt-BR")
              : "Finalizado com Sucesso",
            rawAbertura: chamadoEncontrado.data_abertura || null,
            rawTermino: chamadoEncontrado.dataTermino || null,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do chamado:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChamado();
  }, []);

  useEffect(() => {
    if (contagem === null) return;

    if (contagem === 0) {
      window.close();
      return;
    }

    const timer = setTimeout(() => {
      setContagem(contagem - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [contagem]);

  const handleSubmeterAvaliacao = async (e) => {
    e.preventDefault();
    setStatus({ tipo: null, mensagem: "" });

    const opiniaoTexto = e.target.opiniao.value.trim();

    if (!avaliacao || !opiniaoTexto || !dadosChamado.numero) {
      setStatus({
        tipo: "error",
        mensagem: "Erro: Todos os campos (Avaliação e Opinião) precisam estar preenchidos!",
      });
      return;
    }

    setEnviando(true);
    const emojiSelecionado = emojis.find((item) => item.value === avaliacao);

    const payload = {
      numeroChamado: dadosChamado.numero,
      nomeUsuario: dadosChamado.nomeUsuario,
      dataAbertura: formatarParaBD(dadosChamado.rawAbertura),
      dataTermino: formatarParaBD(dadosChamado.rawTermino),
      mensagem: dadosChamado.mensagem,
      avaliacao: avaliacao,
      pontuacao: emojiSelecionado ? emojiSelecionado.pontuacao : 0,
      opiniao: opiniaoTexto,
    };

    try {
      const response = await fetch(
        "https://avaliacoes.arenavidros.com.br/api/pesquisas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        setContagem(5);
        setAvaliacao("");
        setDadosChamado({
          nomeUsuario: "",
          numero: "",
          mensagem: "",
          dataAbertura: "",
          dataTermino: "",
          rawAbertura: null,
          rawTermino: null,
        });
        e.target.reset();
      } else {
        const erroData = await response.json();
        setStatus({
          tipo: "error",
          mensagem: `Erro ao salvar: ${erroData.error || "Ocorreu um problema no servidor."}`,
        });
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      setStatus({
        tipo: "error",
        mensagem: "Não foi possível conectar ao servidor. Verifique sua conexão.",
      });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: primaryColor }} />
      </Box>
    );
  }

  const podeEnviar = avaliacao && dadosChamado.numero && !enviando;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2, bgcolor: "#f5f5f5", minHeight: "95vh" }}>
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 700, borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "stretch", height: "fit-content" }}>
        
        <Box sx={{ bgcolor: primaryColor, color: "white", py: 4, px: 2, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Pesquisa de Satisfação
          </Typography>
          {contagem === null && (
            <Typography variant="body2" sx={{ color: "#e0e0e0" }}>
              Compartilhe sua experiência conosco sobre o Chamado # {dadosChamado.numero || "---"}
            </Typography>
          )}
        </Box>

        {contagem !== null ? (
          <Box sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 2 }}>
            {/* ÍCONE CORRIGIDO PARA EMOJI, ZERO DEPENDÊNCIAS DE COMPONENTE EXTRA */}
            <Box sx={{ fontSize: "5rem", mb: 1 }}>✅</Box>
            
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#2e7d32" }}>
              Avaliação enviada com sucesso!
            </Typography>
            <Typography variant="body1" sx={{ color: "#555" }}>
              Muito obrigado pelo seu feedback. Ele é muito importante para nós.
            </Typography>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: "#edf7ed", borderRadius: 2, width: "100%", maxWidth: 400 }}>
              {contagem > 0 ? (
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e4620" }}>
                  Esta tela será fechada automaticamente em <strong>{contagem} segundos</strong>...
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ fontWeight: 700, color: dangerColor }}>
                  Pronto! Você já pode fechar esta aba com segurança.
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmeterAvaliacao} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            
            {status.tipo && (
              <Alert severity={status.tipo} sx={{ mb: 1, borderRadius: 1.5 }}>
                {status.mensagem}
              </Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ flex: 0.6 }}>
                <TextField
                  fullWidth
                  disabled
                  id="numero"
                  label="N - 0000"
                  value={dadosChamado.numero}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }} 
                  sx={{ bgcolor: "#fafafa" }}
                />
              </Box>
              <Box sx={{ flex: 3 }}>
                <TextField
                  fullWidth
                  disabled
                  id="nomeUsuario"
                  label="Nome do Usuário"
                  value={dadosChamado.nomeUsuario}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }} 
                  sx={{ bgcolor: "#fafafa" }}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  id="dataAbertura"
                  label="Horário de Abertura"
                  disabled
                  value={dadosChamado.dataAbertura}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }} 
                  sx={{ bgcolor: "#fafafa" }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  disabled
                  id="dataTermino"
                  label="Horário de Término"
                  value={dadosChamado.dataTermino}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }} 
                  sx={{ bgcolor: "#fafafa" }}
                />
              </Box>
            </Stack>

            <Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                disabled
                id="mensagem"
                label="Mensagem do Chamado"
                value={dadosChamado.mensagem}
                variant="outlined"
                InputLabelProps={{ shrink: true }} 
                sx={{ bgcolor: "#fafafa" }}
              />
            </Box>

            <hr style={{ border: "0", borderTop: "1px dashed #ccc", margin: "8px 0" }} />

            <Box sx={{ textAlign: "center", my: 1 }}>
              <Typography variant="subtitle2" sx={{ fontStyle: "italic", mb: 2, color: "#555", fontWeight: 600 }}>
                Como foi o nosso atendimento hoje, referente ao chamado {dadosChamado.numero || "---"}? <span style={{ color: dangerColor }}>*</span>
              </Typography>

              <ClickAwayListener onClickAway={() => {}}>
                <Stack sx={{ display: "flex", alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}>
                  {emojis.map((item) => (
                    <Box key={item.value} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <IconButton
                        type="button"
                        disabled={enviando}
                        onClick={() => setAvaliacao(avaliacao === item.value ? "" : item.value)}
                        sx={{
                          fontSize: "3.5rem",
                          p: 0,
                          filter: avaliacao && avaliacao !== item.value ? "grayscale(100%) opacity(0.4)" : "none",
                          transform: avaliacao === item.value ? "scale(1.1)" : "scale(1)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {item.icon}
                      </IconButton>
                      <Typography variant="caption" sx={{ mt: 1, fontWeight: 700, color: avaliacao === item.value ? primaryColor : "#888", fontSize: "0.65rem" }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </ClickAwayListener>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#333" }}>
                Sua Opinião <span style={{ color: dangerColor }}>*</span>
              </Typography>
              <TextField
                fullWidth
                multiline
                name="opiniao"
                required
                disabled={enviando}
                rows={4}
                placeholder="Conte-nos o que podemos melhorar ou o que você gostou..."
                variant="outlined"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!podeEnviar}
              sx={{
                bgcolor: primaryColor,
                color: "white",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 1.5,
                py: 1.5,
                mt: 1,
                "&:hover": { bgcolor: primaryColor },
              }}
            >
              {enviando ? "Enviando Avaliação..." : "Enviar Avaliação"}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}