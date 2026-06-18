import { http } from "@/services/api";

export interface Department {
  id: number;
  code: string;
  name: string;
  region: string;
}

export const departmentsApi = {
  list: () => http.get<Department[]>("/departments"),
};
