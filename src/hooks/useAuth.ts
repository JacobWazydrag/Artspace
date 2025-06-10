import { useAppSelector } from "./storeHook";
import { RootState } from "../store/store";

export const useAuth = () => {
  const { user, loading, error } = useAppSelector(
    (state: RootState) => state.auth
  );
  return { user, loading, error };
};
