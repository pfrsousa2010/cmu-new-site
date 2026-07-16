import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type ProfileResumo = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
};

interface AuthCtx {
  session: Session | null;
  profile: ProfileResumo | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(Ctx);
}

function isAdminRole(role: string | null | undefined) {
  return (role ?? "").toLowerCase() === "admin";
}

async function loadProfile(userId: string): Promise<ProfileResumo | null> {
  // Tabela public.profiles (também referida como profile no schema do projeto)
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, email, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Erro ao carregar perfil:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id as string,
    nome: (data.nome as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    role: (data.role as string | null) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileResumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (s: Session | null) => {
      if (!s?.user) {
        if (!cancelled) {
          setSession(null);
          setProfile(null);
        }
        return;
      }

      const p = await loadProfile(s.user.id);
      if (cancelled) return;

      if (!p || !isAdminRole(p.role)) {
        // Sessão válida no Auth, mas sem role admin — encerra o acesso.
        await supabase.auth.signOut();
        if (!cancelled) {
          setSession(null);
          setProfile(null);
        }
        return;
      }

      setSession(s);
      setProfile(p);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session);
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      // Evita deadlock do Auth: processa fora do callback síncrono.
      void applySession(s);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    const userId = data.user?.id;
    if (!userId) {
      await supabase.auth.signOut();
      return { error: "Não foi possível validar o usuário." };
    }

    const p = await loadProfile(userId);
    if (!p || !isAdminRole(p.role)) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      return {
        error: "Acesso restrito a administradores. Seu usuário não possui permissão",
      };
    }

    setSession(data.session);
    setProfile(p);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const isAdmin = Boolean(session && profile && isAdminRole(profile.role));

  return (
    <Ctx.Provider
      value={{ session, profile, loading, isAdmin, signIn, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}
