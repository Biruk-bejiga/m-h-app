import { createAnonymousUser } from "./repos/users";
import { getSession, setSessionCookies } from "./auth";

export async function ensureSession(): Promise<{ userId: string; isAnonymous: boolean }> {
  const session = await getSession();
  if (session) return { userId: session.sub, isAnonymous: session.isAnonymous };

  const user = await createAnonymousUser();
  await setSessionCookies({ userId: user.id, isAnonymous: true });
  return { userId: user.id, isAnonymous: true };
}
