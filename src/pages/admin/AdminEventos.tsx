import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { publicUrl, BUCKET_EVENTOS } from "@/lib/supabase";
import {
  fetchEventosAdmin,
  criarEvento,
  atualizarEvento,
  removerEvento,
  setEventoPublicado,
  adicionarFoto,
  removerFoto,
  ehFuturo,
  fmtDataBR,
  type EventoRow,
} from "@/lib/eventos";

const inputCls =
  "w-full rounded-[11px] border-[1.5px] border-black/[.13] px-[14px] py-3 text-[15px] outline-none transition-colors focus:border-azul";

const MAX_FOTOS_EVENTO = 3;
const MAX_FOTO_BYTES = 2 * 1024 * 1024;

/** Converte hora legada ("14h00") para o formato do input type="time" (HH:mm). */
function horaParaInput(hora: string | null | undefined): string {
  if (!hora) return "";
  if (/^\d{2}:\d{2}$/.test(hora)) return hora;
  const m = hora.match(/^(\d{1,2})h(\d{2})$/i);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return hora;
}

function filtrarImagensParaUpload(
  files: Iterable<File>,
  quantidadeAtual: number
): { validas: File[]; avisos: string[] } {
  const avisos: string[] = [];
  const vagas = MAX_FOTOS_EVENTO - quantidadeAtual;
  if (vagas <= 0) {
    return {
      validas: [],
      avisos: [`Limite de ${MAX_FOTOS_EVENTO} fotos por evento.`],
    };
  }

  const validas: File[] = [];
  let ignoradasPorLimite = false;

  for (const file of files) {
    if (validas.length >= vagas) {
      ignoradasPorLimite = true;
      break;
    }
    if (!file.type.startsWith("image/")) {
      avisos.push(`"${file.name}" não é uma imagem.`);
      continue;
    }
    if (file.size > MAX_FOTO_BYTES) {
      avisos.push(`"${file.name}" ultrapassa 2 MB.`);
      continue;
    }
    validas.push(file);
  }

  if (ignoradasPorLimite) {
    avisos.push(`Só é possível adicionar mais ${vagas} foto(s).`);
  }

  return { validas, avisos };
}

type FotoPendente = {
  id: string;
  file: File;
  preview: string;
};

