import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import App from "./App";
import "./index.css";

setAuthTokenGetter(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});

createRoot(document.getElementById("root")!).render(<App />);
