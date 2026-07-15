import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { publicUrl, BUCKET_EVENTOS } from "@/lib/supabase";
import {
  fetchEventosAdmin,
  criarEvento,
  atualizarEvento,
  removerEvento,
  adicionarFoto,
  removerFoto,
  ehFuturo,
  fmtDataBR,
  parseDataBR,
  type EventoRow,
} from "@/lib/eventos";

const inputCls =
  "w-full rounded-[11px] border-[1.5px] border-black/[.13] px-[14px] py-3 text-[15px] outline-none transition-colors focus:border-azul";

export default function AdminEventos() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<EventoRow | null>(null);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setEditando(null);
    setTitulo("");
    setData("");
    setHora("");
    setDescricao("");
    setModalOpen(true);
  };

  const abrirEditar = (e: EventoRow) => {
    setEditando(e);
    setTitulo(e.titulo);
    setData(fmtDataBR(e.data));
    setHora(e.hora ?? "");
    setDescricao(e.descricao ?? "");
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!titulo.trim()) {
      toast("Dê um título ao evento");
      return;
    }
    const iso = parseDataBR(data);
    if (!iso) {
      toast("Informe a data no formato dd/mm/aaaa");
      return;
    }
    setSalvando(true);
    try {
      const input = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data: iso,
        hora: hora.trim() || null,
        publicado: true,
      };
      if (editando) {
        await atualizarEvento(editando.id, input);
      } else {
        await criarEvento(input);
      }
      await recarregar();
      setModalOpen(false);
      toast("Evento salvo");
    } catch (err) {
      toast("Erro ao salvar evento");
      console.error(err);
    } finally {
      setSalvando(false);
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

  const escolherFotos = async (files: FileList | null) => {
    if (!editando || !files?.length) return;
    try {
      const base = editando.evento_fotos?.length ?? 0;
      await Promise.all(
        Array.from(files).map((f, i) => adicionarFoto(editando.id, f, base + i))
      );
      const novos = await fetchEventosAdmin();
      setEventos(novos);
      setEditando(novos.find((x) => x.id === editando.id) ?? null);
      toast("Foto(s) adicionada(s)");
    } catch (err) {
      toast("Erro ao enviar foto");
      console.error(err);
    }
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

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : eventos.length === 0 ? (
        <p className="text-ink-2">Nenhum evento cadastrado.</p>
      ) : (
        <div className="grid gap-3.5">
          {eventos.map((e) => {
            const futuro = ehFuturo(e.data);
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
                      ? "bg-verde/[.12] text-verde-dark"
                      : "bg-black/[.07] text-ink-2",
                  ].join(" ")}
                >
                  {futuro ? "Publicado" : "Passado"}
                </span>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
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
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="dd/mm/aaaa"
                className={inputCls}
              />
            </Campo>
            <Campo label="Horário">
              <input
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                placeholder="14h00"
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
            <div className="mb-1.5 text-[13px] font-bold">Fotos do evento</div>
            {!editando ? (
              <div className="rounded-[10px] bg-site-bg px-4 py-3 text-[13px] text-ink-2">
                Salve o evento primeiro para adicionar fotos.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {editando.evento_fotos?.map((ft) => (
                  <div key={ft.id} className="relative">
                    <img
                      src={publicUrl(BUCKET_EVENTOS, ft.storage_path)}
                      alt=""
                      className="block h-[76px] w-[110px] rounded-[10px] object-cover"
                    />
                    <button
                      onClick={() => excluirFoto(ft.id)}
                      className="absolute -right-[7px] -top-[7px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-vermelho text-xs font-extrabold text-white shadow-[0_2px_6px_rgba(0,0,0,.25)]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-[76px] w-[110px] flex-col items-center justify-center gap-0.5 rounded-[10px] border-2 border-dashed border-black/[.18] text-[12px] font-bold text-ink-3 transition-colors hover:border-azul hover:text-azul"
                >
                  <span className="text-lg">+</span>Adicionar
                </button>
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
            )}
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
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
