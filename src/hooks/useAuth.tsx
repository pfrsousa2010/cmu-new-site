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
};

interface AuthCtx {
  session: Session | null;
  profile: ProfileResumo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(Ctx);
}

async function loadProfile(userId: string): Promise<ProfileResumo | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, email")
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
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileResumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applySession = (s: Session | null) => {
      setSession(s);
      if (!s?.user) {
        setProfile(null);
        return;
      }
      // Evita deadlock do Auth: carrega o perfil fora do callback síncrono.
      void loadProfile(s.user.id).then((p) => {
        if (!cancelled) setProfile(p);
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      applySession(s);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <Ctx.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