export default function AdminEventos() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<EventoRow | null>(null);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fotosPendentes, setFotosPendentes] = useState<FotoPendente[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const limparFotosPendentes = () => {
    setFotosPendentes((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  };

  const fecharModal = () => {
    limparFotosPendentes();
    setDragOver(false);
    setModalOpen(false);
  };

  const qtdFotos = editando
    ? editando.evento_fotos?.length ?? 0
    : fotosPendentes.length;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return eventos;
    return eventos.filter((e) => e.titulo.toLowerCase().includes(termo));
  }, [eventos, busca]);

  const recarregar = async () => {
    setEventos(await fetchEventosAdmin());
    setLoading(false);
  };

  useEffect(() => {
    recarregar();
  }, []);

  // Abertura automática via ?novo=1 (vindo das ações rápidas)
  useEffect(() => {
    if (params.get("novo") === "1") {
      abrirNovo();
      params.delete("novo");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirNovo = () => {
    limparFotosPendentes();
    setEditando(null);
    setTitulo("");
    setData("");
    setHora("");
    setDescricao("");
    setModalOpen(true);
  };

  const abrirEditar = (e: EventoRow) => {
    limparFotosPendentes();
    setEditando(e);
    setTitulo(e.titulo);
    setData(e.data);
    setHora(horaParaInput(e.hora));
    setDescricao(e.descricao ?? "");
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!titulo.trim()) {
      toast("Dê um título ao evento");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      toast("Informe a data do evento");
      return;
    }
    setSalvando(true);
    try {
      const input = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data,
        hora: hora.trim() || null,
        publicado: editando?.publicado ?? false,
      };
      if (editando) {
        await atualizarEvento(editando.id, input);
      } else {
        const eventoId = await criarEvento(input);
        if (fotosPendentes.length) {
          await Promise.all(
            fotosPendentes.map((f, i) => adicionarFoto(eventoId, f.file, i))
          );
        }
        limparFotosPendentes();
      }
      await recarregar();
      fecharModal();
      toast("Evento salvo");
    } catch (err) {
      toast("Erro ao salvar evento");
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const toggleVis = async (e: EventoRow) => {
    const novo = !e.publicado;
    setPending((p) => ({ ...p, [e.id]: true }));
    setEventos((evs) =>
      evs.map((x) => (x.id === e.id ? { ...x, publicado: novo } : x))
    );
    try {
      await setEventoPublicado(e.id, novo);
      toast(novo ? "Evento visível no site" : "Evento oculto do site");
    } catch (err) {
      setEventos((evs) =>
        evs.map((x) => (x.id === e.id ? { ...x, publicado: !novo } : x))
      );
      toast("Erro ao atualizar visibilidade");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [e.id]: false }));
    }
  };

  const remover = async (e: EventoRow) => {
    if (!confirm(`Remover o evento "${e.titulo}"?`)) return;
    try {
      await removerEvento(e);
      await recarregar();
      toast("Evento removido");
    } catch (err) {
      toast("Erro ao remover evento");
      console.error(err);
    }
  };

  const escolherFotos = async (files: FileList | File[] | null) => {
    if (!files?.length || enviandoFotos || salvando) return;

    const lista = Array.isArray(files) ? files : Array.from(files);
    const { validas, avisos } = filtrarImagensParaUpload(lista, qtdFotos);

    if (avisos.length) toast(avisos[0]);
    if (!validas.length) return;

    if (!editando) {
      setFotosPendentes((prev) => [
        ...prev,
        ...validas.map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        })),
      ]);
      return;
    }

    setEnviandoFotos(true);
    try {
      const base = qtdFotos;
      await Promise.all(
        validas.map((f, i) => adicionarFoto(editando.id, f, base + i))
      );
      const novos = await fetchEventosAdmin();
      setEventos(novos);
      setEditando(novos.find((x) => x.id === editando.id) ?? null);
      toast(
        validas.length === 1
          ? "Foto adicionada"
          : `${validas.length} fotos adicionadas`
      );
    } catch (err) {
      toast("Erro ao enviar foto");
      console.error(err);
    } finally {
      setEnviandoFotos(false);
    }
  };

  const aoSoltarArquivos = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (enviandoFotos || salvando || qtdFotos >= MAX_FOTOS_EVENTO) return;
    escolherFotos(e.dataTransfer.files);
  };

  const removerFotoPendente = (id: string) => {
    setFotosPendentes((prev) => {
      const alvo = prev.find((f) => f.id === id);
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const excluirFoto = async (fotoId: string) => {
    if (!editando) return;
    const foto = editando.evento_fotos?.find((f) => f.id === fotoId);
    if (!foto) return;
    try {
      await removerFoto(foto);
      const novos = await fetchEventosAdmin();
      setEventos(novos);
      setEditando(novos.find((x) => x.id === editando.id) ?? null);
      toast("Foto removida");
    } catch (err) {
      toast("Erro ao remover foto");
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 font-display text-[28px] font-black">Eventos</h1>
          <p className="m-0 text-[14.5px] text-ink-2">
            Adicione, edite ou remova eventos da agenda. As fotos de cada evento
            são gerenciadas aqui.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="rounded-full bg-azul px-[22px] py-3 font-display text-[14.5px] font-extrabold text-white shadow-[0_3px_10px_rgba(46,111,183,.3)] transition-colors hover:bg-azul-hover"
        >
          + Novo evento
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar evento pelo nome…"
          aria-label="Buscar evento pelo nome"
          className="w-full max-w-md rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-3 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-azul"
        />
        {!loading && (
          <p className="m-0 text-[14px] font-bold text-ink-2">
            {busca.trim()
              ? `${filtrados.length} de ${eventos.length} ${eventos.length === 1 ? "evento" : "eventos"}`
              : `${eventos.length} ${eventos.length === 1 ? "evento" : "eventos"}`}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : eventos.length === 0 ? (
        <p className="text-ink-2">Nenhum evento cadastrado.</p>
      ) : filtrados.length === 0 ? (
        <p className="text-ink-2">
          Nenhum evento encontrado para “{busca.trim()}”.
        </p>
      ) : (
        <div className="grid gap-3.5">
          {filtrados.map((e) => {
            const futuro = ehFuturo(e.data);
            const busy = pending[e.id];
            const capa = e.evento_fotos?.[0]
              ? publicUrl(BUCKET_EVENTOS, e.evento_fotos[0].storage_path)
              : null;
            return (
              <div
                key={e.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-white px-5 py-4"
              >
                {capa ? (
                  <img
                    src={capa}
                    alt=""
                    className="h-16 w-24 flex-none rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 flex-none items-center justify-center rounded-[10px] bg-subtle text-[11px] text-ink-3">
                    sem foto
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-extrabold">
                    {e.titulo}
                  </div>
                  <div className="mt-0.5 text-[13.5px] text-ink-2">
                    {fmtDataBR(e.data)} · {e.hora ?? "—"} ·{" "}
                    {e.evento_fotos?.length ?? 0} foto(s)
                  </div>
                </div>
                <span
                  className={[
                    "flex-none rounded-full px-3 py-[5px] text-xs font-bold",
                    futuro
                      ? "bg-laranja/[.12] text-laranja"
                      : "bg-black/[.07] text-ink-2",
                  ].join(" ")}
                >
                  {futuro ? "Em breve" : "Finalizado"}
                </span>
                <div className="flex flex-none flex-col items-center gap-1">
                  <span className="text-[11px] font-bold text-ink-2">
                    Visível no site
                  </span>
                  <Toggle
                    on={e.publicado}
                    color="bg-azul"
                    disabled={busy}
                    onClick={() => toggleVis(e)}
                  />
                </div>
                <button
                  onClick={() => abrirEditar(e)}
                  className="flex-none rounded-[9px] px-3 py-2 text-[13.5px] font-bold text-azul hover:bg-azul/[.08]"
                >
                  Editar
                </button>
                <button
                  onClick={() => remover(e)}
                  className="flex-none rounded-[9px] px-3 py-2 text-[13.5px] font-bold text-vermelho hover:bg-vermelho/[.08]"
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={fecharModal}>
        <h2 className="mb-[22px] font-display text-[22px] font-black">
          {editando ? "Editar evento" : "Novo evento"}
        </h2>
        <div className="grid gap-3.5">
          <Campo label="Título do evento">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={inputCls}
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3.5">
            <Campo label="Data">
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputCls}
              />
            </Campo>
            <Campo label="Horário">
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={inputCls}
              />
            </Campo>
          </div>
          <Campo label="Descrição">
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`${inputCls} resize-y`}
            />
          </Campo>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold">Fotos do evento</span>
              <span className="text-[12px] font-semibold text-ink-2">
                {qtdFotos}/{MAX_FOTOS_EVENTO}
              </span>
            </div>
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                if (!enviandoFotos && !salvando && qtdFotos < MAX_FOTOS_EVENTO) {
                  setDragOver(true);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(false);
                }
              }}
              onDrop={aoSoltarArquivos}
              className={[
                "rounded-[12px] border-2 border-dashed p-3 transition-colors",
                dragOver
                  ? "border-azul bg-azul/[.06]"
                  : "border-black/[.15] bg-white",
              ].join(" ")}
            >
              <div className="flex flex-wrap gap-2.5">
                {editando
                  ? editando.evento_fotos?.map((ft) => (
                      <div key={ft.id} className="relative">
                        <img
                          src={publicUrl(BUCKET_EVENTOS, ft.storage_path)}
                          alt=""
                          className="block h-[76px] w-[110px] rounded-[10px] object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => excluirFoto(ft.id)}
                          disabled={enviandoFotos || salvando}
                          className="absolute -right-[7px] -top-[7px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-vermelho text-xs font-extrabold text-white shadow-[0_2px_6px_rgba(0,0,0,.25)] disabled:opacity-60"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  : fotosPendentes.map((ft) => (
                      <div key={ft.id} className="relative">
                        <img
                          src={ft.preview}
                          alt=""
                          className="block h-[76px] w-[110px] rounded-[10px] object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removerFotoPendente(ft.id)}
                          disabled={salvando}
                          className="absolute -right-[7px] -top-[7px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-vermelho text-xs font-extrabold text-white shadow-[0_2px_6px_rgba(0,0,0,.25)] disabled:opacity-60"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                {qtdFotos < MAX_FOTOS_EVENTO && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={enviandoFotos || salvando}
                    className="flex h-[76px] w-[110px] flex-col items-center justify-center gap-0.5 rounded-[10px] border-2 border-dashed border-black/[.18] text-[12px] font-bold text-ink-3 transition-colors hover:border-azul hover:text-azul disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="text-lg">+</span>
                    {enviandoFotos ? "Enviando…" : "Adicionar"}
                  </button>
                )}
              </div>
              <p className="m-0 mt-2.5 text-[12px] leading-[1.45] text-ink-3">
                Arraste imagens aqui ou clique em Adicionar. Apenas imagens, até
                2 MB cada, máximo de {MAX_FOTOS_EVENTO} fotos.
                {!editando && fotosPendentes.length > 0 && (
                  <> Serão enviadas ao salvar o evento.</>
                )}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  escolherFotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              onClick={fecharModal}
              className="rounded-full border-[1.5px] border-black/[.13] px-6 py-3 text-sm font-bold transition-colors hover:border-ink-2"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="rounded-full bg-verde px-7 py-3 font-display text-sm font-extrabold text-white transition-colors hover:bg-verde-hover disabled:opacity-60"
            >
              {salvando ? "Salvando…" : "Salvar evento"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-bold">{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  on,
  color,
  disabled,
  onClick,
}: {
  on: boolean;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={[
        "relative h-[26px] w-[46px] rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        on ? color : "bg-black/[.18]",
      ].join(" ")}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.25)] transition-[left]"
        style={{ left: on ? "23px" : "3px" }}
      />
    </button>
  );
}
