import { useCallback, useEffect, useState } from "react";
import { SB } from "../../lib/supabase";

export function useAuthSession() {
  const [authUser, setAuthUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async (user) => {
    setAuthUser(user);

    const { data: employee } = await SB.from("employees")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (!employee) {
      setLoading(false);
      return;
    }

    const { data: employeeCard } = await SB.from("v_employee_card")
      .select("*")
      .eq("email", user.email)
      .limit(1)
      .maybeSingle();

    let resolvedRoleCode = employeeCard?.role_code || "";
    let resolvedRoleName = employeeCard?.role_name || "";

    if (!resolvedRoleCode && employee.role_id) {
      const { data: role } = await SB.from("roles")
        .select("id,code,name")
        .eq("id", employee.role_id)
        .maybeSingle();

      resolvedRoleCode = role?.code || "";
      resolvedRoleName = role?.name || "";
    }

    const [{ data: brandConfig }, locationResult] = await Promise.all([
      SB.from("brand_configs").select("*").eq("brand_id", employee.brand_id).maybeSingle(),
      employee.home_location_id
        ? SB.from("locations")
            .select("id,name")
            .eq("id", employee.home_location_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const location = locationResult?.data;

    setSession({
      ...employee,
      ...(employeeCard || {}),
      id: employee.id || employeeCard?.employee_id,
      role_code: resolvedRoleCode,
      role_name: resolvedRoleName,
      brand_name: brandConfig?.brand_name,
      brand_slug: brandConfig?.brand_slug,
      home_location_id: employee.home_location_id || employeeCard?.location_id || "",
      location_name: location?.name || employeeCard?.location_name || employee.location_name || "",
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    SB.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (activeSession?.user) {
        loadSession(activeSession.user);
        return;
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = SB.auth.onAuthStateChange((_event, activeSession) => {
      if (activeSession?.user) {
        loadSession(activeSession.user);
        return;
      }

      setAuthUser(null);
      setSession(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadSession]);

  const handleLogin = useCallback(
    async (user) => {
      setAuthUser(user);
      await loadSession(user);
    },
    [loadSession]
  );

  const handleSignOut = useCallback(async () => {
    await SB.auth.signOut();
    setAuthUser(null);
    setSession(null);
  }, []);

  return {
    authUser,
    session,
    loading,
    handleLogin,
    handleSignOut,
  };
}
