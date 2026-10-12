import { createActor } from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { identity, login, clear, loginStatus, isAuthenticated } =
    useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);

  const profileQuery = useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const emailQuery = useQuery({
    queryKey: ["callerEmail"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerEmail();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  return {
    identity,
    login,
    logout: clear,
    loginStatus,
    isAuthenticated,
    principal: identity?.getPrincipal() ?? null,
    profile: profileQuery.data ?? null,
    email: emailQuery.data ?? null,
    isProfileLoading: profileQuery.isLoading,
  };
}
