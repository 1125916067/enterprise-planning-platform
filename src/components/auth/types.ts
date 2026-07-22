export type AuthUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "disabled";
};
