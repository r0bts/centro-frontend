/**
 * Modelos centralizados para Requisiciones
 * Reutilizables en toda la aplicación
 */

export type RequisitionStatus = 
  | 'Solicitado' 
  | 'Autorizada' 
  | 'En Proceso' 
  | 'Listo para Recoger' 
  | 'Parcialmente Entregado'
  | 'Entregado' 
  | 'Espera Devolución' 
  | 'Cancelado';

export interface RequisitionItem {
  id: string;
  creator: string;
  authorizer: string | null;
  pickupPerson?: string | null;
  status: RequisitionStatus;
  creationDate: Date;
  deliveryDate: Date;
  businessUnit?: string;
}

export interface APIRequisitionItem {
  id: string | number;
  creator: string;
  authorizer?: string;
  pickupPerson?: string;
  status: string;
  creationDate: string;
  deliveryDateTime?: string;  // v1.1.0 - Nuevo campo combinado
  deliveryDate?: string;      // v1.0.0 - Campo legacy
  businessUnit?: string;
}

export interface GroupedRequisitions {
  grouped: { [key: string]: RequisitionItem[] };
  dateKeys: string[];
}

export interface RequisitionListResponse {
  success: boolean;
  message: string;
  data: {
    requisitions: APIRequisitionItem[];
    total: number;
  };
}
